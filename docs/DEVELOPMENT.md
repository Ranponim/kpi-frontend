# 🛠️ 개발자 가이드

KPI Dashboard Frontend의 개발 환경 설정, 디버깅, 배포 등 개발에 필요한 모든 정보를 제공합니다.

## 📋 목차

- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조 이해](#프로젝트-구조-이해)
- [개발 워크플로우](#개발-워크플로우)
- [디버깅 가이드](#디버깅-가이드)
- [성능 최적화](#성능-최적화)
- [배포 가이드](#배포-가이드)
- [문제 해결](#문제-해결)

## 🚀 개발 환경 설정

### 1. 시스템 요구사항

#### 필수 요구사항
- **Node.js**: 18.0.0 이상 (LTS 권장)
- **Package Manager**: pnpm 8.0.0 이상 (권장) 또는 npm 8.0.0 이상
- **Git**: 2.30.0 이상
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+

#### 권장 IDE 설정
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.vscode-eslint",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascriptreact"
  }
}
```

### 2. 프로젝트 클론 및 설정

```bash
# 프로젝트 클론
git clone <repository-url>
cd kpi_dashboard/frontend

# 의존성 설치 (pnpm 권장)
pnpm install

# 또는 npm 사용
npm install

# .env 파일 생성
cp .env.example .env.local
```

### 3. 환경 변수 설정

```env
# .env.local
# API 설정
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# 애플리케이션 설정
VITE_APP_TITLE=KPI Dashboard (Dev)
VITE_APP_VERSION=1.0.0-dev

# 개발 설정
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
VITE_DEV_MODE=true

# 테스트 설정
VITE_ENABLE_MSW=true
VITE_MSW_API_BASE_URL=http://localhost:3001
```

### 4. 개발 서버 실행

```bash
# 기본 개발 서버
pnpm run dev

# 특정 포트에서 실행
pnpm run dev --port 3000

# 호스트 바인딩 (네트워크 접근 허용)
pnpm run dev --host 0.0.0.0
```

## 🏗️ 프로젝트 구조 이해

### 주요 디렉토리 구조

```
src/
├── components/           # React 컴포넌트
│   ├── ui/              # 기본 UI 컴포넌트 (shadcn/ui)
│   ├── common/          # 공통 비즈니스 컴포넌트
│   ├── Dashboard.jsx    # 메인 대시보드
│   ├── Statistics.jsx   # 통계 분석
│   └── ...
├── contexts/            # React Context 제공자
├── hooks/               # 커스텀 React 훅
├── lib/                 # 유틸리티 라이브러리
├── utils/               # 헬퍼 함수들
├── types/               # TypeScript 타입 정의
├── App.jsx              # 메인 앱 컴포넌트
└── main.jsx             # 앱 진입점
```

### 컴포넌트 계층 구조

```
App (최상위)
├── Layout (공통 레이아웃)
│   ├── Header (상단바)
│   ├── Sidebar (메뉴)
│   └── Main (메인 콘텐츠)
│       ├── Dashboard (대시보드 페이지)
│       ├── Statistics (통계 페이지)
│       ├── ResultsList (결과 목록)
│       ├── LLMAnalysisManager (LLM 분석)
│       └── PreferenceManager (설정 관리)
```

## 🔄 개발 워크플로우

### 1. 기능 개발 절차

```bash
# 1. 최신 코드 가져오기
git checkout main
git pull origin main

# 2. 기능 브랜치 생성
git checkout -b feature/new-feature

# 3. 기능 구현
# - 컴포넌트 작성
# - 테스트 작성
# - 문서 업데이트

# 4. 코드 품질 검사
pnpm run lint
pnpm run type-check  # TypeScript 적용 시

# 5. 테스트 실행
pnpm run test:e2e

# 6. 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# 7. Push 및 PR 생성
git push origin feature/new-feature
```

### 2. 코드 변경 감시

```bash
# 파일 변경 감시 및 자동 재빌드
pnpm run dev

# 타입 체크 (TypeScript 적용 시)
pnpm run type-check:watch

# 테스트 감시 모드
pnpm run test:watch
```

### 3. 핫 리로드 설정

Vite는 기본적으로 핫 리로드를 지원합니다. 추가 설정이 필요한 경우:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      overlay: true,  // 에러 오버레이 표시
    },
    watch: {
      usePolling: true,  // 파일 시스템 폴링 사용 (Docker 등에서 필요)
    }
  }
});
```

## 🔍 디버깅 가이드

### 1. 브라우저 개발자 도구

#### React DevTools
```bash
# Chrome 확장프로그램 설치
# https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
```

#### 유용한 디버깅 팁
```jsx
// 컴포넌트 디버깅
function MyComponent({ data }) {
  console.log('🔍 컴포넌트 렌더링:', { data, timestamp: Date.now() });

  // 조건부 디버깅
  if (process.env.NODE_ENV === 'development') {
    console.debug('🐛 디버그 모드:', data);
  }

  return <div>{/* JSX */}</div>;
}
```

### 2. 로깅 시스템

프로젝트에서 표준화된 로깅을 사용합니다:

```jsx
import { logApp } from '@/utils/loggingUtils';

// 다양한 로그 레벨
logApp('info', '사용자 로그인 성공', { userId: 123 });
logApp('error', 'API 호출 실패', { error: err.message });
logApp('debug', '컴포넌트 상태 변경', { prevState, newState });
logApp('warn', '권장되지 않는 사용법', { deprecated: true });
```

### 3. 에러 바운더리 디버깅

```jsx
// src/components/ErrorBoundary.jsx
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error('🚨 에러 바운더리:', error);
    console.error('📍 에러 정보:', errorInfo);

    // 에러 리포팅 서비스로 전송
    reportError(error, errorInfo);
  }
}
```

### 4. 네트워크 디버깅

```bash
# API 호출 로깅 활성화
localStorage.setItem('debug', 'api-client');

// 또는 환경 변수로 설정
VITE_DEBUG_API=true
```

### 5. 성능 디버깅

```jsx
// React DevTools Profiler 사용
function ExpensiveComponent() {
  const [count, setCount] = useState(0);

  // 성능 측정
  useEffect(() => {
    const start = performance.now();
    // 복잡한 계산
    const result = expensiveCalculation();
    const end = performance.now();

    console.log(`⚡ 계산 시간: ${end - start}ms`);
  }, [count]);

  return <div>{result}</div>;
}
```

## ⚡ 성능 최적화

### 1. 번들 분석

```bash
# 번들 크기 분석
pnpm run build:analyze

# 결과: dist/bundle-analysis.html 파일 생성
```

### 2. 코드 분할 최적화

```jsx
// 라우트 기반 코드 분할
const Dashboard = lazy(() =>
  import(/* webpackChunkName: "dashboard" */ './Dashboard')
);

// 컴포넌트 기반 코드 분할
const HeavyChart = lazy(() =>
  import(/* webpackChunkName: "charts" */ './HeavyChart')
);
```

### 3. 메모이제이션 적용

```jsx
// 컴포넌트 메모이제이션
const MemoizedChart = memo(ChartComponent);

// 계산 결과 메모이제이션
const processedData = useMemo(() => {
  return expensiveTransform(rawData);
}, [rawData]);

// 콜백 메모이제이션
const handleClick = useCallback((id) => {
  dispatch({ type: 'SELECT_ITEM', payload: id });
}, [dispatch]);
```

### 4. 이미지 최적화

```jsx
// 반응형 이미지
<img
  src={imageSrc}
  srcSet={`${smallImage} 480w, ${mediumImage} 768w, ${largeImage} 1024w`}
  sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
  loading="lazy"
  alt="설명"
/>
```

### 5. Web Vitals 모니터링

```jsx
// webVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals(metric) {
  const { name, value, delta } = metric;

  // 개발 환경에서 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${name}:`, {
      value: Math.round(value),
      delta: Math.round(delta),
      timestamp: Date.now()
    });
  }

  // 프로덕션에서는 분석 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    analytics.track('web_vitals', { name, value, delta });
  }
}

