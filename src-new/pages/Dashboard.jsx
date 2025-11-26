/**
 * 대시보드 페이지
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Header } from '../components/layout';
import { Button, Card, EmptyState, DateTimePicker, Combobox } from '../components/common';

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

function AnalysisForm({ onSubmit, loading }) {
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
              <DateTimePicker label="시작 시간 (Start Time)" value={formData.n1StartTime} onChange={handleChange('n1StartTime')} />
              <DateTimePicker label="종료 시간 (End Time)" value={formData.n1EndTime} onChange={handleChange('n1EndTime')} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200/10 bg-slate-500/5 p-4">
            <p className="text-slate-300 text-sm font-semibold mb-4">N 기간 (Current Period)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker label="시작 시간 (Start Time)" value={formData.nStartTime} onChange={handleChange('nStartTime')} />
              <DateTimePicker label="종료 시간 (End Time)" value={formData.nEndTime} onChange={handleChange('nEndTime')} />
            </div>
            <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              종료 시간은 현재 시간 기준 5분 단위로 자동 설정됩니다. 필요시 변경 가능합니다.
            </p>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Combobox label="NE ID" icon="router" value={formData.neId} onChange={handleChange('neId')} options={NE_ID_OPTIONS} placeholder="NE ID 선택 또는 입력" />
            <Combobox label="CELL ID" icon="cell_tower" value={formData.cellId} onChange={handleChange('cellId')} options={CELL_ID_OPTIONS} placeholder="Cell ID 선택 또는 입력" />
          </div>
        </div>
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200/10">
          <Button type="submit" icon="auto_awesome" loading={loading} disabled={!formData.neId || !formData.cellId}>
            LLM 분석 (LLM Analysis)
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalysisSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Dashboard] 분석 시작:', formData);
      navigate('/results');
    } catch (err) {
      setError(err.message || '분석 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <Header title="KPI Analysis Dashboard" description="Set the conditions below to begin your analysis." />
      <AnalysisForm onSubmit={handleAnalysisSubmit} loading={loading} />
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="flex items-center gap-2"><span className="material-symbols-outlined">error</span>{error}</p>
        </div>
      )}
      <div className="mt-8">
        <div className="flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200/20 bg-[#111a22]/50">
          <EmptyState icon="query_stats" title="Analysis Results Will Appear Here" description="분석할 시간 범위와 네트워크 요소를 선택한 후 'LLM 분석' 버튼을 클릭하세요." />
        </div>
      </div>
    </div>
  );
}

