import { useState, useEffect, useCallback, useRef } from "react";
import {
  startAsyncAnalysis,
  getAsyncAnalysisStatus,
  getAsyncAnalysisResult,
  cancelAsyncAnalysis,
} from "@/lib/apiClient";

/**
 * 비동기 분석을 위한 커스텀 훅
 * LLM 분석을 비동기로 처리하고 실시간 상태를 관리합니다.
 */
export const useAsyncAnalysis = () => {
  // 상태 관리
  const [analysisId, setAnalysisId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, starting, running, completed, failed, cancelled
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 참조
  const pollingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, []);

  // 경과 시간 계산
  useEffect(() => {
    let interval = null;
    if (startTime && status === "running") {
      interval = setInterval(() => {
        if (isMountedRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, status]);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // 폴링 시작
  const startPolling = useCallback(
    (id) => {
      stopPolling(); // 기존 폴링 중지

      const interval = setInterval(async () => {
        if (!isMountedRef.current) {
          stopPolling();
          return;
        }

        try {
          const statusData = await getAsyncAnalysisStatus(id);

          if (!isMountedRef.current) return;

          setProgress(statusData.progress || 0);

          switch (statusData.status) {
            case "completed":
              setStatus("completed");
              setResultData(statusData.result_data);
              stopPolling();
              break;

            case "failed":
              setStatus("failed");
              setErrorMessage(
                statusData.error_message || "분석이 실패했습니다"
              );
              stopPolling();
              break;

            case "cancelled":
              setStatus("cancelled");
              stopPolling();
              break;

            case "processing":
            case "pending":
              setStatus("running");
              break;

            default:
              console.warn("알 수 없는 상태:", statusData.status);
          }
        } catch (error) {
          if (!isMountedRef.current) return;

          console.error("❌ 상태 조회 실패:", error);
          setErrorMessage(error.message);
          setStatus("failed");
          stopPolling();
        }
      }, 2000); // 2초마다 폴링

      pollingIntervalRef.current = interval;
    },
    [stopPolling]
  );

  // 분석 시작
  const startAnalysis = useCallback(
    async (requestParams) => {
      try {
        setStatus("starting");
        setErrorMessage(null);
        setResultData(null);
        setProgress(0);
        setStartTime(Date.now());
        setElapsedTime(0);

        console.log("🚀 비동기 분석 시작:", requestParams);

        const result = await startAsyncAnalysis(requestParams);

        if (!isMountedRef.current) return;

        setAnalysisId(result.analysis_id);
        setStatus("running");

        // 폴링 시작
        startPolling(result.analysis_id);

        return result.analysis_id;
      } catch (error) {
        if (!isMountedRef.current) return;

        console.error("❌ 분석 시작 실패:", error);
        setErrorMessage(error.message);
        setStatus("failed");
        throw error;
      }
    },
    [startPolling]
  );

  // 분석 취소
  const cancelAnalysis = useCallback(async () => {
    if (!analysisId) return;

    try {
      console.log("🛑 분석 취소:", analysisId);

      await cancelAsyncAnalysis(analysisId);

      if (!isMountedRef.current) return;

      setStatus("cancelled");
      stopPolling();
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error("❌ 분석 취소 실패:", error);
      setErrorMessage(error.message);
    }
  }, [analysisId, stopPolling]);

  // 분석 결과 조회
  const getResult = useCallback(async () => {
    if (!analysisId) return null;

    try {
      const result = await getAsyncAnalysisResult(analysisId);
      return result.result;
    } catch (error) {
      console.error("❌ 분석 결과 조회 실패:", error);
      throw error;
    }
  }, [analysisId]);

  // 상태 초기화
  const reset = useCallback(() => {
    setAnalysisId(null);
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
    setResultData(null);
    setStartTime(null);
    setElapsedTime(0);
    stopPolling();
  }, [stopPolling]);

  // 경과 시간 포맷팅
  const formatElapsedTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // 상태별 정보
  const isIdle = status === "idle";
  const isStarting = status === "starting";
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const isCancelled = status === "cancelled";
  const isActive = isStarting || isRunning;

  return {
    // 상태
    analysisId,
    status,
    progress,
    errorMessage,
    resultData,
    startTime,
    elapsedTime,

    // 상태 체크
    isIdle,
    isStarting,
    isRunning,
    isCompleted,
    isFailed,
    isCancelled,
    isActive,

    // 액션
    startAnalysis,
    cancelAnalysis,
    getResult,
    reset,

    // 유틸리티
    formatElapsedTime,
  };
};

export default useAsyncAnalysis;


