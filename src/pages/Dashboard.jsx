/**
 * 대시보드 페이지
 * LLM 분석 API 연동
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "../components/layout/index.js";
import {
  Button,
  Card,
  EmptyState,
  DateTimePicker,
  Combobox,
  Badge,
} from "../components/common/index.js";
import { runAnalysisV2, getUserPreferences } from "../lib/api.js";

function roundDownToFiveMinutes(date) {
  const minutes = date.getMinutes();
  const roundedMinutes = Math.floor(minutes / 5) * 5;
  const result = new Date(date);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
}

function getCurrentTimeRounded() {
  return format(roundDownToFiveMinutes(new Date()), "yyyy-MM-dd HH:mm");
}

const NE_ID_OPTIONS = [
  { value: "SKT_NE_4521_01", label: "SKT_NE_4521_01" },
  { value: "SKT_NE_4521_02", label: "SKT_NE_4521_02" },
  { value: "SKT_NE_8873_05", label: "SKT_NE_8873_05" },
  { value: "nvgnb#10000", label: "nvgnb#10000" },
  { value: "nvgnb#10001", label: "nvgnb#10001" },
];

const CELL_ID_OPTIONS = [
  { value: "C00124", label: "C00124" },
  { value: "C00125", label: "C00125" },
  { value: "C00126", label: "C00126" },
  { value: "2010", label: "2010" },
  { value: "2011", label: "2011" },
];

function AnalysisForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    n1StartTime: "2023-10-26 10:00",
    n1EndTime: "2023-10-26 14:25",
    nStartTime: "2023-10-27 10:00",
    nEndTime: getCurrentTimeRounded(),
    neId: "",
    cellId: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFormData((prev) => ({ ...prev, nEndTime: getCurrentTimeRounded() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field) => (value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <h2 className="text-white text-xl font-bold mb-6">
          분석 조건 설정 (Set Analysis Conditions)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-200/10 bg-slate-500/5 p-4">
            <p className="text-slate-300 text-sm font-semibold mb-4">
              N-1 기간 (Comparison Period)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker
                label="시작 시간 (Start Time)"
                value={formData.n1StartTime}
                onChange={handleChange("n1StartTime")}
                disabled={loading}
              />
              <DateTimePicker
                label="종료 시간 (End Time)"
                value={formData.n1EndTime}
                onChange={handleChange("n1EndTime")}
                disabled={loading}
              />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/10 bg-slate-500/5 p-4">
            <p className="text-slate-300 text-sm font-semibold mb-4">
              N 기간 (Current Period)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker
                label="시작 시간 (Start Time)"
                value={formData.nStartTime}
                onChange={handleChange("nStartTime")}
                disabled={loading}
              />
              <DateTimePicker
                label="종료 시간 (End Time)"
                value={formData.nEndTime}
                onChange={handleChange("nEndTime")}
                disabled={loading}
              />
            </div>
            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              종료 시간은 현재 시간 기준 5분 단위로 자동 설정됩니다. 필요시 변경
              가능합니다.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Combobox
              label="NE ID"
              icon="router"
              value={formData.neId}
              onChange={handleChange("neId")}
              options={NE_ID_OPTIONS}
              placeholder="NE ID 선택 또는 입력"
              disabled={loading}
            />
            <Combobox
              label="CELL ID"
              icon="cell_tower"
              value={formData.cellId}
              onChange={handleChange("cellId")}
              options={CELL_ID_OPTIONS}
              placeholder="Cell ID 선택 또는 입력"
              disabled={loading}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200/10">
          <Button
            type="submit"
            icon="auto_awesome"
            loading={loading}
            disabled={loading || !formData.neId || !formData.cellId}
          >
            LLM 분석 (LLM Analysis)
          </Button>
        </div>
      </form>
    </Card>
  );
}

// 분석 결과 미리보기 컴포넌트
function AnalysisResultPreview({ result, onViewDetail, onReset }) {
  const status = result.choi_result?.status || "normal";

  return (
    <div className="rounded-xl border border-slate-200/10 bg-[#111a22] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold">분석 완료</h3>
        <Badge variant={status} dot>
          {status === "normal"
            ? "Normal"
            : status === "warning"
            ? "Warning"
            : "Critical"}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-slate-800/30 p-4">
          <p className="text-slate-400 text-xs mb-1">NE ID</p>
          <p className="text-white font-medium">{result.ne_id}</p>
        </div>
        <div className="rounded-lg bg-slate-800/30 p-4">
          <p className="text-slate-400 text-xs mb-1">Cell ID</p>
          <p className="text-white font-medium">{result.cell_id}</p>
        </div>
        <div className="rounded-lg bg-slate-800/30 p-4">
          <p className="text-slate-400 text-xs mb-1">Confidence</p>
          <p className="text-white font-medium">
            {((result.llm_analysis?.confidence || 0) * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      {result.llm_analysis && (
        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-slate-400 text-sm mb-2">요약 (Summary)</h4>
            <p className="text-white text-sm">{result.llm_analysis.summary}</p>
          </div>
          {result.llm_analysis.issues?.length > 0 && (
            <div>
              <h4 className="text-slate-400 text-sm mb-2">
                발견된 이슈 ({result.llm_analysis.issues.length})
              </h4>
              <ul className="space-y-1">
                {result.llm_analysis.issues.slice(0, 3).map((issue, i) => (
                  <li
                    key={i}
                    className="text-yellow-400 text-sm flex items-start gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">
                      warning
                    </span>
                    {issue}
                  </li>
                ))}
                {result.llm_analysis.issues.length > 3 && (
                  <li className="text-slate-400 text-sm">
                    ... 외 {result.llm_analysis.issues.length - 3}개
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200/10">
        <Button variant="ghost" onClick={onReset} icon="refresh">
          새 분석
        </Button>
        <Button onClick={onViewDetail} icon="open_in_new">
          전체 결과 보기
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dbConfig, setDbConfig] = useState(null);

  // 사용자 설정에서 DB 설정 로드
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const result = await getUserPreferences("default");
        if (result.success && result.data?.database_settings) {
          setDbConfig(result.data.database_settings);
          console.log("[Dashboard] DB 설정 로드 완료:", {
            ...result.data.database_settings,
            password: "[HIDDEN]",
          });
        }
      } catch (err) {
        console.warn("[Dashboard] 사용자 설정 로드 실패:", err);
      }
    };
    loadPreferences();
  }, []);

  /**
   * 시간 형식 변환: "YYYY-MM-DD HH:MM" → "YYYY-MM-DD_HH:MM"
   * @param {string} dateTimeStr - 입력 시간 문자열
   * @returns {string} 변환된 시간 문자열
   */
  const formatTimeForApi = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    // 공백이나 T를 언더스코어로 변환
    return dateTimeStr.replace(/[\sT]/g, "_").substring(0, 16);
  };

  const handleAnalysisSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // 백엔드 API 기대 형식에 맞게 요청 파라미터 변환
      // n_minus_1: "YYYY-MM-DD_HH:MM~YYYY-MM-DD_HH:MM"
      // n: "YYYY-MM-DD_HH:MM~YYYY-MM-DD_HH:MM"
      const requestParams = {
        n_minus_1: `${formatTimeForApi(
          formData.n1StartTime
        )}~${formatTimeForApi(formData.n1EndTime)}`,
        n: `${formatTimeForApi(formData.nStartTime)}~${formatTimeForApi(
          formData.nEndTime
        )}`,
        ne_id: formData.neId,
        cell_id: formData.cellId,
        db_config: dbConfig
          ? {
              host: dbConfig.host,
              port: dbConfig.port || 5432,
              user: dbConfig.user,
              password: dbConfig.password,
              dbname: dbConfig.dbname,
              table: dbConfig.table || "summary",
            }
          : undefined,
        user_id: "default",
      };

      console.log("[Dashboard] LLM 분석 요청:", {
        ...requestParams,
        db_config: requestParams.db_config
          ? { ...requestParams.db_config, password: "[HIDDEN]" }
          : undefined,
      });

      // /api/analysis/results-v2/analyze API 호출
      const response = await runAnalysisV2(requestParams);
      console.log("[Dashboard] 분석 결과:", response);

      // 응답 데이터 처리
      const result = response.data || response;
      setAnalysisResult(result);
    } catch (err) {
      console.error("[Dashboard] 분석 요청 실패:", err);
      setError(
        err.response?.data?.detail || err.message || "분석 요청에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = () => {
    if (analysisResult?.id) {
      navigate(`/results?highlight=${analysisResult.id}`);
    } else {
      navigate("/results");
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl">
      <Header
        title="KPI Analysis Dashboard"
        description="Set the conditions below to begin your analysis."
      />

      <AnalysisForm onSubmit={handleAnalysisSubmit} loading={loading} />

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </p>
        </div>
      )}

      <div className="mt-8">
        {analysisResult ? (
          <AnalysisResultPreview
            result={analysisResult}
            onViewDetail={handleViewDetail}
            onReset={handleReset}
          />
        ) : (
          <div className="flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200/20 bg-[#111a22]/50">
            <EmptyState
              icon="query_stats"
              title="Analysis Results Will Appear Here"
              description="분석할 시간 범위와 네트워크 요소를 선택한 후 'LLM 분석' 버튼을 클릭하세요."
            />
          </div>
        )}
      </div>
    </div>
  );
}
