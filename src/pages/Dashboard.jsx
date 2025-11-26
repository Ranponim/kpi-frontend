/**
 * 대시보드 페이지
 * 비동기 LLM 분석 API 연동
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '../components/layout/index.js';
import { Button, Card, EmptyState, DateTimePicker, Combobox, Spinner, Badge } from '../components/common/index.js';
import { startAsyncAnalysis, getAsyncAnalysisStatus, getAsyncAnalysisResult } from '../lib/api.js';

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
  return format(roundDownToFiveMinutes(new Date()), 'yyyy-MM-dd HH:mm');
}

const NE_ID_OPTIONS = [
  { value: 'SKT_NE_4521_01', label: 'SKT_NE_4521_01' },
  { value: 'SKT_NE_4521_02', label: 'SKT_NE_4521_02' },
  { value: 'SKT_NE_8873_05', label: 'SKT_NE_8873_05' },
  { value: 'nvgnb#10000', label: 'nvgnb#10000' },
  { value: 'nvgnb#10001', label: 'nvgnb#10001' },
];

const CELL_ID_OPTIONS = [
  { value: 'C00124', label: 'C00124' },
  { value: 'C00125', label: 'C00125' },
  { value: 'C00126', label: 'C00126' },
  { value: '2010', label: '2010' },
  { value: '2011', label: '2011' },
];

function AnalysisForm({ onSubmit, loading, disabled }) {
  const [formData, setFormData] = useState({
    n1StartTime: '2023-10-26 10:00',
    n1EndTime: '2023-10-26 14:25',
    nStartTime: '2023-10-27 10:00',
    nEndTime: getCurrentTimeRounded(),
    neId: '',
    cellId: '',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFormData((prev) => ({ ...prev, nEndTime: getCurrentTimeRounded() }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <h2 className="text-white text-xl font-bold mb-6">분석 조건 설정 (Set Analysis Conditions)</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-200/10 bg-slate-500/5 p-4">
            <p className="text-slate-300 text-sm font-semibold mb-4">N-1 기간 (Comparison Period)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker label="시작 시간 (Start Time)" value={formData.n1StartTime} onChange={handleChange('n1StartTime')} disabled={disabled} />
              <DateTimePicker label="종료 시간 (End Time)" value={formData.n1EndTime} onChange={handleChange('n1EndTime')} disabled={disabled} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/10 bg-slate-500/5 p-4">
            <p className="text-slate-300 text-sm font-semibold mb-4">N 기간 (Current Period)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker label="시작 시간 (Start Time)" value={formData.nStartTime} onChange={handleChange('nStartTime')} disabled={disabled} />
              <DateTimePicker label="종료 시간 (End Time)" value={formData.nEndTime} onChange={handleChange('nEndTime')} disabled={disabled} />
            </div>
            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              종료 시간은 현재 시간 기준 5분 단위로 자동 설정됩니다. 필요시 변경 가능합니다.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Combobox label="NE ID" icon="router" value={formData.neId} onChange={handleChange('neId')} options={NE_ID_OPTIONS} placeholder="NE ID 선택 또는 입력" disabled={disabled} />
            <Combobox label="CELL ID" icon="cell_tower" value={formData.cellId} onChange={handleChange('cellId')} options={CELL_ID_OPTIONS} placeholder="Cell ID 선택 또는 입력" disabled={disabled} />
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200/10">
          <Button type="submit" icon="auto_awesome" loading={loading} disabled={disabled || !formData.neId || !formData.cellId}>
            LLM 분석 (LLM Analysis)
          </Button>
        </div>
      </form>
    </Card>
  );
}

// 분석 진행 상태 표시 컴포넌트
function AnalysisProgress({ status, onCancel, onViewResult }) {
  const getStatusInfo = () => {
    switch (status.status) {
      case 'pending':
        return { icon: 'hourglass_empty', label: '대기 중', color: 'text-yellow-400', description: '분석 요청이 대기열에 추가되었습니다.' };
      case 'processing':
        return { icon: 'sync', label: '분석 중', color: 'text-blue-400', description: 'LLM이 KPI 데이터를 분석하고 있습니다...' };
      case 'completed':
        return { icon: 'check_circle', label: '완료', color: 'text-green-400', description: '분석이 완료되었습니다!' };
      case 'failed':
        return { icon: 'error', label: '실패', color: 'text-red-400', description: status.error || '분석 중 오류가 발생했습니다.' };
      default:
        return { icon: 'help', label: '알 수 없음', color: 'text-slate-400', description: '상태를 확인할 수 없습니다.' };
    }
  };

  const info = getStatusInfo();
  const isProcessing = status.status === 'pending' || status.status === 'processing';
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <div className="rounded-xl border border-slate-200/10 bg-[#111a22] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-lg font-semibold">분석 진행 상태</h3>
        <Badge variant={isCompleted ? 'normal' : isFailed ? 'critical' : 'warning'} dot>
          {info.label}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 ${info.color}`}>
          <span className={`material-symbols-outlined text-3xl ${isProcessing ? 'animate-spin' : ''}`}>
            {info.icon}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-white font-medium">{info.description}</p>
          {status.analysis_id && (
            <p className="text-slate-400 text-sm mt-1">
              분석 ID: <code className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{status.analysis_id}</code>
            </p>
          )}
          {status.progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">진행률</span>
                <span className="text-white">{status.progress}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2b8cee] rounded-full transition-all duration-500" 
                  style={{ width: `${status.progress}%` }} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-slate-200/10">
        {isProcessing && (
          <Button variant="ghost" onClick={onCancel} icon="close">
            취소
          </Button>
        )}
        {isCompleted && (
          <Button onClick={onViewResult} icon="visibility">
            결과 보기
          </Button>
        )}
        {isFailed && (
          <Button variant="secondary" onClick={onCancel} icon="refresh">
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const pollingRef = useRef(null);

  // 분석 상태 폴링
  const startPolling = (analysisId) => {
    // 기존 폴링 정리
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const poll = async () => {
      try {
        const status = await getAsyncAnalysisStatus(analysisId);
        console.log('[Dashboard] 분석 상태:', status);
        setAnalysisStatus({ ...status, analysis_id: analysisId });

        if (status.status === 'completed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          // 결과 가져오기
          const result = await getAsyncAnalysisResult(analysisId);
          setAnalysisResult(result);
        } else if (status.status === 'failed') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        console.error('[Dashboard] 상태 조회 실패:', err);
        setError('분석 상태 조회에 실패했습니다.');
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    // 즉시 한 번 실행 후 2초마다 폴링
    poll();
    pollingRef.current = setInterval(poll, 2000);
  };

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleAnalysisSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setAnalysisStatus(null);
    setAnalysisResult(null);

    try {
      // API 요청 파라미터 변환
      const requestParams = {
        ne_id: formData.neId,
        cell_id: formData.cellId,
        n_minus_1_start: formData.n1StartTime.replace(' ', 'T') + ':00',
        n_minus_1_end: formData.n1EndTime.replace(' ', 'T') + ':00',
        n_start: formData.nStartTime.replace(' ', 'T') + ':00',
        n_end: formData.nEndTime.replace(' ', 'T') + ':00',
      };

      console.log('[Dashboard] 비동기 분석 시작:', requestParams);
      
      // 비동기 분석 API 호출
      const response = await startAsyncAnalysis(requestParams);
      console.log('[Dashboard] 분석 시작 응답:', response);

      // 분석 ID로 상태 폴링 시작
      if (response.analysis_id) {
        setAnalysisStatus({ status: 'pending', analysis_id: response.analysis_id });
        startPolling(response.analysis_id);
      } else {
        throw new Error('분석 ID를 받지 못했습니다.');
      }
    } catch (err) {
      console.error('[Dashboard] 분석 요청 실패:', err);
      setError(err.response?.data?.detail || err.message || '분석 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setAnalysisStatus(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleViewResult = () => {
    // 결과 페이지로 이동 (분석 ID를 쿼리 파라미터로 전달)
    if (analysisStatus?.analysis_id) {
      navigate(`/results?highlight=${analysisStatus.analysis_id}`);
    } else {
      navigate('/results');
    }
  };

  const isAnalyzing = analysisStatus && (analysisStatus.status === 'pending' || analysisStatus.status === 'processing');

  return (
    <div className="max-w-6xl">
      <Header title="KPI Analysis Dashboard" description="Set the conditions below to begin your analysis." />
      
      <AnalysisForm 
        onSubmit={handleAnalysisSubmit} 
        loading={loading} 
        disabled={isAnalyzing}
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
        {analysisStatus ? (
          <AnalysisProgress 
            status={analysisStatus} 
            onCancel={handleCancel}
            onViewResult={handleViewResult}
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

      {/* 분석 완료 시 결과 미리보기 */}
      {analysisResult && (
        <div className="mt-6">
          <Card title="분석 결과 미리보기">
            {analysisResult.llm_analysis && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-slate-400 text-sm mb-2">요약 (Summary)</h4>
                  <p className="text-white text-sm">{analysisResult.llm_analysis.summary}</p>
                </div>
                {analysisResult.llm_analysis.issues?.length > 0 && (
                  <div>
                    <h4 className="text-slate-400 text-sm mb-2">발견된 이슈 ({analysisResult.llm_analysis.issues.length})</h4>
                    <ul className="space-y-1">
                      {analysisResult.llm_analysis.issues.slice(0, 3).map((issue, i) => (
                        <li key={i} className="text-yellow-400 text-sm flex items-start gap-2">
                          <span className="material-symbols-outlined text-lg">warning</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end pt-4 border-t border-slate-200/10">
                  <Button onClick={handleViewResult} icon="open_in_new">
                    전체 결과 보기
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
