/**
 * 분석 결과 관리 커스텀 훅
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAnalysisResultsV2, getAnalysisResultDetailV2 } from '../lib/api';

export function useAnalysisResults(initialParams = {}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0, hasNext: false });
  const [filters, setFilters] = useState({ ne_id: '', cell_id: '', swname: '', choi_status: '', ...initialParams });

  const fetchResults = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { page: params.page || pagination.page, size: params.size || pagination.size, ...filters, ...params };
      Object.keys(queryParams).forEach((key) => { if (!queryParams[key]) delete queryParams[key]; });
      const response = await getAnalysisResultsV2(queryParams);
      setResults(response.items || []);
      setPagination({ page: response.page || 1, size: response.size || 20, total: response.total || 0, hasNext: response.has_next || false });
      return response;
    } catch (err) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.size, filters]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ne_id: '', cell_id: '', swname: '', choi_status: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const goToPage = useCallback((page) => setPagination((prev) => ({ ...prev, page })), []);
  const refresh = useCallback(() => fetchResults(), [fetchResults]);

  useEffect(() => { fetchResults(); }, [pagination.page, filters]);

  const isEmpty = useMemo(() => !loading && results.length === 0, [loading, results]);
  const isFiltered = useMemo(() => Object.values(filters).some((v) => v), [filters]);

  return { results, loading, error, pagination, filters, isEmpty, isFiltered, fetchResults, updateFilters, clearFilters, goToPage, refresh };
}

export function useAnalysisResultDetail(resultId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAnalysisResultDetailV2(id);
      setData(response.data);
      return response.data;
    } catch (err) {
      setError(err.message || '상세 정보를 불러오는데 실패했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (resultId) fetchDetail(resultId); }, [resultId, fetchDetail]);

  return { data, loading, error, refetch: () => fetchDetail(resultId) };
}

export default useAnalysisResults;



