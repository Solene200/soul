"""数据分析路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Any
from datetime import datetime, timedelta
from ..database import get_db
from ..models import User, Diary, AssessmentRecord, TrainingRecord, GrowthRecord
from ..auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

POSITIVE_EMOTIONS = {"快乐", "兴奋", "平静", "感恩", "满足"}
NEGATIVE_EMOTIONS = {"悲伤", "焦虑", "愤怒", "失落", "孤独", "压力", "恐惧"}


def _coerce_emotions(raw_emotions: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_emotions, list):
        return []

    return [item for item in raw_emotions if isinstance(item, dict)]


def _get_emotion_name(emotion: dict[str, Any]) -> str | None:
    value = emotion.get("emotion")
    return value if isinstance(value, str) and value else None


def _get_emotion_intensity(emotion: dict[str, Any]) -> int:
    value = emotion.get("intensity")
    return value if isinstance(value, int) else 0


@router.get("/yearly-report")
async def get_yearly_report(
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定年份的数据分析报表"""
    current_year = datetime.now().year
    if year < 1900 or year > current_year:
        raise HTTPException(status_code=400, detail="年份参数无效")

    start_date = f"{year}-01-01"
    end_date = f"{year}-12-31"
    start_dt = datetime(year, 1, 1)
    end_dt = datetime(year + 1, 1, 1)

    diaries = db.query(Diary).filter(
        Diary.user_id == current_user.id,
        Diary.diary_date >= start_date,
        Diary.diary_date <= end_date
    ).order_by(Diary.diary_date.asc()).all()

    assessments = db.query(AssessmentRecord).filter(
        AssessmentRecord.user_id == current_user.id,
        AssessmentRecord.created_at >= start_dt,
        AssessmentRecord.created_at < end_dt
    ).all()

    trainings = db.query(TrainingRecord).filter(
        TrainingRecord.user_id == current_user.id,
        TrainingRecord.completed_at >= start_dt,
        TrainingRecord.completed_at < end_dt
    ).all()

    emotion_counts: dict[str, int] = {}
    emotion_trend = []
    positive_count = 0
    total_emotion_count = 0

    for diary in diaries:
        emotions = _coerce_emotions(diary.emotions)
        score = 0
        main_emotion = diary.main_emotion

        for emotion in emotions:
            emotion_name = _get_emotion_name(emotion)
            if not emotion_name:
                continue

            intensity = _get_emotion_intensity(emotion)
            total_emotion_count += 1
            emotion_counts[emotion_name] = emotion_counts.get(emotion_name, 0) + 1

            if not main_emotion:
                main_emotion = emotion_name

            if emotion_name in POSITIVE_EMOTIONS:
                positive_count += 1
                score += intensity
            elif emotion_name in NEGATIVE_EMOTIONS:
                score -= intensity

        emotion_trend.append({
            "date": diary.diary_date,
            "emotion": main_emotion or "未知",
            "score": score,
        })

    emotion_distribution = sorted(
        (
            {"emotion": emotion, "count": count}
            for emotion, count in emotion_counts.items()
        ),
        key=lambda item: item["count"],
        reverse=True,
    )

    total_words = sum(diary.word_count or 0 for diary in diaries)
    training_duration = sum(record.duration or 0 for record in trainings)
    positive_ratio = (
        round((positive_count / total_emotion_count) * 100)
        if total_emotion_count > 0
        else 0
    )

    return {
        "year": year,
        "diary_count": len(diaries),
        "assessment_count": len(assessments),
        "training_count": len(trainings),
        "training_duration": training_duration,
        "total_words": total_words,
        "positive_ratio": positive_ratio,
        "total_emotion_count": total_emotion_count,
        "emotion_trend": emotion_trend,
        "emotion_distribution": emotion_distribution,
    }


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取仪表盘概览数据"""
    # 计算近30天数据
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    # 日记统计
    diary_count = db.query(Diary).filter(
        Diary.user_id == current_user.id,
        Diary.diary_date >= thirty_days_ago
    ).count()
    
    # 评估统计
    assessment_count = db.query(AssessmentRecord).filter(
        AssessmentRecord.user_id == current_user.id,
        AssessmentRecord.created_at >= thirty_days_ago
    ).count()
    
    # 训练统计
    training_count = db.query(TrainingRecord).filter(
        TrainingRecord.user_id == current_user.id,
        TrainingRecord.completed_at >= thirty_days_ago
    ).count()
    
    training_duration = db.query(func.sum(TrainingRecord.duration)).filter(
        TrainingRecord.user_id == current_user.id,
        TrainingRecord.completed_at >= thirty_days_ago
    ).scalar() or 0
    
    # 成长记录统计（本年度）
    current_year = datetime.now().year
    start_of_year = f"{current_year}-01-01"
    
    growth_stats = db.query(GrowthRecord).filter(
        GrowthRecord.user_id == current_user.id,
        GrowthRecord.record_date >= start_of_year,
        GrowthRecord.has_diary == True
    ).all()
    
    total_diaries = len(growth_stats)
    winged_hearts = sum(1 for r in growth_stats if r.emotion_valence == "positive")
    
    # 计算连续天数
    current_streak = 0
    check_date = datetime.now()
    
    while True:
        date_str = check_date.strftime("%Y-%m-%d")
        record = next((r for r in growth_stats if r.record_date == date_str), None)
        if record and record.has_diary:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return {
        "diary_count_30d": diary_count,
        "assessment_count_30d": assessment_count,
        "training_count_30d": training_count,
        "training_duration_30d": training_duration,
        "total_diaries_year": total_diaries,
        "winged_hearts_year": winged_hearts,
        "current_streak": current_streak,
        "positive_ratio": round(winged_hearts / total_diaries * 100) if total_diaries > 0 else 0
    }


@router.get("/emotion-trends")
async def get_emotion_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取情绪趋势数据"""
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    diaries = db.query(Diary).filter(
        Diary.user_id == current_user.id,
        Diary.diary_date >= start_date
    ).order_by(Diary.diary_date).all()
    
    # 构建趋势数据
    trends = []
    for diary in diaries:
        # 计算情绪得分（基于AI分析）
        emotion_score = 5  # 默认中性
        
        if diary.ai_feedback:
            emotion_analysis = diary.ai_feedback.get("emotion_analysis", {})
            valence = diary.ai_feedback.get("emotion_valence", "neutral")
            intensity = emotion_analysis.get("emotion_intensity", 5)
            
            # 根据效价和强度计算得分 (0-10)
            if valence == "positive":
                emotion_score = 5 + (intensity * 0.5)
            elif valence == "negative":
                emotion_score = 5 - (intensity * 0.5)
            else:
                emotion_score = 5
        
        trends.append({
            "date": diary.diary_date,
            "emotion": diary.main_emotion,
            "score": emotion_score,
            "word_count": diary.word_count
        })
    
    return trends


