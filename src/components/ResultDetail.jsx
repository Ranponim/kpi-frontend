/**
 * ResultDetail.jsx
 *
 * LLM 분석 결과의 상세 정보를 표시하는 모달 컴포넌트
 * 단일 결과 상세 보기 및 다중 결과 비교 기능을 제공합니다.
 * Task 52: LLM 분석 결과 상세 보기 및 비교 기능 UI 구현
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { ScrollArea } from "@/components/ui/scroll-area.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  MapPin,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Copy,
  Eye,
  Minimize2,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Brain,
  Target,
  Zap,
  AlertTriangle,
  Check,
  Clock,
  Gauge,
  HelpCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import apiClient, { getDetailedResult } from "@/lib/apiClient.js";
import AnalysisSection from "./AnalysisSection.jsx";
import AnalysisStatusIndicator from "./AnalysisStatusIndicator.jsx";
import PEGAnalysisDisplay from "./PEGAnalysisDisplay.jsx";
import { useDashboardSettings } from "@/hooks/usePreference.js";
import usePegPreferences from "@/hooks/usePegPreferences.ts";

const ResultDetail = ({
  isOpen,
  onClose,
  resultIds = [], // 단일 ID 또는 비교용 ID 배열
  mode = "single", // 'single' | 'compare' | 'template'
}) => {
  // === 상태 관리 ===
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // === 새로운 알고리즘 결과 상태 ===
  const [choiAlgorithmResult, setChoiAlgorithmResult] = useState("absent"); // Choi 알고리즘 결과
  const [mahalanobisResult, setMahalanobisResult] = useState(null); // 마할라노비스 거리 결과
  const [pegComparisonResult, setPegComparisonResult] = useState(null); // PEG 비교 결과

  const [choiData, setChoiData] = useState(null);

  // === 도움말 모달 상태 ===
  const [helpModal, setHelpModal] = useState({
    isOpen: false,
    algorithm: null, // 'choi', 'mahalanobis', 'mann-whitney', 'ks-test', 'peg-comparison'
  });

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

  // === Preference 기반 선택 PEG (안전한 초기화) ===
  const dashboardSettingsHook = useDashboardSettings();
  const {
    settings: dashboardSettings = {
      selectedPegs: [],
      pegSearch: "",
      pegSort: "weight_desc",
    },
    updateSettings: updateDashboardSettings = () => {},
  } = dashboardSettingsHook || {};

  const { preferredPegs = [], setPreferredPegs = () => {} } =
    usePegPreferences() || {};

  // === PEG 차트 제어 상태 (안전한 초기화) ===
  const [pegPage, setPegPage] = useState(0);
  const [pegPageSize, setPegPageSize] = useState(10);
  const [pegFilter, setPegFilter] = useState(
    dashboardSettings?.pegSearch || ""
  );
  const [weightFilter, setWeightFilter] = useState("all"); // all, high(>=8), medium(6-7.9), low(<6)
  const [trendFilter, setTrendFilter] = useState("all"); // all, up, down, stable
  const [pegSort, setPegSort] = useState(
    dashboardSettings?.pegSort || "weight_desc"
  );

  // === 메모리 최적화: 큰 데이터 청크 단위 처리 ===
  const [dataChunkSize] = useState(50); // 한 번에 처리할 데이터 청크 크기

  // === 모드 변수 선언 (useEffect보다 먼저 선언) ===
  const isCompareMode = mode === "compare" && resultIds.length > 1;
  const isSingleMode = mode === "single" && resultIds.length === 1;
  const isTemplateMode = mode === "template";

  // === results 배열 안전성 검증 ===
  const safeResults = useMemo(() => {
    if (!Array.isArray(results)) {
      console.warn("⚠️ results가 배열이 아닙니다:", results);
      return [];
    }
    return results;
  }, [results]);

  // === 템플릿 모드 디버깅 정보 ===
  useEffect(() => {
    if (isTemplateMode) {
      console.log("🎨 템플릿 모드 디버깅:", {
        results: results,
        safeResults: safeResults,
        resultsType: typeof results,
        isArray: Array.isArray(results),
        length: Array.isArray(results) ? results.length : "N/A",
      });
    }
  }, [isTemplateMode, results, safeResults]);

  // === 템플릿 데이터 생성 ===
  const createTemplateData = useCallback(() => {
    const now = new Date();
    return {
      id: "template-debug-001",
      analysisDate: now.toISOString(),
      neId: "NE_TEMPLATE_001",
      cellId: "CELL_TEMPLATE_001",
      status: "success",
      llmModel: "gpt-4-turbo",
      metadata: {
        workflow_version: "3.0",
        processing_timestamp: now.toISOString(),
        request_id: "req_template_debug",
        enable_mock: false,
        data_processor: true,
        use_choi: true,
      },
      choi_judgement: {
        overall: "OK",
        reasons: [
          "Most KPIs within normal range",
          "Minor degradation in DL throughput",
          "Network performance stable overall",
        ],
        by_kpi: {
          AirMacDLThruAvg: {
            status: "POK",
            evidence: {
              threshold: 10.0,
              actual_change: -5.82,
              severity: "medium",
            },
          },
          Random_access_preamble_count: {
            status: "OK",
            evidence: {
              threshold: 15.0,
              actual_change: 10.4,
              severity: "low",
            },
          },
          UL_throughput_avg: {
            status: "OK",
            evidence: {
              threshold: 8.0,
              actual_change: 2.1,
              severity: "low",
            },
          },
        },
        abnormal_detection: {
          detected_anomalies: 2,
          anomaly_types: ["throughput_degradation", "latency_spike"],
          confidence_score: 0.85,
        },
        warnings: [
          "DL throughput shows consistent decline pattern",
          "Monitor for potential network congestion",
        ],
        algorithm_version: "choi-v1.2",
        processing_time_ms: 245,
      },
      data: {
        analysis: {
          executive_summary:
            "네트워크 성능 분석 결과, 전반적으로 안정적인 상태를 유지하고 있으나 DL throughput에서 경미한 성능 저하가 관찰됩니다. 이는 일시적인 트래픽 증가로 인한 것으로 판단되며, 지속적인 모니터링이 필요합니다.",
          overall_summary:
            "분석 기간 동안 대부분의 KPI가 정상 범위 내에서 동작하고 있습니다. AirMacDLThruAvg에서 5.82%의 성능 저하가 감지되었으나, 이는 임계값(10%) 이하로 경미한 수준입니다.",
          diagnostic_findings: [
            {
              primary_hypothesis:
                "DL throughput 성능 저하가 주요 관찰 사항입니다",
              supporting_evidence: "AirMacDLThruAvg KPI에서 -5.82% 변화율 관찰",
              confounding_factors_assessment:
                "네트워크 트래픽 증가와 관련된 일시적 현상으로 판단",
            },
            {
              primary_hypothesis:
                "UL throughput은 정상 범위 내에서 안정적입니다",
              supporting_evidence: "UL_throughput_avg에서 +2.1% 개선 관찰",
              confounding_factors_assessment:
                "사용자 활동 패턴의 정상적인 변화",
            },
          ],
          recommended_actions: [
            {
              priority: "High",
              action: "DL throughput 모니터링 강화",
              details:
                "향후 24시간 동안 AirMacDLThruAvg KPI를 집중 모니터링하고, 추가 성능 저하 시 즉시 대응",
            },
            {
              priority: "Medium",
              action: "네트워크 용량 검토",
              details: "현재 트래픽 패턴을 분석하여 용량 증설 필요성 검토",
            },
            {
              priority: "Low",
              action: "정기 성능 리포트 생성",
              details: "주간 성능 트렌드 리포트를 통한 장기적 패턴 분석",
            },
          ],
        },
      },
      kpiResults: {
        AirMacDLThruAvg: { "N-1": 85.2, N: 80.3, weight: 8 },
        Random_access_preamble_count: { "N-1": 120.5, N: 133.1, weight: 6 },
        UL_throughput_avg: { "N-1": 45.8, N: 46.8, weight: 7 },
        DL_throughput_avg: { "N-1": 92.1, N: 88.5, weight: 9 },
        Connection_success_rate: { "N-1": 98.5, N: 98.2, weight: 8 },
      },
      stats: [
        {
          kpi_name: "AirMacDLThruAvg",
          period: "N-1",
          avg: 85.2,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "AirMacDLThruAvg",
          period: "N",
          avg: 80.3,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "Random_access_preamble_count",
          period: "N-1",
          avg: 120.5,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "Random_access_preamble_count",
          period: "N",
          avg: 133.1,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "UL_throughput_avg",
          period: "N-1",
          avg: 45.8,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "UL_throughput_avg",
          period: "N",
          avg: 46.8,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "DL_throughput_avg",
          period: "N-1",
          avg: 92.1,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "DL_throughput_avg",
          period: "N",
          avg: 88.5,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "Connection_success_rate",
          period: "N-1",
          avg: 98.5,
          cell_id: "CELL_TEMPLATE_001",
        },
        {
          kpi_name: "Connection_success_rate",
          period: "N",
          avg: 98.2,
          cell_id: "CELL_TEMPLATE_001",
        },
      ],
      request_params: {
        peg_definitions: {
          AirMacDLThruAvg: { weight: 8 },
          Random_access_preamble_count: { weight: 6 },
          UL_throughput_avg: { weight: 7 },
          DL_throughput_avg: { weight: 9 },
          Connection_success_rate: { weight: 8 },
        },
      },
      // 마할라노비스 분석 결과 (템플릿용)
      mahalanobisAnalysis: {
        success: true,
        data: {
          totalKpis: 5,
          abnormalKpis: [
            {
              kpi_name: "AirMacDLThruAvg",
              distance: 2.45,
              threshold: 2.0,
              status: "abnormal",
              severity: "medium",
            },
          ],
          abnormalScore: 0.2,
          analysis: {
            screening: {
              description:
                "일부 KPI에서 경미한 이상이 감지되었으나 전반적으로 양호한 상태입니다.",
            },
          },
        },
      },
    };
  }, []);

  // === API 호출 (청크 단위 처리로 메모리 최적화) ===
  const fetchResultDetails = async (ids) => {
    setLoading(true);
    setError(null);

    // 템플릿 모드인 경우 템플릿 데이터 사용
    if (isTemplateMode) {
      console.log("🎨 템플릿 모드: 템플릿 데이터 사용");
      try {
        const templateData = createTemplateData();
        setResults([templateData]); // 배열로 감싸서 설정

        // 템플릿 모드에서 마할라노비스 분석 결과 자동 설정
        if (templateData.mahalanobisAnalysis) {
          console.log(
            "🎨 템플릿 모드: 마할라노비스 분석 결과 설정",
            templateData.mahalanobisAnalysis
          );
          setMahalanobisResult(templateData.mahalanobisAnalysis.data);
        }

        setLoading(false);
        return;
      } catch (error) {
        console.error("템플릿 데이터 생성 오류:", error);
        setError("템플릿 데이터 생성에 실패했습니다.");
        setLoading(false);
        return;
      }
    }

    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      console.log("⏹️ 이전 요청 취소");
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성 및 저장
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    try {
      console.log("📊 분석 결과 상세 정보 요청:", ids);

      // ID 유효성 검증 및 정리
      const validIds = ids
        .filter((id) => {
          if (!id || (typeof id !== "string" && typeof id !== "number")) {
            console.warn(`⚠️ 잘못된 ID 형식 감지:`, id, typeof id);
            return false;
          }

          const idStr = String(id).trim();
          if (!idStr || idStr === "undefined" || idStr === "null") {
            console.warn(`⚠️ 빈 ID 감지:`, id);
            return false;
          }

          // ID 형식 검증 (숫자, UUID, 또는 특정 패턴)
          const isValidFormat =
            /^[a-zA-Z0-9_-]+$/.test(idStr) &&
            idStr.length > 0 &&
            idStr.length <= 100;
          if (!isValidFormat) {
            console.warn(`⚠️ 잘못된 ID 형식:`, idStr);
            return false;
          }

          return true;
        })
        .map((id) => String(id).trim());

      if (validIds.length === 0) {
        throw new Error("유효한 결과 ID가 없습니다.");
      }

      if (validIds.length !== ids.length) {
        console.warn(
          `⚠️ ${ids.length - validIds.length}개의 잘못된 ID가 제거되었습니다.`
        );
      }

      console.log(`📊 유효한 ID 목록:`, validIds);

      // 메모리 효율을 위해 청크 단위로 처리 (서버 부하 고려하여 청크 크기 조정)
      const chunks = [];
      const adjustedChunkSize = Math.min(dataChunkSize, 3); // 서버 부하 방지를 위해 최대 3개씩 처리
      for (let i = 0; i < validIds.length; i += adjustedChunkSize) {
        chunks.push(validIds.slice(i, i + adjustedChunkSize));
      }

      console.log(
        `📊 청크 처리 정보: 총 ${validIds.length}개 항목을 ${chunks.length}개 청크로 분할 (청크당 최대 ${adjustedChunkSize}개)`
      );

      let allResults = [];

      for (const chunk of chunks) {
        const promises = chunk.map(async (id) => {
          try {
            // 요청이 취소되었는지 확인
            if (signal.aborted) {
              throw new Error("요청이 취소되었습니다");
            }

            // 500 에러에 대한 재시도 로직 추가
            let retryCount = 0;
            const maxRetries = 2;
            let lastError = null;

            while (retryCount <= maxRetries) {
              try {
                // URL 인코딩으로 안전한 요청 보장
                console.log(`🌐 API 요청(getDetailedResult): ${id}`);
                const data = await getDetailedResult(id);
                if (!data) {
                  throw new Error("서버에서 빈 응답을 반환했습니다.");
                }
                console.log(
                  `✅ 결과 ${id} 로딩 성공 (시도 ${retryCount + 1}/${
                    maxRetries + 1
                  })`
                );
                return { ...data, id };
              } catch (err) {
                lastError = err;

                // 요청 취소된 경우
                if (signal.aborted) {
                  throw new Error("요청이 취소되었습니다");
                }

                // 네트워크 에러인 경우
                if (
                  err.code === "NETWORK_ERROR" ||
                  err.message?.includes("Network Error")
                ) {
                  console.warn(`🌐 네트워크 에러 - 결과 ${id}:`, err.message);
                  if (retryCount < maxRetries) {
                    retryCount++;
                    const delay = 2000; // 네트워크 에러는 2초 대기
                    console.warn(
                      `⚠️ 네트워크 에러로 인한 재시도, ${delay}ms 후 재시도 (${retryCount}/${maxRetries})`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                  }
                }

                // 500 에러이고 재시도 가능한 경우
                if (err?.response?.status === 500 && retryCount < maxRetries) {
                  retryCount++;
                  const delay = Math.min(
                    1000 * Math.pow(2, retryCount - 1),
                    5000
                  ); // 지수 백오프, 최대 5초
                  console.warn(
                    `⚠️ 결과 ${id} 500 에러 발생, ${delay}ms 후 재시도 (${retryCount}/${maxRetries})`
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                  continue;
                }

                // 404 에러인 경우 (존재하지 않는 ID)
                if (err?.response?.status === 404) {
                  console.warn(`⚠️ 결과 ${id}를 찾을 수 없습니다 (404)`);
                  throw new Error(`분석 결과를 찾을 수 없습니다 (ID: ${id})`);
                }

                // 재시도 불가능하거나 다른 에러인 경우
                throw err;
              }
            }

            throw lastError;
          } catch (err) {
            // 취소된 요청은 에러로 처리하지 않음
            if (signal.aborted) {
              console.log(`⏹️ 결과 ${id} 요청 취소됨`);
              return null;
            }

            // 에러 타입별 상세 로깅 및 분류
            const errorInfo = {
              id,
              status: err?.response?.status,
              message: err.message,
              url: err?.config?.url,
              method: err?.config?.method,
              retryAttempts: 3, // maxRetries + 1 대신 고정값 사용
              timestamp: new Date().toISOString(),
            };

            if (err?.response?.status === 500) {
              console.error(
                `❌ 결과 ${id} 서버 내부 오류 (500) - 재시도 실패:`,
                errorInfo
              );
            } else if (err?.response?.status === 404) {
              console.warn(`⚠️ 결과 ${id}를 찾을 수 없음 (404):`, errorInfo);
            } else if (err?.response?.status === 400) {
              console.warn(`⚠️ 결과 ${id} 잘못된 요청 (400):`, errorInfo);
            } else if (
              err.code === "NETWORK_ERROR" ||
              err.message?.includes("Network Error")
            ) {
              console.error(`🌐 결과 ${id} 네트워크 오류:`, errorInfo);
            } else {
              console.error(`❌ 결과 ${id} 로딩 실패:`, errorInfo);
            }

            // 사용자 친화적인 에러 메시지 생성
            let userMessage = "로딩 실패";
            let errorType = "unknown_error";

            if (err?.response?.status === 500) {
              userMessage = "서버 내부 오류 (잠시 후 다시 시도해주세요)";
              errorType = "server_error";
            } else if (err?.response?.status === 404) {
              userMessage = "분석 결과를 찾을 수 없습니다";
              errorType = "not_found";
            } else if (err?.response?.status === 400) {
              userMessage = "잘못된 요청입니다";
              errorType = "bad_request";
            } else if (
              err.code === "NETWORK_ERROR" ||
              err.message?.includes("Network Error")
            ) {
              userMessage = "네트워크 연결 오류";
              errorType = "network_error";
            } else if (err.message?.includes("timeout")) {
              userMessage = "요청 시간 초과";
              errorType = "timeout_error";
            } else {
              userMessage = err.message || "알 수 없는 오류가 발생했습니다";
              errorType = "client_error";
            }

            return {
              id,
              error: userMessage,
              analysisDate: new Date().toISOString(),
              neId: "-",
              cellId: "-",
              status: "error",
              errorType,
              errorDetails: errorInfo,
            };
          }
        });

        const chunkResults = await Promise.all(promises);
        // null 값 제거 (취소된 요청)
        const validResults = chunkResults.filter((result) => result !== null);
        allResults = [...allResults, ...validResults];

        // 메모리 효율을 위해 중간 결과 정리 (브라우저 환경에서 안전하게 처리)
        if (typeof window !== "undefined" && window.gc) {
          window.gc();
        }

        // 서버 부하 분산을 위해 청크 간 지연 추가 (마지막 청크 제외)
        if (chunks.indexOf(chunk) < chunks.length - 1) {
          const delay = 200; // 200ms 지연
          console.log(`⏳ 서버 부하 분산을 위해 ${delay}ms 대기 중...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // 요청이 취소되지 않았을 때만 결과 설정
      if (!signal.aborted) {
        setResults(allResults);

        // 에러 통계 계산 및 로깅
        const errorStats = allResults.reduce(
          (stats, result) => {
            if (result.error) {
              stats.totalErrors++;
              if (result.errorType === "server_error") {
                stats.serverErrors++;
              } else {
                stats.clientErrors++;
              }
            } else {
              stats.successCount++;
            }
            return stats;
          },
          { totalErrors: 0, serverErrors: 0, clientErrors: 0, successCount: 0 }
        );

        console.log("✅ 분석 결과 상세 정보 로딩 완료:", {
          totalItems: allResults.length,
          successCount: errorStats.successCount,
          errorCount: errorStats.totalErrors,
          serverErrors: errorStats.serverErrors,
          clientErrors: errorStats.clientErrors,
          successRate: `${(
            (errorStats.successCount / allResults.length) *
            100
          ).toFixed(1)}%`,
        });

        // 서버 에러가 많이 발생한 경우 사용자에게 알림
        if (errorStats.serverErrors > 0) {
          const errorRate = (errorStats.serverErrors / allResults.length) * 100;
          if (errorRate > 30) {
            // 30% 이상 서버 에러 발생 시
            toast.warning(
              `일부 데이터 로딩에 실패했습니다 (서버 에러: ${errorStats.serverErrors}개). 잠시 후 다시 시도해주세요.`
            );
          }
        }
      } else {
        console.log("⏹️ 요청이 취소되어 결과 설정을 건너뜀");
      }

      // 첫 번째 결과의 데이터 구조 로깅
      if (allResults.length > 0) {
        const firstResult = allResults[0];
        console.log("📋 첫 번째 결과 상세 구조:", {
          id: firstResult.id,
          hasKpiResults: !!firstResult.kpiResults,
          hasStats: !!firstResult.stats,
          kpiResultsType: typeof firstResult.kpiResults,
          statsType: typeof firstResult.stats,
          statsIsArray: Array.isArray(firstResult.stats),
          allKeys: Object.keys(firstResult),
          kpiResultsKeys: firstResult.kpiResults
            ? Object.keys(firstResult.kpiResults)
            : "N/A",
          statsLength: firstResult.stats?.length || "N/A",
        });
      }
    } catch (err) {
      // 취소된 요청은 에러로 처리하지 않음
      if (signal.aborted) {
        console.log("⏹️ 요청이 취소되어 에러 처리 건너뜀");
        return;
      }
      console.error("❌ 분석 결과 상세 정보 로딩 실패:", err);
      setError(err.message || "데이터 로딩에 실패했습니다");
      toast.error("분석 결과를 불러오는데 실패했습니다");
    } finally {
      // 취소된 요청이 아닐 때만 로딩 상태 해제
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  // === 통계 테스트 함수들 ===

  // Mann-Whitney U Test 구현
  const mannWhitneyUTest = useCallback((sample1, sample2) => {
    try {
      // 두 샘플을 결합하고 순위 부여
      const combined = [...sample1, ...sample2];
      const sortedCombined = combined.slice().sort((a, b) => a - b);

      // 순위 계산
      const ranks = combined.map((value) => {
        const rank = sortedCombined.indexOf(value) + 1;
        // 동점 처리 (평균 순위)
        const duplicates = combined.filter((v) => v === value).length;
        const firstIndex = sortedCombined.indexOf(value);
        return duplicates > 1
          ? (firstIndex + 1 + firstIndex + duplicates) / 2
          : rank;
      });

      // 각 그룹의 순위 합 계산
      const n1 = sample1.length;
      const n2 = sample2.length;
      const rankSum1 = sample1.reduce((sum, value, index) => {
        const originalIndex = combined.indexOf(value);
        return sum + ranks[originalIndex];
      }, 0);

      // U 통계량 계산
      const U1 = rankSum1 - (n1 * (n1 + 1)) / 2;
      const U2 = n1 * n2 - U1;
      const U = Math.min(U1, U2);

      // Z-score 계산 (근사)
      const mu_U = (n1 * n2) / 2;
      const sigma_U = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
      const zScore = (U - mu_U) / sigma_U;

      // p-value 계산 (양측 검정)
      const pValue =
        2 *
        (1 -
          (Math.abs(zScore) / Math.sqrt(2 * Math.PI)) *
            Math.exp((-zScore * zScore) / 2));

      return {
        U: U,
        zScore: zScore,
        pValue: Math.min(pValue, 1), // p-value는 최대 1
        significant: pValue < 0.05,
        effectSize: Math.abs(zScore) / Math.sqrt(n1 + n2),
      };
    } catch (error) {
      console.error("Mann-Whitney U Test 오류:", error);
      return { error: "통계 테스트 실패" };
    }
  }, []);

  // Kolmogorov-Smirnov Test 구현
  const kolmogorovSmirnovTest = useCallback((sample1, sample2) => {
    try {
      // 두 샘플 정렬
      const sorted1 = sample1.slice().sort((a, b) => a - b);
      const sorted2 = sample2.slice().sort((a, b) => a - b);

      const n1 = sorted1.length;
      const n2 = sorted2.length;

      let maxDifference = 0;
      let i = 0,
        j = 0;

      // 모든 고유 값에 대해 CDF 차이 계산
      const allValues = [...new Set([...sorted1, ...sorted2])].sort(
        (a, b) => a - b
      );

      for (const value of allValues) {
        // sample1의 CDF
        while (i < n1 && sorted1[i] <= value) i++;
        const cdf1 = i / n1;

        // sample2의 CDF
        while (j < n2 && sorted2[j] <= value) j++;
        const cdf2 = j / n2;

        const difference = Math.abs(cdf1 - cdf2);
        if (difference > maxDifference) {
          maxDifference = difference;
        }
      }

      // D 통계량
      const D = maxDifference;

      // 근사 p-value 계산 (양측 검정)
      const lambda = D * Math.sqrt((n1 * n2) / (n1 + n2));
      const pValue = 2 * Math.exp(-2 * lambda * lambda);

      return {
        D: D,
        lambda: lambda,
        pValue: Math.min(pValue, 1),
        significant: pValue < 0.05,
        distributionDifference:
          D > 0.1 ? "large" : D > 0.05 ? "medium" : "small",
      };
    } catch (error) {
      console.error("Kolmogorov-Smirnov Test 오류:", error);
      return { error: "분포 테스트 실패" };
    }
  }, []);

  // === 마할라노비스 거리 계산 함수 (백엔드 API 호출) ===
  const calculateMahalanobisDistance = useCallback(async (kpiData) => {
    try {
      console.log("🧮 마할라노비스 거리 계산 시작 - 백엔드 API 호출", kpiData);

      // 백엔드 API를 통해 마할라노비스 분석 수행
      const result = await performMahalanobisAnalysis(
        {
          kpiData,
          timestamps: [], // 시간 정보는 현재 데이터에서 추출하지 않음
          periodLabels: [],
        },
        {
          threshold: 0.1,
          sampleSize: 10,
          significanceLevel: 0.05,
        }
      );

      console.log(
        "✅ 마할라노비스 거리 계산 및 통계 테스트 완료 (백엔드 API)",
        result
      );

      // 백엔드 응답을 기존 UI가 기대하는 형식으로 변환
      if (!result) {
        return {
          error: "백엔드 응답이 없습니다",
          timestamp: new Date().toISOString(),
        };
      }

      if (result.success === false) {
        return {
          error: result.message || "백엔드 분석 실패",
          timestamp: new Date().toISOString(),
        };
      }

      return result.data || result;
    } catch (error) {
      console.error("❌ 마할라노비스 거리 계산 실패 (백엔드 API)", error);
      return {
        error: error.message || "계산 중 오류 발생",
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  // === PEG 비교 결과 계산 함수 ===
  const calculatePegComparison = useCallback((result) => {
    try {
      console.log("📊 PEG 비교 결과 계산 시작", result);

      if (!result?.stats || !Array.isArray(result.stats)) {
        return null;
      }

      const stats = result.stats;
      const pegResults = {};

      // PEG별로 N-1과 N 기간 데이터 그룹화
      stats.forEach((stat) => {
        const pegName = stat.kpi_name;
        if (!pegResults[pegName]) {
          pegResults[pegName] = {
            peg_name: pegName,
            n1_values: [],
            n_values: [],
            weight:
              result.request_params?.peg_definitions?.[pegName]?.weight || 5,
          };
        }

        if (stat.period === "N-1") {
          pegResults[pegName].n1_values.push(stat.avg);
        } else if (stat.period === "N") {
          pegResults[pegName].n_values.push(stat.avg);
        }
      });

      // 각 PEG에 대해 통계 계산
      const comparisonResults = Object.values(pegResults).map((peg) => {
        const n1Avg =
          peg.n1_values.length > 0
            ? peg.n1_values.reduce((a, b) => a + b, 0) / peg.n1_values.length
            : 0;
        const nAvg =
          peg.n_values.length > 0
            ? peg.n_values.reduce((a, b) => a + b, 0) / peg.n_values.length
            : 0;

        // RSD (Relative Standard Deviation) 계산
        const n1Rsd =
          peg.n1_values.length > 1
            ? (Math.sqrt(
                peg.n1_values.reduce(
                  (sum, val) => sum + Math.pow(val - n1Avg, 2),
                  0
                ) /
                  (peg.n1_values.length - 1)
              ) /
                Math.abs(n1Avg)) *
              100
            : 0;

        const nRsd =
          peg.n_values.length > 1
            ? (Math.sqrt(
                peg.n_values.reduce(
                  (sum, val) => sum + Math.pow(val - nAvg, 2),
                  0
                ) /
                  (peg.n_values.length - 1)
              ) /
                Math.abs(nAvg)) *
              100
            : 0;

        // 변화율 계산
        const changePercent = n1Avg !== 0 ? ((nAvg - n1Avg) / n1Avg) * 100 : 0;
        const trend =
          changePercent > 5 ? "up" : changePercent < -5 ? "down" : "stable";

        return {
          ...peg,
          n1_avg: n1Avg,
          n_avg: nAvg,
          n1_rsd: n1Rsd,
          n_rsd: nRsd,
          change_percent: changePercent,
          trend,
          significance:
            Math.abs(changePercent) > 10
              ? "high"
              : Math.abs(changePercent) > 5
              ? "medium"
              : "low",
        };
      });

      // 가중치 기준으로 정렬
      const sortedResults = comparisonResults.sort(
        (a, b) => (b.weight || 0) - (a.weight || 0)
      );

      console.log("✅ PEG 비교 결과 계산 완료", sortedResults);
      return sortedResults;
    } catch (error) {
      console.error("❌ PEG 비교 결과 계산 실패", error);
      return null;
    }
  }, []);

  // === AbortController 관리 ===
  const abortControllerRef = useRef(null);

  // === 상태 초기화 함수 ===
  const resetAllStates = useCallback(() => {
    console.log("🔄 모든 상태 초기화 시작");

    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      console.log("⏹️ 이전 요청 취소");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setResults([]);
    setLoading(false);
    setError(null);
    setChoiAlgorithmResult("absent");
    setMahalanobisResult(null);
    setPegComparisonResult(null);
    setPegPage(0);
    setPegPageSize(10);
    setPegFilter("");
    setWeightFilter("all");
    setTrendFilter("all");
    setIsFullscreen(false);
    setHelpModal({ isOpen: false, algorithm: null });
    console.log("✅ 모든 상태 초기화 완료");
  }, []);

  // === Effect: resultIds 변경 시 상태 초기화 및 데이터 로딩 ===
  useEffect(() => {
    if (isOpen && resultIds.length > 0) {
      console.log("📊 새로운 결과 ID로 전환:", resultIds);
      // 먼저 모든 상태를 초기화
      resetAllStates();
      // 그 다음에 새로운 데이터 로딩
      fetchResultDetails(resultIds);
    }

    // cleanup 함수: 컴포넌트 언마운트 또는 의존성 변경 시 이전 요청 취소
    return () => {
      if (abortControllerRef.current) {
        console.log("🧹 useEffect cleanup: 이전 요청 취소");
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen, resultIds, resetAllStates]);

  // === 마할라노비스 거리 분석 수행 (성능 최적화 및 캐싱) ===
  const performMahalanobisAnalysis = useCallback(async () => {
    // 현재 results를 직접 참조하여 초기화 순서 문제 방지
    const currentProcessedResults = safeResults.filter((r) => !r.error);

    if (!currentProcessedResults.length || !currentProcessedResults[0].stats) {
      console.log("📊 마할라노비스 분석: 데이터가 부족합니다");
      return;
    }

    // 성능 최적화: 동일한 데이터에 대한 중복 분석 방지
    const resultId = currentProcessedResults[0].id;
    const dataHash = btoa(
      JSON.stringify(currentProcessedResults[0].stats)
    ).slice(0, 16);

    if (
      mahalanobisResult &&
      mahalanobisResult._cacheKey === `${resultId}-${dataHash}`
    ) {
      console.log("⚡ 마할라노비스 분석: 캐시된 결과 사용");
      return;
    }

    try {
      console.log("🧮 마할라노비스 거리 분석 시작");

      // 로딩 상태 표시
      setMahalanobisResult(null); // 분석 중임을 표시

      // KPI 데이터 추출 (N-1과 N 기간 비교)
      const kpiData = {};
      const statsData = currentProcessedResults[0].stats || [];

      statsData.forEach((stat) => {
        const kpiName = stat.kpi_name;
        if (!kpiData[kpiName]) {
          kpiData[kpiName] = [];
        }
        kpiData[kpiName].push(stat.avg);
      });

      // 데이터 검증
      const validKpis = Object.keys(kpiData).filter(
        (kpiName) => kpiData[kpiName].length >= 2
      );
      if (validKpis.length === 0) {
        throw new Error("분석 가능한 KPI 데이터가 부족합니다.");
      }

      console.log(`📊 분석할 KPI 수: ${validKpis.length}개`);

      // 마할라노비스 분석 수행
      const result = await calculateMahalanobisDistance(kpiData);

      // 캐시 키 추가
      result._cacheKey = `${resultId}-${dataHash}`;

      console.log("✅ 마할라노비스 분석 완료:", result);
      setMahalanobisResult(result);
    } catch (error) {
      console.error("❌ 마할라노비스 분석 실패:", error);
      setMahalanobisResult({
        error: error.message || "분석 중 오류가 발생했습니다.",
        timestamp: new Date().toISOString(),
        _cacheKey: `${resultId}-${dataHash}`,
      });
    }
  }, [safeResults, calculateMahalanobisDistance, mahalanobisResult]); // safeResults 사용

  // === PEG 비교 분석 수행 ===
  const performPegComparisonAnalysis = useCallback(() => {
    // 현재 results를 직접 참조하여 초기화 순서 문제 방지
    const currentProcessedResults = safeResults.filter((r) => !r.error);

    if (!currentProcessedResults.length || !currentProcessedResults[0].stats) {
      console.log("📊 PEG 비교 분석: 데이터가 부족합니다");
      return;
    }

    try {
      console.log("📊 PEG 비교 분석 시작");
      const result = calculatePegComparison(currentProcessedResults[0]);
      console.log("✅ PEG 비교 분석 완료:", result);
      setPegComparisonResult(result);
    } catch (error) {
      console.error("❌ PEG 비교 분석 실패:", error);
      setPegComparisonResult(null);
    }
  }, [safeResults]); // safeResults 사용

  // === Effect: 데이터 로딩 완료 후 분석 수행 ===
  useEffect(() => {
    // 현재 results를 직접 참조하여 초기화 순서 문제 방지
    const currentProcessedResults = safeResults.filter((r) => !r.error);

    if (currentProcessedResults.length > 0 && !loading) {
      console.log("🔬 데이터 로딩 완료, 분석 시작");

      // 마할라노비스 분석 수행 (비동기)
      performMahalanobisAnalysis();

      // PEG 비교 분석 수행 (동기)
      performPegComparisonAnalysis();
    }
  }, [
    safeResults,
    loading,
    performMahalanobisAnalysis,
    performPegComparisonAnalysis,
  ]); // safeResults 사용

  // === 템플릿 모드에서 분석 강제 실행 ===
  useEffect(() => {
    if (isTemplateMode && safeResults.length > 0 && !loading) {
      console.log("🎨 템플릿 모드: 분석 강제 실행");
      // 템플릿 모드에서는 모든 분석을 강제로 실행
      performMahalanobisAnalysis();
      performPegComparisonAnalysis();
    }
  }, [
    isTemplateMode,
    safeResults,
    loading,
    performMahalanobisAnalysis,
    performPegComparisonAnalysis,
  ]);

  // === Effect: 모달이 닫힐 때 상태 정리 ===
  useEffect(() => {
    if (!isOpen) {
      console.log("🚪 모달이 닫혀서 모든 상태 정리");
      resetAllStates();
    }
  }, [isOpen, resetAllStates]);

  // === Effect: 데이터 로딩 완료 후 알고리즘 실행 ===
  useEffect(() => {
    console.log("🔍 마할라노비스 분석 디버깅:", {
      resultsLength: safeResults.length,
      loading,
      processedResults: safeResults.filter((r) => !r.error).length,
    });

    const currentProcessedResults = safeResults.filter((r) => !r.error);
    if (currentProcessedResults.length > 0 && !loading) {
      const firstResult = currentProcessedResults[0];
      console.log("📊 첫 번째 결과 데이터 구조:", {
        hasKpiResults: !!firstResult?.kpiResults,
        hasStats: !!firstResult?.stats,
        kpiResultsKeys: firstResult?.kpiResults
          ? Object.keys(firstResult.kpiResults)
          : [],
        statsLength: firstResult?.stats?.length || 0,
        fullResult: firstResult,
      });

      // Choi 알고리즘 데이터 추출 (use_choi: true인 경우)
      const metadata = firstResult?.metadata || {};
      const useChoi = metadata?.use_choi === true;
      console.log("🧠 Choi 알고리즘 사용 여부:", { useChoi, metadata });

      if (useChoi) {
        // choi_judgement 데이터 추출
        const choiJudgement = firstResult?.choi_judgement;
        if (choiJudgement) {
          console.log("✅ Choi 알고리즘 데이터 발견:", choiJudgement);
          setChoiData(choiJudgement);
          setChoiAlgorithmResult("done");
        } else {
          console.warn(
            "⚠️ use_choi가 true이지만 choi_judgement 데이터가 없습니다"
          );
          setChoiAlgorithmResult("error");
        }
      } else {
        console.log("ℹ️ Choi 알고리즘 미사용 (use_choi: false 또는 없음)");
        setChoiAlgorithmResult("absent");
      }

      // 마할라노비스 거리 계산
      if (firstResult?.kpiResults || firstResult?.stats) {
        const mahalanobisData = firstResult.kpiResults || firstResult.stats;
        console.log("🧮 마할라노비스 계산용 데이터:", mahalanobisData);

        try {
          const mahalanobisResult =
            calculateMahalanobisDistance(mahalanobisData);
          console.log("✅ 마할라노비스 계산 결과:", mahalanobisResult);
          setMahalanobisResult(mahalanobisResult);
        } catch (error) {
          console.error("❌ 마할라노비스 계산 오류:", error);
          setMahalanobisResult({
            error: "계산 중 오류 발생: " + error.message,
          });
        }
      } else {
        console.warn("⚠️ 마할라노비스 계산을 위한 데이터가 없습니다:", {
          kpiResults: firstResult?.kpiResults,
          stats: firstResult?.stats,
        });
        setMahalanobisResult({ error: "분석 데이터가 없습니다" });
      }

      // PEG 비교 결과 계산
      if (firstResult?.stats) {
        const pegResult = calculatePegComparison(firstResult);
        setPegComparisonResult(pegResult);
      }
    } else {
      console.log("⏳ 마할라노비스 분석 대기 중:", {
        hasResults: currentProcessedResults.length > 0,
        isLoading: loading,
      });
    }
  }, [results, loading, calculateMahalanobisDistance, calculatePegComparison]);

  // === 상태별 뱃지 색상 ===
  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "success":
        return "default";
      case "error":
      case "failed":
        return "destructive";
      case "warning":
        return "secondary";
      case "pending":
      case "processing":
        return "outline";
      default:
        return "secondary";
    }
  };

  // === 날짜 포맷팅 ===
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
      });
    } catch {
      return dateString || "-";
    }
  };

  // (모킹 제거)

  // === 처리된 결과 데이터 ===
  const processedResults = useMemo(() => {
    // 모킹 제거: 에러가 있는 항목은 제외하고 그대로 사용
    return safeResults.filter((r) => !r.error);
  }, [safeResults]);

  // === 비교 모드 데이터 처리 ===
  const comparisonData = useMemo(() => {
    if (!isCompareMode) return null;

    const kpiNames =
      processedResults[0]?.kpiResults?.map((kpi) => kpi.name) || [];

    return kpiNames.map((kpiName) => {
      const dataPoint = { name: kpiName };

      processedResults.forEach((result, index) => {
        const kpi = result.kpiResults?.find((k) => k.name === kpiName);
        dataPoint[`결과${index + 1}`] = parseFloat(kpi?.value || 0);
      });

      return dataPoint;
    });
  }, [processedResults, isCompareMode]);

  // === 단일 결과 차트 데이터 처리 ===
  const kpiChartData = useMemo(() => {
    if (
      isCompareMode ||
      !processedResults.length ||
      !processedResults[0].stats
    ) {
      return {
        kpiResults: [],
        sortedKpiResults: [],
        filteredResults: [],
        dataWithTrends: [],
        trendFilteredResults: [],
        totalPages: 0,
        paginatedResults: [],
        data: [],
        summaryStats: {
          improved: 0,
          declined: 0,
          stable: 0,
          avgChange: 0,
          weightedAvgChange: 0,
        },
      };
    }

    const result = processedResults[0];
    const statsData = result.stats || [];

    const pegComparison = {};
    statsData.forEach((stat) => {
      const pegName = stat.kpi_name;
      if (!pegComparison[pegName]) {
        pegComparison[pegName] = { peg_name: pegName, weight: 5 };
      }
      if (stat.period === "N-1") {
        pegComparison[pegName]["N-1"] = stat.avg;
      } else if (stat.period === "N") {
        pegComparison[pegName]["N"] = stat.avg;
      }
    });

    const weightData = result.request_params?.peg_definitions || {};
    Object.keys(pegComparison).forEach((pegName) => {
      if (weightData[pegName]?.weight) {
        pegComparison[pegName].weight = weightData[pegName].weight;
      }
    });

    const kpiResults = Object.values(pegComparison).filter(
      (peg) => peg["N-1"] !== undefined && peg["N"] !== undefined
    );
    // 정렬 로직: Preference 기반
    const sortKey = pegSort;
    const sortedKpiResults = [...kpiResults].sort((a, b) => {
      switch (sortKey) {
        case "weight_asc":
          return (a.weight || 0) - (b.weight || 0);
        case "change_desc":
          return (b.change_percent || 0) - (a.change_percent || 0);
        case "change_asc":
          return (a.change_percent || 0) - (b.change_percent || 0);
        case "name_asc":
          return String(a.peg_name).localeCompare(String(b.peg_name));
        case "name_desc":
          return String(b.peg_name).localeCompare(String(a.peg_name));
        case "weight_desc":
        default:
          return (b.weight || 0) - (a.weight || 0);
      }
    });

    const filteredResults = sortedKpiResults.filter((item) => {
      const matchesNameFilter =
        !pegFilter ||
        item.peg_name.toLowerCase().includes(pegFilter.toLowerCase());
      const weight = item.weight || 0;
      let matchesWeightFilter = true;
      if (weightFilter === "high") matchesWeightFilter = weight >= 8;
      else if (weightFilter === "medium")
        matchesWeightFilter = weight >= 6 && weight < 8;
      else if (weightFilter === "low") matchesWeightFilter = weight < 6;
      return matchesNameFilter && matchesWeightFilter;
    });

    const dataWithTrends = filteredResults.map((item) => {
      const n1Value = item["N-1"] || 0;
      const nValue = item["N"] || 0;
      const change = nValue - n1Value;
      const changePercent = n1Value !== 0 ? (change / n1Value) * 100 : 0;
      const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";
      return { ...item, change, changePercent, trend };
    });

    const trendFilteredResults = dataWithTrends.filter((item) => {
      if (trendFilter === "all") return true;
      return item.trend === trendFilter;
    });

    const totalPages = Math.ceil(trendFilteredResults.length / pegPageSize);
    const paginatedResults = trendFilteredResults.slice(
      pegPage * pegPageSize,
      (pegPage + 1) * pegPageSize
    );

    const data = paginatedResults.map((item) => ({
      name: item.peg_name,
      "N-1": item["N-1"] || 0,
      N: item["N"] || 0,
      change: item.change,
      changePercent: item.changePercent,
      trend: item.trend,
      weight: item.weight,
      unit: "%",
      peg: item.weight || 0,
    }));

    const improved = data.filter((item) => item.trend === "up").length;
    const declined = data.filter((item) => item.trend === "down").length;
    const stable = data.filter((item) => item.trend === "stable").length;
    const avgChange =
      data.length > 0
        ? data.reduce((sum, item) => sum + item.change, 0) / data.length
        : 0;
    const weightedAvgChange =
      data.length > 0
        ? data.reduce((sum, item) => sum + item.change * item.weight, 0) /
          data.reduce((sum, item) => sum + item.weight, 0)
        : 0;
    const summaryStats = {
      improved,
      declined,
      stable,
      avgChange,
      weightedAvgChange,
    };

    return {
      kpiResults,
      sortedKpiResults,
      filteredResults,
      dataWithTrends,
      trendFilteredResults,
      totalPages,
      paginatedResults,
      data,
      summaryStats,
    };
  }, [
    isCompareMode,
    processedResults,
    pegFilter,
    weightFilter,
    trendFilter,
    pegPage,
    pegPageSize,
  ]);

  const renderKpiChart = () => {
    const { kpiResults, trendFilteredResults, totalPages, data, summaryStats } =
      kpiChartData;

    if (isCompareMode) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {processedResults.map((_, index) => (
              <Bar
                key={`result${index + 1}`}
                dataKey={`결과${index + 1}`}
                fill={`hsl(${index * 60}, 70%, 50%)`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (!kpiResults.length) {
      return (
        <div className="text-center text-muted-foreground">
          PEG 비교 데이터가 없습니다.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* 성능 요약 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {summaryStats.improved}
            </div>
            <div className="text-xs text-muted-foreground">개선 📈</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {summaryStats.declined}
            </div>
            <div className="text-xs text-muted-foreground">하락 📉</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              {summaryStats.stable}
            </div>
            <div className="text-xs text-muted-foreground">안정 ➡️</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-bold ${
                summaryStats.avgChange >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summaryStats.avgChange > 0 ? "+" : ""}
              {summaryStats.avgChange.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">평균 변화</div>
          </div>
          <div className="text-center">
            <div
              className={`text-lg font-bold ${
                summaryStats.weightedAvgChange >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {summaryStats.weightedAvgChange > 0 ? "+" : ""}
              {summaryStats.weightedAvgChange.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">가중 평균 변화</div>
          </div>
        </div>

        {/* 필터 및 제어 영역 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>📊 PEG별 N-1/N 성능 비교 (가중치 높은 순)</span>
            <Badge variant="outline">
              전체 {kpiResults.length}개 중 {trendFilteredResults.length}개 표시
            </Badge>
          </div>

          <div
            className={`grid gap-3 transition-all duration-300 ${
              isFullscreen
                ? "grid-cols-1 md:grid-cols-6 lg:grid-cols-8"
                : "grid-cols-1 md:grid-cols-5"
            }`}
          >
            {/* PEG 이름 검색 */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="PEG 이름 검색..."
                value={pegFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  setPegFilter(v);
                  // Preference 저장
                  updateDashboardSettings({ pegSearch: v });
                  setPegPage(0); // 검색 시 첫 페이지로
                }}
                className="pl-8"
              />
            </div>

            {/* 가중치 필터 */}
            <Select
              value={weightFilter}
              onValueChange={(value) => {
                setWeightFilter(value);
                setPegPage(0); // 필터 변경 시 첫 페이지로
              }}
            >
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="가중치 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="high">높음 (≥8)</SelectItem>
                <SelectItem value="medium">중간 (6-7.9)</SelectItem>
                <SelectItem value="low">낮음 (&lt;6)</SelectItem>
              </SelectContent>
            </Select>

            {/* 트렌드 필터 */}
            <Select
              value={trendFilter}
              onValueChange={(value) => {
                setTrendFilter(value);
                setPegPage(0); // 필터 변경 시 첫 페이지로
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="트렌드 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 트렌드</SelectItem>
                <SelectItem value="up">개선 📈</SelectItem>
                <SelectItem value="down">하락 📉</SelectItem>
                <SelectItem value="stable">안정 ➡️</SelectItem>
              </SelectContent>
            </Select>

            {/* 정렬 선택 */}
            <Select
              value={pegSort}
              onValueChange={(value) => {
                setPegSort(value);
                updateDashboardSettings({ pegSort: value });
                setPegPage(0);
              }}
            >
              <SelectTrigger className="w-[165px]">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_desc">가중치 ↓</SelectItem>
                <SelectItem value="weight_asc">가중치 ↑</SelectItem>
                <SelectItem value="change_desc">변화율 ↓</SelectItem>
                <SelectItem value="change_asc">변화율 ↑</SelectItem>
                <SelectItem value="name_asc">이름 A→Z</SelectItem>
                <SelectItem value="name_desc">이름 Z→A</SelectItem>
              </SelectContent>
            </Select>

            {/* 페이지 크기 선택 */}
            <Select
              value={pegPageSize.toString()}
              onValueChange={(value) => {
                setPegPageSize(parseInt(value));
                setPegPage(0); // 페이지 크기 변경 시 첫 페이지로
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="표시 개수" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5개씩</SelectItem>
                <SelectItem value="10">10개씩</SelectItem>
                <SelectItem value="20">20개씩</SelectItem>
                <SelectItem value="50">50개씩</SelectItem>
              </SelectContent>
            </Select>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPegPage(Math.max(0, pegPage - 1))}
                disabled={pegPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {pegPage + 1} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPegPage(Math.min(totalPages - 1, pegPage + 1))
                }
                disabled={pegPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <ResponsiveContainer
          width="100%"
          height={
            isFullscreen
              ? Math.min(window.innerHeight * 0.55, 900)
              : Math.min(window.innerHeight * 0.4, 500)
          }
          className="transition-all duration-300"
        >
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              fontSize={10}
            />
            <YAxis />
            <Tooltip
              formatter={(value, name, props) => [
                `${value?.toFixed(2)} ${props.payload.unit}`,
                name,
              ]}
              labelFormatter={(label) => {
                const item = data.find((d) => d.name === label);
                return `${label} (가중치: ${item?.weight || 0})`;
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                const data = payload[0]?.payload;
                if (!data) return null;

                const getTrendIcon = (trend) => {
                  switch (trend) {
                    case "up":
                      return "📈";
                    case "down":
                      return "📉";
                    default:
                      return "➡️";
                  }
                };

                const getTrendColor = (trend) => {
                  switch (trend) {
                    case "up":
                      return "text-green-600";
                    case "down":
                      return "text-red-600";
                    default:
                      return "text-gray-600";
                  }
                };

                return (
                  <div className="bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
                    <div className="font-semibold mb-2">{label}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-orange-600">N-1 기간:</span>
                        <span className="font-medium">
                          {data["N-1"]?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">N 기간:</span>
                        <span className="font-medium">
                          {data["N"]?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="border-t pt-1 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">성능 변화:</span>
                          <div
                            className={`flex items-center gap-1 font-medium ${getTrendColor(
                              data.trend
                            )}`}
                          >
                            <span>{getTrendIcon(data.trend)}</span>
                            <span>
                              {data.change > 0 ? "+" : ""}
                              {data.change?.toFixed(2)}%
                            </span>
                            <span className="text-xs">
                              ({data.changePercent > 0 ? "+" : ""}
                              {data.changePercent?.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">가중치:</span>
                          <span className="font-medium">{data.weight}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar dataKey="N-1" fill="#ff7300" name="N-1 기간" />
            <Bar dataKey="N" fill="#8884d8" name="N 기간" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // === LLM 데이터 구조 분석 헬퍼 함수들 ===

  // 데이터 구조 자동 분석
  const analyzeLLMDataStructure = (data) => {
    const analysis = {
      hasDirectAnalysis: !!data?.analysis,
      hasDataAnalysis: !!data?.data?.analysis,
      hasNestedDataAnalysis: !!data?.data?.data?.analysis,
      dataKeys: data ? Object.keys(data) : [],
      nestedDataKeys: data?.data ? Object.keys(data.data) : [],
      doubleNestedKeys: data?.data?.data ? Object.keys(data.data.data) : [],
      structureType: "unknown",
      recommendedPath: "",
    };

    // 구조 타입 판정 및 추천 경로 설정
    if (data?.data?.data?.analysis) {
      analysis.structureType = "triple_nested";
      analysis.recommendedPath = "data.data.analysis";
    } else if (data?.data?.analysis) {
      analysis.structureType = "double_nested";
      analysis.recommendedPath = "data.analysis";
    } else if (data?.analysis) {
      analysis.structureType = "single_level";
      analysis.recommendedPath = "analysis";
    }

    return analysis;
  };

  // 우선순위 기반 분석 데이터 추출 (개선된 다중 폴백)
  const extractAnalysisData = (data) => {
    let doc, analysis, dataStructure;

    // 우선순위 1: Backend 표준 구조 (data.analysis) - LLM 결과가 analysis 필드에 저장됨
    if (
      data?.data?.analysis &&
      typeof data.data.analysis === "object" &&
      !Array.isArray(data.data.analysis)
    ) {
      doc = data.data;
      analysis = doc.analysis;
      dataStructure = "data.analysis (Backend 표준 구조 - LLM 결과 위치)";
      console.log(
        "✅ 우선순위 1: data.analysis 구조 사용 (Backend 표준 - LLM 결과 위치)"
      );
    }
    // 우선순위 2: Backend 표준 구조 (data) - data 필드가 직접 LLM 결과인 경우
    else if (
      data?.data &&
      typeof data.data === "object" &&
      !Array.isArray(data.data)
    ) {
      // data 필드에 LLM 분석 결과가 직접 있는지 확인
      const hasLLMFields =
        data.data.executive_summary !== undefined ||
        data.data.overall_summary !== undefined ||
        data.data.comprehensive_summary !== undefined ||
        data.data.diagnostic_findings !== undefined;

      if (hasLLMFields) {
        doc = data;
        analysis = doc.data;
        dataStructure = "data (Backend 표준 구조 - LLM 결과 직접 위치)";
        console.log(
          "✅ 우선순위 2: data 구조 사용 (Backend 표준 - LLM 결과 직접 위치)"
        );
      } else {
        // LLM 필드가 없으면 다음 우선순위로
        doc = data;
        analysis = {};
        dataStructure = "data (LLM 필드 없음)";
        console.log("⚠️ data 구조에 LLM 필드가 없습니다");
      }
    }
    // 우선순위 3: 기존 중첩 구조 (first.data.data.analysis) - 호환성 유지
    else if (data?.data?.data?.analysis) {
      doc = data.data.data;
      analysis = doc.analysis;
      dataStructure = "data.data.analysis (기존 중첩 구조)";
      console.log("⚠️ 우선순위 3: data.data.analysis 구조 사용 (중첩 구조)");
    }
    // 우선순위 4: 직접 구조 (first.analysis) - 폴백
    else if (data?.analysis) {
      doc = data;
      analysis = doc.analysis;
      dataStructure = "analysis (직접 구조)";
      console.log("📋 우선순위 4: analysis 직접 구조 사용");
    }
    // 우선순위 5: 기본값
    else {
      doc = data || {};
      analysis = {};
      dataStructure = "empty (데이터 없음)";
      console.warn("❌ 모든 우선순위 실패: 분석 데이터를 찾을 수 없습니다");
    }

    return { doc, analysis, dataStructure };
  };

  // 데이터 검증 함수 (타입 안전성 강화)
  const validateAnalysisData = (analysis) => {
    const validation = {
      isValid: false,
      errors: [],
      warnings: [],
    };

    if (!analysis) {
      validation.errors.push("analysis 객체가 없습니다");
      return validation;
    }

    if (typeof analysis !== "object") {
      validation.errors.push("analysis가 객체 타입이 아닙니다");
      return validation;
    }

    // executive_summary 검증
    if (analysis.executive_summary !== undefined) {
      if (typeof analysis.executive_summary === "string") {
        validation.isValid = true;
      } else {
        validation.warnings.push("executive_summary가 문자열 타입이 아닙니다");
      }
    }

    // 다른 요약 필드들도 검증
    const summaryFields = ["overall_summary", "comprehensive_summary"];
    summaryFields.forEach((field) => {
      if (
        analysis[field] !== undefined &&
        typeof analysis[field] !== "string"
      ) {
        validation.warnings.push(`${field}가 문자열 타입이 아닙니다`);
      }
    });

    // 필수 필드 존재 확인
    const requiredFields = ["diagnostic_findings", "recommended_actions"];
    requiredFields.forEach((field) => {
      if (analysis[field] === undefined) {
        validation.warnings.push(`선택적 필드 ${field}가 없습니다`);
      }
    });

    if (validation.errors.length === 0) {
      validation.isValid = true;
    }

    return validation;
  };

  // 개선된 요약 텍스트 추출 (우선순위 기반 + 유연한 필드 탐색)
  const extractSummaryText = (analysis) => {
    let summaryText = "요약 정보가 없습니다.";
    let selectedField = "none";

    if (!analysis) {
      return { summaryText, selectedField };
    }

    // 우선순위 1: 표준 LLM 분석 요약 필드들
    const priorityFields = [
      "executive_summary", // 경영진 요약
      "overall_summary", // 전체 요약
      "comprehensive_summary", // 종합 요약
      "summary", // 일반 요약
      "conclusion", // 결론
      "result", // 결과
      "description", // 설명
      "analysis_summary", // 분석 요약
      "key_findings", // 주요 발견사항 (문자열인 경우)
      "recommendations", // 권장사항 (문자열인 경우)
      "insights", // 통찰
      "overview", // 개요
    ];

    // 우선순위 필드들을 순차적으로 탐색
    for (const field of priorityFields) {
      const value = analysis[field];

      if (value) {
        // 문자열인 경우 직접 사용
        if (typeof value === "string" && value.trim()) {
          summaryText = value.trim();
          selectedField = field;
          console.log(`✅ ${field} 필드 사용 (문자열)`);
          break;
        }
        // 배열인 경우 첫 번째 요소가 문자열이면 사용
        else if (Array.isArray(value) && value.length > 0) {
          const firstItem = value[0];
          if (typeof firstItem === "string" && firstItem.trim()) {
            summaryText = firstItem.trim();
            selectedField = `${field}[0]`;
            console.log(`📝 ${field} 배열의 첫 번째 요소 사용`);
            break;
          }
          // 객체 배열인 경우 특정 필드 탐색
          else if (typeof firstItem === "object" && firstItem) {
            const textFields = [
              "text",
              "content",
              "summary",
              "description",
              "message",
            ];
            for (const textField of textFields) {
              if (
                firstItem[textField] &&
                typeof firstItem[textField] === "string"
              ) {
                summaryText = firstItem[textField].trim();
                selectedField = `${field}[0].${textField}`;
                console.log(`📝 ${field}[0].${textField} 필드 사용`);
                break;
              }
            }
            if (selectedField !== "none") break;
          }
        }
        // 객체인 경우 특정 필드 탐색
        else if (typeof value === "object") {
          const textFields = [
            "text",
            "content",
            "summary",
            "description",
            "message",
          ];
          for (const textField of textFields) {
            if (value[textField] && typeof value[textField] === "string") {
              summaryText = value[textField].trim();
              selectedField = `${field}.${textField}`;
              console.log(`📝 ${field}.${textField} 필드 사용`);
              break;
            }
          }
          if (selectedField !== "none") break;
        }
      }
    }

    // 모든 필드 탐색에도 실패한 경우
    if (selectedField === "none") {
      console.warn("⚠️ 모든 요약 필드가 비어있거나 유효하지 않습니다");
      console.log("🔍 사용 가능한 필드들:", Object.keys(analysis));
    }

    return { summaryText, selectedField };
  };

  // === LLM 분석 리포트 렌더링 (개선된 데이터 구조 처리) ===
  const renderLLMReport = (results) => {
    const first = results?.[0] || {};

    // 강화된 디버깅: 데이터 구조 자동 분석
    const dataStructureAnalysis = analyzeLLMDataStructure(first);
    console.log("🔍 LLM 분석 결과 디버깅:", dataStructureAnalysis);

    // 개선된 분석 객체 추출: 우선순위 기반 다중 폴백
    const { doc, analysis, dataStructure } = extractAnalysisData(first);

    // 타입 안전성 강화: 데이터 검증
    const validationResult = validateAnalysisData(analysis);

    console.log("📊 분석 객체 구조:", {
      analysis,
      analysisKeys: Object.keys(analysis || {}),
      dataStructure,
      validationResult,
      availableSummaries: {
        executive_summary: !!analysis?.executive_summary,
        overall_summary: !!analysis?.overall_summary,
        comprehensive_summary: !!analysis?.comprehensive_summary,
      },
      // 추가 디버깅: 원본 데이터 구조 확인
      originalDataKeys: Object.keys(first || {}),
      hasDataField: "data" in (first || {}),
      dataFieldKeys: first?.data ? Object.keys(first.data) : [],
      hasAnalysisInData: first?.data?.analysis !== undefined,
      analysisInDataKeys: first?.data?.analysis
        ? Object.keys(first.data.analysis)
        : [],
      // LLM 필드 존재 여부 상세 확인
      llmFieldsCheck: {
        executive_summary: {
          exists: analysis?.executive_summary !== undefined,
          type: typeof analysis?.executive_summary,
          value: analysis?.executive_summary,
        },
        overall_summary: {
          exists: analysis?.overall_summary !== undefined,
          type: typeof analysis?.overall_summary,
          value: analysis?.overall_summary,
        },
        comprehensive_summary: {
          exists: analysis?.comprehensive_summary !== undefined,
          type: typeof analysis?.comprehensive_summary,
          value: analysis?.comprehensive_summary,
        },
      },
    });

    // 개선된 요약 텍스트 추출: 우선순위 기반
    const { summaryText, selectedField } = extractSummaryText(analysis);

    console.log("📝 최종 요약 텍스트:", {
      summaryText: summaryText?.substring(0, 200) + "..." || "없음",
      selectedField,
      textLength: summaryText?.length || 0,
      isValid: !!summaryText && summaryText !== "요약 정보가 없습니다.",
    });

    // 진단 결과: 다중 필드 지원으로 유연한 탐색
    const extractDiagnosticFindings = (analysis) => {
      // 우선순위: diagnostic_findings -> key_findings -> findings -> observations
      const possibleFields = [
        "diagnostic_findings",
        "key_findings",
        "findings",
        "observations",
        "insights",
      ];

      for (const field of possibleFields) {
        const value = analysis[field];
        if (Array.isArray(value) && value.length > 0) {
          // 이미 객체 배열인 경우
          if (typeof value[0] === "object" && value[0]) {
            return value;
          }
          // 문자열 배열인 경우 객체로 변환
          else if (typeof value[0] === "string") {
            return value.map((item) => ({ primary_hypothesis: String(item) }));
          }
        }
      }
      return [];
    };

    const diagnosticFindings = extractDiagnosticFindings(analysis);

    // 권장 조치: 다중 필드 지원으로 유연한 탐색
    const extractRecommendedActions = (analysis) => {
      // 우선순위: recommended_actions -> recommendations -> actions -> suggestions
      const possibleFields = [
        "recommended_actions",
        "recommendations",
        "actions",
        "suggestions",
      ];

      for (const field of possibleFields) {
        const value = analysis[field];
        if (Array.isArray(value) && value.length > 0) {
          return value.map((a) => {
            if (a && typeof a === "object") return a;
            return { priority: "", action: String(a || ""), details: "" };
          });
        }
        // 단일 객체인 경우 배열로 변환
        else if (value && typeof value === "object") {
          return [
            {
              priority: value.priority || "",
              action: value.action || String(value),
              details: value.details || "",
            },
          ];
        }
        // 문자열인 경우 객체로 변환
        else if (typeof value === "string" && value.trim()) {
          return [{ priority: "", action: value.trim(), details: "" }];
        }
      }
      return [];
    };

    const recommendedActions = extractRecommendedActions(analysis);

    return (
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* 종합 분석 요약 */}
        <Card className="w-full overflow-hidden">
          <CardHeader>
            <CardTitle>종합 분석 요약</CardTitle>
          </CardHeader>
          <CardContent className="w-full overflow-hidden">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words w-full">
              {summaryText}
            </div>
          </CardContent>
        </Card>

        {/* 핵심 관찰 사항 (diagnostic_findings) */}
        {diagnosticFindings.length > 0 && (
          <Card className="w-full overflow-hidden">
            <CardHeader>
              <CardTitle>핵심 관찰 사항</CardTitle>
            </CardHeader>
            <CardContent className="max-w-full overflow-hidden">
              <div className="space-y-3">
                {diagnosticFindings.map((d, idx) => (
                  <div key={idx} className="space-y-1">
                    {d.primary_hypothesis && (
                      <div className="text-sm break-words whitespace-pre-wrap">
                        <span className="font-semibold">가설 {idx + 1}:</span>{" "}
                        {d.primary_hypothesis}
                      </div>
                    )}
                    {d.supporting_evidence && (
                      <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                        증거: {d.supporting_evidence}
                      </div>
                    )}
                    {d.confounding_factors_assessment && (
                      <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap">
                        교란 변수 평가: {d.confounding_factors_assessment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 권장 조치 (recommended_actions) */}
        {recommendedActions.length > 0 && (
          <Card className="w-full overflow-hidden">
            <CardHeader>
              <CardTitle>권장 조치</CardTitle>
            </CardHeader>
            <CardContent className="max-w-full overflow-hidden">
              <div className="space-y-3 max-w-full overflow-hidden">
                {recommendedActions.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 max-w-full overflow-hidden"
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                      <div className="flex items-center gap-2 max-w-full overflow-hidden">
                        {a.priority && (
                          <Badge variant="outline" className="flex-shrink-0">
                            {a.priority}
                          </Badge>
                        )}
                        <div className="text-sm font-medium break-words whitespace-pre-wrap min-w-0 max-w-full">
                          {a.action || "-"}
                        </div>
                      </div>
                      {a.details && (
                        <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-words max-w-full">
                          {a.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // === 비교 모드 헤더 ===
  const renderCompareHeader = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {processedResults.length}개 결과 비교
        </h3>
        <div className="flex gap-2">
          {processedResults.map((result, index) => (
            <Badge key={result.id} variant="outline" className="gap-2">
              <div
                className={`w-3 h-3 rounded-full`}
                style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
              />
              결과 {index + 1}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processedResults.map((result, index) => (
          <Card
            key={result.id}
            className="border-l-4"
            style={{ borderLeftColor: `hsl(${index * 60}, 70%, 50%)` }}
          >
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">결과 {index + 1}</span>
                  <Badge variant={getStatusBadgeVariant(result.status)}>
                    {result.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDate(result.analysisDate)}
                </div>
                <div className="text-sm">
                  NE: {result.neId} | Cell: {result.cellId}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // === 단일 결과 개요 ===
  const renderSingleOverview = (result) => (
    <div className="space-y-4 max-w-full overflow-hidden">
      <Card className="border-l-4 border-l-blue-500 w-full overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">분석 결과 상세 정보</CardTitle>
            <Badge variant={getStatusBadgeVariant(result.status)}>
              {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-w-full overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                분석 날짜
              </div>
              <div className="text-sm">{formatDate(result.analysisDate)}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                NE ID
              </div>
              <div className="text-sm">{result.neId}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                Cell ID
              </div>
              <div className="text-sm">{result.cellId}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">
                LLM 모델
              </div>
              <div className="text-sm">{result.llmModel || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // === Choi 알고리즘 결과 렌더링 ===
  const renderChoiAlgorithmResult = () => {
    const getStatusBadgeVariant = (status) => {
      switch (status?.toLowerCase()) {
        case "ok":
          return "default";
        case "pok":
          return "secondary";
        case "ng":
          return "destructive";
        default:
          return "outline";
      }
    };

    const getStatusText = (status) => {
      switch (status?.toLowerCase()) {
        case "ok":
          return "정상";
        case "pok":
          return "주의";
        case "ng":
          return "이상";
        default:
          return status || "N/A";
      }
    };

    return (
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Choi 알고리즘 판정 결과
                {choiData ? (
                  <Badge variant="outline" className="text-purple-600">
                    완료
                  </Badge>
                ) : choiAlgorithmResult === "error" ? (
                  <Badge variant="destructive" className="text-red-600">
                    오류
                  </Badge>
                ) : choiAlgorithmResult === "absent" ? (
                  <Badge variant="outline" className="text-gray-600">
                    미사용
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-purple-600">
                    대기
                  </Badge>
                )}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowHelp("choi")}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Choi 알고리즘 문서 기반의 품질 판정 결과를 표시합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {choiData ? (
            <div className="space-y-6">
              {/* 전체 판정 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  전체 판정
                </span>
                <Badge
                  variant={getStatusBadgeVariant(choiData.overall)}
                  className="text-lg px-3 py-1"
                >
                  {getStatusText(choiData.overall)}
                </Badge>
              </div>

              {/* 판정 사유 */}
              {Array.isArray(choiData.reasons) &&
                choiData.reasons.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      판정 사유
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {choiData.reasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {typeof reason === "string"
                            ? reason
                            : JSON.stringify(reason)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* KPI별 상세 판정 */}
              {choiData.by_kpi && Object.keys(choiData.by_kpi).length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    KPI별 상세 판정
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border rounded-lg">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            KPI
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            상태
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            임계값
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            실제 변화
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            심각도
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(choiData.by_kpi).map(
                          ([kpiName, kpiData]) => (
                            <tr key={kpiName} className="border-t">
                              <td className="px-3 py-2 font-medium">
                                {kpiName}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    kpiData.status
                                  )}
                                >
                                  {getStatusText(kpiData.status)}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {kpiData.evidence?.threshold || "N/A"}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {kpiData.evidence?.actual_change || "N/A"}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant={
                                    kpiData.evidence?.severity === "high"
                                      ? "destructive"
                                      : kpiData.evidence?.severity === "medium"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {kpiData.evidence?.severity || "N/A"}
                                </Badge>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 이상 탐지 정보 */}
              {choiData.abnormal_detection && (
                <div>
                  <div className="text-sm font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    이상 탐지 정보
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {choiData.abnormal_detection.detected_anomalies || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        탐지된 이상
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(
                          (choiData.abnormal_detection.confidence_score || 0) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground">
                        신뢰도
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {Array.isArray(
                          choiData.abnormal_detection.anomaly_types
                        )
                          ? choiData.abnormal_detection.anomaly_types.length
                          : 0}
                        개 유형
                      </div>
                      <div className="text-xs text-muted-foreground">
                        이상 유형
                      </div>
                    </div>
                  </div>
                  {Array.isArray(choiData.abnormal_detection.anomaly_types) &&
                    choiData.abnormal_detection.anomaly_types.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {choiData.abnormal_detection.anomaly_types.map(
                          (type, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {type}
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                </div>
              )}

              {/* 경고 메시지 */}
              {Array.isArray(choiData.warnings) &&
                choiData.warnings.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      경고 메시지
                    </div>
                    <div className="space-y-2">
                      {choiData.warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* 알고리즘 정보 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                <div>
                  {choiData.algorithm_version && (
                    <span>알고리즘 버전: {choiData.algorithm_version}</span>
                  )}
                </div>
                <div>
                  {choiData.processing_time_ms && (
                    <span>처리 시간: {choiData.processing_time_ms}ms</span>
                  )}
                </div>
              </div>
            </div>
          ) : choiAlgorithmResult === "error" ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-red-600">
                Choi 알고리즘 오류
              </h3>
              <p className="text-muted-foreground">
                Choi 알고리즘 데이터를 불러오는 중 오류가 발생했습니다.
              </p>
            </div>
          ) : choiAlgorithmResult === "absent" ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Choi 알고리즘 미사용
              </h3>
              <p className="text-muted-foreground">
                이 분석에서는 Choi 알고리즘이 사용되지 않았습니다.
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Choi 알고리즘 데이터를 불러오는 중...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // === 마할라노비스 거리 알고리즘 결과 렌더링 ===
  const renderMahalanobisResult = () => {
    console.log("🎨 마할라노비스 렌더링 상태:", {
      mahalanobisResult,
      loading,
      resultsLength: safeResults.length,
    });

    // Promise 객체인 경우 처리
    if (mahalanobisResult && typeof mahalanobisResult.then === "function") {
      return (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              마할라노비스 분석 중...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              마할라노비스 거리 분석을 수행하고 있습니다. 잠시만 기다려주세요.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!mahalanobisResult) {
      return (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              마할라노비스 거리 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground">
                    분석 데이터를 불러오는 중...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    분석 데이터를 기다리는 중...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    결과: {results.length}개, 로딩: {loading ? "예" : "아니오"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (mahalanobisResult?.error) {
      return (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              마할라노비스 거리 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{mahalanobisResult.error}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    const getAlarmColor = (level) => {
      switch (level) {
        case "critical":
          return "text-red-600 bg-red-50 border-red-200";
        case "warning":
          return "text-orange-600 bg-orange-50 border-orange-200";
        case "caution":
          return "text-yellow-600 bg-yellow-50 border-yellow-200";
        default:
          return "text-green-600 bg-green-50 border-green-200";
      }
    };

    const getAlarmIcon = (level) => {
      switch (level) {
        case "critical":
          return <AlertTriangle className="h-5 w-5" />;
        case "warning":
          return <AlertCircle className="h-5 w-5" />;
        case "caution":
          return <Clock className="h-5 w-5" />;
        default:
          return <Check className="h-5 w-5" />;
      }
    };

    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                마할라노비스 거리 분석 결과
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShowHelp("mahalanobis")}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            1차 스크리닝: 종합 건강 상태 진단 및 2차 심층 분석 결과
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 종합 건강 상태 */}
          <div
            className={`p-4 rounded-lg border ${getAlarmColor(
              mahalanobisResult.alarmLevel
            )}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getAlarmIcon(mahalanobisResult.alarmLevel)}
                <span className="font-semibold">종합 건강 상태</span>
              </div>
              <Badge
                variant={
                  mahalanobisResult.alarmLevel === "normal"
                    ? "default"
                    : "destructive"
                }
              >
                {mahalanobisResult.alarmLevel === "normal"
                  ? "정상"
                  : mahalanobisResult.alarmLevel === "caution"
                  ? "주의"
                  : mahalanobisResult.alarmLevel === "warning"
                  ? "경고"
                  : "심각"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">총 KPI 수:</span>
                <div className="font-medium">
                  {mahalanobisResult.totalKpis || 0}개
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">이상 KPI 수:</span>
                <div className="font-medium">
                  {mahalanobisResult.abnormalKpis?.length || 0}개
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">이상 점수:</span>
                <div className="font-medium">
                  {((mahalanobisResult.abnormalScore || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">판정:</span>
              <span className="ml-1">
                {mahalanobisResult.analysis?.screening?.description ||
                  "분석 중..."}
              </span>
            </div>
          </div>

          {/* 이상 KPI 목록 */}
          {mahalanobisResult.abnormalKpis?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                이상 감지된 KPI 목록
              </h4>
              <div className="space-y-2">
                {mahalanobisResult.abnormalKpis?.slice(0, 5).map((kpi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{kpi.kpiName}</div>
                      <div className="text-sm text-muted-foreground">
                        N-1: {kpi.n1Value?.toFixed(2)} → N:{" "}
                        {kpi.nValue?.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          kpi.severity === "critical"
                            ? "destructive"
                            : kpi.severity === "warning"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {(kpi.changeRate * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 심층 분석 결과 */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              2차 심층 분석 결과
            </h4>

            {/* 분석 요약 */}
            {mahalanobisResult.analysis?.drilldown?.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {mahalanobisResult.analysis.drilldown.summary.totalAnalyzed}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    분석된 KPI
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {
                      mahalanobisResult.analysis.drilldown.summary
                        .statisticallySignificant
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    통계적 유의성
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {
                      mahalanobisResult.analysis.drilldown.summary
                        .highConfidenceFindings
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    고신뢰도 발견
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {
                      mahalanobisResult.analysis.drilldown.summary
                        .distributionChanges
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">분포 변화</div>
                </div>
              </div>
            )}

            {/* 개별 KPI 통계 분석 결과 */}
            {mahalanobisResult.analysis?.drilldown?.statisticalAnalysis
              ?.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-medium text-sm">개별 KPI 통계 분석 결과</h5>
                {mahalanobisResult.analysis.drilldown.statisticalAnalysis.map(
                  (analysis, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {analysis.kpiName}
                          </span>
                          <Badge
                            variant={
                              analysis.severity === "critical"
                                ? "destructive"
                                : analysis.severity === "warning"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {analysis.severity}
                          </Badge>
                          <Badge
                            variant={
                              analysis.confidence === "high"
                                ? "default"
                                : analysis.confidence === "medium"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            신뢰도: {analysis.confidence}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          변화율: {(analysis.changeRate * 100).toFixed(1)}%
                        </div>
                      </div>

                      {!analysis.statisticalTests.error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Mann-Whitney U Test 결과 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h6 className="text-sm font-medium flex items-center gap-2">
                                <Target className="h-3 w-3" />
                                Mann-Whitney U Test
                              </h6>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowHelp("mann-whitney")}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 p-0"
                              >
                                <HelpCircle className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>U 통계량:</span>
                                <span className="font-mono">
                                  {analysis.statisticalTests.mannWhitney.U?.toFixed(
                                    2
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Z-score:</span>
                                <span className="font-mono">
                                  {analysis.statisticalTests.mannWhitney.zScore?.toFixed(
                                    3
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>p-value:</span>
                                <span
                                  className={`font-mono ${
                                    analysis.statisticalTests.mannWhitney
                                      .significant
                                      ? "text-red-600 font-bold"
                                      : "text-green-600"
                                  }`}
                                >
                                  {analysis.statisticalTests.mannWhitney.pValue?.toFixed(
                                    4
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>효과 크기:</span>
                                <span className="font-mono">
                                  {analysis.statisticalTests.mannWhitney.effectSize?.toFixed(
                                    3
                                  )}
                                </span>
                              </div>
                            </div>
                            <div
                              className={`text-xs p-2 rounded ${
                                analysis.statisticalTests.mannWhitney
                                  .significant
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-green-50 text-green-700 border border-green-200"
                              }`}
                            >
                              {
                                analysis.statisticalTests.mannWhitney
                                  .interpretation
                              }
                            </div>
                          </div>

                          {/* Kolmogorov-Smirnov Test 결과 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h6 className="text-sm font-medium flex items-center gap-2">
                                <BarChart3 className="h-3 w-3" />
                                Kolmogorov-Smirnov Test
                              </h6>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShowHelp("ks-test")}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-6 w-6 p-0"
                              >
                                <HelpCircle className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>D 통계량:</span>
                                <span className="font-mono">
                                  {analysis.statisticalTests.kolmogorovSmirnov.D?.toFixed(
                                    4
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>p-value:</span>
                                <span
                                  className={`font-mono ${
                                    analysis.statisticalTests.kolmogorovSmirnov
                                      .significant
                                      ? "text-red-600 font-bold"
                                      : "text-green-600"
                                  }`}
                                >
                                  {analysis.statisticalTests.kolmogorovSmirnov.pValue?.toFixed(
                                    4
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>분포 차이:</span>
                                <span className="font-mono">
                                  {
                                    analysis.statisticalTests.kolmogorovSmirnov
                                      .distributionDifference
                                  }
                                </span>
                              </div>
                            </div>
                            <div
                              className={`text-xs p-2 rounded ${
                                analysis.statisticalTests.kolmogorovSmirnov
                                  .significant
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-green-50 text-green-700 border border-green-200"
                              }`}
                            >
                              {
                                analysis.statisticalTests.kolmogorovSmirnov
                                  .interpretation
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      {analysis.statisticalTests.error && (
                        <div className="text-xs p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                          {analysis.statisticalTests.error}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* 변화점 탐지 계획 */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h6 className="text-sm font-medium text-blue-800 mb-2">
                변화점 탐지 알고리즘
              </h6>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Cusum 알고리즘을 통한 변화점 자동 탐지 예정</div>
                <div>• 정확한 문제 발생 시각 특정 및 원인 분석</div>
                <div>• 실시간 모니터링을 통한 사전 경고 시스템 구축</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // === PEG 비교 결과 렌더링 ===
  const renderPegComparisonResult = () => {
    if (!pegComparisonResult) {
      return (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              PEG 비교 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-muted-foreground">
                PEG 비교 데이터를 불러오는 중...
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                PEG 성능 비교 분석
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const visibleNames = (pegComparisonResult || [])
                  .filter((p) => {
                    const matchesName =
                      !pegFilter ||
                      String(p.peg_name)
                        .toLowerCase()
                        .includes(pegFilter.toLowerCase());
                    const weight = p.weight || 0;
                    const matchesWeight =
                      weightFilter === "all"
                        ? true
                        : weightFilter === "high"
                        ? weight >= 8
                        : weightFilter === "medium"
                        ? weight >= 6 && weight < 8
                        : weightFilter === "low"
                        ? weight < 6
                        : true;
                    const matchesTrend =
                      trendFilter === "all" ? true : p.trend === trendFilter;
                    return matchesName && matchesWeight && matchesTrend;
                  })
                  .map((p) => p.peg_name);

                const total = pegComparisonResult?.length || 0;
                const selCount = preferredPegs.length;

                return (
                  <>
                    <Badge variant="outline" className="text-xs">
                      선택 {selCount} / 총 {total}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPreferredPegs(
                          Array.from(
                            new Set([...(preferredPegs || []), ...visibleNames])
                          )
                        )
                      }
                    >
                      선택 모두
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreferredPegs([])}
                    >
                      선택 해제
                    </Button>
                  </>
                );
              })()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowHelp("peg-comparison")}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            N-1 기간과 N 기간의 PEG별 평균, RSD, 변화율 비교
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                {pegComparisonResult.length}
              </div>
              <div className="text-xs text-muted-foreground dark:text-muted-foreground/80">
                총 PEG 수
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/40 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-300">
                {pegComparisonResult.filter((p) => p.trend === "up").length}
              </div>
              <div className="text-xs text-muted-foreground">개선 PEG</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/40 rounded-lg">
              <div className="text-lg font-bold text-red-600 dark:text-red-300">
                {pegComparisonResult.filter((p) => p.trend === "down").length}
              </div>
              <div className="text-xs text-muted-foreground">하락 PEG</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-bold text-gray-600 dark:text-gray-300">
                {pegComparisonResult.filter((p) => p.trend === "stable").length}
              </div>
              <div className="text-xs text-muted-foreground">안정 PEG</div>
            </div>
          </div>

          {/* PEG 목록 테이블 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              PEG별 상세 비교 결과
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 dark:bg-muted/20 sticky top-0">
                    <tr className="text-left text-sm font-medium">
                      <th className="p-3">PEG 이름</th>
                      <th className="p-3 text-center">선택</th>
                      <th className="p-3 text-center">가중치</th>
                      <th className="p-3 text-center">N-1 평균</th>
                      <th className="p-3 text-center">N 평균</th>
                      <th className="p-3 text-center">N-1 RSD</th>
                      <th className="p-3 text-center">N RSD</th>
                      <th className="p-3 text-center">변화율</th>
                      <th className="p-3 text-center">트렌드</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(dashboardSettings?.selectedPegs) &&
                    dashboardSettings.selectedPegs.length > 0
                      ? pegComparisonResult.filter((p) =>
                          dashboardSettings.selectedPegs.includes(p.peg_name)
                        )
                      : pegComparisonResult
                    ).map((peg, idx) => (
                      <tr key={idx} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{peg.peg_name}</td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={preferredPegs.includes(peg.peg_name)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? Array.from(
                                    new Set([...preferredPegs, peg.peg_name])
                                  )
                                : preferredPegs.filter(
                                    (n) => n !== peg.peg_name
                                  );
                              setPreferredPegs(next);
                            }}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline">{peg.weight}</Badge>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {peg.n1_avg.toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {peg.n_avg.toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {peg.n1_rsd.toFixed(1)}%
                        </td>
                        <td className="p-3 text-center font-mono">
                          {peg.n_rsd.toFixed(1)}%
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              peg.significance === "high"
                                ? "destructive"
                                : peg.significance === "medium"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {peg.change_percent > 0 ? "+" : ""}
                            {peg.change_percent.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              peg.trend === "up"
                                ? "default"
                                : peg.trend === "down"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {peg.trend === "up"
                              ? "📈"
                              : peg.trend === "down"
                              ? "📉"
                              : "➡️"}
                            {peg.trend === "up"
                              ? "개선"
                              : peg.trend === "down"
                              ? "하락"
                              : "안정"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              PEG 성능 비교 차트
            </h4>
            <div className="h-64">{renderKpiChart()}</div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // === 디버깅 정보 표시 컴포넌트 ===
  const DebugInfo = ({ component, hooks = [], description = "" }) => {
    if (!isTemplateMode) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">디버깅 정보</span>
        </div>
        <div className="text-xs text-blue-700 space-y-1">
          <div>
            <strong>컴포넌트:</strong> {component}
          </div>
          {hooks.length > 0 && (
            <div>
              <strong>사용된 훅:</strong> {hooks.join(", ")}
            </div>
          )}
          {description && (
            <div>
              <strong>설명:</strong> {description}
            </div>
          )}
        </div>
      </div>
    );
  };

  // === 모달 컨텐츠 ===
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-muted-foreground dark:text-muted-foreground/80">
              분석 결과를 불러오는 중...
            </p>
          </div>
          <div className="grid gap-4">
            <div className="bg-card/40 dark:bg-card/20 border rounded-lg p-4">
              <div className="h-5 w-48 bg-accent/60 dark:bg-accent/30 animate-pulse rounded mb-3" />
              <div className="h-4 w-full bg-accent/60 dark:bg-accent/30 animate-pulse rounded mb-2" />
              <div className="h-4 w-5/6 bg-accent/60 dark:bg-accent/30 animate-pulse rounded" />
            </div>
            <div className="bg-card/40 dark:bg-card/20 border rounded-lg p-4">
              <div className="h-5 w-56 bg-accent/60 dark:bg-accent/30 animate-pulse rounded mb-3" />
              <div className="h-48 w-full bg-accent/60 dark:bg-accent/30 animate-pulse rounded" />
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-xl mx-auto">
          <div className="border rounded-lg p-6 bg-background dark:bg-background/60">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold">데이터를 불러오지 못했습니다</h4>
                <p className="text-sm text-muted-foreground">{error}</p>
                <div className="pt-1">
                  <Button
                    variant="outline"
                    onClick={() => fetchResultDetails(resultIds)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> 다시 시도
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (processedResults.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              분석 결과를 찾을 수 없습니다.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 기본 정보 요약 */}
        <div className="space-y-6">
          <DebugInfo
            component={
              isCompareMode ? "renderCompareHeader()" : "renderSingleOverview()"
            }
            hooks={["useMemo", "formatDate", "getStatusBadgeVariant"]}
            description={
              isCompareMode
                ? "다중 결과 비교 헤더를 표시하는 컴포넌트"
                : "단일 결과 개요 정보를 표시하는 컴포넌트"
            }
          />
          {isCompareMode
            ? renderCompareHeader()
            : renderSingleOverview(processedResults[0])}
        </div>

        {/* Choi 알고리즘 결과 (최우선) */}
        <AnalysisSection
          title={
            <span className="inline-flex items-center gap-2">
              Choi 알고리즘 판정
              {choiData?.overall && (
                <AnalysisStatusIndicator status={choiData.overall} />
              )}
            </span>
          }
          defaultOpen
          data-testid="section-choi"
        >
          <DebugInfo
            component="renderChoiAlgorithmResult()"
            hooks={["useState", "useEffect", "useCallback"]}
            description="Choi 알고리즘 판정 결과를 표시하는 컴포넌트. choi_judgement 데이터를 기반으로 전체 판정, KPI별 상세 판정, 이상 탐지 정보를 표시합니다."
          />
          {renderChoiAlgorithmResult()}
        </AnalysisSection>

        {/* LLM 분석 리포트 */}
        <AnalysisSection
          title="LLM 분석 리포트"
          defaultOpen
          data-testid="section-llm"
        >
          <DebugInfo
            component="renderLLMReport()"
            hooks={["useMemo", "extractAnalysisData", "extractSummaryText"]}
            description="LLM 분석 결과를 표시하는 컴포넌트. executive_summary, diagnostic_findings, recommended_actions 등의 데이터를 구조화하여 표시합니다."
          />
          {renderLLMReport(processedResults)}
        </AnalysisSection>

        {/* 마할라노비스 거리 분석 */}
        {mahalanobisResult && (
          <AnalysisSection
            title="마할라노비스 분석"
            defaultOpen
            data-testid="section-mahalanobis"
          >
            <DebugInfo
              component="renderMahalanobisResult()"
              hooks={["useState", "useEffect", "calculateMahalanobisDistance"]}
              description="마할라노비스 거리 분석 결과를 표시하는 컴포넌트. 종합 건강 상태, 이상 KPI 목록, 2차 심층 분석 결과를 표시합니다."
            />
            {renderMahalanobisResult()}
          </AnalysisSection>
        )}

        {/* PEG 비교 분석 (Preference 연동 예정) */}
        {pegComparisonResult && (
          <AnalysisSection
            title="PEG 비교 분석"
            defaultOpen
            data-testid="section-peg"
          >
            <DebugInfo
              component="PEGAnalysisDisplay"
              hooks={[
                "usePegPreferences",
                "useDashboardSettings",
                "calculatePegComparison",
              ]}
              description="PEG 성능 비교 분석을 표시하는 컴포넌트. KPI별 성능 변화, 가중치 기반 분석, 차트 및 테이블 형태로 데이터를 표시합니다."
            />
            <PEGAnalysisDisplay results={pegComparisonResult} />
          </AnalysisSection>
        )}
      </div>
    );
  };

  // === 도움말 모달 핸들러 ===
  const handleShowHelp = useCallback((algorithm) => {
    setHelpModal({
      isOpen: true,
      algorithm,
    });
  }, []);

  const handleCloseHelp = useCallback(() => {
    setHelpModal({
      isOpen: false,
      algorithm: null,
    });
  }, []);

  // === 도움말 컨텐츠 렌더링 ===
  const renderHelpContent = () => {
    switch (helpModal.algorithm) {
      case "choi":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Brain className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Choi 알고리즘 도움말</h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">
                  🔍 알고리즘 개요
                </h4>
                <p className="text-purple-700">
                  Choi 알고리즘은 품질 저하 판정을 위한 특화된 알고리즘입니다.
                  현재 준비 단계로, 향후 특정 KPI 패턴을 분석하여 품질 문제를
                  진단합니다.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  📊 신뢰성 기준
                </h4>
                <div className="space-y-2 text-blue-700">
                  <p>
                    <strong>준비 단계:</strong> 현재 absent 상태로 표시됩니다.
                  </p>
                  <p>
                    <strong>향후 기준:</strong> 구현 시 품질 저하 판정 정확도
                    85% 이상 목표
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  💡 해석 방법
                </h4>
                <div className="space-y-2 text-green-700">
                  <p>
                    <strong>정상:</strong> 품질 문제가 감지되지 않음
                  </p>
                  <p>
                    <strong>주의:</strong> 잠재적 품질 저하 가능성
                  </p>
                  <p>
                    <strong>경고:</strong> 즉각적인 조치 필요
                  </p>
                  <p>
                    <strong>심각:</strong> 긴급 대응 요구
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ 주의사항
                </h4>
                <div className="space-y-1 text-yellow-700 text-xs">
                  <p>• 현재 구현 준비 단계입니다.</p>
                  <p>• Choi 알고리즘 문서에 따라 구현될 예정입니다.</p>
                  <p>• 도메인 전문가의 검토가 필요합니다.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "mahalanobis":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Target className="h-12 w-12 text-orange-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">
                마할라노비스 거리 분석 도움말
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">
                  🔍 알고리즘 개요
                </h4>
                <p className="text-orange-700">
                  다차원 데이터에서 이상치를 탐지하는 통계적 방법입니다. 여러
                  KPI를 동시에 고려하여 종합적인 건강 상태를 평가합니다.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  📊 신뢰성 기준
                </h4>
                <div className="space-y-2 text-blue-700">
                  <p>
                    <strong>이상 점수 범위:</strong> 0.0 ~ 1.0
                  </p>
                  <p>
                    <strong>주의 임계치:</strong> 0.1 (10% 이상 KPI 이상)
                  </p>
                  <p>
                    <strong>경고 임계치:</strong> 0.2 (20% 이상 KPI 이상)
                  </p>
                  <p>
                    <strong>심각 임계치:</strong> 0.3 (30% 이상 KPI 이상)
                  </p>
                  <p>
                    <strong>신뢰도:</strong> 95% 이상의 정확도 목표
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  💡 해석 방법
                </h4>
                <div className="space-y-2 text-green-700">
                  <p>
                    <strong>정상 (Normal):</strong> 이상 점수가 낮아 안정적 상태
                  </p>
                  <p>
                    <strong>주의 (Caution):</strong> 일부 KPI에서 변화 감지,
                    모니터링 필요
                  </p>
                  <p>
                    <strong>경고 (Warning):</strong> 다수 KPI 이상, 즉각적 검토
                    필요
                  </p>
                  <p>
                    <strong>심각 (Critical):</strong> 심각한 이상 패턴, 긴급
                    조치 요구
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ 주의사항
                </h4>
                <div className="space-y-1 text-yellow-700 text-xs">
                  <p>• 다차원 데이터의 상관관계를 고려합니다.</p>
                  <p>• 개별 KPI 변화율 10% 이상을 이상으로 간주합니다.</p>
                  <p>• 통계적 유의성을 고려하여 판정합니다.</p>
                  <p>• 도메인 지식과 함께 해석하는 것이 중요합니다.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "mann-whitney":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">
                Mann-Whitney U Test 도움말
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  🔍 알고리즘 개요
                </h4>
                <p className="text-blue-700">
                  두 독립적인 그룹 간의 차이를 비교하는 비모수적 통계
                  검정입니다. 데이터의 정규성 가정 없이 평균 차이의 통계적
                  유의성을 검정합니다.
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  📊 신뢰성 기준
                </h4>
                <div className="space-y-2 text-green-700">
                  <p>
                    <strong>p-value:</strong> 0.05 미만이면 통계적으로 유의함
                  </p>
                  <p>
                    <strong>효과 크기 (Effect Size):</strong>
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• 0.2: 작은 효과</li>
                    <li>• 0.5: 중간 효과</li>
                    <li>• 0.8: 큰 효과</li>
                  </ul>
                  <p>
                    <strong>Z-score:</strong> ±1.96 이상이면 95% 신뢰수준에서
                    유의함
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">
                  💡 해석 방법
                </h4>
                <div className="space-y-2 text-purple-700">
                  <p>
                    <strong>p &lt; 0.05:</strong> 두 그룹 간에 통계적으로 유의한
                    차이가 있음
                  </p>
                  <p>
                    <strong>p ≥ 0.05:</strong> 우연에 의한 차이일 가능성이 높음
                  </p>
                  <p>
                    <strong>큰 효과 크기:</strong> 실질적으로 의미 있는 차이
                  </p>
                  <p>
                    <strong>작은 효과 크기:</strong> 통계적 유의성은 있지만
                    실질적 차이는 미미
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ 주의사항
                </h4>
                <div className="space-y-1 text-yellow-700 text-xs">
                  <p>• 데이터의 독립성 가정을 만족해야 합니다.</p>
                  <p>• 표본 크기가 작으면 검정력이 낮아질 수 있습니다.</p>
                  <p>• 이상치에 덜 민감하지만, 분포 모양을 고려해야 합니다.</p>
                  <p>
                    • p-value만으로 결론을 내리지 말고 효과 크기도 고려하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "ks-test":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">
                Kolmogorov-Smirnov Test 도움말
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  🔍 알고리즘 개요
                </h4>
                <p className="text-green-700">
                  두 샘플의 분포가 같은지 비교하는 비모수적 검정입니다.
                  누적분포함수(CDF)의 최대 차이를 기반으로 분포 차이를
                  검정합니다.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  📊 신뢰성 기준
                </h4>
                <div className="space-y-2 text-blue-700">
                  <p>
                    <strong>D 통계량:</strong> 두 CDF 간 최대 차이 (0~1 범위)
                  </p>
                  <p>
                    <strong>p-value:</strong> 0.05 미만이면 분포 차이가 유의함
                  </p>
                  <p>
                    <strong>분포 차이 정도:</strong>
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• Small (D &lt; 0.1): 미미한 차이</li>
                    <li>• Medium (0.1 ≤ D &lt; 0.2): 중간 정도 차이</li>
                    <li>• Large (D ≥ 0.2): 큰 차이</li>
                  </ul>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">
                  💡 해석 방법
                </h4>
                <div className="space-y-2 text-purple-700">
                  <p>
                    <strong>p &lt; 0.05:</strong> 두 그룹의 분포가 통계적으로
                    다름
                  </p>
                  <p>
                    <strong>p ≥ 0.05:</strong> 두 그룹의 분포가 비슷함
                  </p>
                  <p>
                    <strong>D 값이 큼:</strong> 분포 모양의 차이가 큼
                  </p>
                  <p>
                    <strong>D 값이 작음:</strong> 분포가 서로 유사함
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ 주의사항
                </h4>
                <div className="space-y-1 text-yellow-700 text-xs">
                  <p>• 분포의 모양, 위치, 산포도 차이를 모두 고려합니다.</p>
                  <p>• 표본 크기가 작으면 검정력이 낮아질 수 있습니다.</p>
                  <p>• 이상치에 민감할 수 있습니다.</p>
                  <p>• p-value와 D 통계량을 함께 고려하여 해석하세요.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "peg-comparison":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Gauge className="h-12 w-12 text-teal-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">PEG 비교 분석 도움말</h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                <h4 className="font-semibold text-teal-800 mb-2">
                  🔍 알고리즘 개요
                </h4>
                <p className="text-teal-700">
                  N-1 기간과 N 기간의 PEG별 성능을 비교하는 분석입니다. 평균,
                  표준편차, 변화율을 계산하여 성능 트렌드를 분석합니다.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">
                  📊 신뢰성 기준
                </h4>
                <div className="space-y-2 text-blue-700">
                  <p>
                    <strong>변화율:</strong>
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• ±5%: 안정 범위</li>
                    <li>• ±5~10%: 주의 범위</li>
                    <li>• ±10% 초과: 이상 범위</li>
                  </ul>
                  <p>
                    <strong>RSD (상대 표준편차):</strong>
                  </p>
                  <ul className="ml-4 space-y-1">
                    <li>• &lt; 10%: 매우 안정적</li>
                    <li>• 10~20%: 보통 안정성</li>
                    <li>• &gt; 20%: 불안정적</li>
                  </ul>
                  <p>
                    <strong>가중치:</strong> 1~10 범위로 PEG 중요도 반영
                  </p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">
                  💡 해석 방법
                </h4>
                <div className="space-y-2 text-green-700">
                  <p>
                    <strong>개선 (Up):</strong> N 기간 성능이 향상된 PEG
                  </p>
                  <p>
                    <strong>하락 (Down):</strong> N 기간 성능이 저하된 PEG
                  </p>
                  <p>
                    <strong>안정 (Stable):</strong> 큰 변화 없는 PEG
                  </p>
                  <p>
                    <strong>신뢰도:</strong> 통계 테스트 결과에 따른 분석 신뢰도
                  </p>
                  <p>
                    <strong>RSD 비교:</strong> 기간별 변동성 비교
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ 주의사항
                </h4>
                <div className="space-y-1 text-yellow-700 text-xs">
                  <p>• 데이터의 연속성과 완전성을 확인하세요.</p>
                  <p>• 계절적/주기적 패턴을 고려하여 분석하세요.</p>
                  <p>• 이상치가 분석 결과에 미치는 영향을 검토하세요.</p>
                  <p>• 도메인 전문가의 의견과 함께 해석하는 것이 중요합니다.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>알고리즘을 선택해주세요.</div>;
    }
  };

  return (
    <>
      {/* 메인 모달 */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={`transition-all duration-500 ease-in-out transform overflow-hidden ${
            isFullscreen
              ? "max-w-[99vw] h-[98vh] w-[99vw] scale-100"
              : "max-w-6xl max-h-[90vh] w-auto min-w-[80vw] scale-100"
          }`}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {isTemplateMode
                  ? "🎨 분석 결과 템플릿 (디버깅용)"
                  : isCompareMode
                  ? "분석 결과 비교"
                  : "분석 결과 상세"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* ✅ 세로로만 확대하는 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="transition-all duration-200 hover:scale-110 hover:bg-accent"
                  title={isFullscreen ? "원래 크기로 (ESC)" : "최대화 (F11)"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                {/* ❌ 커스텀 닫기 버튼 제거: DialogContent 기본 X만 사용 */}
              </div>
            </div>
            <DialogDescription className="sr-only">
              {isCompareMode
                ? `${processedResults.length}개의 분석 결과를 비교하고 알고리즘 분석 결과를 확인할 수 있습니다.`
                : "단일 분석 결과의 상세 정보를 확인하고 Choi 알고리즘, 마할라노비스 거리, PEG 비교 분석 결과를 확인할 수 있습니다."}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea
            className={`transition-all duration-300 overflow-hidden ${
              isFullscreen ? "h-[85vh]" : "max-h-[75vh] min-h-[400px]"
            }`}
          >
            <div className="px-1 w-full max-w-full overflow-hidden">
              {renderContent()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 도움말 모달 */}
      <Dialog open={helpModal.isOpen} onOpenChange={handleCloseHelp}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              알고리즘 도움말
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-4">{renderHelpContent()}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default memo(ResultDetail);
