# 프론트엔드 V2 API 통합 가이드

## 📋 개요

백엔드 `/api/analysis/results-v2/` API에 맞춰 프론트엔드 컴포넌트를 업데이트했습니다.

## 🎯 주요 변경사항

### 1. API 클라이언트 업데이트

**파일**: `src/lib/apiClient.js`

새로운 V2 API 함수들이 추가되었습니다:

- `getAnalysisResultsV2(params)` - 목록 조회 (페이징 지원)
- `getAnalysisResultDetailV2(resultId)` - 상세 조회
- `getAnalysisStatsV2()` - 통계 요약

**사용 예시**:

```javascript
import {
  getAnalysisResultsV2,
  getAnalysisResultDetailV2,
} from "@/lib/apiClient.js";

// 목록 조회
const results = await getAnalysisResultsV2({
  page: 1,
  size: 20,
  ne_id: "nvgnb#10000",
  cell_id: "2010",
  swname: "host01",
});
// 결과: { items: [...], total, page, size, has_next }

// 상세 조회
const detail = await getAnalysisResultDetailV2("some-id");
// 결과: { message, data: { ne_id, cell_id, swname, choi_result, llm_analysis, peg_comparisons } }
```

### 2. TypeScript 타입 정의

**파일**: `src/types/analysisV2.ts`

V2 API 응답 구조에 맞춘 타입 정의:

```typescript
interface AnalysisResultV2 {
  id: string;
  ne_id: string;
  cell_id: string;
  swname: string;
  rel_ver?: string;
  created_at: string;

  choi_result?: ChoiResult;
  llm_analysis: LLMAnalysis;
  peg_comparisons: PegComparison[];
}
```

### 3. V2 결과 표시 컴포넌트

**파일**: `src/components/AnalysisResultV2Display.jsx`

V2 데이터 구조에 맞춰 최적화된 표시 컴포넌트:

- **ChoiResultDisplay**: Choi 알고리즘 판정 결과 (상태별 색상 구분)
- **LLMAnalysisDisplay**: LLM 분석 결과 (요약, 문제점, 권장사항, 신뢰도)
- **PEGComparisonsDisplay**: PEG 비교 분석 (N-1 vs N 기간 통계)

**사용 예시**:

```jsx
import AnalysisResultV2Display from "@/components/AnalysisResultV2Display.jsx";

<AnalysisResultV2Display result={resultData} />;
```

### 4. V2 상세 모달 컴포넌트

**파일**: `src/components/ResultDetailV2.jsx`

V2 API를 사용하는 상세 결과 모달:

```jsx
import ResultDetailV2 from "@/components/ResultDetailV2.jsx";

<ResultDetailV2
  isOpen={isOpen}
  onClose={handleClose}
  resultIds={["result-id-123"]}
  mode="single" // 또는 "template"
/>;
```

**기능**:

- 단일 결과 상세 조회
- Template 모드 (샘플 데이터)
- JSON 내보내기
- 전체화면 지원
- 키보드 단축키 (F11: 전체화면, ESC: 닫기)

## 📊 V2 vs V1 비교

### API 엔드포인트

| 구분      | V1                           | V2                                       |
| --------- | ---------------------------- | ---------------------------------------- |
| 목록 조회 | `/api/analysis/results`      | `/api/analysis/results-v2`               |
| 상세 조회 | `/api/analysis/results/{id}` | `/api/analysis/results-v2/{id}`          |
| 통계      | N/A                          | `/api/analysis/results-v2/stats/summary` |

### 응답 구조

**V1 (복잡)**:

```json
{
  "ne_id": "...",
  "cell_id": "...",
  "analysis_type": "enhanced",
  "metadata": {
    "analysis_type": "enhanced", // ❌ 중복
    "total_pegs": 10,
    "complete_data_pegs": 8
  },
  "peg_metrics": {
    "statistics": {
      "total_pegs": 10, // ❌ 또 중복
      "complete_data_pegs": 8
    }
  }
}
```

**V2 (간소화)**:

