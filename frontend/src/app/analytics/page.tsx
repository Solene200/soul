'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageErrorState } from '@/components/PageErrorState';
import { PageLoading } from '@/components/PageLoading';
import { apiRequest } from '@/lib/api';
import { hasAccessToken } from '@/lib/auth';
import { useRequireAuth } from '@/hooks/useRequireAuth';

interface EmotionTrendPoint {
  date: string;
  score: number;
  emotion: string;
}

interface EmotionDistributionItem {
  emotion: string;
  count: number;
}

interface AnalyticsYearlyReport {
  year: number;
  diary_count: number;
  assessment_count: number;
  training_count: number;
  training_duration: number;
  total_words: number;
  positive_ratio: number;
  total_emotion_count: number;
  emotion_trend: EmotionTrendPoint[];
  emotion_distribution: EmotionDistributionItem[];
}

interface UserInfo {
  created_at: string;
}

const EMOTION_COLORS: Record<string, string> = {
  '快乐': '#FEF3C7',
  '兴奋': '#FED7AA',
  '平静': '#DBEAFE',
  '感恩': '#E9D5FF',
  '满足': '#D1FAE5',
  '悲伤': '#E5E7EB',
  '焦虑': '#FEE2E2',
  '愤怒': '#FECACA',
  '失落': '#E0E7FF',
  '孤独': '#F1F5F9',
  '压力': '#FFEDD5',
  '恐惧': '#F3E8FF',
};

export default function AnalyticsPage() {
  const router = useRouter();
  useRequireAuth();
  const [report, setReport] = useState<AnalyticsYearlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [userCreatedYear, setUserCreatedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (!hasAccessToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadUserInfo = async () => {
      try {
        const userData = await apiRequest<UserInfo>('/api/auth/me');

        if (!cancelled && userData?.created_at) {
          setUserCreatedYear(new Date(userData.created_at).getFullYear());
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };

    void loadUserInfo();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasAccessToken()) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const data = await apiRequest<AnalyticsYearlyReport>(
          '/api/analytics/yearly-report',
          {
            query: { year: selectedYear },
          }
        );

        if (cancelled) {
          return;
        }

        setReport(data ?? null);
      } catch (error) {
        console.error('获取数据失败:', error);
        setLoadError('分析数据暂时无法加载，请稍后重试。');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // 生成年份列表
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = userCreatedYear;
    const endYear = currentYear;
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  };

  if (loading) {
    return <PageLoading label="加载分析数据..." tone="blue" />;
  }

  if (loadError) {
    return (
      <PageErrorState
        message={loadError}
        actionLabel="重新加载"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!report) {
    return (
      <PageErrorState
        message="分析数据暂时不可用，请稍后重试。"
        actionLabel="重新加载"
        onAction={() => window.location.reload()}
      />
    );
  }

  const emotionTrend = report.emotion_trend;
  const emotionDistribution = report.emotion_distribution;
  const totalEmotionCount = report.total_emotion_count;
  const maxEmotionScore = Math.max(...emotionTrend.map((point) => Math.abs(point.score)), 1);
  const hasData =
    report.diary_count > 0 || report.assessment_count > 0 || report.training_count > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← 返回
            </button>
            <h1 className="text-3xl font-bold text-gray-800">📊 数据分析</h1>
          </div>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {generateYearOptions().map(year => (
              <option key={year} value={year}>{year} 年</option>
            ))}
          </select>
        </div>

        {/* 年度核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">📝</div>
            <div className="text-3xl font-bold text-blue-500">{report.diary_count}</div>
            <div className="text-sm text-gray-600 mt-2">日记篇数</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">✍️</div>
            <div className="text-3xl font-bold text-purple-500">{report.total_words.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-2">总字数</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">📋</div>
            <div className="text-3xl font-bold text-green-500">{report.assessment_count}</div>
            <div className="text-sm text-gray-600 mt-2">心理评估</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">🏋️</div>
            <div className="text-3xl font-bold text-orange-500">{report.training_count}</div>
            <div className="text-sm text-gray-600 mt-2">训练次数</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">⏱️</div>
            <div className="text-3xl font-bold text-red-500">{report.training_duration}</div>
            <div className="text-sm text-gray-600 mt-2">训练时长(分)</div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">😊</div>
            <div className="text-3xl font-bold text-green-500">{report.positive_ratio}%</div>
            <div className="text-sm text-gray-600 mt-2">积极占比</div>
          </div>
        </div>

        <div className="space-y-6">
          {/* 情绪分布 */}
          {emotionDistribution.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">😊 情绪分布</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {emotionDistribution.map(({ emotion, count }) => (
                  <div key={emotion} className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: EMOTION_COLORS[emotion] || '#E5E7EB' }}
                      >
                        {count}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{emotion}</div>
                        <div className="text-sm text-gray-600">
                          {totalEmotionCount > 0
                            ? `${((count / totalEmotionCount) * 100).toFixed(0)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 情绪趋势图 */}
          {emotionTrend.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">📈 情绪趋势</h2>
              <div className="relative">
                {/* 左侧标签 */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                  <span>积极</span>
                  <span>0</span>
                  <span>消极</span>
                </div>
                
                {/* 图表容器 */}
                <div className="ml-12 h-64">
                  {/* 0刻度线 */}
                  <div className="absolute left-12 right-0 top-1/2 border-t-2 border-gray-300 z-0"></div>
                  
                  {/* 柱状图 */}
                  <div className="relative h-full flex justify-around gap-1">
                    {emotionTrend.map((point, index) => {
                      const heightPercent = point.score === 0
                        ? 2
                        : (Math.abs(point.score) / maxEmotionScore) * 45 + 5;
                      const isPositive = point.score > 0;
                      const isNeutral = point.score === 0;

                      return (
                        <div
                          key={`${point.date}-${index}`}
                          className="h-full flex flex-col group relative flex-1"
                        >
                          <div className="flex-1 flex flex-col justify-end items-stretch">
                            {isPositive && (
                              <div
                                className="w-full bg-green-400 hover:bg-green-500 transition-all rounded-t"
                                style={{ height: `${heightPercent * 2}%` }}
                              />
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-start items-stretch">
                            {isNeutral && (
                              <div className="w-full h-1 bg-gray-300 hover:bg-gray-400 rounded" />
                            )}
                            {!isPositive && !isNeutral && (
                              <div
                                className="w-full bg-red-400 hover:bg-red-500 transition-all rounded-b"
                                style={{ height: `${heightPercent * 2}%` }}
                              />
                            )}
                          </div>

                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20">
                            {point.date}
                            <br />
                            {point.emotion} ({point.score > 0 ? '+' : ''}{point.score})
                          </div>

                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                            {new Date(point.date).getMonth() + 1}/{new Date(point.date).getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center mt-10">
                {selectedYear} 年的情绪变化（共 {emotionTrend.length} 篇日记）
              </div>
            </div>
          )}

          {!hasData && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 mb-2">暂无{selectedYear}年数据</p>
              <p className="text-sm text-gray-500 mb-4">开始使用平台功能后，这里会显示你的成长数据</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push('/diary/write')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  写日记
                </button>
                <button
                  onClick={() => router.push('/assessment')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  心理评估
                </button>
                <button
                  onClick={() => router.push('/training')}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  心理训练
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
