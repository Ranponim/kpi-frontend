import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

/**
 * 비동기 분석 컴포넌트
 * LLM 분석을 비동기로 처리하고 실시간 진행률을 표시합니다.
 */
const AsyncAnalysis = ({
  requestParams,
  onAnalysisComplete,
  onAnalysisError,
  className = "",
}) => {
  // 상태 관리
  const [analysisId, setAnalysisId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, starting, running, completed, failed, cancelled
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 경과 시간 계산
  useEffect(() => {
    let interval = null;
    if (startTime && status === "running") {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, status]);

  // 분석 시작
  const startAnalysis = useCallback(async () => {
    try {
      setStatus("starting");
      setErrorMessage(null);
      setResultData(null);
      setProgress(0);
      setStartTime(Date.now());
      setElapsedTime(0);

      console.log("🚀 비동기 분석 시작:", requestParams);

      const response = await fetch("/api/async-analysis/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestParams),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ 분석 시작 응답:", result);

      setAnalysisId(result.analysis_id);
      setStatus("running");

      // 폴링 시작
      startPolling(result.analysis_id);
    } catch (error) {
      console.error("❌ 분석 시작 실패:", error);
      setErrorMessage(error.message);
      setStatus("failed");
      onAnalysisError?.(error);
    }
  }, [requestParams, onAnalysisError]);

  // 분석 취소
  const cancelAnalysis = useCallback(async () => {
    if (!analysisId) return;

    try {
      console.log("🛑 분석 취소:", analysisId);

      const response = await fetch(`/api/async-analysis/cancel/${analysisId}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("✅ 분석 취소 완료:", result);

      setStatus("cancelled");
      stopPolling();
    } catch (error) {
      console.error("❌ 분석 취소 실패:", error);
      setErrorMessage(error.message);
    }
  }, [analysisId]);

  // 폴링 시작
  const startPolling = useCallback(
    (id) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/async-analysis/status/${id}`);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const statusData = await response.json();
          console.log("📊 분석 상태:", statusData);

          setProgress(statusData.progress || 0);

          switch (statusData.status) {
            case "completed":
              setStatus("completed");
              setResultData(statusData.result_data);
              stopPolling();
              onAnalysisComplete?.(statusData.result_data);
              break;

            case "failed":
              setStatus("failed");
              setErrorMessage(
                statusData.error_message || "분석이 실패했습니다"
              );
              stopPolling();
              onAnalysisError?.(new Error(statusData.error_message));
              break;

            case "cancelled":
              setStatus("cancelled");
              stopPolling();
              break;

            case "processing":
              setStatus("running");
              break;

            case "pending":
              setStatus("running");
              break;

            default:
              console.warn("알 수 없는 상태:", statusData.status);
          }
        } catch (error) {
          console.error("❌ 상태 조회 실패:", error);
          setErrorMessage(error.message);
          setStatus("failed");
          stopPolling();
        }
      }, 2000); // 2초마다 폴링

      setPollingInterval(interval);
    },
    [onAnalysisComplete, onAnalysisError]
  );

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // 상태별 아이콘
  const getStatusIcon = () => {
    switch (status) {
      case "idle":
        return <Play className="h-4 w-4" />;
      case "starting":
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // 상태별 배지
  const getStatusBadge = () => {
    const variants = {
      idle: "secondary",
      starting: "default",
      running: "default",
      completed: "default",
      failed: "destructive",
      cancelled: "secondary",
    };

    const labels = {
      idle: "대기 중",
      starting: "시작 중",
      running: "분석 중",
      completed: "완료",
      failed: "실패",
      cancelled: "취소됨",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {getStatusIcon()}
        <span className="ml-1">{labels[status] || status}</span>
      </Badge>
    );
  };

  // 경과 시간 포맷팅
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>비동기 LLM 분석</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 진행률 표시 */}
        {(status === "running" || status === "starting") && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>분석 진행률</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* 경과 시간 */}
        {startTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>경과 시간: {formatElapsedTime(elapsedTime)}</span>
          </div>
        )}

        {/* 오류 메시지 */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          {status === "idle" && (
            <Button onClick={startAnalysis} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              분석 시작
            </Button>
          )}

          {(status === "running" || status === "starting") && (
            <Button
              onClick={cancelAnalysis}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              분석 취소
            </Button>
          )}

          {(status === "completed" ||
            status === "failed" ||
            status === "cancelled") && (
            <Button
              onClick={startAnalysis}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              다시 분석
            </Button>
          )}
        </div>

        {/* 분석 결과 미리보기 */}
        {status === "completed" && resultData && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">분석 완료</h4>
            <p className="text-sm text-green-700">
              LLM 분석이 성공적으로 완료되었습니다. 결과를 확인하려면 상세 분석
              탭을 확인하세요.
            </p>
          </div>
        )}

        {/* 분석 정보 */}
        {analysisId && (
          <div className="text-xs text-muted-foreground">
            분석 ID: {analysisId}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AsyncAnalysis;
