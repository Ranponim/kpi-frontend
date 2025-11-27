#!/bin/sh
set -e

# Nginx 런타임 환경변수 주입을 위해 기본값 안내 로그
echo "[entrypoint] BACKEND_BASE_URL=${BACKEND_BASE_URL:-unset} VITE_API_BASE_URL=${VITE_API_BASE_URL:-unset}"
echo "[entrypoint] EMS_API_URL=${EMS_API_URL:-unset}"
echo "[entrypoint] DB_HOST=${DB_HOST:-unset} DB_PORT=${DB_PORT:-unset} DB_USER=${DB_USER:-unset} DB_NAME=${DB_NAME:-unset}"

# 환경변수 확인 및 기본값 설정 (강제 적용)
BACKEND_BASE_URL="${BACKEND_BASE_URL:-http://165.213.69.30:8000}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://165.213.69.30:8000/api}"
EMS_API_URL="${EMS_API_URL:-http://10.246.183.251:8888}"

# 환경변수가 설정되지 않은 경우 강제로 설정
if [ "$BACKEND_BASE_URL" = "unset" ] || [ -z "$BACKEND_BASE_URL" ]; then
  BACKEND_BASE_URL="http://165.213.69.30:8000"
fi

if [ "$VITE_API_BASE_URL" = "unset" ] || [ -z "$VITE_API_BASE_URL" ]; then
  VITE_API_BASE_URL="http://165.213.69.30:8000/api"
fi

if [ "$EMS_API_URL" = "unset" ] || [ -z "$EMS_API_URL" ]; then
  EMS_API_URL="http://10.246.183.251:8888"
fi

echo "[entrypoint] Final BACKEND_BASE_URL: $BACKEND_BASE_URL"
echo "[entrypoint] Final VITE_API_BASE_URL: $VITE_API_BASE_URL"
echo "[entrypoint] Final EMS_API_URL: $EMS_API_URL"

# runtime-config.js 생성 (정적 파일로 제공) - 강제 값 적용
cat <<EOF > /usr/share/nginx/html/runtime-config.js
// Docker 환경용 런타임 설정
// 이 파일은 docker-entrypoint.sh에서 동적으로 생성됩니다
window.__RUNTIME_CONFIG__ = {
  BACKEND_BASE_URL: "$BACKEND_BASE_URL",
  VITE_API_BASE_URL: "$VITE_API_BASE_URL",
  EMS_API_URL: "$EMS_API_URL",
  DB_HOST: "${DB_HOST:-}",
  DB_PORT: "${DB_PORT:-5432}",
  DB_USER: "${DB_USER:-postgres}",
  DB_PASSWORD: "${DB_PASSWORD:-}",
  DB_NAME: "${DB_NAME:-postgres}",
  ENVIRONMENT: "docker"
};

// 설정 검증을 위한 로그
console.log('[Runtime Config] Docker 환경 설정 적용됨:', window.__RUNTIME_CONFIG__);
EOF

echo "[entrypoint] Runtime config generated successfully with Docker settings"

# 생성된 파일 확인
if [ -f "/usr/share/nginx/html/runtime-config.js" ]; then
  echo "[entrypoint] runtime-config.js 생성 확인:"
  cat /usr/share/nginx/html/runtime-config.js
else
  echo "[entrypoint] ERROR: runtime-config.js 파일이 생성되지 않았습니다!"
  exit 1
fi

exec nginx -g 'daemon off;'


