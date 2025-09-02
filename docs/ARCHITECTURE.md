# 🏗️ 시스템 아키텍처 문서

## 개요

KPI Dashboard Frontend는 모듈화되고 확장 가능한 아키텍처를 기반으로 설계되었습니다. 이 문서는 시스템의 전체적인 구조와 설계 원칙을 설명합니다.

## 📁 프로젝트 구조 상세

```
kpi_dashboard/frontend/
├── 📁 public/                    # 정적 자원
│   ├── favicon.ico               # 웹사이트 아이콘
│   ├── runtime-config.js         # 런타임 설정
│   └── vite.svg                  # Vite 로고
├── 📁 src/                       # 소스 코드
│   ├── 📁 components/           # React 컴포넌트 계층
│   │   ├── 📁 ui/              # 기본 UI 컴포넌트 (shadcn/ui)
│   │   │   ├── button.jsx       # 버튼 컴포넌트
│   │   │   ├── card.jsx         # 카드 컴포넌트
│   │   │   ├── dialog.jsx       # 모달 다이얼로그
│   │   │   └── ...              # 기타 UI 컴포넌트
│   │   ├── 📁 common/          # 공통 비즈니스 컴포넌트
│   │   │   ├── AnalysisResultsViewer.jsx
│   │   │   ├── DataFilterPanel.jsx
│   │   │   └── ...
│   │   ├── Dashboard.jsx        # 메인 대시보드 페이지
│   │   ├── Statistics.jsx       # 통계 분석 페이지
│   │   ├── ResultsList.jsx      # 결과 목록 페이지
│   │   └── ...
│   ├── 📁 contexts/            # React Context 제공자
│   │   ├── PreferenceContext.jsx # 사용자 설정 컨텍스트
│   │   └── ...
│   ├── 📁 hooks/               # 커스텀 React 훅
│   │   ├── usePreference.js    # 설정 관리 훅
│   │   ├── useAnalysisResults.js # 분석 결과 훅
│   │   └── ...
│   ├── 📁 lib/                 # 유틸리티 라이브러리
│   │   ├── apiClient.js        # API 통신 클라이언트
│   │   ├── utils.js            # 일반 유틸리티 함수
│   │   └── ...
│   ├── 📁 utils/               # 특화 유틸리티
│   │   ├── loggingUtils.js     # 로깅 유틸리티
│   │   ├── errorHandlingUtils.js # 에러 처리 유틸리티
│   │   └── ...
│   ├── 📁 types/               # TypeScript 타입 정의
│   │   └── userSettings.ts     # 사용자 설정 타입
│   ├── App.jsx                 # 메인 애플리케이션 컴포넌트
│   └── main.jsx                # 애플리케이션 진입점
├── 📁 tests/                   # 테스트 파일들
│   ├── api-integration.spec.ts # API 통합 테스트
│   ├── comprehensive-workflow.spec.ts # 종합 워크플로우 테스트
│   └── ...
├── 📁 scripts/                 # 빌드 및 배포 스크립트
│   ├── performance-baseline.js # 성능 측정 스크립트
│   └── ...
├── 📁 docker/                  # Docker 관련 파일들
│   ├── Dockerfile              # 컨테이너 정의
│   ├── docker-entrypoint.sh    # 컨테이너 시작 스크립트
│   └── nginx.conf              # Nginx 설정
└── 📄 package.json             # 프로젝트 설정 및 의존성
```

## 🏛️ 아키텍처 원칙

### 1. 컴포넌트 기반 아키텍처

#### 계층 구조
- **UI 컴포넌트 계층**: 재사용 가능한 기본 컴포넌트들
- **비즈니스 컴포넌트 계층**: 특정 도메인 로직을 담당하는 컴포넌트들
- **페이지 컴포넌트 계층**: 전체 페이지 레벨의 컴포넌트들

#### 설계 패턴
```jsx
// Container/Presentational 패턴 적용
function DashboardContainer() {
  const { data, loading, error } = useDashboardData();

  return <DashboardPresentational data={data} loading={loading} error={error} />;
}

function DashboardPresentational({ data, loading, error }) {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return <DashboardContent data={data} />;
}
```

### 2. 상태 관리 아키텍처

#### Context + Custom Hook 패턴
```jsx
// Context 정의
const PreferenceContext = createContext();

// Provider 컴포넌트
function PreferenceProvider({ children }) {
  const [preferences, setPreferences] = useState(defaultPreferences);

  const updatePreference = useCallback((key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const value = { preferences, updatePreference };

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
}

// Custom Hook
function usePreference() {
  const context = useContext(PreferenceContext);
  if (!context) {
    throw new Error('usePreference must be used within PreferenceProvider');
  }
  return context;
}
```

#### 상태 계층
- **로컬 상태**: useState, useReducer
- **컨텍스트 상태**: 전역 사용자 설정, 테마 등
- **서버 상태**: API 데이터를 위한 SWR 또는 React Query

### 3. 데이터 흐름 아키텍처

#### 단방향 데이터 흐름
```
User Action → Event Handler → State Update → Re-render → UI Update
```

#### API 통신 패턴
```jsx
// API 클라이언트 추상화
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // 에러 처리 중앙화
  handleError(error) {
    if (error.response) {
      // 서버 에러
      return new ApiError(error.response.status, error.response.data.message);
    } else if (error.request) {
      // 네트워크 에러
      return new NetworkError('Network request failed');
    } else {
      // 기타 에러
      return new UnknownError(error.message);
    }
  }
}
```