@router.get("/assessment-trends")
async def get_assessment_trends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取评估趋势数据"""
    records = db.query(AssessmentRecord).filter(
        AssessmentRecord.user_id == current_user.id
    ).order_by(AssessmentRecord.created_at).all()
    
    # 按量表分组
    trends_by_scale = {}
    
    for record in records:
        scale_name = record.template.scale_name if record.template else "Unknown"
        
        if scale_name not in trends_by_scale:
            trends_by_scale[scale_name] = []
        
        trends_by_scale[scale_name].append({
            "date": record.created_at.strftime("%Y-%m-%d"),
            "score": record.total_score,
            "risk_level": record.risk_level
        })
    
    return trends_by_scale


@router.get("/training-stats")
async def get_training_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取训练统计数据"""
    records = db.query(TrainingRecord).filter(
        TrainingRecord.user_id == current_user.id
    ).all()
    
    # 按训练类型统计
    stats_by_type = {}
    
    for record in records:
        training_type = record.template.training_type if record.template else "Unknown"
        training_name = record.template.training_name if record.template else "Unknown"
        
        if training_type not in stats_by_type:
            stats_by_type[training_type] = {
                "name": training_name,
                "count": 0,
                "total_duration": 0
            }
        
        stats_by_type[training_type]["count"] += 1
        stats_by_type[training_type]["total_duration"] += record.duration
    
    return stats_by_type


@router.get("/emotion-distribution")
async def get_emotion_distribution(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取情绪分布数据"""
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    diaries = db.query(Diary).filter(
        Diary.user_id == current_user.id,
        Diary.diary_date >= start_date,
        Diary.main_emotion.isnot(None)
    ).all()
    
    # 统计各情绪出现次数
    emotion_counts = {}
    
    for diary in diaries:
        emotion = diary.main_emotion
        if emotion:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    # 转换为列表格式
    distribution = [
        {"emotion": emotion, "count": count}
        for emotion, count in emotion_counts.items()
    ]
    
    # 按次数排序
    distribution.sort(key=lambda x: x["count"], reverse=True)
    
    return distribution
