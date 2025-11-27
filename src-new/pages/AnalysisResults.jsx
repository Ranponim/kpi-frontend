/**
 * 분석 결과 페이지
 */

import { useState } from 'react';
import { Header } from '../components/layout';
import { Button, Input, Card, Badge, Modal, EmptyState, Spinner } from '../components/common';
import { useAnalysisResults, useAnalysisResultDetail } from '../hooks/useAnalysisResults';
import { formatDate, formatPercent, formatChange, getStatusStyle, getTrendStyle, cn } from '../lib/utils';

function FilterChip({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value) || options[0];
  return (
    <div className="relative">
      <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-slate-800/50 text-white hover:bg-slate-800 border border-slate-200/10" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-sm font-medium">{label}: {selectedOption.label}</span>
        <span className="material-symbols-outlined text-lg">arrow_drop_down</span>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-[#192633] border border-slate-200/10 rounded-lg shadow-xl py-1 min-w-32">
            {options.map((option) => (
              <button key={option.value} className={cn('w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50', option.value === value ? 'text-[#2b8cee]' : 'text-white')} onClick={() => { onChange(option.value); setIsOpen(false); }}>
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterBar({ filters, onFilterChange, onClear, isFiltered }) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex-1"><Input icon="search" placeholder="Search by NE ID, Cell ID, or SW Name..." value={filters.ne_id || ''} onChange={(e) => onFilterChange({ ne_id: e.target.value })} /></div>
        {isFiltered && <Button variant="ghost" onClick={onClear} icon="filter_alt_off">필터 초기화</Button>}
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterChip label="Status" value={filters.choi_status} options={[{ value: '', label: 'All' }, { value: 'normal', label: 'Normal' }, { value: 'warning', label: 'Warning' }, { value: 'critical', label: 'Critical' }]} onChange={(value) => onFilterChange({ choi_status: value })} />
      </div>
    </div>
  );
}

function ResultsTable({ results, onRowClick, loading }) {
  if (loading) return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  if (results.length === 0) return <EmptyState icon="search_off" title="No Results Found" description="검색 조건에 맞는 분석 결과가 없습니다." />;
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/10 bg-[#111a22]">
      <table className="w-full">
        <thead className="border-b border-slate-200/10">
          <tr className="bg-slate-800/20">
            <th className="px-4 py-3 text-left text-slate-300 text-xs font-medium uppercase tracking-wider w-28">Status</th>
            <th className="px-4 py-3 text-left text-slate-300 text-xs font-medium uppercase tracking-wider">NE ID / Cell ID</th>
            <th className="px-4 py-3 text-left text-slate-300 text-xs font-medium uppercase tracking-wider">SW Name</th>
            <th className="px-4 py-3 text-left text-slate-300 text-xs font-medium uppercase tracking-wider w-32">Confidence</th>
            <th className="px-4 py-3 text-left text-slate-300 text-xs font-medium uppercase tracking-wider w-44">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/10">
          {results.map((result) => {
            const status = result.choi_result?.status || 'normal';
            const statusStyle = getStatusStyle(status);
            return (
              <tr key={result.id} className="hover:bg-slate-800/30 cursor-pointer transition-colors" onClick={() => onRowClick(result)}>
                <td className="px-4 py-4"><Badge variant={status} dot>{statusStyle.label}</Badge></td>
                <td className="px-4 py-4"><div className="flex flex-col"><span className="text-white text-sm font-medium">{result.ne_id}</span><span className="text-slate-400 text-xs">{result.cell_id}</span></div></td>
                <td className="px-4 py-4 text-slate-300 text-sm">{result.swname || '-'}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-[#2b8cee] rounded-full" style={{ width: `${(result.llm_analysis?.confidence || 0) * 100}%` }} /></div>
                    <span className="text-slate-300 text-xs">{formatPercent((result.llm_analysis?.confidence || 0) * 100, 0)}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-300 text-sm">{formatDate(result.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  const { page, size, total, hasNext } = pagination;
  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-400">Showing <span className="font-medium text-white">{start}</span> to <span className="font-medium text-white">{end}</span> of <span className="font-medium text-white">{total}</span> results</p>
      <div className="flex items-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/10 bg-slate-800/50 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => onPageChange(page - 1)} disabled={page === 1}><span className="material-symbols-outlined text-xl">chevron_left</span></button>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/10 bg-slate-800/50 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => onPageChange(page + 1)} disabled={!hasNext}><span className="material-symbols-outlined text-xl">chevron_right</span></button>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (<div className="rounded-lg bg-slate-800/30 p-4"><p className="text-slate-400 text-xs mb-1">{label}</p><div className="text-white text-lg font-medium">{value}</div></div>);
}

function ResultDetailModal({ isOpen, onClose, resultId }) {
  const { data, loading, error } = useAnalysisResultDetail(isOpen ? resultId : null);
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Analysis Details" size="lg">
      {loading ? <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div> : error ? <div className="text-red-400 text-center py-8">{error}</div> : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <InfoCard label="Status" value={<Badge variant={data.choi_result?.status || 'normal'} dot>{getStatusStyle(data.choi_result?.status || 'normal').label}</Badge>} />
            <InfoCard label="NE ID" value={data.ne_id} />
            <InfoCard label="Cell ID" value={data.cell_id} />
          </div>
          {data.llm_analysis && (
            <Card title="LLM Analysis">
              <div className="space-y-4">
                <div><h4 className="text-slate-400 text-sm mb-2">Summary</h4><p className="text-white text-sm">{data.llm_analysis.summary}</p></div>
                {data.llm_analysis.issues?.length > 0 && (<div><h4 className="text-slate-400 text-sm mb-2">Issues</h4><ul className="space-y-1">{data.llm_analysis.issues.map((issue, i) => (<li key={i} className="text-red-400 text-sm flex items-start gap-2"><span className="material-symbols-outlined text-lg">warning</span>{issue}</li>))}</ul></div>)}
                {data.llm_analysis.recommendations?.length > 0 && (<div><h4 className="text-slate-400 text-sm mb-2">Recommendations</h4><ul className="space-y-1">{data.llm_analysis.recommendations.map((rec, i) => (<li key={i} className="text-green-400 text-sm flex items-start gap-2"><span className="material-symbols-outlined text-lg">lightbulb</span>{rec}</li>))}</ul></div>)}
              </div>
            </Card>
          )}
          {data.peg_comparisons?.length > 0 && (
            <Card title="PEG Comparisons">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200/10"><th className="text-left py-2 text-slate-400">PEG Name</th><th className="text-right py-2 text-slate-400">N-1 Avg</th><th className="text-right py-2 text-slate-400">N Avg</th><th className="text-right py-2 text-slate-400">Change</th></tr></thead>
                  <tbody>
                    {data.peg_comparisons.slice(0, 10).map((peg, i) => {
                      const trendStyle = getTrendStyle(peg.change_percentage);
                      return (<tr key={i} className="border-b border-slate-200/10"><td className="py-2 text-white">{peg.peg_name}</td><td className="py-2 text-right text-slate-300">{peg.n_minus_1?.avg?.toFixed(2) || '-'}</td><td className="py-2 text-right text-slate-300">{peg.n?.avg?.toFixed(2) || '-'}</td><td className={cn('py-2 text-right', trendStyle.color)}><span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-sm">{trendStyle.icon}</span>{formatChange(peg.change_percentage)}</span></td></tr>);
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

export default function AnalysisResults() {
  const [selectedResult, setSelectedResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { results, loading, error, pagination, filters, isEmpty, isFiltered, updateFilters, clearFilters, goToPage, refresh } = useAnalysisResults();

  const handleRowClick = (result) => { setSelectedResult(result); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedResult(null); };

  return (
    <div>
      <Header title="KPI Analysis Results" description="Real-time monitoring and analysis of 3GPP Key Performance Indicators." actions={<><Button variant="secondary" icon="refresh" onClick={refresh}>새로고침</Button><Button icon="add">New Analysis</Button></>} />
      <FilterBar filters={filters} onFilterChange={updateFilters} onClear={clearFilters} isFiltered={isFiltered} />
      {error && <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{error}</div>}
      <ResultsTable results={results} onRowClick={handleRowClick} loading={loading} />
      {!isEmpty && <Pagination pagination={pagination} onPageChange={goToPage} />}
      <ResultDetailModal isOpen={isModalOpen} onClose={handleCloseModal} resultId={selectedResult?.id} />
    </div>
  );
}










