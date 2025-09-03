#!/bin/bash

# Docker 실행 예제 스크립트
# 이 스크립트를 실행하면 다양한 환경에서 Docker 컨테이너를 실행할 수 있습니다

echo "=== KPI Dashboard Frontend Docker 실행 예제 ==="

# 1. 기본 실행 (환경변수 없이 - 기본값 사용)
echo "1. 기본 실행 (환경변수 없이):"
echo "docker run -d -p 8080:80 --name kpi-frontend kpi-dashboard-frontend:latest"
echo ""

# 2. 환경변수로 백엔드 URL 설정
echo "2. 환경변수로 백엔드 URL 설정:"
echo "docker run -d -p 8080:80 \\"
echo "  -e BACKEND_BASE_URL='http://165.213.69.30:8000' \\"
echo "  -e VITE_API_BASE_URL='http://165.213.69.30:8000/api' \\"
echo "  --name kpi-frontend-env kpi-dashboard-frontend:latest"
echo ""

# 3. 다른 백엔드 URL 설정 예제
echo "3. 다른 백엔드 URL 설정 예제:"
echo "docker run -d -p 8080:80 \\"
echo "  -e BACKEND_BASE_URL='http://your-server.com:8000' \\"
echo "  -e VITE_API_BASE_URL='http://your-server.com:8000/api' \\"
echo "  --name kpi-frontend-custom kpi-dashboard-frontend:latest"
echo ""

# 4. 개발 환경용 실행
echo "4. 개발 환경용 실행:"
echo "docker run -d -p 8080:80 \\"
echo "  -e BACKEND_BASE_URL='http://localhost:8000' \\"
echo "  -e VITE_API_BASE_URL='http://localhost:8000/api' \\"
echo "  --name kpi-frontend-dev kpi-dashboard-frontend:latest"
echo ""

# 5. 데이터베이스 설정 포함
echo "5. 데이터베이스 설정 포함:"
echo "docker run -d -p 8080:80 \\"
echo "  -e BACKEND_BASE_URL='http://165.213.69.30:8000' \\"
echo "  -e VITE_API_BASE_URL='http://165.213.69.30:8000/api' \\"
echo "  -e DB_HOST='165.213.69.30' \\"
echo "  -e DB_PORT='5432' \\"
echo "  -e DB_USER='kpi_user' \\"
echo "  -e DB_NAME='kpi_db' \\"
echo "  --name kpi-frontend-full kpi-dashboard-frontend:latest"
echo ""

echo "=== 실행 후 확인 방법 ==="
echo "1. 컨테이너 로그 확인:"
echo "docker logs kpi-frontend"
echo ""
echo "2. 컨테이너 접속:"
echo "docker exec -it kpi-frontend /bin/sh"
echo ""
echo "3. 브라우저에서 확인:"
echo "http://localhost:8080"
echo ""
echo "4. API URL 확인:"
echo "브라우저 콘솔에서: console.log(window.__RUNTIME_CONFIG__)"
echo ""

echo "=== Docker Compose 사용 (권장) ==="
echo "docker-compose.yml 파일을 만들어 사용하세요:"
cat << 'EOF'
version: '3.8'
services:
  frontend:
    image: kpi-dashboard-frontend:latest
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
EOF