// 모든 Web Vitals 측정
getCLS(reportWebVitals);
getFID(reportWebVitals);
getFCP(reportWebVitals);
getLCP(reportWebVitals);
getTTFB(reportWebVitals);
```

## 🚀 배포 가이드

### 1. 프로덕션 빌드

```bash
# 최적화된 프로덕션 빌드
pnpm run build

# 미리보기 서버로 확인
pnpm run preview

# 번들 분석 포함 빌드
pnpm run build:analyze
```

### 2. 환경별 설정

```javascript
// vite.config.js
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    build: {
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: isProduction ? {
            vendor: ['react', 'react-dom'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            chart: ['recharts'],
          } : undefined,
        },
      },
    },
  };
});
```

### 3. Docker 배포

```bash
# Docker 이미지 빌드
docker build -t kpi-dashboard:latest .

# 컨테이너 실행
docker run -p 80:80 kpi-dashboard:latest

# Docker Compose 사용
docker-compose up -d
```

### 4. CI/CD 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Deploy to server
        run: |
          # 배포 스크립트 실행
          ./scripts/deploy.sh
```

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. 빌드 실패

**문제**: `pnpm run build` 실패

**해결 방법**:
```bash
# 캐시 정리
pnpm store prune

# node_modules 재설치
rm -rf node_modules
pnpm install

# 빌드 재시도
pnpm run build
```

