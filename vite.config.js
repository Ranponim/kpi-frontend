import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 번들 분석기 (분석 모드에서만 활성화)
    process.env.ANALYZE &&
      visualizer({
        filename: "dist/bundle-analysis.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  // API 프록시 설정 - 환경변수 우선 사용
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://165.213.69.30:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, res) => {
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, res) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
      // EMS/NE/Cell 목록 API 프록시 (CORS 우회)
      "/ems-api": {
        target: "http://10.246.183.251:8888",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ems-api/, ""),
      },
    },
  },

  // 환경변수 설정
  define: {
    // Docker 환경에서 사용할 기본 API URL
    __DOCKER_API_BASE_URL__: JSON.stringify(
      process.env.VITE_API_BASE_URL || "http://165.213.69.30:8000/api"
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 청크 크기 경고 임계값 설정 (500KB -> 300KB)
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      // 모듈 초기화 순서 문제 해결을 위한 설정
      external: [],
      output: {
        // 모듈 초기화 순서 보장
        format: "es",
        // 청크 간 의존성 문제 해결
        interop: "auto",
        // 수동 청크 분할 설정 (React 안전하게 처리)
        manualChunks: (id) => {
          // 큰 페이지 컴포넌트들을 별도 청크로 분리 (코드 스플리팅)
          if (id.includes("/src/components/Dashboard")) {
            return "dashboard-page";
          }
          if (id.includes("/src/components/PreferenceManager")) {
            return "preference-page";
          }
          if (id.includes("/src/components/ResultsList")) {
            return "results-page";
          }

          // 공통 컴포넌트들을 별도 청크로 분리
          if (id.includes("/src/components/common/")) {
            return "common-components";
          }

          // 차트 관련 라이브러리들을 vendor 청크에 포함하여 초기화 문제 해결
          // (별도 청크로 분리하지 않고 vendor에 포함)

          // Radix UI 라이브러리들 (UI 컴포넌트)
          if (id.includes("@radix-ui")) {
            return "ui-vendor";
          }

          // Lucide React 아이콘들
          if (id.includes("lucide-react")) {
            return "icon-vendor";
          }

          // 유틸리티 라이브러리들
          if (
            id.includes("date-fns") ||
            id.includes("lodash") ||
            id.includes("clsx") ||
            id.includes("class-variance-authority")
          ) {
            return "utils-vendor";
          }

          // 폼 관련 라이브러리들
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("zod")
          ) {
            return "form-vendor";
          }

          // 애니메이션 라이브러리
          if (id.includes("framer-motion")) {
            return "animation-vendor";
          }

          // React와 React-DOM은 vendor 청크에 함께 포함 (분리하지 않음)
          // Node modules를 별도로 분리
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        // 청크 파일명에 해시 추가하여 캐싱 문제 방지
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                .replace(".jsx", "")
                .replace(".js", "")
            : "chunk";
          return `assets/${facadeModuleId}-[hash].js`;
        },
        // 에셋 파일명도 해시 추가
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
