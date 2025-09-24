# 3GPP KPI Dashboard Frontend

## 📋 개요

3GPP KPI 대시보드 시스템의 프론트엔드 애플리케이션입니다. React (Vite) 기반으로 구축되어 있으며, 백엔드 API와 연동하여 KPI 데이터를 시각화하고 분석 결과를 제공합니다.

## 🏗️ 아키텍처

### 시스템 구성

```
Frontend (React) ↔ Backend (FastAPI) ↔ PostgreSQL (Raw KPI Data)
                                    ↔ MongoDB (Analysis Results)
                                    ↔ MCP (LLM Analysis)
```

### 주요 구성요소

1. **React**: 사용자 인터페이스 프레임워크
2. **Vite**: 빌드 도구 및 개발 서버
3. **Chart.js**: 데이터 시각화 라이브러리
4. **Tailwind CSS**: 스타일링 프레임워크
5. **Axios**: HTTP 클라이언트

## 🔧 구현된 기능

### 1) 주요 컴포넌트

#### Dashboard

- KPI 데이터 시각화
- 실시간 차트 업데이트
- 다중 KPI 동시 표시

#### Statistics

- 통계 분석 수행
- 기간별 데이터 비교
- PEG 선택 및 필터링

#### Analysis Results

- 분석 결과 조회 및 관리
- 결과 필터링 및 정렬
- 상세 분석 결과 표시

#### LLM Analysis

- LLM 기반 분석 실행
- 분석 진행 상황 모니터링
- 결과 시각화

#### Async Analysis

- 비동기 분석 작업 관리
- 실시간 상태 업데이트
- 작업 취소 및 결과 조회

#### Preference

- 사용자 설정 관리
- Import/Export 기능
- Derived PEG 관리

### 2) 데이터 구조 (DTO)

#### 새로운 DTO 구조 지원

```javascript
// DTO 구조 우선 사용
const result = {
  status: "success",
  time_ranges: { ... },
  peg_metrics: {
    items: [...],
    statistics: { ... }
  },
  llm_analysis: {
    summary: "...",
    issues: [...],
    recommended_actions: [...]
  },
  metadata: { ... },
  legacy_payload: { ... } // 하위 호환성
};
```

#### 레거시 데이터 호환성

```javascript
// 기존 데이터 구조도 지원
const legacyResult = {
  results: [...],
  analysis: { ... },
  analysis_raw_compact: { ... }
};
```

### 3) API 통합

#### KPI 조회 API

```javascript
// KPI 데이터 조회
const kpiData = await apiClient.post("/api/kpi/query", {
  start_date: "2025-01-01",
  end_date: "2025-01-02",
  kpi_types: ["availability", "rrc"],
  ne: "nvgnb#10000",
  cellid: "2010",
});
```

#### 분석 결과 API

```javascript
// 분석 결과 조회
const analysisResults = await apiClient.get("/api/analysis/results");

// LLM 분석 실행
const llmAnalysis = await apiClient.post("/api/analysis/trigger-llm-analysis", {
  user_id: "default",
  n_minus_1: "2024-01-01_00:00~2024-01-01_23:59",
  n: "2024-01-02_00:00~2024-01-02_23:59",
  enable_mock: false,
});
```

#### 비동기 분석 API

```javascript
// 비동기 분석 시작
const asyncAnalysis = await apiClient.post(
  "/api/async-analysis/start",
  requestData
);

// 분석 상태 확인
const status = await apiClient.get(`/api/async-analysis/status/${analysisId}`);

// 분석 결과 조회
const result = await apiClient.get(`/api/async-analysis/result/${analysisId}`);
```

## ⚙️ 설정 및 배포

### 필수 의존성

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "chart.js": "^4.2.0",
    "react-chartjs-2": "^5.2.0",
    "tailwindcss": "^3.2.0",
    "lucide-react": "^0.263.0",
    "sonner": "^1.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.1.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 환경 변수

```bash
# API 서버 URL
VITE_API_BASE_URL=http://localhost:8000

# 개발 모드 설정
VITE_DEV_MODE=true
```