```json
{
  "ne_id": "...",
  "cell_id": "...",
  "swname": "host01",
  "rel_ver": "R23A",
  "choi_result": {
    "enabled": true,
    "status": "normal",
    "score": 9.2
  },
  "llm_analysis": {
    "summary": "...",
    "issues": [],
    "recommendations": [],
    "confidence": 0.95
  },
  "peg_comparisons": [
    {
      "peg_name": "DL_THROUGHPUT",
      "n_minus_1": { "avg": 142.5, ... },
      "n": { "avg": 149.9, ... },
      "change_percentage": 5.19
    }
  ]
}
```

## 🚀 사용 방법

### 1. 목록 페이지에서 V2 사용

```jsx
import { getAnalysisResultsV2 } from "@/lib/apiClient.js";

const AnalysisListPage = () => {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchResults = async () => {
      const data = await getAnalysisResultsV2({
        page,
        size: 20,
        ne_id: filters.neId,
        swname: filters.swname,
      });
      setResults(data.items);
    };
    fetchResults();
  }, [page, filters]);

  return (
    <div>
      {results.map((result) => (
        <AnalysisCard key={result.id} result={result} />
      ))}
    </div>
  );
};
```

### 2. 상세 모달 열기

```jsx
import ResultDetailV2 from "@/components/ResultDetailV2.jsx";

const MyComponent = () => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpenDetail = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <>
      <button onClick={() => handleOpenDetail("result-123")}>상세 보기</button>

      <ResultDetailV2
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        resultIds={[selectedId]}
        mode="single"
      />
    </>
  );
};
```

### 3. Template 모드 (샘플 데이터)

```jsx
<ResultDetailV2
  isOpen={true}
  onClose={() => {}}
  resultIds={[]}
  mode="template" // 샘플 데이터 표시
/>
```

## 🎨 UI 컴포넌트 커스터마이징

### Choi 판정 상태 색상

```jsx
// AnalysisResultV2Display.jsx의 statusConfig
const statusConfig = {
  normal: {
    color: "text-green-600",
    bgColor: "bg-green-50",
    badgeVariant: "success",
  },
  warning: {
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    badgeVariant: "warning",
  },
  critical: {
    color: "text-red-600",
    bgColor: "bg-red-50",
    badgeVariant: "destructive",
  },
};
```

### PEG 변화율 표시

```jsx
// 개선: 초록색 ↑
// 악화: 빨간색 ↓
// 안정: 회색 -
```

## 📝 마이그레이션 가이드

### V1에서 V2로 전환

#### 1단계: API 호출 변경

**Before (V1)**:

```javascript
const results = await apiClient.get("/analysis/results", { params });
```

**After (V2)**:

```javascript
const results = await getAnalysisResultsV2(params);
```

#### 2단계: 데이터 구조 업데이트

**Before (V1)**:

```javascript
const { ne_id, cell_id, metadata, peg_metrics } = result;
const totalPegs = metadata.total_pegs; // 중복 위치
```

**After (V2)**:

```javascript
const { ne_id, cell_id, swname, rel_ver, peg_comparisons } = result;
const totalPegs = peg_comparisons.length;
```

#### 3단계: 컴포넌트 교체

**Before (V1)**:

```jsx
<ResultDetail resultIds={[id]} />
```

**After (V2)**:

```jsx
<ResultDetailV2 resultIds={[id]} />
```

## ⚠️ 주의사항

### 1. V1과 V2 병행 운영

- V1 API는 레거시 지원을 위해 유지됩니다
- 신규 기능은 V2를 사용하세요
- 점진적 마이그레이션 권장

### 2. 타입 안전성

TypeScript를 사용하는 경우 `analysisV2.ts` 타입을 import하세요:

```typescript
import type { AnalysisResultV2, PegComparison } from "@/types/analysisV2.ts";
```

### 3. 에러 처리

V2 API는 표준화된 에러 응답을 반환합니다:

```javascript
try {
  const result = await getAnalysisResultDetailV2(id);
} catch (error) {
  console.error("API 오류:", error.message);
  // error.response.data.detail에 상세 오류 정보
}
```

## 🔗 관련 문서

- [백엔드 V2 API 요약](../../docs/ANALYSIS_API_V2_SUMMARY.md)
- [V2 스키마 정의](../../backend/app/models/analysis_simplified.py)
- [V2 라우터](../../backend/app/routers/analysis_v2.py)

## 📞 문의

V2 API 관련 문의사항은 백엔드 팀에 문의하세요.






