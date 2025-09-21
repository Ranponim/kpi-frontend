/**
 * 타입 정의 통합 Export 파일
 *
 * 프로젝트에서 사용되는 모든 TypeScript 인터페이스와 타입을
 * 중앙에서 관리하고 export합니다.
 *
 * @author KPI Analysis Team
 * @version 1.0.0
 */

// ================================
// 사용자 설정 관련 타입들
// ================================

export * from "./userSettings";

// ================================
// 분석 결과 관련 타입들
// ================================

export * from "./analysis";

// ================================
// 타입 재export (편의성을 위한 별칭)
// ================================

// 자주 사용되는 분석 관련 타입들을 명시적으로 재export
export type {
  // 기본 분석 타입
  AnalysisResult,
  AnalysisStatus,
  CreateAnalysisResult,
  UpdateAnalysisResult,

  // LLM 분석
  LLMAnalysisResult,

  // Choi 알고리즘 분석
  ChoiAnalysisResult,
  ChoiKpiJudgement,

  // 마할라노비스 거리 분석
  MahalanobisAnalysisResult,
  MahalanobisAnalysisDetails,
  AbnormalKpi,
  StatisticalAnalysis,
  DrilldownSummary,

  // PEG 분석
  PEGAnalysisResult,
  PEG,
  PEGComparisonResult,
  PEGDefinition,

  // 사용자 설정
  UserSettings,
  DashboardPreferences,
  ChartPreferences,
  FilterPreferences,
  PegConfiguration,
  StatisticsConfiguration,
  LocalStorageSettings,
  LocalStorageStatus,
  LocalStorageError,
} from "./analysis";

export type {
  // 사용자 설정 관련 타입들 (명시적 재export)
  UserSettings as UserSettingsType,
  LocalStorageSettings as LocalStorageSettingsType,
  SerializationResult,
  DeserializationResult,
} from "./userSettings";

// ================================
// 공통 유틸리티 타입들
// ================================

/**
 * API 응답 래퍼 타입
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * 페이지네이션된 응답
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * 로딩 상태
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * 에러 정보
 */
export interface ErrorInfo {
  code?: string | number;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * 필터 조건
 */
export interface FilterCondition {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan"
    | "between";
  value: any;
  values?: any[]; // between 연산자용
}

/**
 * 정렬 조건
 */
export interface SortCondition {
  field: string;
  direction: "asc" | "desc";
}

/**
 * 검색 파라미터
 */
export interface SearchParams {
  query?: string;
  filters?: FilterCondition[];
  sort?: SortCondition[];
  pagination?: {
    page: number;
    pageSize: number;
  };
}

// ================================
// 컴포넌트 Props 공통 타입들
// ================================

/**
 * 기본 React 컴포넌트 Props
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  "data-testid"?: string;
}

/**
 * 로딩 상태를 가지는 컴포넌트 Props
 */
export interface LoadingComponentProps extends BaseComponentProps {
  loading?: boolean;
  loadingText?: string;
}

/**
 * 에러 상태를 가지는 컴포넌트 Props
 */
export interface ErrorComponentProps extends BaseComponentProps {
  error?: ErrorInfo | string | null;
  onRetry?: () => void;
}
