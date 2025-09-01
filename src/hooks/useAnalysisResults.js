/**
 * LLM 분석 결과 데이터를 관리하는 커스텀 훅
 * 
 * 이 훅은 분석 결과 조회, 필터링, 페이지네이션 기능을 제공합니다.
 * Task 40: Frontend LLM 분석 결과 목록 UI 컴포넌트 개발
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import apiClient from '@/lib/apiClient.js'
import { toast } from 'sonner'

// Axios CancelToken import
import axios from 'axios'

/**
 * 분석 결과 데이터를 관리하는 커스텀 훅
 * 
 * @param {Object} options - 옵션 객체
 * @param {number} options.initialLimit - 초기 페이지당 항목 수 (기본값: 20)
 * @param {boolean} options.autoFetch - 자동 데이터 조회 여부 (기본값: true)
 * @param {Object} options.initialFilters - 초기 필터 값
 * @returns {Object} 분석 결과 상태 및 관리 함수들
 */
export const useAnalysisResults = ({
  initialLimit = 20,
  autoFetch = true,
  initialFilters = {}
} = {}) => {
  
  // === 상태 관리 ===
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  
  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    limit: initialLimit,
    skip: 0,
    total: 0
  })
  
  // 필터 상태
  const [filters, setFilters] = useState({
    // 운영 환경에서는 기본값으로 'ALL' 지정하여 누락 방지
    neId: process.env.NODE_ENV === 'production' ? 'ALL' : '',
    cellId: process.env.NODE_ENV === 'production' ? 'ALL' : '',
    startDate: null,
    endDate: null,
    status: '',
    ...initialFilters
  })
  
  // === 로깅 함수 ===
  const logInfo = useCallback((message, data = {}) => {
    console.log(`[useAnalysisResults] ${message}`, data)
  }, [])

  const logError = useCallback((message, error) => {
    console.error(`[useAnalysisResults] ${message}`, error)
  }, [])

  // === 디바운스 타이머 ref ===
  const debounceTimerRef = useRef(null)

  // === API 요청 취소 컨트롤러 ===
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true) // 컴포넌트 마운트 상태 추적
  const isRequestingRef = useRef(false) // 현재 요청 중인지 추적

  // === API 호출 함수 ===
  const fetchResults = useCallback(async ({
    limit = pagination.limit,
    skip = 0,
    append = false,
    showToast = true
  } = {}) => {
    try {
      // 컴포넌트가 언마운트된 경우 요청하지 않음
      if (!isMountedRef.current) {
        logInfo('컴포넌트가 언마운트되어 API 요청을 건너뜁니다')
        return []
      }

      // 이미 요청 중인 경우 중복 요청 방지
      if (isRequestingRef.current) {
        logInfo('이미 요청 중이므로 새 요청을 건너뜁니다')
        return []
      }

      isRequestingRef.current = true
      logInfo('요청 상태: 시작')

      // 이전 요청 취소 (디버깅용 로그 추가)
      if (abortControllerRef.current) {
        logInfo('이전 요청 취소 시도')
        abortControllerRef.current.abort()
      }

      // 새로운 AbortController 생성
      abortControllerRef.current = new AbortController()
      logInfo('새로운 AbortController 생성')

      setLoading(true)
      setError(null)

      logInfo('분석 결과 조회 시작', { limit, skip, filters })

      // API 요청 파라미터 구성 (백엔드의 snake_case 쿼리 파라미터에 맞춤)
      const params = {
        limit,
        skip
      }
      
      // 필터 조건 추가
      if (filters.neId?.trim()) {
        params.ne_id = filters.neId.trim()
      }
      if (filters.cellId?.trim()) {
        params.cell_id = filters.cellId.trim()
      }
      if (filters.startDate) {
        params.date_from = filters.startDate
      }
      if (filters.endDate) {
        params.date_to = filters.endDate
      }
      if (filters.status?.trim()) {
        params.status = filters.status.trim()
      }
      
      // API 호출 (취소 신호 포함)
      const response = await apiClient.get('/api/analysis/results', {
        params,
        signal: abortControllerRef.current.signal
      })
      
      logInfo('분석 결과 조회 성공', {
        resultCount: response.data?.items?.length || 0,
        total: response.data?.total || 0,
        totalRequested: limit
      })
      
      // LLM 전용(analysis_type === 'llm_analysis')만 클라이언트 측에서 필터링
      const rawItems = response.data?.items || []
      const newResults = rawItems.filter(item => {
        const t = item?.analysis_type || item?.analysisType
        return t === 'llm_analysis'
      })
      
      // 결과 업데이트
      if (append) {
        setResults(prevResults => [...prevResults, ...newResults])
      } else {
        setResults(newResults)
      }
      
      // 페이지네이션 상태 업데이트
      setPagination(prev => ({
        ...prev,
        skip: append ? prev.skip + newResults.length : skip + newResults.length,
        total: response.data?.total || 0  // ✅ Backend에서 받은 total 사용
      }))
      
      // 더 가져올 데이터가 있는지 확인
      setHasMore(response.data?.has_next || false)  // ✅ Backend의 has_next 활용
      
      // 성공 메시지 (옵션)
      if (showToast && !append) {
        toast.success(`${newResults.length}개의 분석 결과를 불러왔습니다.`)
      }
      
      return newResults
      
    } catch (err) {
      // 디버깅을 위한 상세 로그
      logInfo('API 오류 상세 정보', {
        name: err.name,
        code: err.code,
        message: err.message,
        stack: err.stack,
        isCancel: axios.isCancel ? axios.isCancel(err) : 'axios.isCancel not available'
      })

      // 요청 취소된 경우는 무시 (정상적인 취소)
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED' ||
          err.message?.toLowerCase().includes('canceled') ||
          err.message?.toLowerCase().includes('cancel') ||
          (axios.isCancel && axios.isCancel(err))) {
        logInfo('API 요청이 취소되었습니다', { reason: err.message })
        isRequestingRef.current = false // 취소 시에도 상태 리셋
        return []
      }

      const errorMessage = err?.response?.data?.error?.message ||
                          err?.message ||
                          '분석 결과를 불러오는 중 오류가 발생했습니다.'

      logError('분석 결과 조회 실패', err)
      setError(errorMessage)

      if (showToast) {
        toast.error(`데이터 조회 실패: ${errorMessage}`)
      }

      return []

    } finally {
      setLoading(false)
      isRequestingRef.current = false
      logInfo('요청 상태: 완료')
    }
  }, [pagination.limit, JSON.stringify(filters), logInfo, logError])

  // === 필터 관리 함수 (디바운스 적용) ===
  const updateFilters = useCallback((newFilters, debounceMs = 1000) => {
    logInfo('필터 업데이트', { 이전: filters, 새로운: newFilters })

    // 컴포넌트가 언마운트된 경우 무시
    if (!isMountedRef.current) {
      logInfo('컴포넌트 언마운트 상태에서 필터 업데이트 무시')
      return
    }

    // 기존 타이머 클리어
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 디바운스 적용 (시간 증가)
    debounceTimerRef.current = setTimeout(() => {
      // 타이머 실행 시점에도 마운트 상태 확인
      if (!isMountedRef.current) {
        logInfo('디바운스 실행 시점에 컴포넌트가 언마운트됨')
        return
      }

      setFilters(prev => ({
        ...prev,
        ...newFilters
      }))

      // 필터 변경 시 페이지네이션 리셋
      setPagination(prev => ({
        ...prev,
        skip: 0
      }))

      logInfo('필터 업데이트 완료', { 적용된필터: { ...filters, ...newFilters } })
    }, debounceMs)

  }, [filters, logInfo])

  const clearFilters = useCallback(() => {
    logInfo('필터 초기화')
    
    setFilters({
      neId: '',
      cellId: '',
      startDate: null,
      endDate: null,
      status: ''
    })
    
    setPagination(prev => ({
      ...prev,
      skip: 0
    }))
  }, [logInfo])

  // === 페이지네이션 함수 ===
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      logInfo('추가 로딩 건너뜀', { loading, hasMore })
      return
    }
    
    logInfo('추가 결과 로딩 시작')
    await fetchResults({ 
      skip: pagination.skip, 
      append: true,
      showToast: false 
    })
  }, [loading, hasMore, fetchResults, pagination.skip, logInfo])

  const refresh = useCallback(async () => {
    logInfo('데이터 새로고침 시작')
    
    setPagination(prev => ({
      ...prev,
      skip: 0
    }))
    
    await fetchResults({ skip: 0, append: false })
  }, [fetchResults, logInfo])

  // === 특정 결과 삭제 ===
  const deleteResult = useCallback(async (resultId) => {
    try {
      logInfo('분석 결과 삭제 시작', { resultId })
      
      await apiClient.delete(`/api/analysis/results/${resultId}`)
      
      // 로컬 상태에서 제거
      setResults(prev => prev.filter(result => result.id !== resultId))
      
      logInfo('분석 결과 삭제 성공', { resultId })
      toast.success('분석 결과가 삭제되었습니다.')
      
    } catch (err) {
      const errorMessage = err?.response?.data?.error?.message || 
                          err?.message || 
                          '분석 결과 삭제 중 오류가 발생했습니다.'
      
      logError('분석 결과 삭제 실패', err)
      toast.error(`삭제 실패: ${errorMessage}`)
    }
  }, [logInfo, logError])

  // === 자동 데이터 조회 (마운트 시) ===
  useEffect(() => {
    if (autoFetch && isMountedRef.current) {
      logInfo('컴포넌트 마운트 - 자동 데이터 조회 시작')
      fetchResults({ skip: 0, append: false, showToast: false })
    }
  }, [autoFetch, logInfo, fetchResults]) // fetchResults 의존성 추가

  // === 필터 변경 시 자동 재조회 (디바운스 적용) ===
  useEffect(() => {
    if (autoFetch && isMountedRef.current) {
      logInfo('필터 변경 감지 - 데이터 재조회', { filters: JSON.stringify(filters) })
      fetchResults({ skip: 0, append: false, showToast: false })
    }
  }, [autoFetch, JSON.stringify(filters), logInfo, fetchResults]) // fetchResults 의존성 추가

  // === 계산된 값들 ===
  const isEmpty = useMemo(() => !loading && results.length === 0, [loading, results.length])
  
  const isFiltered = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== null && value !== undefined && value !== ''
    )
  }, [filters])

  const resultCount = useMemo(() => results.length, [results.length])

  // === 디버깅 정보 ===
  const debugInfo = useMemo(() => ({
    resultCount,
    loading,
    hasMore,
    isEmpty,
    isFiltered,
    pagination,
    filters,
    error
  }), [resultCount, loading, hasMore, isEmpty, isFiltered, pagination, filters, error])

  // 개발 환경에서 디버깅 정보 출력
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useAnalysisResults] Debug Info:', debugInfo)
    }
  }, [debugInfo])

  // === 클린업 ===
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 상태 업데이트
      isMountedRef.current = false
      isRequestingRef.current = false

      // 타이머 및 요청 클리어
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // === 반환 값 ===
  return {
    // 데이터
    results,
    loading,
    error,
    
    // 상태
    isEmpty,
    hasMore,
    isFiltered,
    resultCount,
    
    // 페이지네이션
    pagination,
    
    // 필터
    filters,
    updateFilters,
    clearFilters,
    
    // 액션
    fetchResults,
    refresh,
    loadMore,
    deleteResult,
    
    // 디버깅
    debugInfo
  }
}

export default useAnalysisResults

