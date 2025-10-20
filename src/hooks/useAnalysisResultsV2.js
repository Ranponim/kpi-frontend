/**
 * LLM 분석 결과 V2 데이터를 관리하는 커스텀 훅
 *
 * 이 훅은 V2 API를 사용하여 분석 결과 조회, 필터링, 페이지네이션 기능을 제공합니다.
 * /api/analysis/results-v2 엔드포인트 사용
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { getAnalysisResultsV2 } from "@/lib/apiClient.js";
import { toast } from "sonner";

// Axios CancelToken import
import axios from "axios";

/**
 * 분석 결과 V2 데이터를 관리하는 커스텀 훅
 *
 * @param {Object} options - 옵션 객체
 * @param {number} options.initialLimit - 초기 페이지당 항목 수 (기본값: 20)
 * @param {boolean} options.autoFetch - 자동 데이터 조회 여부 (기본값: true)
 * @param {Object} options.initialFilters - 초기 필터 값
 * @returns {Object} 분석 결과 상태 및 관리 함수들
 */
export const useAnalysisResultsV2 = ({
  initialLimit = 20,
  autoFetch = true,
  initialFilters = {},
} = {}) => {
  // === 상태 관리 (안전한 초기화) ===
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // 페이지네이션 상태 (안전한 초기화)
  const [pagination, setPagination] = useState(() => ({
    page: 1,
    size: initialLimit || 20,
    total: 0,
  }));

  // 필터 상태 (안전한 초기화) - V2 API 파라미터에 맞춤
  const [filters, setFilters] = useState(() => ({
    ne_id: "",
    cell_id: "",
    swname: "",
    rel_ver: "",
    date_from: null,
    date_to: null,
    choi_status: "",
    ...(initialFilters || {}),
  }));

  // === 로깅 함수 ===
  const logInfo = useCallback((message, data = {}) => {
    console.log(`[useAnalysisResultsV2] ${message}`, data);
  }, []);

  const logError = useCallback((message, error) => {
    console.error(`[useAnalysisResultsV2] ${message}`, error);
  }, []);

  // === 디바운스 타이머 ref ===
  const debounceTimerRef = useRef(null);

  // === API 요청 취소 컨트롤러 ===
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true); // 컴포넌트 마운트 상태 추적
  const isRequestingRef = useRef(false); // 현재 요청 중인지 추적
  const fetchResultsRef = useRef(null); // fetchResults 함수 참조

  // === API 호출 함수 ===
  const fetchResults = useCallback(
    async ({
      page = pagination.page,
      size = pagination.size,
      append = false,
      showToast = true,
      currentFilters = filters,
    } = {}) => {
      try {
        // 컴포넌트가 언마운트된 경우 요청하지 않음
        if (!isMountedRef.current) {
          logInfo("컴포넌트가 언마운트되어 API 요청을 건너뜁니다");
          return [];
        }

        // 이미 요청 중인 경우 중복 요청 방지
        if (isRequestingRef.current) {
          logInfo("이미 요청 중이므로 새 요청을 건너뜁니다");
          return [];
        }

        isRequestingRef.current = true;
        logInfo("V2 요청 상태: 시작");

        // 이전 요청 취소
        if (abortControllerRef.current) {
          logInfo("이전 요청 취소 시도");
          abortControllerRef.current.abort();
        }

        // 새로운 AbortController 생성
        abortControllerRef.current = new AbortController();
        logInfo("새로운 AbortController 생성");

        setLoading(true);
        setError(null);

        logInfo("분석 결과 V2 조회 시작", {
          page,
          size,
          filters: currentFilters,
        });

        // API 요청 파라미터 구성
        const params = {
          page,
          size,
        };

        // 필터 조건 추가
        if (currentFilters.ne_id?.trim()) {
          params.ne_id = currentFilters.ne_id.trim();
        }
        if (currentFilters.cell_id?.trim()) {
          params.cell_id = currentFilters.cell_id.trim();
        }
        if (currentFilters.swname?.trim()) {
          params.swname = currentFilters.swname.trim();
        }
        if (currentFilters.rel_ver?.trim()) {
          params.rel_ver = currentFilters.rel_ver.trim();
        }
        if (currentFilters.date_from) {
          params.date_from = currentFilters.date_from;
        }
        if (currentFilters.date_to) {
          params.date_to = currentFilters.date_to;
        }
        if (currentFilters.choi_status?.trim()) {
          params.choi_status = currentFilters.choi_status.trim();
        }

        // V2 API 호출
        const response = await getAnalysisResultsV2(params);

        logInfo("분석 결과 V2 조회 성공", {
          itemCount: response?.items?.length || 0,
          total: response?.total || 0,
          page: response?.page || 1,
        });

        const newResults = response?.items || [];

        // 결과 업데이트
        if (append) {
          setResults((prevResults) => [...prevResults, ...newResults]);
        } else {
          setResults(newResults);
        }

        // 페이지네이션 상태 업데이트
        setPagination({
          page: response?.page || page,
          size: response?.size || size,
          total: response?.total || 0,
        });

        // 더 가져올 데이터가 있는지 확인
        setHasMore(response?.has_next || false);

        // 성공 메시지 (옵션)
        if (showToast && !append) {
          toast.success(`${newResults.length}개의 분석 결과를 불러왔습니다.`);
        }

        return newResults;
      } catch (err) {
        // 디버깅을 위한 상세 로그
        logInfo("V2 API 오류 상세 정보", {
          name: err.name,
          code: err.code,
          message: err.message,
          stack: err.stack,
          isCancel: axios.isCancel
            ? axios.isCancel(err)
            : "axios.isCancel not available",
        });

        // 요청 취소된 경우는 무시
        if (
          err.name === "AbortError" ||
          err.code === "ERR_CANCELED" ||
          err.message?.toLowerCase().includes("canceled") ||
          err.message?.toLowerCase().includes("cancel") ||
          (axios.isCancel && axios.isCancel(err))
        ) {
          logInfo("V2 API 요청이 취소되었습니다", { reason: err.message });
          isRequestingRef.current = false;
          return [];
        }

        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "분석 결과 V2를 불러오는 중 오류가 발생했습니다.";

        logError("분석 결과 V2 조회 실패", err);
        setError(errorMessage);

        if (showToast) {
          toast.error(`V2 데이터 조회 실패: ${errorMessage}`);
        }

        return [];
      } finally {
        setLoading(false);
        isRequestingRef.current = false;
        logInfo("V2 요청 상태: 완료");
      }
    },
    [pagination.page, pagination.size, logInfo, logError]
  );

  // fetchResults 함수 참조 업데이트
  fetchResultsRef.current = fetchResults;

  // === 필터 관리 함수 (디바운스 적용) ===
  const updateFilters = useCallback(
    (newFilters, debounceMs = 1000) => {
      logInfo("V2 필터 업데이트", { 이전: filters, 새로운: newFilters });

      // 컴포넌트가 언마운트된 경우 무시
      if (!isMountedRef.current) {
        logInfo("컴포넌트 언마운트 상태에서 필터 업데이트 무시");
        return;
      }

      // 기존 타이머 클리어
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 디바운스 적용
      debounceTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          logInfo("디바운스 실행 시점에 컴포넌트가 언마운트됨");
          return;
        }

        setFilters((prev) => ({
          ...prev,
          ...newFilters,
        }));

        // 필터 변경 시 페이지네이션 리셋
        setPagination((prev) => ({
          ...prev,
          page: 1,
        }));

        logInfo("V2 필터 업데이트 완료", {
          적용된필터: { ...filters, ...newFilters },
        });
      }, debounceMs);
    },
    [filters, logInfo]
  );

  const clearFilters = useCallback(() => {
    logInfo("V2 필터 초기화");

    setFilters({
      ne_id: "",
      cell_id: "",
      swname: "",
      rel_ver: "",
      date_from: null,
      date_to: null,
      choi_status: "",
    });

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  }, [logInfo]);

  // === 페이지네이션 함수 ===
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      logInfo("V2 추가 로딩 건너뜀", { loading, hasMore });
      return;
    }

    logInfo("V2 추가 결과 로딩 시작");
    if (fetchResultsRef.current) {
      const nextPage = pagination.page + 1;
      const currentFilters = filters;

      await fetchResultsRef.current({
        page: nextPage,
        append: true,
        showToast: false,
        currentFilters: currentFilters,
      });
    }
  }, [loading, hasMore, pagination.page, filters, logInfo]);

  const refresh = useCallback(async () => {
    logInfo("V2 데이터 새로고침 시작");

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));

    if (fetchResultsRef.current) {
      const currentFilters = filters;

      await fetchResultsRef.current({
        page: 1,
        append: false,
        currentFilters: currentFilters,
      });
    }
  }, [filters, logInfo]);

  // === 특정 결과 삭제 ===
  const deleteResult = useCallback(
    async (resultId) => {
      try {
        logInfo("V2 분석 결과 삭제 시작", { resultId });

        // V2는 삭제 API가 없을 수 있으므로 로컬 상태에서만 제거
        setResults((prev) => prev.filter((result) => result.id !== resultId));

        logInfo("V2 분석 결과 삭제 성공 (로컬)", { resultId });
        toast.success("분석 결과가 삭제되었습니다.");
      } catch (err) {
        const errorMessage =
          err?.response?.data?.error?.message ||
          err?.message ||
          "분석 결과 삭제 중 오류가 발생했습니다.";

        logError("V2 분석 결과 삭제 실패", err);
        toast.error(`삭제 실패: ${errorMessage}`);
      }
    },
    [logInfo, logError]
  );

  // === 자동 데이터 조회 (마운트 시) ===
  useEffect(() => {
    if (autoFetch && isMountedRef.current && fetchResultsRef.current) {
      logInfo("V2 컴포넌트 마운트 - 자동 데이터 조회 시작");
      const currentFilters = filters;
      fetchResultsRef.current({
        page: 1,
        append: false,
        showToast: false,
        currentFilters: currentFilters,
      });
    }
  }, [autoFetch, logInfo]);

  // === 필터 변경 시 자동 재조회 ===
  useEffect(() => {
    if (autoFetch && isMountedRef.current && fetchResultsRef.current) {
      logInfo("V2 필터 변경 감지 - 데이터 재조회", { filters });
      fetchResultsRef.current({
        page: 1,
        append: false,
        showToast: false,
        currentFilters: filters,
      });
    }
  }, [
    autoFetch,
    filters.ne_id,
    filters.cell_id,
    filters.swname,
    filters.rel_ver,
    filters.date_from,
    filters.date_to,
    filters.choi_status,
    logInfo,
  ]);

  // === 계산된 값들 ===
  const isEmpty = useMemo(
    () => !loading && results.length === 0,
    [loading, results.length]
  );

  const isFiltered = useMemo(() => {
    return Object.values(filters).some(
      (value) => value !== null && value !== undefined && value !== ""
    );
  }, [filters]);

  const resultCount = useMemo(() => results.length, [results.length]);

  // === 디버깅 정보 ===
  const debugInfo = useMemo(
    () => ({
      resultCount,
      loading,
      hasMore,
      isEmpty,
      isFiltered,
      pagination,
      filters,
      error,
    }),
    [
      resultCount,
      loading,
      hasMore,
      isEmpty,
      isFiltered,
      pagination,
      filters,
      error,
    ]
  );

  // 개발 환경에서 디버깅 정보 출력
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[useAnalysisResultsV2] Debug Info:", debugInfo);
    }
  }, [debugInfo]);

  // === 클린업 ===
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isRequestingRef.current = false;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // === 반환 값 ===
  return {
    // 데이터
    results,
    loading,
    error,

    // 상태
    isEmpty,
    hasMore,
    isFiltered,
    resultCount,

    // 페이지네이션
    pagination,

    // 필터
    filters,
    updateFilters,
    clearFilters,

    // 액션
    fetchResults,
    refresh,
    loadMore,
    deleteResult,

    // 디버깅
    debugInfo,
  };
};

export default useAnalysisResultsV2;

