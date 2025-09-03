# 📊 KPI Dashboard Frontend

> 현대적인 React 기반 KPI 모니터링 대시보드 애플리케이션
>
> **React 19**, **Vite**, **Tailwind CSS**, **shadcn/ui** 기반의 고성능 웹 애플리케이션

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.7-38B2AC.svg)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-1.54.2-2EAD33.svg)](https://playwright.dev/)

## 🎯 프로젝트 개요

KPI Dashboard는 기업의 핵심 성과 지표(KPI)를 실시간으로 모니터링하고 분석할 수 있는 현대적인 웹 애플리케이션입니다. 통계 분석, LLM 기반 인사이트, 실시간 차트 시각화 등의 기능을 제공합니다.

### ✨ 주요 특징

- **실시간 KPI 모니터링**: 실시간 데이터 업데이트 및 시각화
- **고급 통계 분석**: Mann-Whitney U Test, Kolmogorov-Smirnov Test 등
- **LLM 기반 분석**: AI를 활용한 자동화된 인사이트 생성
- **적응형 UI**: 반응형 디자인과 다크모드 지원
- **고성능 아키텍처**: 최적화된 번들링과 게으른 로딩
- **완전한 테스트 커버리지**: E2E 테스트 및 단위 테스트

## 🚀 빠른 시작

### 시스템 요구사항

- **Node.js**: 18.0.0 이상
- **npm**: 8.0.0 이상 또는 **pnpm**: 8.0.0 이상
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+

### 설치 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd kpi_dashboard/frontend

# 의존성 설치 (pnpm 권장)
pnpm install

# 개발 서버 실행
pnpm run dev

# 또는 npm 사용 시
npm install
npm run dev
```

애플리케이션이 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
# 프로덕션 빌드
npm run build

# 미리보기 서버 실행
npm run preview
```

## 📁 프로젝트 구조

```
kpi_dashboard/frontend/
├── public/                    # 정적 파일들
├── src/
│   ├── components/           # React 컴포넌트들
│   │   ├── ui/              # 재사용 가능한 UI 컴포넌트들
│   │   ├── common/          # 공통 컴포넌트들
│   │   ├── Dashboard.jsx    # 메인 대시보드
│   │   ├── Statistics.jsx   # 통계 분석 페이지
│   │   ├── ResultsList.jsx  # 분석 결과 목록
│   │   └── ...
│   ├── contexts/            # React Context 제공자들
│   ├── hooks/               # 커스텀 React 훅들
│   ├── lib/                 # 유틸리티 및 API 클라이언트
│   ├── utils/               # 헬퍼 함수들
│   └── types/               # TypeScript 타입 정의
├── tests/                   # E2E 테스트 파일들
├── scripts/                 # 빌드 및 배포 스크립트들
└── docker/                  # Docker 구성 파일들
```

## 🏗️ 아키텍처

### 기술 스택

#### 프론트엔드 프레임워크
- **React 19**: 최신 React 기능과 동시성 모드 지원
- **React Router**: 클라이언트 사이드 라우팅
- **React Hook Form**: 고성능 폼 관리

#### UI/UX 라이브러리
- **Tailwind CSS 4**: 유틸리티 우선 CSS 프레임워크
- **shadcn/ui**: 고품질 UI 컴포넌트 라이브러리
- **Radix UI**: 접근성 높은 기본 컴포넌트
- **Lucide React**: 일관된 아이콘 시스템

#### 차트 및 데이터 시각화
- **Recharts**: React 기반 차트 라이브러리
- **Framer Motion**: 부드러운 애니메이션

#### 상태 관리 및 데이터
- **React Context**: 전역 상태 관리
- **Axios**: HTTP 클라이언트
- **localStorage**: 클라이언트 사이드 데이터 저장

#### 개발 도구
- **Vite**: 초고속 개발 서버 및 빌드 도구
- **ESLint**: 코드 품질 관리
- **Playwright**: E2E 테스트 자동화
- **Lighthouse CI**: 성능 모니터링

### 아키텍처 패턴

- **컴포넌트 기반 아키텍처**: 재사용 가능한 컴포넌트 설계
- **컨테이너/프레젠터 패턴**: 로직과 UI의 분리
- **커스텀 훅 패턴**: 비즈니스 로직 재사용
- **Context 패턴**: 전역 상태 관리
- **Error Boundary 패턴**: 에러 처리 및 복구

## 🎨 주요 기능

### 1. 대시보드 (Dashboard)

실시간 KPI 모니터링 및 시각화:
- 실시간 데이터 업데이트
- 다양한 차트 타입 지원 (막대, 선, 원형, 영역)
- 반응형 그리드 레이아웃
- 드래그 앤 드롭 위젯 배치

### 2. 통계 분석 (Statistics)

고급 통계 분석 기능:
- **Mann-Whitney U Test**: 두 그룹 간 차이 검정
- **Kolmogorov-Smirnov Test**: 분포 비교 검정
- **마할라노비스 거리**: 다차원 이상치 탐지
- **PEG 비교 분석**: 성능 지표 비교

### 3. LLM 분석 (LLM Analysis)

AI 기반 자동 분석:
- 자연어 기반 분석 요청
- 자동화된 인사이트 생성
- 다중 모델 지원
- 결과 해석 및 시각화

### 4. 결과 관리 (Results)

분석 결과 관리 및 비교:
- 분석 결과 목록 조회
- 상세 결과 비교 기능
- 결과 필터링 및 검색
- 결과 내보내기/가져오기

### 5. 설정 관리 (Preferences)

사용자 맞춤 설정:
- 테마 설정 (라이트/다크 모드)
- 차트 설정 및 커스터마이징
- 알림 설정
- 데이터 필터링 설정

## 🧪 테스트

### E2E 테스트 실행

```bash
# 모든 E2E 테스트 실행
npm run test:e2e:all

# 특정 테스트만 실행
npm run test:e2e:stable      # 안정성 테스트
npm run test:e2e:comprehensive  # 종합 테스트
npm run test:e2e:auxiliary   # 보조 기능 테스트

# UI 모드로 테스트 실행
npm run test:e2e:ui

# 테스트 리포트 확인
npm run test:e2e:report
```

### 성능 테스트

```bash
# 성능 기준선 측정
npm run perf:baseline

# Lighthouse 성능 분석
npm run perf:analyze

# 번들 크기 분석
npm run analyze:bundle
```

## 🐳 Docker 배포

### 🔧 환경변수 설정

Docker 컨테이너에서 백엔드 API URL을 설정하려면 다음 환경변수를 사용하세요:

```bash
# 백엔드 API URL 설정
-e BACKEND_BASE_URL="http://165.213.69.30:8000"
-e VITE_API_BASE_URL="http://165.213.69.30:8000/api"

# 데이터베이스 설정 (선택사항)
-e DB_HOST="165.213.69.30"
-e DB_PORT="5432"
-e DB_USER="kpi_user"
-e DB_NAME="kpi_db"
-e DB_PASSWORD="your_password"
```

### Docker 이미지 빌드

```bash
# 기본 빌드
docker build -t kpi-dashboard:latest .

# 빌드 시점에 API URL 설정 (권장)
docker build \
  --build-arg VITE_API_BASE_URL="http://165.213.69.30:8000/api" \
  -t kpi-dashboard:latest .
```

### 컨테이너 실행

```bash
# 1. 기본 실행 (기본값 사용: http://165.213.69.30:8000)
docker run -p 8080:80 --name kpi-frontend kpi-dashboard:latest

# 2. 환경변수로 API URL 설정 (권장)
docker run -p 8080:80 \
  -e BACKEND_BASE_URL="http://165.213.69.30:8000" \
  -e VITE_API_BASE_URL="http://165.213.69.30:8000/api" \
  --name kpi-frontend kpi-dashboard:latest

# 3. 개발 환경용 (localhost)
docker run -p 8080:80 \
  -e BACKEND_BASE_URL="http://localhost:8000" \
  -e VITE_API_BASE_URL="http://localhost:8000/api" \
  --name kpi-frontend-dev kpi-dashboard:latest

# 4. 다른 서버용
docker run -p 8080:80 \
  -e BACKEND_BASE_URL="http://your-server.com:8000" \
  -e VITE_API_BASE_URL="http://your-server.com:8000/api" \
  --name kpi-frontend-custom kpi-dashboard:latest
```

### Docker Compose (권장)

프로젝트 루트에 `docker-compose.yml` 파일을 생성하고 사용하세요:

```yaml
version: '3.8'
services:
  frontend:
    image: kpi-dashboard-frontend:latest
    build:
      context: .
      args:
        VITE_API_BASE_URL: http://165.213.69.30:8000/api
    ports:
      - "8080:80"
    environment:
      - BACKEND_BASE_URL=http://165.213.69.30:8000
      - VITE_API_BASE_URL=http://165.213.69.30:8000/api
      - DB_HOST=165.213.69.30
      - DB_PORT=5432
      - DB_USER=kpi_user
      - DB_NAME=kpi_db
    restart: unless-stopped
```

실행 명령어:
```bash
# 빌드 및 실행
docker-compose up --build -d

# 로그 확인
docker-compose logs -f frontend

# 중지
docker-compose down
```

### 환경변수 설정 파일

`.env` 파일을 만들어 환경변수를 관리할 수 있습니다:

```bash
# .env 파일 예제
BACKEND_BASE_URL=http://165.213.69.30:8000
VITE_API_BASE_URL=http://165.213.69.30:8000/api
DB_HOST=165.213.69.30
DB_PORT=5432
DB_USER=kpi_user
DB_NAME=kpi_db
```

### 확인 방법

컨테이너가 정상적으로 실행되면:

1. **컨테이너 로그 확인**:
```bash
docker logs kpi-frontend
# 또는
docker-compose logs frontend
```

2. **브라우저에서 확인**:
   - `http://localhost:8080` 접속
   - 브라우저 콘솔에서 `console.log(window.__RUNTIME_CONFIG__)` 실행
   - API 요청이 올바른 URL로 가는지 Network 탭에서 확인

3. **컨테이너 내부 확인**:
```bash
docker exec -it kpi-frontend /bin/sh
cat /usr/share/nginx/html/runtime-config.js
```

### 문제 해결

환경변수가 적용되지 않는 경우:

1. **컨테이너 재시작**:
```bash
docker restart kpi-frontend
```

2. **캐시 삭제 후 재빌드**:
```bash
docker system prune -f
docker-compose down
docker-compose up --build --force-recreate
```

3. **환경변수 확인**:
```bash
docker exec kpi-frontend env | grep -E "(BACKEND|VITE_API|DB_)"
```
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 🔧 개발자 가이드

### 코드 품질 관리

```bash
# 코드 린팅
npm run lint

# 코드 포맷팅 (Prettier 설정 권장)
# 개발 환경에서 자동 포맷팅 사용
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# API 설정
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# 애플리케이션 설정
VITE_APP_TITLE=KPI Dashboard
VITE_APP_VERSION=1.0.0

# 디버그 설정
VITE_DEBUG=true
VITE_LOG_LEVEL=info
```

### 커밋 컨벤션

```bash
# 기능 추가
git commit -m "feat: 새로운 KPI 차트 컴포넌트 추가"

# 버그 수정
git commit -m "fix: 차트 렌더링 오류 수정"

# 문서 업데이트
git commit -m "docs: README 설치 가이드 개선"

# 리팩토링
git commit -m "refactor: 대시보드 컴포넌트 최적화"

# 테스트 추가
git commit -m "test: E2E 테스트 케이스 추가"
```

## 📊 성능 최적화

### 빌드 최적화 기능

- **코드 분할**: 라우트 기반 자동 코드 분할
- **트리 쉐이킹**: 사용하지 않는 코드 제거
- **압축**: Gzip/Brotli 압축 지원
- **캐싱**: 긴 캐시 헤더를 통한 정적 자원 캐싱

### 런타임 최적화

- **React.lazy**: 컴포넌트 지연 로딩
- **React.memo**: 불필요한 리렌더링 방지
- **useMemo/useCallback**: 계산 비용 최적화
- **가상화**: 대용량 데이터 렌더링 최적화

## 🤝 기여하기

### 개발 환경 설정

1. **프로젝트 클론**
   ```bash
   git clone <repository-url>
   cd kpi_dashboard/frontend
   ```

2. **개발 의존성 설치**
   ```bash
   pnpm install
   ```

3. **개발 서버 실행**
   ```bash
   pnpm run dev
   ```

4. **브라우저에서 확인**
   - `http://localhost:5173` 접속
   - 핫 리로드가 자동으로 적용됩니다

### 코드 기여 절차

1. **이슈 생성**: 새로운 기능이나 버그에 대한 이슈 생성
2. **브랜치 생성**: 기능 브랜치 생성 (`git checkout -b feature/new-feature`)
3. **코드 작성**: 기능 구현 및 테스트 작성
4. **테스트 실행**: 모든 테스트가 통과하는지 확인
5. **Pull Request**: 변경사항에 대한 PR 생성
6. **코드 리뷰**: 팀원들의 리뷰 후 머지

### 코드 스타일 가이드

- **ESLint 규칙 준수**: 모든 ESLint 경고/에러 해결
- **의미 있는 변수명**: `x`, `temp` 대신 `userName`, `calculateAverage` 사용
- **함수 단위 책임**: 하나의 함수는 하나의 기능만 담당
- **주석 작성**: 복잡한 로직에 대한 상세한 주석 필수
- **에러 처리**: 모든 비동기 작업에 적절한 에러 처리

## 📝 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다.

## 🙋‍♂️ 지원 및 문의

- **이슈 트래커**: [GitHub Issues](https://github.com/your-org/kpi-dashboard/issues)
- **토론**: [GitHub Discussions](https://github.com/your-org/kpi-dashboard/discussions)
- **문서**: [Wiki](https://github.com/your-org/kpi-dashboard/wiki)

## 🏆 릴리즈 노트

### v1.0.0 (2024-01-XX)
- ✅ React 19 마이그레이션 완료
- ✅ 새로운 통계 분석 모듈 추가
- ✅ LLM 기반 분석 기능 구현
- ✅ 완전한 E2E 테스트 커버리지
- ✅ Docker 컨테이너화 지원
- ✅ 성능 최적화 및 번들 크기 감소

---

**개발자**: AI Assistant & Team
**마지막 업데이트**: 2024-01-XX
**문서 버전**: 1.0.0



