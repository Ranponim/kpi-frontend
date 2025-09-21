/**
 * API 클라이언트 모듈 - 리팩토링된 버전
 *
 * 백엔드 API와의 통신을 담당하는 axios 기반 클라이언트입니다.
 * 런타임 설정, 에러 처리, 로깅 기능을 포함합니다.
 *
 * 주요 기능:
 * - 런타임 설정 기반 API 엔드포인트 구성
 * - 통합된 에러 처리 및 사용자 피드백
 * - LLM 분석 API 함수들
 * - 사용자 설정 동기화 API 함수들
 *
 * 사용법:
 * ```javascript
 * import apiClient, { triggerLLMAnalysis, getUserPreferences } from '@/lib/apiClient.js'
 * ```
 */

import axios from "axios";
import { toast } from "sonner";
// TypeScript 타입 import (JSDoc에서 사용)
// @ts-ignore - JS 파일에서 TS 타입 import
import { AnalysisResult } from "../types";

// ================================
// 로깅 유틸리티
// ================================

/**
 * 로그 레벨별 출력 함수
 * @param {string} level - 로그 레벨 (info, error, warn, debug)
 * @param {string} message - 로그 메시지
 * @param {any} data - 추가 데이터
 */
const logApiClient = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[ApiClient:${timestamp}]`;

  switch (level) {
    case "info":
      console.log(`${prefix} ${message}`, data);
      break;
    case "error":
      console.error(`${prefix} ${message}`, data);
      break;
    case "warn":
      console.warn(`${prefix} ${message}`, data);
      break;
    case "debug":
      console.debug(`${prefix} ${message}`, data);
      break;
    default:
      console.log(`${prefix} ${message}`, data);
  }
};

// ================================
// 설정 및 초기화
// ================================

/**
 * 런타임 설정에서 API 기본 URL을 가져옵니다
 * @returns {string} API 기본 URL
 */
const getBaseURL = () => {
  try {
    // 환경변수 우선순위: Vite 환경변수 > 런타임 설정 > 기본값
    let baseURL = null;

    // 1. Vite 환경변수 우선 확인 (최고 우선순위)
    if (import.meta.env.VITE_API_BASE_URL) {
      baseURL = import.meta.env.VITE_API_BASE_URL;
      logApiClient(
        "info",
        "Vite 환경변수에서 URL 사용 (최고 우선순위)",
        baseURL
      );
    }

    // 2. 런타임 설정 확인 (Docker 환경에서 사용)
    if (!baseURL) {
      const runtimeCfg =
        typeof window !== "undefined" ? window.__RUNTIME_CONFIG__ || {} : {};

      if (
        runtimeCfg.VITE_API_BASE_URL &&
        String(runtimeCfg.VITE_API_BASE_URL).trim()
      ) {
        baseURL = String(runtimeCfg.VITE_API_BASE_URL).trim();
        logApiClient("info", "런타임 설정에서 VITE_API_BASE_URL 사용", baseURL);
      } else if (
        runtimeCfg.BACKEND_BASE_URL &&
        String(runtimeCfg.BACKEND_BASE_URL).trim()
      ) {
        baseURL = String(runtimeCfg.BACKEND_BASE_URL).trim();
        logApiClient("info", "런타임 설정에서 BACKEND_BASE_URL 사용", baseURL);
      }
    }

    // 3. 환경별 기본값 설정 (항상 외부 백엔드 우선)
    if (!baseURL) {
      // 현재 호스트 확인
      const currentHost =
        typeof window !== "undefined" ? window.location.hostname : "localhost";

      // 외부 백엔드 서버 우선 사용 (개발 환경에서도 외부 API 사용)
      if (currentHost !== "localhost" && currentHost !== "127.0.0.1") {
        // Docker/productions 환경: 설정된 백엔드 URL 사용
        baseURL = "http://165.213.69.30:8000";
        logApiClient("info", "외부 호스트 감지, 외부 백엔드 URL 사용", baseURL);
      } else {
        // 개발 환경: 외부 백엔드 우선, localhost는 fallback
        baseURL = "http://165.213.69.30:8000";
        logApiClient("info", "개발 환경에서도 외부 백엔드 우선 사용", baseURL);
      }
    }

    // 5. 최종 검증 및 포맷팅 - 백엔드 URL에 /api가 이미 포함된 경우 그대로 사용
    if (baseURL && baseURL.includes("/api")) {
      // 이미 /api가 포함되어 있으면 그대로 사용
      logApiClient("info", "baseURL에 /api가 이미 포함되어 있음", baseURL);
    } else if (baseURL && !baseURL.endsWith("/api")) {
      // /api가 없으면 추가
      baseURL = baseURL.endsWith("/") ? `${baseURL}api` : `${baseURL}/api`;
    }

    logApiClient("info", "최종 API URL 결정", {
      baseURL,
      runtimeCfg: Object.keys(runtimeCfg),
      currentHost:
        typeof window !== "undefined" ? window.location.hostname : "unknown",
      isDockerEnv:
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost",
    });

    return baseURL;
  } catch (error) {
    logApiClient("error", "API 기본 URL 설정 오류", error);

    // 에러 시에도 환경에 맞는 기본값 반환
    const isDockerEnv =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    return isDockerEnv
      ? "http://165.213.69.30:8000"
      : "http://165.213.69.30:8000";
  }
};

/**
 * 안전한 에러 메시지 추출 함수
 * @param {Error} error - 에러 객체
 * @returns {string} 사용자 친화적인 에러 메시지
 */
const getErrorMessage = (error) => {
  try {
    if (error?.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error?.message) {
      return error.message;
    }
    return "알 수 없는 오류가 발생했습니다.";
  } catch (e) {
    logApiClient("error", "에러 메시지 추출 실패", e);
    return "알 수 없는 오류가 발생했습니다.";
  }
};

/**
 * 민감한 정보를 숨기는 함수
 * @param {Object} obj - 객체
 * @param {string[]} sensitiveKeys - 숨길 키 목록
 * @returns {Object} 민감한 정보가 숨겨진 객체
 */
const sanitizeObject = (
  obj,
  sensitiveKeys = ["password", "token", "secret"]
) => {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = { ...obj };
  sensitiveKeys.forEach((key) => {
    if (sanitized[key]) {
      sanitized[key] = "[HIDDEN]";
    }
  });
  return sanitized;
};

// ================================
// API 클라이언트 생성
// ================================

const baseURL = getBaseURL();

const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false, // 백엔드 allow_credentials=False와 일치
});

logApiClient("info", "API 클라이언트 초기화 완료", { baseURL, timeout: 15000 });

// ================================
// 인터셉터 설정
// ================================

/**
 * 요청 인터셉터: 요청 로깅
 */
apiClient.interceptors.request.use(
  (config) => {
    logApiClient("debug", "API 요청 시작", {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      hasData: !!config.data,
      hasParams: !!config.params,
    });
    return config;
  },
  (error) => {
    logApiClient("error", "API 요청 인터셉터 오류", error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터: 에러 처리 및 사용자 피드백
 */
apiClient.interceptors.response.use(
  (response) => {
    logApiClient("debug", "API 응답 성공", {
      status: response.status,
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
    });
    return response;
  },
  (error) => {
    const errorMessage = getErrorMessage(error);
    logApiClient("error", "API 응답 오류", {
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method?.toUpperCase(),
      message: errorMessage,
    });

    // 사용자에게 명확한 피드백 제공
    toast.error(`요청 실패: ${errorMessage}`);
    return Promise.reject(error);
  }
);

// ================================
// LLM 분석 API 함수들
// ================================

/**
 * LLM 분석을 트리거합니다
 * @param {Object} dbConfig - PostgreSQL 데이터베이스 설정
 * @param {Object} analysisParams - 분석 파라미터
 * @param {string} userId - 사용자 ID (기본값: 'default')
 * @returns {Promise<Object>} 분석 요청 응답
 */
export const triggerLLMAnalysis = async (
  dbConfig,
  analysisParams,
  userId = "default"
) => {
  logApiClient("info", "LLM 분석 요청 시작", {
    dbConfig: sanitizeObject(dbConfig),
    analysisParams,
    userId,
  });

  try {
    const response = await apiClient.post(
      "/api/analysis/trigger-llm-analysis",
      {
        user_id: userId,
        db_config: dbConfig,
        ...analysisParams,
      }
    );

    logApiClient("info", "LLM 분석 트리거 성공", {
      analysisId: response.data?.analysis_id,
    });
    return response.data;
  } catch (error) {
    logApiClient("error", "LLM 분석 트리거 실패", error);
    throw error;
  }
};

/**
// === LLM 데이터 구조 분석 헬퍼 함수들 ===

/**
 * 데이터 구조 분석 함수
 * @param {Object} data - 분석할 데이터 객체
 * @returns {Object} 구조 분석 결과
 */
const analyzeDataStructure = (data) => {
  if (!data || typeof data !== "object") {
    return {
      hasData: false,
      dataType: typeof data,
      structureType: "invalid",
      recommendation: "데이터가 유효하지 않습니다",
    };
  }

  const analysis = {
    hasData: true,
    dataType: typeof data,
    dataKeys: Object.keys(data),
    structureType: "unknown",
    hasNestedData: !!data.data,
    hasAnalysis: !!data.analysis,
    hasNestedAnalysis: !!data.data?.analysis,
    hasDoubleNestedAnalysis: !!data.data?.data?.analysis,
    recommendation: "",
  };

  // 구조 타입 판정
  if (data.data?.data?.analysis) {
    analysis.structureType = "triple_nested";
    analysis.recommendation =
      "백엔드 개선 필요: data.data.analysis → data.analysis";
  } else if (data.data?.analysis) {
    analysis.structureType = "double_nested";
    analysis.recommendation = "권장 구조: data.analysis";
  } else if (data.analysis) {
    analysis.structureType = "single_level";
    analysis.recommendation = "단순 구조: analysis";
  } else {
    analysis.structureType = "no_analysis";
    analysis.recommendation = "분석 데이터가 없습니다";
  }

  return analysis;
};

/**
 * executive_summary 존재 여부 확인
 * @param {Object} data - 확인할 데이터 객체
 * @returns {boolean} executive_summary 존재 여부
 */
const checkExecutiveSummaryPresence = (data) => {
  if (!data) return false;

  // 여러 경로에서 확인
  const paths = [
    data.analysis?.executive_summary,
    data.data?.analysis?.executive_summary,
    data.data?.data?.analysis?.executive_summary,
  ];

  return paths.some(
    (path) => path && typeof path === "string" && path.trim().length > 0
  );
};

/**
 * 데이터 구조 건강도 평가
 * @param {Object} data - 평가할 데이터 객체
 * @returns {string} 건강도 상태
 */
const evaluateDataStructureHealth = (data) => {
  if (!data) return "critical";

  let score = 0;
  const maxScore = 5;

  // 1. 기본 데이터 존재
  if (data && typeof data === "object") score++;

  // 2. 분석 데이터 존재
  if (data.analysis || data.data?.analysis || data.data?.data?.analysis)
    score++;

  // 3. executive_summary 존재
  if (checkExecutiveSummaryPresence(data)) score++;

  // 4. 중첩 구조가 아닌 경우
  if (data.data?.analysis && !data.data?.data?.analysis) score++;

  // 5. 데이터 타입 검증
  const analysis =
    data.analysis || data.data?.analysis || data.data?.data?.analysis || {};
  if (analysis && typeof analysis === "object") score++;

  // 건강도 판정
  const healthRatio = score / maxScore;
  if (healthRatio >= 0.8) return "excellent";
  if (healthRatio >= 0.6) return "good";
  if (healthRatio >= 0.4) return "fair";
  if (healthRatio >= 0.2) return "poor";
  return "critical";
};

/**
 * 특정 LLM 분석 결과를 조회합니다
 * @param {string} analysisId - 분석 ID
 * @returns {Promise<Object>} 분석 결과
 */
export const getLLMAnalysisResult = async (analysisId) => {
  logApiClient("info", "LLM 분석 결과 조회", { analysisId });

  try {
    const response = await apiClient.get(
      `/api/analysis/llm-analysis/${analysisId}`
    );

    // ResponseValidationError 감지 및 로깅
    if (response.data?.detail && Array.isArray(response.data.detail)) {
      const validationErrors = response.data.detail;
      const hasMissingDataError = validationErrors.some(
        (d) => d.type === "missing" && d.loc?.includes("data")
      );

      if (hasMissingDataError) {
        logApiClient(
          "error",
          "🚨 ResponseValidationError 감지 (LLM 분석): data 필드 누락",
          {
            analysisId,
            validationErrors,
            responseDataKeys: response.data ? Object.keys(response.data) : [],
          }
        );
      }
    }

    // 응답 데이터 구조 상세 로깅 (개선된 구조 분석)
    const dataStructure = analyzeDataStructure(response.data);
    logApiClient("info", "LLM 분석 결과 조회 성공", {
      analysisId,
      ...dataStructure,
      // 추가 검증 정보
      hasExecutiveSummary: checkExecutiveSummaryPresence(response.data),
      dataStructureHealth: evaluateDataStructureHealth(response.data),
    });

    return response.data;
  } catch (error) {
    // ResponseValidationError 구분 로깅
    if (
      error?.response?.data?.detail &&
      Array.isArray(error.response.data.detail)
    ) {
      const validationErrors = error.response.data.detail;
      const hasMissingDataError = validationErrors.some(
        (d) => d.type === "missing" && d.loc?.includes("data")
      );

      if (hasMissingDataError) {
        logApiClient(
          "error",
          "🚨 ResponseValidationError 발생 (LLM 분석): data 필드 누락",
          {
            analysisId,
            status: error.response.status,
            validationErrors,
            fullError: error.response.data,
          }
        );
      }
    }

    logApiClient("error", "LLM 분석 결과 조회 실패", {
      analysisId,
      error: error.message,
      status: error?.response?.status,
      hasValidationError: !!(
        error?.response?.data?.detail &&
        Array.isArray(error.response.data.detail)
      ),
    });
    throw error;
  }
};

/**
 * Choi 알고리즘 판정을 실행합니다 (POST /api/kpi/choi-analysis)
 * @param {Object} payload - { input_data, cell_ids, time_range, compare_mode }
 * @returns {Promise<Object>} 판정 결과 (kpi_judgement 등)
 */
export const runChoiAnalysis = async (payload) => {
  logApiClient("info", "Choi 알고리즘 요청 시작", {
    hasInputData: !!payload?.input_data,
    cellIds: Array.isArray(payload?.cell_ids) ? payload.cell_ids.length : 0,
    hasTimeRange: !!payload?.time_range,
    compareMode: payload?.compare_mode,
  });

  try {
    const response = await apiClient.post("/api/kpi/choi-analysis", payload);
    logApiClient("info", "Choi 알고리즘 요청 성공", {
      keys: Object.keys(response.data || {}),
    });
    return response.data;
  } catch (error) {
    logApiClient("error", "Choi 알고리즘 요청 실패", error);
    throw error;
  }
};

/**
 * 분석 결과 목록에서 LLM 분석 결과도 포함하여 조회합니다
 * 기존 getAnalysisResults에 type 필터 추가
 * @param {Object} params - 쿼리 파라미터
 * @returns {Promise<Object>} 분석 결과 목록
 */
export const getAnalysisResults = async (params = {}) => {
  logApiClient("info", "분석 결과 목록 조회", { params });

  try {
    const response = await apiClient.get("/api/analysis/results", { params });

    logApiClient("info", "분석 결과 목록 조회 성공", {
      resultCount: response.data?.results?.length || 0,
    });
    return response.data;
  } catch (error) {
    logApiClient("error", "분석 결과 목록 조회 실패", error);
    throw error;
  }
};

/**
 * Database 연결 테스트
 * @param {Object} dbConfig - 데이터베이스 설정
 * @returns {Promise<Object>} 연결 테스트 결과
 */
export const testDatabaseConnection = async (dbConfig) => {
  logApiClient("info", "Database 연결 테스트", {
    dbConfig: sanitizeObject(dbConfig),
  });

  try {
    const response = await apiClient.post(
      "/api/master/test-connection",
      dbConfig
    );
    logApiClient("info", "Database 연결 성공");
    return { success: true, data: response.data };
  } catch (error) {
    logApiClient("error", "Database 연결 실패", error);
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * 상세 분석 결과를 조회합니다
 * 모든 분석 타입(LLM, Choi, 마할라노비스, PEG)의 통합 결과를 반환합니다
 *
 * @param {string} id - 분석 결과 ID
 * @returns {Promise<AnalysisResult>} 상세 분석 결과
 */
export const getDetailedResult = async (id) => {
  logApiClient("info", "상세 분석 결과 조회 시작", { resultId: id });

  try {
    // 입력 검증
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      throw new Error("유효하지 않은 분석 결과 ID입니다.");
    }

    const response = await apiClient.get(`/api/results/${id}/detailed`);

    // 응답 데이터 검증
    if (!response.data) {
      throw new Error("분석 결과 데이터가 없습니다.");
    }

    const analysisResult = response.data;

    // 기본 구조 검증
    if (!analysisResult.id) {
      logApiClient("warn", "응답에 ID가 없어 요청 ID로 설정", {
        requestId: id,
      });
      analysisResult.id = id;
    }

    if (!analysisResult.timestamp) {
      logApiClient("warn", "응답에 timestamp가 없어 현재 시간으로 설정");
      analysisResult.timestamp = new Date().toISOString();
    }

    // 각 분석 타입별 데이터 정규화
    if (analysisResult.llmAnalysis) {
      logApiClient("debug", "LLM 분석 데이터 확인됨");
    }

    if (analysisResult.choiAnalysis) {
      logApiClient("debug", "Choi 알고리즘 분석 데이터 확인됨");
    }

    if (analysisResult.mahalanobisAnalysis) {
      logApiClient("debug", "마할라노비스 분석 데이터 확인됨");
    }

    if (analysisResult.pegAnalysis) {
      logApiClient("debug", "PEG 분석 데이터 확인됨");
    }

    logApiClient("info", "상세 분석 결과 조회 성공", {
      resultId: id,
      hasLlm: !!analysisResult.llmAnalysis,
      hasChoi: !!analysisResult.choiAnalysis,
      hasMahalanobis: !!analysisResult.mahalanobisAnalysis,
      hasPeg: !!analysisResult.pegAnalysis,
    });

    return analysisResult;
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    logApiClient("error", "상세 분석 결과 조회 실패", {
      resultId: id,
      error: errorMessage,
      status: error?.response?.status,
    });

    // 사용자 친화적인 에러 메시지
    if (error?.response?.status === 404) {
      throw new Error(`분석 결과를 찾을 수 없습니다. (ID: ${id})`);
    } else if (error?.response?.status === 403) {
      throw new Error("분석 결과에 접근할 권한이 없습니다.");
    } else if (error?.response?.status >= 500) {
      throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }

    throw error;
  }
};

// ================================
// 사용자 설정 동기화 API 함수들
// ================================

/**
 * 서버에서 사용자 설정을 조회합니다 (GET /api/preference/settings)
 * @param {string} userId - 사용자 ID (기본값: 'default')
 * @returns {Promise<Object>} 사용자 설정 데이터
 */
export const getUserPreferences = async (userId = "default") => {
  logApiClient("info", "사용자 설정 조회", { userId });

  try {
    const response = await apiClient.get("/api/preference/settings", {
      params: { user_id: userId },
    });

    logApiClient("info", "사용자 설정 조회 성공", { userId });
    return { success: true, data: response.data };
  } catch (error) {
    // 404는 정상적인 경우 (처음 사용자)
    if (error?.response?.status === 404) {
      logApiClient("info", "사용자 설정이 없음 (신규 사용자)", { userId });
      return { success: true, data: null, isNew: true };
    }

    logApiClient("error", "사용자 설정 조회 실패", { userId, error });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * 서버에 사용자 설정을 저장합니다 (PUT /api/preference/settings)
 * @param {string} userId - 사용자 ID (기본값: 'default')
 * @param {Object} preferenceData - 저장할 설정 데이터
 * @returns {Promise<Object>} 저장 결과
 */
export const saveUserPreferences = async (
  userId = "default",
  preferenceData
) => {
  logApiClient("info", "사용자 설정 저장", {
    userId,
    hasData: !!preferenceData,
    dataKeys: preferenceData ? Object.keys(preferenceData) : [],
  });

  try {
    const response = await apiClient.put(
      "/api/preference/settings",
      preferenceData,
      {
        params: { user_id: userId },
      }
    );

    logApiClient("info", "사용자 설정 저장 성공", { userId });
    return { success: true, data: response.data };
  } catch (error) {
    logApiClient("error", "사용자 설정 저장 실패", { userId, error });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * 서버에 새로운 사용자 설정을 생성합니다 (POST /api/preference/settings)
 * @param {Object} preferenceData - 생성할 설정 데이터 (user_id 포함)
 * @returns {Promise<Object>} 생성 결과
 */
export const createUserPreferences = async (preferenceData) => {
  const userId = preferenceData.user_id || preferenceData.userId;
  logApiClient("info", "사용자 설정 생성", { userId });

  try {
    const response = await apiClient.post(
      "/api/preference/settings",
      preferenceData
    );

    logApiClient("info", "사용자 설정 생성 성공", { userId });
    return { success: true, data: response.data };
  } catch (error) {
    logApiClient("error", "사용자 설정 생성 실패", { userId, error });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * 서버에서 사용자 설정을 삭제합니다 (DELETE /api/preference/settings)
 * @param {string} userId - 사용자 ID (기본값: 'default')
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteUserPreferences = async (userId = "default") => {
  logApiClient("info", "사용자 설정 삭제", { userId });

  try {
    await apiClient.delete("/api/preference/settings", {
      params: { user_id: userId },
    });

    logApiClient("info", "사용자 설정 삭제 성공", { userId });
    return { success: true };
  } catch (error) {
    logApiClient("error", "사용자 설정 삭제 실패", { userId, error });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * 설정 내보내기 (GET /api/preference/export)
 * @param {string} userId - 사용자 ID (기본값: 'default')
 * @returns {Promise<Object>} 내보내기 결과
 */
export const exportUserPreferences = async (userId = "default") => {
  logApiClient("info", "사용자 설정 내보내기", { userId });

  try {
    const response = await apiClient.get("/api/preference/export", {
      params: { user_id: userId },
    });

    logApiClient("info", "사용자 설정 내보내기 성공", { userId });
    return { success: true, data: response.data };
  } catch (error) {
    logApiClient("error", "사용자 설정 내보내기 실패", { userId, error });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

/**
 * 설정 가져오기 (POST /api/preference/import)
 * @param {string} userId - 사용자 ID (기본값: 'default')
 * @param {File} file - 가져올 설정 파일
 * @param {boolean} overwrite - 기존 설정 덮어쓰기 여부 (기본값: false)
 * @returns {Promise<Object>} 가져오기 결과
 */
export const importUserPreferences = async (
  userId = "default",
  file,
  overwrite = false
) => {
  logApiClient("info", "사용자 설정 가져오기", {
    userId,
    fileName: file?.name,
    fileSize: file?.size,
    overwrite,
  });

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/api/preference/import", formData, {
      params: { user_id: userId, overwrite },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    logApiClient("info", "사용자 설정 가져오기 성공", { userId });
    return { success: true, data: response.data };
  } catch (error) {
    logApiClient("error", "사용자 설정 가져오기 실패", { userId, error });
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

// ================================
// 내보내기
// ================================

export default apiClient;
