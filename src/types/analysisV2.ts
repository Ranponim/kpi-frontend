/**
 * 분석 API V2 타입 정의
 *
 * 백엔드 /api/analysis/results-v2/ 엔드포인트의 스키마와 동기화
 */

/**
 * PEG 통계
 */
export interface PegStatistics {
  avg: number;
  pct_95: number;
  pct_99: number;
  min: number;
  max: number;
  count: number;
  std: number;
}

/**
 * PEG 비교 결과
 */
export interface PegComparison {
  peg_name: string;
  n_minus_1: PegStatistics;
  n: PegStatistics;
  change_absolute: number;
  change_percentage: number;
  llm_insight?: string;
}

/**
 * Choi 알고리즘 결과
 */
export interface ChoiResult {
  enabled: boolean;
  status?: "normal" | "warning" | "critical";
  score?: number;
  message?: string;
}

/**
 * LLM 분석 결과
 */
export interface LLMAnalysis {
  summary: string;
  issues: string[];
  recommendations: string[];
  confidence: number;
  model_name?: string;
  peg_insights?: Record<string, string>;
}

/**
 * 분석 결과 (V2 - 간소화)
 */
export interface AnalysisResultV2 {
  id: string;
  ne_id: string;
  cell_id: string;
  swname: string;
  rel_ver?: string;
  created_at: string;

  // Choi 알고리즘 결과 (선택적)
  choi_result?: ChoiResult;

  // LLM 분석 결과
  llm_analysis: LLMAnalysis;

  // PEG 비교 결과
  peg_comparisons: PegComparison[];
}

/**
 * 분석 결과 목록 응답 (V2)
 */
export interface AnalysisResultsListV2 {
  items: AnalysisResultV2[];
  total: number;
  page: number;
  size: number;
  has_next: boolean;
}

/**
 * 분석 결과 상세 응답 (V2)
 */
export interface AnalysisResultDetailResponseV2 {
  message: string;
  data: AnalysisResultV2;
}

/**
 * 분석 결과 통계 요약 (V2)
 */
export interface AnalysisStatsV2 {
  total_count: number;
  by_ne: Record<string, number>;
  by_cell: Record<string, number>;
  by_swname: Record<string, number>;
  by_choi_status?: {
    normal: number;
    warning: number;
    critical: number;
  };
  date_range: {
    earliest: string;
    latest: string;
  };
}

/**
 * 분석 결과 통계 응답 (V2)
 */
export interface AnalysisStatsResponseV2 {
  message: string;
  data: AnalysisStatsV2;
}

/**
 * 조회 필터 파라미터 (V2)
 */
export interface AnalysisFilterParamsV2 {
  page?: number;
  size?: number;
  ne_id?: string;
  cell_id?: string;
  swname?: string;
  rel_ver?: string;
  date_from?: string;
  date_to?: string;
  choi_status?: "normal" | "warning" | "critical";
}







