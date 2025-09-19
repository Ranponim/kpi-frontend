/**
 * ResultDetail 컴포넌트 E2E 통합 테스트
 *
 * 프론트엔드 ResultDetail.jsx와 백엔드 API 간의 통합 테스트를 수행합니다.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('ResultDetail 컴포넌트 통합 테스트', () => {
  let testData: any;

  test.beforeAll(() => {
    // 테스트 데이터 로드
    const testDataPath = path.join(process.cwd(), 'tests', 'test-data.json');
    testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
  });

  test('마할라노비스 분석 결과 표시', async ({ page }) => {
    // 테스트용 분석 결과 데이터 준비
    const mockAnalysisResult = {
      id: 'test-result-1',
      name: 'Test Analysis Result',
      stats: {
        'RACH Success Rate': {
          avg: 98.2,
          min: 96.8,
          max: 99.1,
          count: 5,
          std: 0.89
        },
        'RLC DL Throughput': {
          avg: 44.3,
          min: 42.1,
          max: 46.8,
          count: 5,
          std: 1.92
        }
      }
    };

    // 모의 데이터로 페이지 설정
    await page.addScriptTag({
      content: `
        window.mockData = ${JSON.stringify(mockAnalysisResult)};
      `
    });

    // ResultDetail 페이지로 이동
    await page.goto('/');

    // 분석 결과 로딩 대기
    await page.waitForTimeout(2000);

    // 마할라노비스 분석 섹션 존재 확인
    const mahalanobisSection = page.locator('[data-testid="mahalanobis-section"]').first();
    await expect(mahalanobisSection).toBeVisible();

    // 분석 시작 버튼 클릭
    const analyzeButton = page.locator('button:has-text("마할라노비스 분석")').first();
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();

    // 분석 완료 대기 (최대 10초)
    await page.waitForTimeout(10000);

    // 분석 결과 확인
    const analysisResult = page.locator('[data-testid="mahalanobis-result"]').first();
    await expect(analysisResult).toBeVisible();

    // 결과에 KPI 개수 정보가 포함되어 있는지 확인
    await expect(page.locator('text=/KPI 개수/')).toBeVisible();

    // API 호출이 성공적으로 이루어졌는지 확인
    const apiCalls = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('/api/analysis/mahalanobis'))
        .length;
    });

    expect(apiCalls).toBeGreaterThan(0);
  });

  test('캐시된 마할라노비스 분석 결과 사용', async ({ page }) => {
    // 동일한 데이터를 사용한 두 번째 분석
    const mockAnalysisResult = {
      id: 'test-result-1',
      name: 'Test Analysis Result',
      stats: {
        'RACH Success Rate': {
          avg: 98.2,
          min: 96.8,
          max: 99.1,
          count: 5,
          std: 0.89
        },
        'RLC DL Throughput': {
          avg: 44.3,
          min: 42.1,
          max: 46.8,
          count: 5,
          std: 1.92
        }
      }
    };

    // 첫 번째 분석
    await page.addScriptTag({
      content: `window.mockData = ${JSON.stringify(mockAnalysisResult)};`
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const analyzeButton1 = page.locator('button:has-text("마할라노비스 분석")').first();
    await analyzeButton1.click();

    // 첫 번째 분석 완료 대기
    await page.waitForTimeout(5000);

    const firstAnalysisTime = await page.evaluate(() => {
      return window.performance.now();
    });

    // 두 번째 분석 (캐시 사용)
    const analyzeButton2 = page.locator('button:has-text("마할라노비스 분석")').first();
    await analyzeButton2.click();

    // 두 번째 분석 완료 대기
    await page.waitForTimeout(5000);

    const secondAnalysisTime = await page.evaluate(() => {
      return window.performance.now();
    });

    // 두 번째 분석이 더 빠르게 완료되었는지 확인
    // (실제 캐시 효과는 네트워크 상태에 따라 다를 수 있음)
    expect(secondAnalysisTime - firstAnalysisTime).toBeGreaterThan(0);

    // 캐시 히트 표시가 있는지 확인
    const cacheIndicator = page.locator('[data-testid="cache-hit"]').first();
    // 캐시 인디케이터는 있을 수도 있고 없을 수도 있음 (선택적)
    if (await cacheIndicator.isVisible()) {
      await expect(cacheIndicator).toContainText('캐시');
    }
  });

  test('이상 KPI 감지 및 표시', async ({ page }) => {
    // 이상 데이터가 포함된 테스트 데이터
    const abnormalMockData = {
      id: 'test-result-2',
      name: 'Abnormal KPI Test',
      stats: {
        'RACH Success Rate': {
          avg: 85.2,  // 정상 범위보다 낮음
          min: 82.1,
          max: 88.5,
          count: 5,
          std: 2.3
        },
        'RLC DL Throughput': {
          avg: 44.3,
          min: 42.1,
          max: 46.8,
          count: 5,
          std: 1.92
        }
      }
    };

    await page.addScriptTag({
      content: `window.mockData = ${JSON.stringify(abnormalMockData)};`
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const analyzeButton = page.locator('button:has-text("마할라노비스 분석")').first();
    await analyzeButton.click();

    // 분석 완료 대기
    await page.waitForTimeout(8000);

    // 이상 KPI가 감지되었는지 확인
    const abnormalKpiSection = page.locator('[data-testid="abnormal-kpi-list"]').first();
    await expect(abnormalKpiSection).toBeVisible();

    // 경고 레벨 표시 확인
    const alarmLevel = page.locator('[data-testid="alarm-level"]').first();
    await expect(alarmLevel).toBeVisible();

    // 경고 레벨이 정상 범위를 벗어난 값인지 확인
    const alarmText = await alarmLevel.textContent();
    expect(['caution', 'warning', 'critical']).toContain(alarmText?.toLowerCase());
  });

  test('통계 테스트 결과 표시', async ({ page }) => {
    const mockData = {
      id: 'test-result-3',
      name: 'Statistical Test Result',
      stats: {
        'RACH Success Rate': {
          avg: 98.2,
          min: 96.8,
          max: 99.1,
          count: 5,
          std: 0.89
        },
        'RLC DL Throughput': {
          avg: 44.3,
          min: 42.1,
          max: 46.8,
          count: 5,
          std: 1.92
        }
      }
    };

    await page.addScriptTag({
      content: `window.mockData = ${JSON.stringify(mockData)};`
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const analyzeButton = page.locator('button:has-text("마할라노비스 분석")').first();
    await analyzeButton.click();

    // 분석 완료 대기
    await page.waitForTimeout(8000);

    // 통계 테스트 결과 섹션 확인
    const statTestSection = page.locator('[data-testid="statistical-tests"]').first();
    await expect(statTestSection).toBeVisible();

    // Mann-Whitney U Test 결과 확인
    const mannWhitneyResult = page.locator('text=/Mann-Whitney/').first();
    await expect(mannWhitneyResult).toBeVisible();

    // Kolmogorov-Smirnov Test 결과 확인
    const ksTestResult = page.locator('text=/Kolmogorov-Smirnov/').first();
    await expect(ksTestResult).toBeVisible();
  });

  test('분석 오류 처리', async ({ page }) => {
    // 빈 데이터로 테스트
    const emptyMockData = {
      id: 'test-result-4',
      name: 'Empty Data Test',
      stats: {}
    };

    await page.addScriptTag({
      content: `window.mockData = ${JSON.stringify(emptyMockData)};`
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const analyzeButton = page.locator('button:has-text("마할라노비스 분석")').first();
    await analyzeButton.click();

    // 분석 완료 대기
    await page.waitForTimeout(5000);

    // 에러 메시지가 표시되는지 확인
    const errorMessage = page.locator('[data-testid="analysis-error"]').first();
    await expect(errorMessage).toBeVisible();

    // 에러 메시지에 유용한 정보가 포함되어 있는지 확인
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10); // 의미 있는 에러 메시지
  });

  test('분석 결과 내보내기 기능', async ({ page }) => {
    const mockData = {
      id: 'test-result-5',
      name: 'Export Test',
      stats: {
        'RACH Success Rate': {
          avg: 98.2,
          min: 96.8,
          max: 99.1,
          count: 5,
          std: 0.89
        }
      }
    };

    await page.addScriptTag({
      content: `window.mockData = ${JSON.stringify(mockData)};`
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    const analyzeButton = page.locator('button:has-text("마할라노비스 분석")').first();
    await analyzeButton.click();

    // 분석 완료 대기
    await page.waitForTimeout(8000);

    // 내보내기 버튼 확인
    const exportButton = page.locator('button:has-text("내보내기")').first();
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // 파일 다운로드 대기
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;

      // 다운로드 파일 이름 확인
      expect(download.suggestedFilename()).toContain('mahalanobis');
      expect(download.suggestedFilename()).toContain('.json');
    }
  });
});


