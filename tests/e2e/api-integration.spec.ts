/**
 * 백엔드 API 통합 테스트
 *
 * 프론트엔드에서 백엔드 API로의 HTTP 요청을 테스트합니다.
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

test.describe('백엔드 API 통합 테스트', () => {
  test('마할라노비스 분석 API 연결성 테스트', async ({ page }) => {
    // 백엔드 API 직접 호출
    const response = await page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis`, {
      data: {
        kpiData: {
          "RACH Success Rate": [98.5, 97.2, 99.1, 96.8, 98.3],
          "RLC DL Throughput": [45.2, 42.1, 46.8, 43.5, 44.9]
        },
        threshold: 0.1,
        sampleSize: 10,
        significanceLevel: 0.05
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('data');
    expect(responseData).toHaveProperty('processing_time');
  });

  test('빠른 마할라노비스 분석 API 테스트', async ({ page }) => {
    const response = await page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis/quick`, {
      data: {
        kpiData: {
          "RACH Success Rate": [98.5, 97.2, 99.1],
          "RLC DL Throughput": [45.2, 42.1, 46.8]
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('data');
  });

  test('통계 테스트 API 테스트', async ({ page }) => {
    // Mann-Whitney U Test
    const mwResponse = await page.request.post(`${BACKEND_URL}/api/statistical-tests/mann-whitney-u`, {
      data: {
        groupA: [98.5, 97.8, 99.2, 96.7, 98.1],
        groupB: [85.2, 87.3, 84.9, 86.1, 85.8],
        significanceLevel: 0.05
      }
    });

    expect(mwResponse.ok()).toBeTruthy();
    const mwData = await mwResponse.json();
    expect(mwData).toHaveProperty('success', true);
    expect(mwData).toHaveProperty('result');
    expect(mwData.result).toHaveProperty('test_name', 'Mann-Whitney U');

    // Kolmogorov-Smirnov Test
    const ksResponse = await page.request.post(`${BACKEND_URL}/api/statistical-tests/kolmogorov-smirnov`, {
      data: {
        groupA: [98.5, 97.8, 99.2, 96.7, 98.1],
        groupB: [85.2, 87.3, 84.9, 86.1, 85.8],
        significanceLevel: 0.05
      }
    });

    expect(ksResponse.ok()).toBeTruthy();
    const ksData = await ksResponse.json();
    expect(ksData).toHaveProperty('success', true);
    expect(ksData).toHaveProperty('result');
    expect(ksData.result).toHaveProperty('test_name', 'Kolmogorov-Smirnov');
  });

  test('캐시 통계 API 테스트', async ({ page }) => {
    const response = await page.request.get(`${BACKEND_URL}/api/analysis/cache/stats`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const stats = await response.json();
    expect(stats).toHaveProperty('cache_type');
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('hit_rate');
    expect(stats).toHaveProperty('mahalanobis_entries');
    expect(stats).toHaveProperty('performance_metrics');
  });

  test('캐시 정리 API 테스트', async ({ page }) => {
    const response = await page.request.post(`${BACKEND_URL}/api/analysis/cache/clear`, {
      data: {
        pattern: "mahalanobis:*"
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const result = await response.json();
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('cleared_count');
    expect(result).toHaveProperty('pattern');
  });

  test('API 건강 상태 확인', async ({ page }) => {
    // 마할라노비스 분석 건강 상태
    const mahalanobisHealth = await page.request.get(`${BACKEND_URL}/api/analysis/mahalanobis/health`);
    expect(mahalanobisHealth.ok()).toBeTruthy();
    const mahalanobisData = await mahalanobisHealth.json();
    expect(mahalanobisData).toHaveProperty('status');
    expect(['healthy', 'unhealthy'].includes(mahalanobisData.status)).toBeTruthy();

    // 통계 테스트 건강 상태
    const statHealth = await page.request.get(`${BACKEND_URL}/api/statistical-tests/health`);
    expect(statHealth.ok()).toBeTruthy();
    const statData = await statHealth.json();
    expect(statData).toHaveProperty('status');
    expect(['healthy', 'degraded', 'unhealthy'].includes(statData.status)).toBeTruthy();
  });

  test('API 에러 처리 테스트', async ({ page }) => {
    // 잘못된 데이터로 요청
    const invalidResponse = await page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis`, {
      data: {
        kpiData: {}, // 빈 KPI 데이터
        threshold: 0.1,
        sampleSize: 10,
        significanceLevel: 0.05
      }
    });

    expect(invalidResponse.status()).toBe(200); // 현재 구현에서는 200으로 에러 응답

    const errorData = await invalidResponse.json();
    expect(errorData).toHaveProperty('success', false);
    expect(errorData).toHaveProperty('message');
  });

  test('API 응답 시간 측정', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis`, {
      data: {
        kpiData: {
          "Test KPI": [100.0, 99.8, 100.2, 99.9, 100.1]
        },
        threshold: 0.1,
        sampleSize: 10,
        significanceLevel: 0.05
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(5000); // 5초 이내 응답

    const responseData = await response.json();
    expect(responseData).toHaveProperty('processing_time');
    expect(responseData.processing_time).toBeLessThan(2.0); // 2초 이내 처리
  });

  test('캐시 효과 검증', async ({ page }) => {
    const testData = {
      kpiData: {
        "Cache Test KPI": [100.0, 99.8, 100.2, 99.9, 100.1]
      },
      threshold: 0.1,
      sampleSize: 10,
      significanceLevel: 0.05
    };

    // 첫 번째 요청
    const firstStart = Date.now();
    const firstResponse = await page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis`, {
      data: testData
    });
    const firstTime = Date.now() - firstStart;

    expect(firstResponse.ok()).toBeTruthy();
    const firstData = await firstResponse.json();
    expect(firstData).toHaveProperty('cacheHit', false);

    // 동일한 데이터로 두 번째 요청 (캐시 효과)
    const secondStart = Date.now();
    const secondResponse = await page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis`, {
      data: testData
    });
    const secondTime = Date.now() - secondStart;

    expect(secondResponse.ok()).toBeTruthy();
    const secondData = await secondResponse.json();

    // 캐시 히트 여부 확인 (환경에 따라 다를 수 있음)
    if (secondData.cacheHit === true) {
      // 캐시가 작동하면 두 번째 요청이 더 빠름
      expect(secondTime).toBeLessThanOrEqual(firstTime);
    }

    // 결과 일관성 확인
    expect(firstData.data.totalKpis).toBe(secondData.data.totalKpis);
  });

  test('동시성 테스트', async ({ page }) => {
    const testData = {
      kpiData: {
        "Concurrency Test KPI": [100.0, 99.8, 100.2]
      },
      threshold: 0.1,
      sampleSize: 10,
      significanceLevel: 0.05
    };

    // 5개의 동시 요청
    const requests = Array(5).fill(null).map(() =>
      page.request.post(`${BACKEND_URL}/api/analysis/mahalanobis`, {
        data: testData
      })
    );

    const responses = await Promise.all(requests);

    // 모든 요청이 성공해야 함
    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    // 모든 응답 데이터 검증
    const responseData = await Promise.all(
      responses.map(response => response.json())
    );

    responseData.forEach(data => {
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('processing_time');
    });
  });
});


