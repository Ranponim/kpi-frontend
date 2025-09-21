/**
 * 분석 결과 관련 TypeScript 인터페이스 정의
 *
 * 3GPP KPI 분석 플랫폼에서 사용되는 다양한 분석 결과 타입들을 정의합니다.
 * - LLM 분석 결과
 * - Choi 알고리즘 분석 결과
 * - 마할라노비스 거리 분석 결과
 * - PEG 분석 결과
 *
 * @author KPI Analysis Team
 * @version 1.0.0
 */

// ================================
// 기본 분석 상태 타입
// ================================

/**
 * 분석 결과의 상태를 나타내는 유니온 타입
 */
export type AnalysisStatus = "OK" | "NOK" | "PARTIAL_OK";

// ================================
// LLM 분석 결과 인터페이스
// ================================

/**
 * LLM 분석 결과 인터페이스
 * AI 모델이 생성한 분석 요약, 주요 발견사항, 권장사항을 포함합니다.
 */
export interface LLMAnalysisResult {
  /** AI가 생성한 전체적인 분석 요약 */
  summary: string;

  /** AI가 도출한 주요 발견사항 목록 */
  keyFindings: string[];

  /** AI가 제안하는 권장사항 목록 */
  recommendations: string[];

  /** AI 분석의 신뢰도 (0.0 ~ 1.0) */
  confidence?: number;

  /** 분석 생성 시각 */
  generatedAt?: string;
}

// ================================
// 통합 분석 결과 인터페이스
// ================================

/**
 * 모든 분석 결과를 통합하는 메인 인터페이스
 * 각 분석 타입별 결과를 하나의 객체로 구성합니다.
 */
export interface AnalysisResult {
  /** 분석 결과의 고유 식별자 */
  id: string;

  /** 원본 시험 결과 ID */
  testId: string;

  /** 분석이 수행된 시각 */
  timestamp: string;

  /** 분석 결과의 전체적인 상태 */
  overallStatus?: AnalysisStatus;

  /** LLM 분석 결과 (최우선 표시) */
  llmAnalysis?: LLMAnalysisResult;

  /** Choi 알고리즘 분석 결과 */
  choiAnalysis?: ChoiAnalysisResult;

  /** 마할라노비스 거리 분석 결과 */
  mahalanobisAnalysis?: MahalanobisAnalysisResult;

  /** PEG 분석 결과 */
  pegAnalysis?: PEGAnalysisResult;

  /** 추가 메타데이터 */
  metadata?: {
    /** 분석을 수행한 사용자 ID */
    userId?: string;
    /** 분석 버전 */
    version?: string;
    /** 분석에 사용된 설정 */
    analysisConfig?: Record<string, any>;
  };
}

// ================================
// 미래 확장을 위한 인터페이스 스텁
// ================================

// ================================
// Choi 알고리즘 분석 결과 인터페이스
// ================================

/**
 * Choi 알고리즘의 KPI별 판정 결과
 */
export interface ChoiKpiJudgement {
  /** KPI 식별자 */
  kpi: string;

  /** 판정 결과 */
  judgement: AnalysisStatus;

  /** 판정 근거 또는 설명 */
  reason?: string;
}

/**
 * Choi 알고리즘 분석 결과 인터페이스
 * 품질 저하 판정을 위한 특화된 알고리즘 결과
 */
export interface ChoiAnalysisResult {
  /** 전체적인 판정 결과 */
  overall: AnalysisStatus;

  /** 판정 근거 목록 */
  reasons?: string[];

  /** KPI별 상세 판정 결과 */
  by_kpi?: Record<string, AnalysisStatus>;

  /** 경고 메시지 목록 */
  warnings?: string[];

  /** 분석에 사용된 KPI 개수 */
  totalKpis?: number;

  /** 분석 수행 시각 */
  analyzedAt?: string;

  /** 분석 신뢰도 (0.0 ~ 1.0) */
  confidence?: number;
}

// ================================
// 마할라노비스 거리 분석 결과 인터페이스
// ================================

/**
 * 이상 KPI 정보
 */
export interface AbnormalKpi {
  /** KPI 이름 */
  name: string;

  /** 마할라노비스 거리 값 */
  distance: number;

  /** 실제 측정값 */
  value: number;

  /** 기대값 (평균) */
  expected?: number;

  /** 이상 정도 (1-10) */
  severity?: number;
}

/**
 * 통계적 분석 결과
 */
export interface StatisticalAnalysis {
  /** 분석 항목명 */
  metric: string;

  /** 분석 값 */
  value: number;

  /** 설명 */
  description: string;
}

/**
 * 드릴다운 분석 요약
 */
export interface DrilldownSummary {
  /** 분석된 총 KPI 수 */
  totalAnalyzed: number;

  /** 정상 KPI 수 */
  normalCount: number;

  /** 주의 KPI 수 */
  cautionCount: number;

  /** 경고 KPI 수 */
  warningCount: number;
}

/**
 * 마할라노비스 분석 상세 결과
 */
export interface MahalanobisAnalysisDetails {
  /** 스크리닝 결과 */
  screening: {
    /** 스크리닝 설명 */
    description: string;
  };

