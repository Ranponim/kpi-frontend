import React, { lazy, Suspense } from "react";

// 📈 차트 컴포넌트들을 lazy loading으로 최적화
const Dashboard = lazy(() => import("./Dashboard.optimized.jsx"));
const PreferenceManager = lazy(() => import("./PreferenceManager.jsx"));
const ResultsList = lazy(() => import("./ResultsList.jsx"));
const ResultsListV2 = lazy(() => import("./ResultsListV2.jsx"));

// 차트 관련 컴포넌트들 (recharts 사용)
const ResultDetail = lazy(() => import("./ResultDetail.jsx"));

// 프리로딩 함수들 - 사용자 인터랙션에 따라 미리 로드
export const preloadDashboard = () => import("./Dashboard.optimized.jsx");
export const preloadPreferenceManager = () => import("./PreferenceManager.jsx");
export const preloadResultsList = () => import("./ResultsList.jsx");
export const preloadResultsListV2 = () => import("./ResultsListV2.jsx");

// 차트 관련 프리로딩
export const preloadResultDetail = () => import("./ResultDetail.jsx");

// 네트워크 속도에 따른 지능형 프리로딩
export const preloadBasedOnNetworkSpeed = () => {
  // 네트워크 속도 확인 (지원되는 브라우저에서만)
  if ("connection" in navigator) {
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;

    console.log(`🌐 네트워크 속도: ${effectiveType}`);

    // 빠른 네트워크에서는 적극적으로 프리로드
    if (effectiveType === "4g" || effectiveType === "3g") {
      console.log("🚀 빠른 네트워크 감지 - 컴포넌트 프리로딩 시작");

      // 핵심 컴포넌트들을 백그라운드에서 프리로드
      setTimeout(() => {
        preloadDashboard().catch(console.warn);
      }, 1000);

      setTimeout(() => {
        preloadPreferenceManager().catch(console.warn);
        preloadResultsList().catch(console.warn);
        preloadResultsListV2().catch(console.warn);
      }, 2000);
    } else {
      console.log("📶 느린 네트워크 - 필요시에만 로드");
    }
  } else {
    // 네트워크 정보를 알 수 없는 경우 기본 프리로딩
    console.log("📶 네트워크 정보 불가 - 기본 프리로딩");
    setTimeout(() => {
      preloadDashboard().catch(console.warn);
    }, 2000);
  }
};

// 로딩 컴포넌트
const LoadingSpinner = ({ name = "컴포넌트" }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-600">{name} 로딩 중...</span>
  </div>
);

// Suspense로 감싼 컴포넌트들
export const SuspenseDashboard = ({ ...props }) => (
  <Suspense fallback={<LoadingSpinner name="Dashboard" />}>
    <Dashboard {...props} />
  </Suspense>
);

export const SuspensePreferenceManager = ({ ...props }) => (
  <Suspense fallback={<LoadingSpinner name="Preference" />}>
    <PreferenceManager {...props} />
  </Suspense>
);

export const SuspenseResultsList = ({ ...props }) => (
  <Suspense fallback={<LoadingSpinner name="분석 결과" />}>
    <ResultsList {...props} />
  </Suspense>
);

export const SuspenseResultsListV2 = ({ ...props }) => (
  <Suspense fallback={<LoadingSpinner name="분석 결과 V2" />}>
    <ResultsListV2 {...props} />
  </Suspense>
);

export const SuspenseResultDetail = ({ ...props }) => (
  <Suspense fallback={<LoadingSpinner name="결과 상세" />}>
    <ResultDetail {...props} />
  </Suspense>
);

// 기본 컴포넌트들 (하위 호환성)
export { Dashboard, PreferenceManager, ResultsList, ResultsListV2 };
