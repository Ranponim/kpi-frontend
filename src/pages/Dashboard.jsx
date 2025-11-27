/**
 * 대시보드 페이지
 * LLM 분석 API 연동
 */

import { useState, useEffect, useMemo } from "react";
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
  Spinner,
} from "../components/common/index.js";
import { runAnalysisV2, getUserPreferences, getEmsNeList } from "../lib/api.js";

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

function AnalysisForm({ onSubmit, loading, emsData, emsLoading }) {
  const [formData, setFormData] = useState({
    n1StartTime: "2023-10-26 10:00",
    n1EndTime: "2023-10-26 14:25",
    nStartTime: "2023-10-27 10:00",
    nEndTime: getCurrentTimeRounded(),
    ems: "",
    neId: "",
    cellId: "",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFormData((prev) => ({ ...prev, nEndTime: getCurrentTimeRounded() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // EMS 옵션 생성
  const emsOptions = useMemo(() => {
    if (!emsData) return [];
    return Object.keys(emsData).map((ems) => ({
      value: ems,
      label: ems,
    }));
  }, [emsData]);

  // NE ID 옵션 생성 (선택된 EMS 기준)
  const neIdOptions = useMemo(() => {
    if (!emsData || !formData.ems) return [];
    const emsEntry = emsData[formData.ems];
    if (!emsEntry) return [];
    return Object.keys(emsEntry).map((neId) => ({
      value: neId,
      label: neId,
    }));
  }, [emsData, formData.ems]);

  // Cell ID 옵션 생성 (선택된 EMS + NE ID 기준)
  const cellIdOptions = useMemo(() => {
    if (!emsData || !formData.ems || !formData.neId) return [];
    const emsEntry = emsData[formData.ems];
    if (!emsEntry) return [];
    const neEntry = emsEntry[formData.neId];
    if (!neEntry) return [];
    
    // 모든 tech의 ID를 합침
    const allIds = [];
    Object.entries(neEntry).forEach(([tech, ids]) => {
      if (Array.isArray(ids)) {
        ids.forEach((id) => {
          allIds.push({
            value: String(id),
            label: `${id} (${tech})`,
          });
        });
      }
    });
    return allIds;
  }, [emsData, formData.ems, formData.neId]);

  const handleChange = (field) => (value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      // EMS 변경 시 NE ID, Cell ID 초기화
      if (field === "ems") {
        newData.neId = "";
        newData.cellId = "";
      }
      // NE ID 변경 시 Cell ID 초기화
      if (field === "neId") {
        newData.cellId = "";
      }
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.ems && formData.neId && formData.cellId;

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <h2 className="text-white text-xl font-bold mb-6">
          분석 조건 설정 (Set Analysis Conditions)
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 시간 설정 영역 */}
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
              종료 시간은 현재 시간 기준 5분 단위로 자동 설정됩니다.
            </p>
          </div>

          {/* EMS / NE ID / Cell ID 선택 영역 */}
          <div className="lg:col-span-2 rounded-lg border border-slate-200/10 bg-slate-500/5 p-4">
            <p className="text-slate-300 text-sm font-semibold mb-4">
              네트워크 요소 선택 (Network Element Selection)
            </p>
            {emsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
                <span className="text-slate-400 ml-3">EMS 목록 로딩 중...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Combobox
                  label="EMS"
                  icon="dns"
                  value={formData.ems}
                  onChange={handleChange("ems")}
                  options={emsOptions}
                  placeholder="EMS 선택"
                  disabled={loading || emsOptions.length === 0}
                />
                <Combobox
                  label="NE ID"
                  icon="router"
                  value={formData.neId}
                  onChange={handleChange("neId")}
                  options={neIdOptions}
                  placeholder={formData.ems ? "NE ID 선택" : "EMS를 먼저 선택하세요"}
                  disabled={loading || !formData.ems || neIdOptions.length === 0}
                />
                <Combobox
                  label="Cell ID"
                  icon="cell_tower"
                  value={formData.cellId}
                  onChange={handleChange("cellId")}
                  options={cellIdOptions}
                  placeholder={formData.neId ? "Cell ID 선택" : "NE ID를 먼저 선택하세요"}
                  disabled={loading || !formData.neId || cellIdOptions.length === 0}
                />
              </div>
            )}
            {!emsLoading && emsOptions.length === 0 && (
              <p className="text-yellow-400 text-xs mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                EMS 목록을 불러올 수 없습니다. 네트워크 연결을 확인하세요.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200/10">
          <Button
            type="submit"
            icon="auto_awesome"
            loading={loading}
            disabled={loading || !isFormValid}
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
  
  // EMS/NE/Cell 목록 데이터
  const [emsData, setEmsData] = useState(null);
  const [emsLoading, setEmsLoading] = useState(true);

  // EMS/NE/Cell 목록 로드
  useEffect(() => {
    const loadEmsData = async () => {
      setEmsLoading(true);
      try {
        const data = await getEmsNeList();
        console.log("[Dashboard] EMS 목록 로드 완료:", data);
        setEmsData(data);
      } catch (err) {
        console.error("[Dashboard] EMS 목록 로드 실패:", err);
        setEmsData(null);
      } finally {
        setEmsLoading(false);
      }
    };
    loadEmsData();
  }, []);

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
   */
  const formatTimeForApi = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    return dateTimeStr.replace(/[\sT]/g, "_").substring(0, 16);
  };

  const handleAnalysisSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const requestParams = {
        n_minus_1: `${formatTimeForApi(formData.n1StartTime)}~${formatTimeForApi(formData.n1EndTime)}`,
        n: `${formatTimeForApi(formData.nStartTime)}~${formatTimeForApi(formData.nEndTime)}`,
        ems: formData.ems,
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

      const response = await runAnalysisV2(requestParams);
      console.log("[Dashboard] 분석 결과:", response);

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

      <AnalysisForm 
        onSubmit={handleAnalysisSubmit} 
        loading={loading}
        emsData={emsData}
        emsLoading={emsLoading}
      />

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