### 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 🧪 테스트

### 1) E2E 테스트

#### 핵심 사용자 여정 테스트

- **TC001**: 완전한 워크플로우 (Preference → Statistics → Dashboard)
- **TC002**: Preference Import/Export 기능
- **TC003**: LLM 분석 결과 관리 워크플로우
- **TC004**: Derived PEG 관리 및 활용
- **TC005**: 실제 데이터 API 연동

#### 테스트 환경 설정

```bash
# 1. 시스템 시작
docker compose up -d

# 2. 프론트엔드 시작
cd frontend && npm run dev

# 3. 테스트 데이터 확인
docker exec -it kpi-mongo mongosh --eval "db.peg_master.find()"

# 4. 브라우저에서 테스트 수행
# http://localhost:5173
```

### 2) 성능 테스트

#### 성능 기준

- **응답 시간**: API 호출 응답 시간 < 2초
- **차트 렌더링**: 대시보드 차트 로딩 시간 < 3초
- **대용량 데이터**: 100개 이상 분석 결과 처리 가능

#### UI/UX 검증

- **반응형 디자인**: 다양한 화면 크기에서 정상 동작
- **에러 처리**: 네트워크 오류 시 적절한 사용자 피드백
- **로딩 상태**: 비동기 작업 시 로딩 스피너 표시

### 3) 데이터 무결성

#### 검증 항목

- **동시성**: 여러 사용자가 동시 접근 시 데이터 충돌 없음
- **트랜잭션**: 설정 저장 실패 시 부분 업데이트 방지
- **백업**: 중요 설정 변경 시 이전 상태 복구 가능

## 🔍 데이터 흐름

1. **사용자 입력**: 사용자가 설정 및 요청 입력
2. **API 호출**: 백엔드 API로 요청 전송
3. **데이터 처리**: 백엔드에서 데이터 처리 및 분석
4. **결과 반환**: 처리된 결과를 프론트엔드로 반환
5. **시각화**: 차트 및 테이블로 데이터 시각화

## 📊 성능 최적화

### 1) 컴포넌트 최적화

- React.memo를 사용한 불필요한 리렌더링 방지
- useMemo, useCallback을 사용한 계산 최적화
- 가상화를 사용한 대용량 데이터 처리

### 2) API 최적화

- 요청 캐싱 및 중복 요청 방지
- 배치 요청을 통한 네트워크 효율성 향상
- 에러 처리 및 재시도 로직

### 3) 번들 최적화

- 코드 스플리팅을 통한 초기 로딩 시간 단축
- 트리 셰이킹을 통한 번들 크기 최적화
- 이미지 및 정적 자산 최적화

## ⚠️ 현재 제한사항

- 실시간 업데이트는 폴링 기반 (추후 WebSocket 지원 예정)
- 대용량 데이터 처리 시 성능 최적화 필요
- 모바일 환경에서의 사용성 개선 필요

## 🔄 향후 개선

- WebSocket을 통한 실시간 업데이트
- PWA 지원으로 오프라인 기능 추가
- 모바일 최적화 및 반응형 디자인 개선
- 접근성(Accessibility) 향상
- 다국어 지원

## 🛠️ 개발 가이드

### 1) 컴포넌트 개발

```javascript
// 새로운 컴포넌트 생성 시
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NewComponent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>새 컴포넌트</CardTitle>
      </CardHeader>
      <CardContent>{/* 컴포넌트 내용 */}</CardContent>
    </Card>
  );
};

export default NewComponent;
```

### 2) API 통합

```javascript
// API 클라이언트 사용
import { apiClient } from "@/lib/apiClient";

const fetchData = async () => {
  try {
    const response = await apiClient.get("/api/endpoint");
    return response.data;
  } catch (error) {
    console.error("API 호출 실패:", error);
    throw error;
  }
};
```

### 3) 상태 관리

```javascript
// React Hook을 사용한 상태 관리
import { useState, useEffect } from "react";

const useData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiClient.get("/api/data");
        setData(result.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
```

_문서 업데이트: 2025-01-14 (DTO 구조 및 비동기 처리 반영)_
