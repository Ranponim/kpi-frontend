/**
 * API 클라이언트 모듈
 * 
 * 백엔드 API와의 통신을 담당하는 axios 기반 클라이언트입니다.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://165.213.69.30:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`[API] Error:`, error.response?.data?.detail || error.message);
    return Promise.reject(error);
  }
);

// 분석 결과 API (V2)
export const getAnalysisResultsV2 = async (params = {}) => {
  const response = await api.get('/analysis/results-v2', { params });
  return response.data;
};

export const getAnalysisResultDetailV2 = async (resultId) => {
  const response = await api.get(`/analysis/results-v2/${resultId}`);
  return response.data;
};

export const getAnalysisStatsV2 = async () => {
  const response = await api.get('/analysis/results-v2/stats/summary');
  return response.data;
};

// 비동기 분석 API
export const startAsyncAnalysis = async (requestParams) => {
  const response = await api.post('/async-analysis/start', requestParams);
  return response.data;
};

export const getAsyncAnalysisStatus = async (analysisId) => {
  const response = await api.get(`/async-analysis/status/${analysisId}`);
  return response.data;
};

export const getAsyncAnalysisResult = async (analysisId) => {
  const response = await api.get(`/async-analysis/result/${analysisId}`);
  return response.data;
};

// PEG 비교분석 API
export const getPEGComparisonResult = async (resultId) => {
  const response = await api.get(`/analysis/results/${resultId}/peg-comparison`);
  return response.data;
};

// 사용자 설정 API
export const getUserPreferences = async (userId = 'default') => {
  try {
    const response = await api.get('/preference/settings', { params: { user_id: userId } });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.response?.status === 404) return { success: true, data: null, isNew: true };
    throw error;
  }
};

export const saveUserPreferences = async (userId = 'default', settings) => {
  const response = await api.put('/preference/settings', settings, { params: { user_id: userId } });
  return { success: true, data: response.data };
};

export default api;

