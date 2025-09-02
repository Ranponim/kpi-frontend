# 🔌 API 문서

KPI Dashboard Frontend에서 사용하는 API 엔드포인트와 데이터 구조를 설명합니다.

## 📋 목차

- [API 클라이언트 설정](#api-클라이언트-설정)
- [인증 API](#인증-api)
- [대시보드 API](#대시보드-api)
- [분석 API](#분석-api)
- [결과 관리 API](#결과-관리-api)
- [설정 API](#설정-api)
- [에러 처리](#에러-처리)
- [타입 정의](#타입-정의)

## 🔧 API 클라이언트 설정

### 기본 설정

```javascript
// src/lib/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 인증 토큰 추가
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 요청 로깅 (개발 환경)
    if (import.meta.env.DEV) {
      console.log('📤 API 요청:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    // 응답 로깅 (개발 환경)
    if (import.meta.env.DEV) {
      console.log('📥 API 응답:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // 에러 처리
    if (error.response) {
      // 서버 에러 응답
      const { status, data } = error.response;

      if (status === 401) {
        // 인증 만료 처리
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }

      // 에러 로깅
      console.error('🚨 API 에러:', {
        status,
        url: error.config?.url,
        message: data?.message || 'API 요청 실패',
      });

      return Promise.reject({
        status,
        message: data?.message || '서버 오류가 발생했습니다',
        code: data?.code,
      });
    } else if (error.request) {
      // 네트워크 에러
      console.error('🌐 네트워크 에러:', error.message);
      return Promise.reject({
        status: 0,
        message: '네트워크 연결을 확인해주세요',
        code: 'NETWORK_ERROR',
      });
    } else {
      // 기타 에러
      console.error('⚠️ 기타 에러:', error.message);
      return Promise.reject({
        status: -1,
        message: '알 수 없는 오류가 발생했습니다',
        code: 'UNKNOWN_ERROR',
      });
    }
  }
);

export default apiClient;
```

### 환경별 설정

```javascript
// 개발 환경
VITE_API_BASE_URL=http://localhost:8000/api

// 프로덕션 환경
VITE_API_BASE_URL=https://api.kpi-dashboard.com/api

// 테스트 환경
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🔐 인증 API

### 로그인

```javascript
// POST /auth/login
const loginData = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await apiClient.post('/auth/login', loginData);

// 응답
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "사용자",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

### 로그아웃

```javascript
// POST /auth/logout
const response = await apiClient.post('/auth/logout');

// 응답
{
  "success": true,
  "message": "로그아웃되었습니다"
}
```

### 토큰 갱신

```javascript
// POST /auth/refresh
const response = await apiClient.post('/auth/refresh');

// 응답
{
  "success": true,
  "data": {
    "token": "new_token_here",
    "expiresIn": 3600
  }
}
```

## 📊 대시보드 API

### 대시보드 데이터 조회

```javascript
// GET /dashboard/overview
const response = await apiClient.get('/dashboard/overview', {
  params: {
    dateRange: '7d',  // 1d, 7d, 30d, 90d
    refresh: false
  }
});

// 응답
{
  "success": true,
  "data": {
    "summary": {
      "totalKpis": 25,
      "activeAlerts": 3,
      "lastUpdated": "2024-01-15T10:30:00Z"
    },
    "kpiGroups": [
      {
        "name": "네트워크 성능",
        "kpis": [
          {
            "id": "latency",
            "name": "평균 지연시간",
            "value": 45.2,
            "unit": "ms",
            "trend": "up",  // up, down, stable
            "changePercent": 2.5,
            "threshold": {
              "warning": 50,
              "critical": 100
            }
          }
        ]
      }
    ]
  }
}
```

### 실시간 데이터 스트림

```javascript
// WebSocket 연결
const ws = new WebSocket('ws://localhost:8000/ws/dashboard');

// 메시지 수신
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📊 실시간 데이터:', data);
};

// 구독 요청
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['kpi-updates', 'alerts']
  }));
};
```

## 🔍 분석 API

### 분석 요청 생성

```javascript
// POST /analysis
const analysisRequest = {
  type: 'statistical',  // statistical, llm, comparative
  target: {
    neId: 'NE001',
    cellId: 'CELL001',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-15'
    }
  },
  parameters: {
    algorithms: ['mann-whitney', 'ks-test'],
    confidence: 0.95,
    filters: {
      kpiType: 'latency',
      threshold: 50
    }
  }
};

const response = await apiClient.post('/analysis', analysisRequest);

// 응답
{
  "success": true,
  "data": {
    "id": "analysis_12345",
    "status": "processing",
    "estimatedTime": 30,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 분석 결과 조회

```javascript
// GET /analysis/{id}
const response = await apiClient.get('/analysis/analysis_12345');

// 응답
{
  "success": true,
  "data": {
    "id": "analysis_12345",
    "status": "completed",
    "results": {
      "mannWhitney": {
        "statistic": 2.34,
        "pValue": 0.021,
        "significant": true,
        "effectSize": 0.45
      },
      "ksTest": {
        "statistic": 0.123,
        "pValue": 0.045,
        "significant": true
      },
      "summary": {
        "totalKpis": 25,
        "abnormalKpis": 3,
        "confidence": "high"
      }
    },
    "charts": [
      {
        "type": "line",
        "data": [...],
        "config": {...}
      }
    ],
    "recommendations": [
      {
        "priority": "high",
        "action": "네트워크 최적화 필요",
        "details": "지연시간 임계치 초과 감지"
      }
    ],
    "completedAt": "2024-01-15T10:30:30Z"
  }
}
```

### 분석 목록 조회

```javascript
// GET /analysis
const response = await apiClient.get('/analysis', {
  params: {
    page: 1,
    limit: 20,
    status: 'completed',  // pending, processing, completed, failed
    dateFrom: '2024-01-01',
    dateTo: '2024-01-15'
  }
});

// 응답
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

## 📋 결과 관리 API

### 결과 상세 조회

```javascript
// GET /results/{id}
const response = await apiClient.get('/results/result_123');

// 응답
{
  "success": true,
  "data": {
    "id": "result_123",
    "analysisId": "analysis_12345",
    "type": "statistical",
    "target": {
      "neId": "NE001",
      "cellId": "CELL001"
    },
    "status": "completed",
    "results": {
      "kpiData": [...],
      "statistics": {...},
      "charts": [...]
    },
    "metadata": {
      "createdAt": "2024-01-15T10:30:00Z",
      "createdBy": "user123",
      "processingTime": 25
    }
  }
}
```

### 결과 비교

```javascript
// POST /results/compare
const compareRequest = {
  resultIds: ['result_123', 'result_124', 'result_125'],
  compareType: 'kpi_performance',  // kpi_performance, trend_analysis, statistical_comparison
  parameters: {
    metrics: ['latency', 'throughput', 'packet_loss'],
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-15'
    }
  }
};

const response = await apiClient.post('/results/compare', compareRequest);

// 응답
{
  "success": true,
  "data": {
    "comparisonId": "comparison_678",
    "results": [
      {
        "resultId": "result_123",
        "metrics": {
          "latency": { "value": 45.2, "rank": 2, "change": -2.1 },
          "throughput": { "value": 95.8, "rank": 1, "change": 5.3 }
        }
      }
    ],
    "summary": {
      "bestPerformer": "result_124",
      "worstPerformer": "result_125",
      "overallTrend": "improving"
    }
  }
}
```

## ⚙️ 설정 API

### 사용자 설정 조회

```javascript
// GET /settings/user
const response = await apiClient.get('/settings/user');

// 응답
{
  "success": true,
  "data": {
    "theme": "light",  // light, dark, auto
    "language": "ko",
    "notifications": {
      "email": true,
      "browser": false,
      "alerts": {
        "critical": true,
        "warning": true,
        "info": false
      }
    },
    "dashboard": {
      "refreshInterval": 300,  // seconds
      "defaultDateRange": "7d",
      "chartPreferences": {
        "animation": true,
        "grid": true,
        "legend": true
      }
    },
    "analysis": {
      "defaultConfidence": 0.95,
      "autoSave": true,
      "exportFormat": "json"  // json, csv, pdf
    }
  }
}
```

### 사용자 설정 업데이트

```javascript
// PUT /settings/user
const settingsUpdate = {
  theme: 'dark',
  notifications: {
    email: false,
    browser: true
  }
};

const response = await apiClient.put('/settings/user', settingsUpdate);

// 응답
{
  "success": true,
  "message": "설정이 업데이트되었습니다"
}
```

### 시스템 설정 조회

```javascript
// GET /settings/system
const response = await apiClient.get('/settings/system');

// 응답
{
  "success": true,
  "data": {
    "version": "1.0.0",
    "maintenance": {
      "enabled": false,
      "message": null
    },
    "features": {
      "llmAnalysis": true,
      "realTimeUpdates": true,
      "export": true
    },
    "limits": {
      "maxAnalysisPerHour": 100,
      "maxConcurrentUsers": 50,
      "maxFileSize": "10MB"
    }
  }
}
```

## 🚨 에러 처리

### 표준 에러 응답 형식

```javascript
// 모든 API 엔드포인트의 에러 응답
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다",
    "details": {
      "field": "email",
      "reason": "올바른 이메일 형식이 아닙니다"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_12345"
  }
}
```

### 에러 코드 표

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `VALIDATION_ERROR` | 입력 데이터 검증 실패 | 400 |
| `AUTHENTICATION_ERROR` | 인증 실패 | 401 |
| `AUTHORIZATION_ERROR` | 권한 부족 | 403 |
| `NOT_FOUND` | 리소스를 찾을 수 없음 | 404 |
| `CONFLICT` | 리소스 충돌 | 409 |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 | 429 |
| `INTERNAL_ERROR` | 서버 내부 오류 | 500 |
| `SERVICE_UNAVAILABLE` | 서비스 이용 불가 | 503 |

### 클라이언트 측 에러 처리

```javascript
// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (options.showSuccessToast) {
        toast.success(options.successMessage || '요청이 성공적으로 처리되었습니다');
      }

      return response.data;
    } catch (err) {
      const errorData = {
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message || '알 수 없는 오류가 발생했습니다',
        status: err.status || 500
      };

      setError(errorData);

      // 사용자 친화적인 에러 메시지 표시
      const userMessage = getUserFriendlyMessage(errorData);
      toast.error(userMessage);

      throw errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}

// 사용자 친화적인 에러 메시지 변환
function getUserFriendlyMessage(error) {
  const messages = {
    'VALIDATION_ERROR': '입력한 정보가 올바르지 않습니다. 다시 확인해주세요.',
    'AUTHENTICATION_ERROR': '로그인이 필요합니다.',
    'NOT_FOUND': '요청한 정보를 찾을 수 없습니다.',
    'RATE_LIMIT_EXCEEDED': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'INTERNAL_ERROR': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
  };

  return messages[error.code] || error.message;
}

export default useApi;
```

## 📝 타입 정의

### TypeScript 인터페이스 (향후 적용)

```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 분석 관련 타입
export interface AnalysisRequest {
  type: 'statistical' | 'llm' | 'comparative';
  target: {
    neId: string;
    cellId: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  parameters: {
    algorithms?: string[];
    confidence?: number;
    filters?: Record<string, any>;
  };
}

export interface AnalysisResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any;
  charts?: ChartConfig[];
  recommendations?: Recommendation[];
  completedAt?: string;
}

// 차트 설정 타입
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  config: Record<string, any>;
}

// 추천사항 타입
export interface Recommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  details?: string;
  category?: string;
}

// 사용자 설정 타입
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    alerts: {
      critical: boolean;
      warning: boolean;
      info: boolean;
    };
  };
  dashboard: {
    refreshInterval: number;
    defaultDateRange: string;
    chartPreferences: {
      animation: boolean;
      grid: boolean;
      legend: boolean;
    };
  };
  analysis: {
    defaultConfidence: number;
    autoSave: boolean;
    exportFormat: string;
  };
}
```

### API 사용 예시

```jsx
// src/hooks/useAnalysis.js
import { useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

export function useAnalysis() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);

  // 분석 생성
  const createAnalysis = useCallback(async (requestData) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/analysis', requestData);

      toast.success('분석이 시작되었습니다');
      return response.data;
    } catch (error) {
      toast.error('분석 요청에 실패했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 분석 결과 조회
  const getAnalysisResult = useCallback(async (id) => {
    try {
      const response = await apiClient.get(`/analysis/${id}`);
      return response.data;
    } catch (error) {
      console.error('분석 결과 조회 실패:', error);
      throw error;
    }
  }, []);

  // 분석 목록 조회
  const getAnalyses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/analysis', { params });

      setAnalyses(response.data.data.items);
      return response.data;
    } catch (error) {
      toast.error('분석 목록 조회에 실패했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analyses,
    loading,
    createAnalysis,
    getAnalysisResult,
    getAnalyses
  };
}
```

---

**API 버전**: v1.0.0
**마지막 업데이트**: 2024-01-XX
**문의**: api@kpi-dashboard.dev

