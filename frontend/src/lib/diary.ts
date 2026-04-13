export interface DiaryEmotion {
  emotion: string;
  intensity: number;
}

export interface DiaryLifeDimensions {
  sleep: number;
  diet: number;
  exercise: number;
  social: number;
  productivity: number;
}

export interface DiaryGuidedResponse {
  question: string;
  answer: string;
}

export interface DiaryRecommendation {
  title: string;
  reason: string;
  type?: string;
}

export interface DiaryEmotionAnalysis {
  primary_emotion?: string;
  emotion_intensity?: number;
  emotion_valence?: string;
}

export interface DiaryAiFeedback {
  emotion_analysis?: DiaryEmotionAnalysis | null;
  life_quality?: string[] | null;
  positive_highlights?: string[] | null;
  recommendations?: DiaryRecommendation[] | null;
  overall_score?: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function toRecommendations(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title : '推荐内容',
      reason: typeof item.reason === 'string' ? item.reason : '暂无说明',
      type: typeof item.type === 'string' ? item.type : undefined,
    }));
}

export function normalizeDiaryAiFeedback(value: unknown): DiaryAiFeedback {
  if (!isRecord(value)) {
    return {};
  }

  const emotionAnalysis = isRecord(value.emotion_analysis)
    ? {
        primary_emotion:
          typeof value.emotion_analysis.primary_emotion === 'string'
            ? value.emotion_analysis.primary_emotion
            : undefined,
        emotion_intensity:
          typeof value.emotion_analysis.emotion_intensity === 'number'
            ? value.emotion_analysis.emotion_intensity
            : undefined,
        emotion_valence:
          typeof value.emotion_analysis.emotion_valence === 'string'
            ? value.emotion_analysis.emotion_valence
            : undefined,
      }
    : null;

  return {
    emotion_analysis: emotionAnalysis,
    life_quality: toStringArray(value.life_quality),
    positive_highlights: toStringArray(value.positive_highlights),
    recommendations: toRecommendations(value.recommendations),
    overall_score: typeof value.overall_score === 'number' ? value.overall_score : null,
  };
}

export function normalizeGuidedResponse(value: unknown): DiaryGuidedResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.question !== 'string' || typeof value.answer !== 'string') {
    return null;
  }

  return {
    question: value.question,
    answer: value.answer,
  };
}

export function calculateWritingDurationMinutes(startedAt: number | null, finishedAt = Date.now()) {
  if (!startedAt) {
    return 0;
  }

  const elapsedMs = Math.max(0, finishedAt - startedAt);
  const elapsedMinutes = Math.round(elapsedMs / 60000);

  return Math.max(1, elapsedMinutes);
}
