# 🔌 Backend API Reference

프론트엔드 재구축을 위한 백엔드 API 정보 정리 문서입니다.

---

## 📋 목차

1. [API 기본 정보](#api-기본-정보)
2. [분석 API (V2 - 권장)](#분석-api-v2---권장)
3. [비동기 분석 API](#비동기-분석-api)
4. [PEG 비교분석 API](#peg-비교분석-api)
5. [사용자 설정 API](#사용자-설정-api)

---

## 🔧 API 기본 정보

### Base URL

```
Production: http://165.213.69.30:8000/api
Development: http://localhost:8000/api
```

---

## 📊 분석 API (V2 - 권장)

### 1. 분석 결과 목록 조회

```http
GET /api/analysis/results-v2
```

**Query Parameters:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `page` | number | 페이지 번호 (기본값: 1) |
| `size` | number | 페이지 크기 (기본값: 20) |
| `ne_id` | string | NE ID 필터 |
| `cell_id` | string | Cell ID 필터 |
| `swname` | string | Software Name 필터 |
| `choi_status` | string | Choi 판정 상태 (normal/warning/critical) |

**응답:**

```typescript
{
  items: AnalysisResultV2[],
  total: number,
  page: number,
  size: number,
  has_next: boolean
}
```

### 2. 분석 결과 상세 조회

```http
GET /api/analysis/results-v2/{resultId}
```

**응답:**

```typescript
{
  message: string,
  data: {
    id: string,
    ne_id: string,
    cell_id: string,
    swname: string,
    created_at: string,
    choi_result?: {
      enabled: boolean,
      status?: 'normal' | 'warning' | 'critical',
      score?: number
    },
    llm_analysis: {
      summary: string,
      issues: string[],
      recommendations: string[],
      confidence: number
    },
    peg_comparisons: PegComparison[]
  }
}
```

### 3. 분석 결과 통계 요약

```http
GET /api/analysis/results-v2/stats/summary
```

---

## ⏳ 비동기 분석 API

### 비동기 LLM 분석 시작

```http
POST /api/async-analysis/start
```

### 비동기 분석 상태 조회

```http
GET /api/async-analysis/status/{analysisId}
```

### 비동기 분석 결과 조회

```http
GET /api/async-analysis/result/{analysisId}
```

---

## 📊 PEG 비교분석 API

### PEG 비교분석 결과 조회

```http
GET /api/analysis/results/{resultId}/peg-comparison
```

---

## ⚙️ 사용자 설정 API

### 사용자 설정 조회

```http
GET /api/preference/settings?user_id={userId}
```

### 사용자 설정 저장

```http
PUT /api/preference/settings?user_id={userId}
```

---

## 📝 주요 데이터 타입

### AnalysisResultV2

```typescript
interface AnalysisResultV2 {
  id: string;
  ne_id: string;
  cell_id: string;
  swname: string;
  created_at: string;
  choi_result?: ChoiResult;
  llm_analysis: LLMAnalysis;
  peg_comparisons: PegComparison[];
}
```

### PegComparison

```typescript
interface PegComparison {
  peg_name: string;
  n_minus_1: { avg, pct_95, pct_99, min, max, count, std };
  n: { avg, pct_95, pct_99, min, max, count, std };
  change_percentage: number;
}
```

---

**문서 버전:** 1.0.0

