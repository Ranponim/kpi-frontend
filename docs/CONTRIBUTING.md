# 🤝 기여 가이드

KPI Dashboard 프로젝트에 기여하는 방법을 안내하는 문서입니다. 모든 기여를 환영합니다!

## 📋 목차

- [개발 환경 설정](#개발-환경-설정)
- [코드 기여 절차](#코드-기여-절차)
- [코딩 컨벤션](#코딩-컨벤션)
- [테스트 작성](#테스트-작성)
- [Pull Request 가이드](#pull-request-가이드)
- [버그 리포트](#버그-리포트)
- [기능 요청](#기능-요청)

## 🚀 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.0.0 이상
- **pnpm**: 8.0.0 이상 (권장) 또는 npm 8.0.0 이상
- **Git**: 2.30.0 이상

### 1. 프로젝트 클론

```bash
# SSH 사용 (권장)
git clone git@github.com:your-org/kpi-dashboard.git

# 또는 HTTPS 사용
git clone https://github.com/your-org/kpi-dashboard.git

cd kpi-dashboard/frontend
```

### 2. 의존성 설치

```bash
# pnpm 사용 (권장)
pnpm install

# 또는 npm 사용
npm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
# API 설정
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_TIMEOUT=10000

# 개발 설정
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# 테스트 설정
VITE_TEST_MODE=true
```

### 4. 개발 서버 실행

```bash
# 개발 서버 시작
pnpm run dev

# 또는 npm 사용
npm run dev
```

서버가 `http://localhost:5173`에서 실행됩니다.

### 5. 브라우저에서 확인

- `http://localhost:5173` 접속
- 핫 리로드가 자동으로 적용됩니다
- 개발자 도구에서 콘솔 로그 확인

## 🔧 코드 기여 절차

### 1. 이슈 생성

새로운 기능이나 버그 수정 전, 관련 이슈가 있는지 확인하세요:

1. [Issues 탭](https://github.com/your-org/kpi-dashboard/issues)에서 검색
2. 관련 이슈가 없으면 새로운 이슈 생성
3. 이슈 템플릿에 따라 상세한 정보 기재

### 2. 브랜치 생성

기능이나 수정사항에 대한 브랜치를 생성하세요:

```bash
# 메인 브랜치에서 시작
git checkout main
git pull origin main

# 기능 브랜치 생성
git checkout -b feature/your-feature-name

# 또는 버그 수정 브랜치
git checkout -b fix/bug-description

# 또는 문서 수정 브랜치
git checkout -b docs/update-readme
```

### 3. 코드 작성

기능을 구현하거나 버그를 수정하세요:

- **코딩 컨벤션** 준수
- **테스트 코드** 작성
- **문서 업데이트** (필요시)
- **커밋 메시지** 컨벤션 준수

### 4. 테스트 실행

모든 변경사항에 대해 테스트를 실행하세요:

```bash
# 모든 테스트 실행
pnpm run test:e2e:all

# 특정 테스트만 실행
pnpm run test:e2e:stable

# 성능 테스트
pnpm run perf:baseline

# 코드 품질 검사
pnpm run lint
```

### 5. Pull Request 생성

변경사항을 커밋하고 Push한 후 PR을 생성하세요:

```bash
# 변경사항 커밋
git add .
git commit -m "feat: 새로운 기능 추가"

# Push
git push origin feature/your-feature-name
```

GitHub에서 Pull Request를 생성하세요.

## 📝 코딩 컨벤션

### JavaScript/React 컨벤션

#### 파일 및 폴더 구조

```
src/
├── components/
│   ├── ui/              # 재사용 가능한 UI 컴포넌트
│   ├── common/          # 공통 비즈니스 컴포넌트
│   └── pages/           # 페이지 컴포넌트
├── hooks/               # 커스텀 훅
├── utils/               # 유틸리티 함수
├── contexts/            # React Context
├── lib/                 # 라이브러리 설정
└── types/               # TypeScript 타입 (향후 적용)
```

#### 컴포넌트 작성 규칙

```jsx
// ✅ 좋은 예: 의미 있는 컴포넌트명과 구조
function UserProfileCard({ user, onEdit, loading }) {
  // 1. 커스텀 훅 사용으로 로직 분리
  const { formattedData, handleUpdate } = useUserProfile(user);

  // 2. 조기 리턴으로 에러/로딩 처리
  if (loading) return <LoadingSpinner />;
  if (!user) return <NotFoundMessage />;

  // 3. 의미 있는 변수명과 구조화
  const { name, email, avatar, role } = formattedData;

  return (
    <Card className="user-profile">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{role}</CardDescription>
      </CardHeader>
      <CardContent>
        <Avatar src={avatar} alt={name} />
        <div className="user-info">
          <p><strong>이메일:</strong> {email}</p>
          <Button onClick={() => handleUpdate(onEdit)}>
            프로필 수정
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ❌ 나쁜 예: 한 곳에 모든 로직 집중
function BadComponent({ data }) {
  const [x, setX] = useState(null); // 의미 없는 변수명
  // 복잡한 로직이 컴포넌트에 직접 포함됨
  // 에러 처리 부족
  // 구조화되지 않은 JSX
}
```

#### 커스텀 훅 작성 규칙

```jsx
// ✅ 좋은 예: 단일 책임 원칙 준수
function useUserProfile(userId) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API 호출 로직
  const fetchUser = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/users/${userId}`);
      setUser(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('사용자 정보 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 사용자 정보 업데이트 로직
  const updateUser = useCallback(async (updates) => {
    // 업데이트 로직
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    updateUser
  };
}
```

### 네이밍 컨벤션

#### 컴포넌트 및 파일명
```jsx
// ✅ 컴포넌트: PascalCase
function UserDashboard() { /* ... */ }
function DataTable() { /* ... */ }

// ✅ 파일명: PascalCase + .jsx
UserDashboard.jsx
DataTable.jsx

// ✅ 폴더명: camelCase
userManagement/
dataVisualization/
```

#### 변수 및 함수명
```jsx
// ✅ 카멜케이스 사용
const userName = 'John Doe';
const isLoading = false;
const handleSubmit = () => { /* ... */ };

// ✅ 의미 있는 이름 사용
// ✅ (좋음)
const filteredUsers = users.filter(user => user.active);
const calculateTotalRevenue = (orders) => { /* ... */ };

// ❌ (나쁨)
const x = users.filter(u => u.a);
const calc = (o) => { /* ... */ };
```

#### 상수
```jsx
// ✅ 대문자 스네이크케이스
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
```

### 주석 작성 규칙

```jsx
/**
 * 사용자 프로필을 표시하는 카드 컴포넌트
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {User} props.user - 사용자 객체
 * @param {Function} props.onEdit - 편집 핸들러 함수
 * @param {boolean} props.loading - 로딩 상태
 *
 * @returns {JSX.Element} 프로필 카드 컴포넌트
 *
 * @example
 * <UserProfileCard
 *   user={currentUser}
 *   onEdit={handleEdit}
 *   loading={isLoading}
 * />
 */
function UserProfileCard({ user, onEdit, loading }) {
  // 복잡한 로직에 대한 설명
  const processedData = useMemo(() => {
    // 데이터 변환 로직이 복잡한 경우 설명
    return user ? transformUserData(user) : null;
  }, [user]);

  // 조건문이 복잡한 경우 설명
  if (loading && !user) {
    // 로딩 중이면서 사용자 데이터가 없는 특별한 경우
    return <SkeletonLoader />;
  }

  return (
    <div>
      {/* JSX 내 인라인 주석은 최소화 */}
      {processedData && <UserInfo data={processedData} />}
    </div>
  );
}
```

## 🧪 테스트 작성

### E2E 테스트 작성 가이드

```typescript
// tests/user-profile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('사용자 프로필 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 전 설정
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('프로필 정보가 올바르게 표시된다', async ({ page }) => {
    // Given: 로그인된 상태
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();

    // When: 프로필 페이지로 이동
    await page.click('[data-testid="profile-link"]');

    // Then: 프로필 정보 확인
    await expect(page.locator('[data-testid="profile-name"]')).toHaveText('John Doe');
    await expect(page.locator('[data-testid="profile-email"]')).toHaveText('john@example.com');
  });

  test('프로필 수정 기능이 작동한다', async ({ page }) => {
    // Given: 프로필 페이지에 있음
    await page.goto('/profile');

    // When: 이름 수정
    await page.fill('[data-testid="name-input"]', 'Jane Doe');
    await page.click('[data-testid="save-button"]');

    // Then: 수정 성공 메시지 확인
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="profile-name"]')).toHaveText('Jane Doe');
  });
});
```

### 테스트 실행

```bash
# 모든 E2E 테스트
pnpm run test:e2e:all

# 특정 테스트 파일만
pnpm run test:e2e -- user-profile.spec.ts

# UI 모드로 디버깅
pnpm run test:e2e:ui

# 특정 브라우저만
pnpm run test:e2e -- --project=chromium
```

## 📤 Pull Request 가이드

### PR 템플릿

새로운 Pull Request를 생성할 때 다음 정보를 포함하세요:

```markdown
## 📝 변경사항 요약

<!-- 변경사항에 대한 간단한 설명 -->

## 🎯 관련 이슈

<!-- 관련 이슈 번호 (예: #123, #456) -->
Closes #

## 🔧 변경 유형

<!-- 해당되는 항목에 체크 -->
- [ ] 🐛 Bug fix (버그 수정)
- [ ] ✨ New feature (새로운 기능)
- [ ] 💥 Breaking change (호환성 깨짐)
- [ ] 📚 Documentation (문서)
- [ ] 🎨 Style (스타일)
- [ ] ♻️ Refactor (리팩토링)
- [ ] ⚡ Performance (성능)
- [ ] ✅ Test (테스트)

## 📋 체크리스트

- [ ] 코드 리뷰 완료
- [ ] 테스트 통과
- [ ] 문서 업데이트 (필요시)
- [ ] 브레이킹 체인지 확인

## 🧪 테스트 결과

<!-- 테스트 실행 결과 또는 스크린샷 -->

## 💡 추가 설명

<!-- 리뷰어에게 도움이 될 만한 추가 정보 -->
```

### 커밋 메시지 컨벤션

```bash
# 형식: type(scope): description

# 기능 추가
feat(dashboard): 실시간 KPI 차트 추가

# 버그 수정
fix(auth): 로그인 폼 유효성 검사 오류 수정

# 문서 업데이트
docs(readme): 설치 가이드 개선

# 스타일 변경
style(button): 버튼 컴포넌트 스타일링 개선

# 리팩토링
refactor(utils): 유틸리티 함수 모듈화

# 테스트 추가
test(auth): 로그인 컴포넌트 단위 테스트 추가

# 성능 개선
perf(chart): 차트 렌더링 성능 최적화

# 설정 변경
ci(docker): Docker 빌드 설정 개선
```

## 🐛 버그 리포트

버그를 발견하셨나요? 다음 정보를 포함해 이슈를 생성해주세요:

### 버그 리포트 템플릿

```markdown
## 🐛 버그 설명

<!-- 버그에 대한 명확한 설명 -->

## 🔄 재현 단계

1. 다음 페이지로 이동: '...'
2. 다음 버튼을 클릭: '...'
3. 스크롤하여 '....' 섹션 확인
4. 에러 발생

## 📱 예상 동작

<!-- 정상적인 경우 어떤 동작을 기대했는지 설명 -->

## 📷 스크린샷

<!-- 가능하다면 스크린샷 첨부 -->

## 🖥️ 환경 정보

- **OS**: [예: Windows 11, macOS Ventura]
- **브라우저**: [예: Chrome 120, Firefox 119]
- **Node.js 버전**: [예: 18.17.0]
- **npm/pnpm 버전**: [예: pnpm 8.15.0]

## 📋 추가 정보

<!-- 버그와 관련된 추가 정보 -->
```

## 💡 기능 요청

새로운 기능을 제안하고 싶으신가요?

### 기능 요청 템플릿

```markdown
## 💡 기능 요청

### 문제 설명
<!-- 현재 어떤 문제가 있는지 설명 -->

### 제안하는 해결책
<!-- 어떻게 해결하고 싶은지 설명 -->

### 대안 방안
<!-- 다른 해결 방법이 있다면 설명 -->

### 추가 정보
<!-- 디자인, 스크린샷, 링크 등 -->
```

## 🎯 코드 리뷰 가이드라인

### 리뷰어 체크리스트

- [ ] **기능 요구사항 충족**: PR이 요구사항을 올바르게 구현했는가?
- [ ] **코드 품질**: 코딩 컨벤션이 준수되었는가?
- [ ] **테스트 커버리지**: 충분한 테스트가 작성되었는가?
- [ ] **성능 영향**: 성능에 부정적인 영향을 미치지 않는가?
- [ ] **보안**: 보안 취약점이 없는가?
- [ ] **문서화**: 필요한 문서가 업데이트되었는가?

### 리뷰어 코멘트 예시

```markdown
✅ **좋은 점들:**
- 코드 구조가 깔끔하고 읽기 쉽습니다
- 적절한 에러 처리가 구현되었습니다
- 테스트 커버리지가 충분합니다

🔄 **개선 제안:**
- [ ] 이 부분의 변수명을 더 의미 있게 바꾸는 건 어떨까요?
- [ ] 여기서 early return을 사용하면 더 좋을 것 같습니다

❌ **반드시 수정해야 할 부분:**
- [ ] 이 함수에서 메모리 누수가 발생할 수 있습니다
- [ ] API 호출 시 에러 처리가 누락되었습니다
```

## 📞 지원

질문이 있으신가요?

- 💬 **토론**: [GitHub Discussions](https://github.com/your-org/kpi-dashboard/discussions)
- 🐛 **버그 리포트**: [Issues](https://github.com/your-org/kpi-dashboard/issues)
- 📧 **이메일**: maintainer@kpi-dashboard.dev

## 🙏 행동 강령

이 프로젝트는 모든 기여자를 존중하는 문화를 유지합니다:

- ✅ **존중**: 모든 사람을 존중하고 차별하지 않습니다
- ✅ **협력**: 건설적인 피드백을 제공합니다
- ✅ **책임**: 자신의 행동에 책임을 집니다
- ✅ **포용**: 다양한 의견을 환영합니다

---

**마지막 업데이트**: 2024-01-XX
**기여자 여러분의 참여에 감사드립니다! 🚀**

