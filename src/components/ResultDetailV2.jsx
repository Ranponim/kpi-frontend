/**
 * ResultDetailV2.jsx
 *
 * V2 API를 사용하는 분석 결과 상세 표시 컴포넌트
 * 기존 ResultDetail의 V2 버전
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import {
  X,
  Download,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import { getAnalysisResultDetailV2 } from "@/lib/apiClient.js";
import AnalysisResultV2Display from "./AnalysisResultV2Display.jsx";

const ResultDetailV2 = ({
  isOpen,
  onClose,
  resultIds = [],
  mode = "single", // 'single' | 'template'
}) => {
  // === 상태 관리 ===
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // === 키보드 단축키 지원 ===
  useEffect(() => {
    const handleKeydown = (event) => {
      if (event.key === "F11") {
        event.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (event.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeydown);
      return () => window.removeEventListener("keydown", handleKeydown);
    }
  }, [isOpen, isFullscreen]);

  // === 템플릿 데이터 생성 ===
  const createTemplateData = () => {
    return {
      id: "template-v2-001",
      ne_id: "nvgnb#10000",
      cell_id: "2010",
      swname: "host01",
      rel_ver: "R23A",
      created_at: new Date().toISOString(),

      // Choi 알고리즘 결과 (예시)
      choi_result: {
        enabled: true,
        status: "normal",
        score: 9.2,
        message: "모든 지표가 정상 범위 내에 있습니다",
      },

      // LLM 분석 결과 (Enhanced 프롬프트 구조)
      llm_analysis: {
        executive_summary:
          "AirMacDLThruAvg(Kbps)의 급격한 감소와 RandomlySelectedPreamblesLow(count)의 현저한 변동성을 확인했습니다. 이는 다운링크 자원 할당 실패 또는 랜덤 액세스 성능 저하를 시사합니다.",
        diagnostic_findings: [
          {
            primary_hypothesis:
              "다운링크 자원 할당 실패 또는 접속 시도 실패로 인한 성능 저하",
            supporting_evidence:
              "AirMacDLThruAvg(Kbps)의 극심한 감소는 다운링크 데이터 전송에 직접적인 영향을 미치므로, 자원 할당 실패나 RRC connection setup failure 등의 가능성이 높습니다. RandomlySelectedPreamblesLow(count)의 변동성은 셀 접속 시도가 불안정함을 나타냅니다.",
            confounding_factors_assessment:
              "동일 환경 가정 하에서, 하드웨어 오류 가능성은 낮다고 판단됩니다. 다만, 네트워크 트래픽 급증이나 외부 간섭 요인이 있었다면 이는 교란 요인으로 작용할 수 있습니다.",
          },
        ],
        recommended_actions: [
          {
            priority: "P1",
            action:
              "다운링크 자원 할당 관련 로그 분석 및 스케줄링 파라미터 확인",
            details:
              "2025-09-04_12:30~2025-09-04_13:45 구간과 2025-09-05_12:45~2025-09-05_13:00 구간의 RRC connection setup failure 로그를 비교 분석하여, 자원 할당 실패의 근본 원인을 파악합니다.",
          },
          {
            priority: "P2",
            action: "RACH 파라미터 최적화 및 프리앰블 설정 재검토",
            details:
              "RandomlySelectedPreamblesLow(count)의 변동성이 큰 구간에서 RACH preamble 설정 및 backoff indicator를 재검토하여 접속 안정성을 개선합니다.",
          },
        ],
        // 추가 분석 필드 (심도 있는 분석용)
        technical_analysis:
          "DL Throughput 감소는 PRB 할당 실패와 직접 연관되며, 스케줄러의 자원 배분 알고리즘이 피크 트래픽 상황에서 효율적으로 동작하지 못하고 있을 가능성이 있습니다. RACH Preamble 변동성은 contention-based 랜덤 액세스 절차의 불안정성을 나타내며, 백오프 지연이 과도하게 증가하는 것으로 추정됩니다.",
        cells_with_significant_change: ["cell_2010", "cell_2011", "cell_2015"],
        action_plan:
          "1단계: RRC 실패 로그 수집 및 분석 (1-2일)\n2단계: PRB 할당 알고리즘 검토 및 파라미터 조정 (2-3일)\n3단계: RACH preamble 설정 최적화 (1일)\n4단계: 실시간 모니터링 체계 구축 및 성능 재평가 (1주일)",
        key_findings: [
          "DL Throughput 85% 급감 (특정 시간대 집중)",
          "RACH Preamble 변동성 200% 증가",
          "RRC Connection Setup Failure Rate 상승",
          "특정 셀(2010, 2011, 2015)에서 집중 발생",
        ],
        confidence: 0.92,
        model_name: "gemini-2.5-pro",
        peg_insights: {
          DL_THROUGHPUT: "급격한 감소 (-85%), 즉시 조치 필요",
          RACH_SUCCESS_RATE: "변동성 증가, 모니터링 강화 필요",
        },
      },

      // PEG 비교 결과 (예시)
      peg_comparisons: [
        {
          peg_name: "DL_THROUGHPUT",
          n_minus_1: {
            avg: 142.5,
            pct_95: 180.0,
            pct_99: 195.0,
            min: 85.0,
            max: 210.0,
            count: 1440,
            std: 25.3,
          },
          n: {
            avg: 149.9,
            pct_95: 188.0,
            pct_99: 202.0,
            min: 90.0,
            max: 220.0,
            count: 1440,
            std: 23.8,
          },
          change_absolute: 7.4,
          change_percentage: 5.19,
          llm_insight:
            "다운링크 처리량이 개선되었습니다. 사용자 경험 향상 기대됩니다.",
        },
        {
          peg_name: "UL_THROUGHPUT",
          n_minus_1: {
            avg: 42.8,
            pct_95: 55.0,
            pct_99: 62.0,
            min: 25.0,
            max: 68.0,
            count: 1440,
            std: 8.5,
          },
          n: {
            avg: 41.8,
            pct_95: 53.5,
            pct_99: 60.0,
            min: 24.0,
            max: 65.0,
            count: 1440,
            std: 8.2,
          },
          change_absolute: -1.0,
          change_percentage: -2.34,
          llm_insight:
            "업링크 처리량이 소폭 감소했습니다. 원인 분석이 필요합니다.",
        },
        {
          peg_name: "RACH_SUCCESS_RATE",
          n_minus_1: {
            avg: 97.2,
            pct_95: 99.0,
            pct_99: 99.5,
            min: 92.0,
            max: 100.0,
            count: 1440,
            std: 1.8,
          },
          n: {
            avg: 98.5,
            pct_95: 99.8,
            pct_99: 99.9,
            min: 95.0,
            max: 100.0,
            count: 1440,
            std: 1.2,
          },
          change_absolute: 1.3,
          change_percentage: 1.34,
          llm_insight:
            "랜덤 액세스 성공률이 개선되어 연결 품질이 향상되었습니다.",
        },
      ],
    };
  };

  // === 데이터 fetch ===
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) {
        return;
      }

      // Template 모드인 경우 샘플 데이터 사용
      if (mode === "template") {
        console.log("🎨 Template 모드: 샘플 데이터 사용");
        setResult(createTemplateData());
        setLoading(false);
        return;
      }

      // 일반 모드
      if (!resultIds || resultIds.length === 0) {
        return;
      }

      const resultId = resultIds[0]; // V2는 단일 결과만 지원

      setLoading(true);
      setError(null);

      console.log("📥 V2 분석 결과 상세 조회 시작:", resultId);

      try {
        const response = await getAnalysisResultDetailV2(resultId);

        console.log("✅ V2 분석 결과 상세 조회 성공:", response);

        if (response && response.data) {
          setResult(response.data);
        } else {
          throw new Error("응답 데이터가 없습니다");
        }
      } catch (err) {
        console.error("❌ V2 분석 결과 상세 조회 실패:", err);
        setError(err.message || "데이터 로딩에 실패했습니다");
        toast.error("분석 결과를 불러오는데 실패했습니다");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, resultIds, mode]);

  // === 데이터 내보내기 ===
  const handleExport = () => {
    if (!result) {
      toast.error("내보낼 데이터가 없습니다");
      return;
    }

    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        result: result,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analysis-result-v2-${result.id || Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("분석 결과를 성공적으로 내보냈습니다");
    } catch (err) {
      console.error("❌ 데이터 내보내기 실패:", err);
      toast.error("데이터 내보내기에 실패했습니다");
    }
  };

  // === 렌더링 ===
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? "max-w-full h-screen m-0 rounded-none"
            : "max-w-[90vw] max-h-[90vh]"
        } flex flex-col`}
      >
        {/* 헤더 */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>분석 결과 상세 (V2)</DialogTitle>
            <div className="flex items-center gap-2">
              {/* 전체화면 토글 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen((prev) => !prev)}
                title={isFullscreen ? "전체화면 해제" : "전체화면"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* 내보내기 버튼 */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                disabled={!result}
                title="JSON으로 내보내기"
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* 닫기 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {result && (
            <DialogDescription>
              분석 날짜: {new Date(result.created_at).toLocaleString("ko-KR")}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* 본문 */}
        <ScrollArea className="flex-1 pr-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">데이터를 불러오는 중...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-destructive mb-4" />
              <p className="text-destructive font-semibold mb-2">
                데이터 로딩 실패
              </p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </div>
          )}

          {!loading && !error && result && (
            <AnalysisResultV2Display result={result} />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ResultDetailV2;
