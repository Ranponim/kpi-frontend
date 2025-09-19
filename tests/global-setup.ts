/**
 * Playwright 전역 설정 파일
 *
 * 테스트 실행 전 백엔드 서버와 데이터베이스 설정을 담당합니다.
 */

import { chromium, FullConfig } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  console.log('🔧 프론트엔드-백엔드 통합 테스트 환경 설정 중...');

  // 백엔드 서버 상태 확인 및 시작
  await ensureBackendServer();

  // 테스트 데이터 준비
  await prepareTestData();

  console.log('✅ 통합 테스트 환경 설정 완료');
}

async function ensureBackendServer() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  try {
    // 백엔드 서버가 실행 중인지 확인
    const response = await fetch(`${backendUrl}/health`, {
      timeout: 5000
    });

    if (response.ok) {
      console.log('✅ 백엔드 서버가 이미 실행 중입니다');
      return;
    }
  } catch (error) {
    console.log('⚠️ 백엔드 서버가 실행되지 않았습니다. 서버를 시작합니다...');
  }

  // 백엔드 서버 시작 (비동기)
  const backendDir = path.join(process.cwd(), '..', 'backend');

  return new Promise<void>((resolve, reject) => {
    const backendProcess = spawn('python', ['main.py'], {
      cwd: backendDir,
      stdio: 'pipe',
      detached: true
    });

    // 백엔드 서버 시작 대기
    let serverReady = false;
    const timeout = setTimeout(() => {
      if (!serverReady) {
        console.error('❌ 백엔드 서버 시작 시간 초과');
        backendProcess.kill();
        reject(new Error('Backend server startup timeout'));
      }
    }, 30000); // 30초 타임아웃

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Backend:', output);

      if (output.includes('Application startup complete') || output.includes('Uvicorn running')) {
        serverReady = true;
        clearTimeout(timeout);
        console.log('✅ 백엔드 서버가 성공적으로 시작되었습니다');
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error('Backend Error:', data.toString());
    });

    backendProcess.on('close', (code) => {
      if (code !== 0 && !serverReady) {
        clearTimeout(timeout);
        reject(new Error(`Backend server exited with code ${code}`));
      }
    });

    // 프로세스 ID 저장 (테스트 종료 시 정리용)
    fs.writeFileSync(path.join(process.cwd(), 'tests', '.backend.pid'), backendProcess.pid.toString());
  });
}

async function prepareTestData() {
  console.log('📊 테스트 데이터 준비 중...');

  // 테스트용 KPI 데이터베이스 초기화
  const testData = {
    kpiData: {
      "RACH Success Rate": [98.5, 97.2, 99.1, 96.8, 98.3],
      "RLC DL Throughput": [45.2, 42.1, 46.8, 43.5, 44.9],
      "Normal KPI": [100.0, 99.8, 100.2, 99.9, 100.1]
    },
    timestamps: [
      "2024-01-01T10:00:00Z",
      "2024-01-01T11:00:00Z",
      "2024-01-01T12:00:00Z",
      "2024-01-01T13:00:00Z",
      "2024-01-01T14:00:00Z"
    ],
    periodLabels: ["N-1", "N-2", "N-3", "N-4", "N-5"]
  };

  // 테스트 데이터를 파일로 저장
  const testDataPath = path.join(process.cwd(), 'tests', 'test-data.json');
  fs.writeFileSync(testDataPath, JSON.stringify(testData, null, 2));

  console.log('✅ 테스트 데이터 준비 완료');
}

export default globalSetup;