#### 2. 핫 리로드 작동하지 않음

**문제**: 파일 변경 시 자동 리로드 안됨

**해결 방법**:
```javascript
// vite.config.js
export default defineConfig({
  server: {
    watch: {
      usePolling: true,  // 폴링 모드 사용
      interval: 300,     // 폴링 간격 (ms)
    },
    hmr: {
      overlay: false,    // 에러 오버레이 비활성화
    },
  },
});
```

#### 3. 메모리 부족 에러

**문제**: `JavaScript heap out of memory`

**해결 방법**:
```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# 또는 package.json에 추가
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
  }
}
```

#### 4. CORS 에러

**문제**: API 호출 시 CORS 에러

**해결 방법**:
```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

#### 5. ESLint 에러

**문제**: 코드 린팅 에러

**해결 방법**:
```bash
# 자동 수정 가능한 에러들 수정
pnpm run lint --fix

# 특정 파일만 린팅
pnpm run lint src/components/MyComponent.jsx

# ESLint 캐시 정리
pnpm run lint --cache-location .eslintcache --no-cache
```

### 디버깅 도구

#### 1. React DevTools
- 컴포넌트 트리 확인
- Props/State 실시간 모니터링
- 성능 프로파일링

#### 2. Chrome DevTools
- Network 탭: API 호출 모니터링
- Performance 탭: 성능 분석
- Application 탭: Storage/LocalStorage 확인
- Console 탭: 로그 및 에러 확인

#### 3. Vite 개발 서버
```bash
# 자세한 로그 출력
DEBUG=vite:* pnpm run dev

# 특정 모듈 디버깅
DEBUG=vite:transform pnpm run dev
```

## 📊 모니터링 및 로깅

### 애플리케이션 로깅

```jsx
// src/utils/logger.js
class Logger {
  constructor() {
    this.level = process.env.VITE_LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    };
  }

  log(level, message, data = {}) {
    if (this.levels[level] > this.levels[this.level]) return;

    const timestamp = new Date().toISOString();
    const logData = {
      level,
      message,
      timestamp,
      ...data,
    };

    // 개발 환경에서는 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      console[level](`[${level.toUpperCase()}] ${message}`, logData);
    }

    // 프로덕션에서는 외부 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToService(logData);
    }
  }

  error(message, error) {
    this.log('error', message, { error: error.message, stack: error.stack });
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }
}

export const logger = new Logger();
```

### 에러 추적

```jsx
// src/utils/errorTracker.js
class ErrorTracker {
  track(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    // 개발 환경에서는 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 에러 추적:', errorData);
    }

    // 프로덕션에서는 에러 추적 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracker(errorData);
    }
  }

  // React Error Boundary에서 사용
  trackReactError(error, errorInfo) {
    this.track(error, {
      componentStack: errorInfo.componentStack,
      type: 'react_error_boundary',
    });
  }

  // 비동기 에러 추적
  trackAsyncError(error, context) {
    this.track(error, {
      ...context,
      type: 'async_error',
    });
  }
}

export const errorTracker = new ErrorTracker();
```

## 🎯 개발 팁

### 1. 코드 작성 팁

- **작은 컴포넌트**: 하나의 컴포넌트는 하나의 책임을 가져야 합니다
- **커스텀 훅 사용**: 로직을 재사용 가능한 훅으로 분리하세요
- **TypeScript 점진적 적용**: 기존 코드를 유지하면서 타입을 추가하세요
- **테스트 우선 개발**: 새로운 기능은 테스트와 함께 작성하세요

### 2. 성능 팁

- **불필요한 리렌더링 방지**: React.memo, useMemo, useCallback 적절히 사용
- **코드 분할**: 초기 로딩 시간을 줄이기 위해 라우트 기반 분할 적용
- **이미지 최적화**: WebP 사용, lazy loading 적용
- **번들 최적화**: tree-shaking과 압축을 활용

### 3. 디버깅 팁

- **React DevTools**: 컴포넌트 계층과 상태를 실시간으로 확인
- **Network 탭**: API 호출과 응답을 모니터링
- **Performance 탭**: 렌더링 성능과 병목 지점을 찾기
- **Console 탭**: 에러와 로그를 체계적으로 확인

### 4. 협업 팁

- **브랜치 전략**: 기능별 브랜치 사용 (`feature/`, `fix/`, `docs/`)
- **커밋 메시지**: 의미 있는 커밋 메시지 작성
- **코드 리뷰**: 변경사항에 대한 충분한 리뷰 진행
- **문서화**: 새로운 기능은 반드시 문서화

---

**문서 버전**: 1.0.0
**마지막 업데이트**: 2024-01-XX
**개발자 여러분의 생산적인 개발을 응원합니다! 🚀**