  /** 드릴다운 분석 */
  drilldown?: {
    /** 분석 요약 */
    summary: DrilldownSummary;

    /** 통계적 분석 결과 목록 */
    statisticalAnalysis: StatisticalAnalysis[];
  };
}

/**
 * 마할라노비스 거리 분석 결과 인터페이스
 * 다변량 이상치 탐지 알고리즘 결과
 */
export interface MahalanobisAnalysisResult {
  /** 전체 알람 레벨 */
  alarmLevel: "normal" | "caution" | "warning" | "critical";

  /** 분석된 총 KPI 수 */
  totalKpis: number;

  /** 이상 KPI 목록 */
  abnormalKpis: AbnormalKpi[];

  /** 이상 점수 (0.0 ~ 1.0) */
  abnormalScore: number;

  /** 상세 분석 결과 */
  analysis: MahalanobisAnalysisDetails;

  /** 분석 수행 시각 */
  analyzedAt?: string;

  /** 에러 정보 (분석 실패 시) */
  error?: string;

  /** 캐시 키 (성능 최적화용) */
  _cacheKey?: string;
}

// ================================
// PEG 분석 결과 인터페이스
// ================================

/**
 * 개별 PEG 항목 정보
 */
export interface PEG {
  /** PEG 고유 식별자 */
  id: string;

  /** PEG 이름 */
  name: string;

  /** 현재 측정값 */
  value: number;

  /** 기대값 또는 기준값 */
  expected?: number;

  /** 측정 단위 */
  unit?: string;

  /** PEG 가중치 (1-10) */
  weight?: number;

  /** 분석 상태 */
  status?: AnalysisStatus;

  /** 설명 또는 분석 근거 */
  explanation?: string;

  /** 추가 메타데이터 */
  metadata?: Record<string, any>;
}

/**
 * PEG 비교 분석 결과
 */
export interface PEGComparisonResult {
  /** PEG 이름 */
  peg_name: string;

  /** N-1 기간 평균값 */
  n1_avg: number;

  /** N 기간 평균값 */
  n_avg: number;

  /** N-1 기간 RSD (상대표준편차) */
  n1_rsd?: number;

  /** N 기간 RSD (상대표준편차) */
  n_rsd?: number;

  /** 변화량 (절대값) */
  change?: number;

  /** 변화율 (%) */
  changePercent?: number;

  /** 트렌드 방향 */
  trend?: "up" | "down" | "stable";

  /** PEG 가중치 */
  weight?: number;

  /** N-1 기간 원시 데이터 */
  n1_values?: number[];

  /** N 기간 원시 데이터 */
  n_values?: number[];
}

/**
 * PEG 정의 정보
 */
export interface PEGDefinition {
  /** PEG 이름 */
  name: string;

  /** 가중치 */
  weight: number;

  /** 임계값 설정 */
  thresholds?: {
    /** 정상 범위 최소값 */
    min?: number;
    /** 정상 범위 최대값 */
    max?: number;
    /** 경고 임계값 */
    warning?: number;
    /** 위험 임계값 */
    critical?: number;
  };

  /** 설명 */
  description?: string;
}

/**
 * PEG 분석 결과 인터페이스
 * Performance Engineering Guidelines 분석 결과
 */
export interface PEGAnalysisResult {
  /** 개별 PEG 결과 목록 */
  pegs: PEG[];

  /** PEG 비교 분석 결과 (N-1 vs N 기간 비교) */
  comparisonResults?: PEGComparisonResult[];

  /** 전체적인 PEG 분석 상태 */
  overallStatus?: AnalysisStatus;

  /** 분석 요약 정보 */
  summary?: {
    /** 총 PEG 수 */
    totalPegs: number;
    /** 정상 PEG 수 */
    normalPegs: number;
    /** 경고 PEG 수 */
    warningPegs: number;
    /** 위험 PEG 수 */
    criticalPegs: number;
  };

  /** 사용된 PEG 정의 */
  pegDefinitions?: Record<string, PEGDefinition>;

  /** 분석에 사용된 필터 설정 */
  filterSettings?: {
    /** 이름 필터 */
    nameFilter?: string;
    /** 가중치 필터 */
    weightFilter?: "all" | "high" | "medium" | "low";
    /** 트렌드 필터 */
    trendFilter?: "all" | "up" | "down" | "stable";
  };

  /** 분석 수행 시각 */
  analyzedAt?: string;

  /** 분석에 사용된 데이터 소스 */
  dataSource?: {
    /** 분석 기간 */
    period?: string;
    /** 데이터 개수 */
    dataCount?: number;
    /** 데이터 품질 */
    quality?: "high" | "medium" | "low";
  };

  /** 에러 정보 (분석 실패 시) */
  error?: string;
}

// ================================
// 헬퍼 타입들
// ================================

/**
 * 분석 결과 생성을 위한 부분적 타입
 * 필수 필드만을 요구하는 생성용 인터페이스
 */
export type CreateAnalysisResult = Omit<AnalysisResult, "id" | "timestamp"> & {
  id?: string;
  timestamp?: string;
};

/**
 * 분석 결과 업데이트를 위한 부분적 타입
 * 모든 필드가 선택적인 업데이트용 인터페이스
 */
export type UpdateAnalysisResult = Partial<AnalysisResult> & {
  id: string;
};