## 🔧 기술 스택 상세

### 프론트엔드 프레임워크
- **React 19**: 최신 Concurrent Features 지원
- **React Router v7**: 파일 기반 라우팅
- **React Hook Form**: 고성능 폼 상태 관리

### UI/스타일링
- **Tailwind CSS 4**: 유틸리티 우선 CSS
- **shadcn/ui**: Radix UI 기반 컴포넌트 라이브러리
- **Framer Motion**: 선언적 애니메이션

### 빌드 및 개발 도구
- **Vite 6**: ESM 기반 초고속 빌드 도구
- **ESLint**: 코드 품질 관리
- **TypeScript**: 타입 안전성 (점진적 적용)

### 테스트 도구
- **Playwright**: E2E 테스트 자동화
- **Vitest**: 단위 테스트 (향후 적용 예정)
- **Testing Library**: 컴포넌트 테스트 유틸리티

## 📊 데이터 관리 전략

### 1. 클라이언트 사이드 스토리지

#### localStorage 활용
```jsx
// 설정 데이터 지속성
function useLocalStorageSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const item = localStorage.getItem('kpi-dashboard-settings');
      return item ? JSON.parse(item) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('kpi-dashboard-settings', JSON.stringify(newSettings));
  }, []);

  return [settings, saveSettings];
}
```

#### IndexedDB 고려사항
- 대용량 데이터 캐싱
- 오프라인 기능 지원
- 향후 확장 가능성 고려

### 2. API 통신 전략

#### 요청/응답 패턴
```jsx
// 표준화된 API 응답 형식
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// 에러 처리 표준화
interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

#### 캐싱 전략
- **GET 요청**: 브라우저 캐시 + 메모리 캐시
- **POST/PUT/DELETE**: 캐시 무효화
- **실시간 데이터**: WebSocket 또는 Server-Sent Events

## 🚀 성능 최적화 아키텍처

### 1. 번들 최적화

#### 코드 분할 전략
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 라이브러리별 분할
          if (id.includes('recharts')) return 'chart-vendor';
          if (id.includes('@radix-ui')) return 'ui-vendor';
          if (id.includes('react')) return 'react-vendor';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
});
```

#### 지연 로딩 구현
```jsx
// 컴포넌트 레벨 코드 분할
const HeavyComponent = lazy(() =>
  import('./components/HeavyComponent')
);

// 라우트 레벨 코드 분할
const Dashboard = lazy(() =>
  import('./pages/Dashboard')
);
```

### 2. 런타임 최적화

#### 메모이제이션 전략
```jsx
// 컴포넌트 메모이제이션
const MemoizedChart = memo(ChartComponent);

// 계산 결과 메모이제이션
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// 함수 메모이제이션
const handleClick = useCallback(() => {
  // 클릭 핸들러 로직
}, [dependencies]);
```

#### 가상화 구현
```jsx
// 대용량 리스트 가상화
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </List>
  );
}
```

## 🛡️ 에러 처리 및 복구 전략

### 1. 에러 바운더리 패턴

```jsx
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 2. 그레이스풀 디그레이션

```jsx
// 기능 지원 여부에 따른 폴백
function useFeatureDetection() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // WebGL 지원 확인
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    setIsSupported(!!gl);
  }, []);

  return isSupported;
}

function ChartComponent() {
  const isWebGLSupported = useFeatureDetection();

  if (!isWebGLSupported) {
    return <FallbackChart />; // Canvas 기반 폴백
  }

  return <WebGLChart />; // WebGL 기반 고성능 차트
}
```

## 🔄 CI/CD 아키텍처

### 빌드 파이프라인

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm run lint

      - name: Build
        run: pnpm run build

      - name: Test
        run: pnpm run test:e2e:ci

      - name: Performance check
        run: pnpm run perf:baseline
```

### 배포 전략

#### 멀티스테이지 Docker 빌드
```dockerfile
# 빌드 스테이지
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 프로덕션 스테이지
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📈 모니터링 및 분석

### 성능 모니터링

#### Web Vitals 추적
```javascript
// webVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric) {
  // 분석 서비스로 전송
  console.log(metric);

  // 실제 구현에서는 다음과 같이 사용
  // analytics.track('web_vitals', {
  //   name: metric.name,
  //   value: metric.value,
  //   delta: metric.delta,
  // });
}

getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

#### 사용자 인터랙션 추적
```javascript
// 사용자 행동 분석
function trackUserInteraction(eventType, element, metadata = {}) {
  const interaction = {
    type: eventType,
    element: element,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    ...metadata
  };

  // 분석 서비스로 전송
  analytics.track('user_interaction', interaction);
}
```

## 🔮 미래 확장 계획

### 1. 마이크로 프론트엔드
- 모듈 페더레이션 적용
- 독립적인 팀별 개발 지원
- 점진적 마이그레이션 전략

### 2. PWA 지원
- 서비스 워커 구현
- 오프라인 기능 추가
- 푸시 알림 지원

### 3. 실시간 데이터
- WebSocket 연결
- 실시간 차트 업데이트
- 서버 상태 동기화

### 4. AI/ML 통합
- 클라이언트 사이드 머신러닝
- 예측 분석 기능
- 개인화된 인사이트

---

**문서 버전**: 1.0.0
**최종 업데이트**: 2024-01-XX
**작성자**: AI Assistant

