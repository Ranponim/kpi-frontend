/**
 * AnalysisResultV2Display.jsx
 *
 * V2 API 분석 결과 표시 컴포넌트
 * Choi 알고리즘, LLM 분석, PEG 비교 결과를 통합 표시
 */

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import {
  Brain,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Gauge,
} from "lucide-react";

/**
 * Choi 알고리즘 결과 표시
 */
const ChoiResultDisplay = ({ choiResult }) => {
  if (!choiResult || !choiResult.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Choi 알고리즘 판정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            이 분석에는 Choi 알고리즘 판정이 포함되지 않았습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    normal: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      badgeVariant: "success",
      label: "정상",
    },
    warning: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      badgeVariant: "warning",
      label: "주의",
    },
    critical: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      badgeVariant: "destructive",
      label: "위험",
    },
  };

  const config = statusConfig[choiResult.status] || statusConfig.normal;
  const Icon = config.icon;

  return (
    <Card className={`${config.borderColor} border-2`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Choi 알고리즘 판정
          </div>
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`p-4 rounded-lg ${config.bgColor} flex items-center gap-4`}
        >
          <Icon className={`h-12 w-12 ${config.color}`} />
          <div className="flex-1">
            {choiResult.score !== undefined && (
              <div className="text-2xl font-bold mb-1">
                점수: {choiResult.score.toFixed(2)}
              </div>
            )}
            {choiResult.message && (
              <p className="text-sm text-muted-foreground">
                {choiResult.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * LLM 분석 결과 표시
 *
 * 개선 사항:
 * - 문제점과 권장사항을 가로로 배치하여 한 화면에 더 많이 표시
 * - 반응형 레이아웃 적용
 */
const LLMAnalysisDisplay = ({ llmAnalysis }) => {
  if (!llmAnalysis) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          LLM 분석 결과 (Enhanced)
        </CardTitle>
        {llmAnalysis.model_name && (
          <CardDescription>모델: {llmAnalysis.model_name}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Executive Summary - 전체 너비 */}
        {llmAnalysis.executive_summary && (
          <div>
            <h4 className="font-semibold mb-2">📝 Executive Summary</h4>
            <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
              {llmAnalysis.executive_summary}
            </p>
          </div>
        )}

        {/* Diagnostic Findings */}
        {llmAnalysis.diagnostic_findings &&
          llmAnalysis.diagnostic_findings.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  진단 결과 ({llmAnalysis.diagnostic_findings.length}개)
                </h4>
                <div className="space-y-3">
                  {llmAnalysis.diagnostic_findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 bg-red-50/30 hover:bg-red-50/50 transition-colors"
                    >
                      <div className="space-y-2">
                        {/* Primary Hypothesis */}
                        {finding.primary_hypothesis && (
                          <div>
                            <span className="font-semibold text-sm text-red-700">
                              🔍 주요 가설:
                            </span>
                            <p className="text-sm mt-1">
                              {finding.primary_hypothesis}
                            </p>
                          </div>
                        )}

                        {/* Supporting Evidence */}
                        {finding.supporting_evidence && (
                          <div>
                            <span className="font-semibold text-sm text-blue-700">
                              📊 지지 증거:
                            </span>
                            <p className="text-sm mt-1 whitespace-pre-wrap">
                              {finding.supporting_evidence}
                            </p>
                          </div>
                        )}

                        {/* Confounding Factors Assessment */}
                        {finding.confounding_factors_assessment && (
                          <div>
                            <span className="font-semibold text-sm text-orange-700">
                              ⚠️ 교란 요인 평가:
                            </span>
                            <p className="text-sm mt-1 whitespace-pre-wrap">
                              {finding.confounding_factors_assessment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        {/* Recommended Actions */}
        {llmAnalysis.recommended_actions &&
          llmAnalysis.recommended_actions.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  권장 조치 사항 ({llmAnalysis.recommended_actions.length}개)
                </h4>
                <div className="space-y-3">
                  {llmAnalysis.recommended_actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 bg-green-50/30 hover:bg-green-50/50 transition-colors"
                    >
                      <div className="space-y-2">
                        {/* Priority & Action */}
                        <div className="flex items-start gap-2">
                          {action.priority && (
                            <span
                              className={`
                              inline-flex items-center justify-center px-2 py-1 
                              text-xs font-bold rounded shrink-0
                              ${
                                action.priority === "P1"
                                  ? "bg-red-100 text-red-700"
                                  : action.priority === "P2"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                            `}
                            >
                              {action.priority}
                            </span>
                          )}
                          {action.action && (
                            <p className="text-sm font-semibold flex-1">
                              {action.action}
                            </p>
                          )}
                        </div>

                        {/* Details */}
                        {action.details && (
                          <div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {action.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        {/* Technical Analysis - 기술적 상세 분석 */}
        {llmAnalysis.technical_analysis && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                기술적 상세 분석
              </h4>
              <p className="text-sm whitespace-pre-wrap bg-purple-50/30 p-3 rounded-lg border">
                {llmAnalysis.technical_analysis}
              </p>
            </div>
          </>
        )}

        {/* Key Findings - 핵심 발견 사항 */}
        {llmAnalysis.key_findings && llmAnalysis.key_findings.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                핵심 발견 사항 ({llmAnalysis.key_findings.length}개)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {llmAnalysis.key_findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm p-2 bg-amber-50/30 rounded-lg border"
                  >
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Cells with Significant Change - 유의미한 변화 셀 */}
        {llmAnalysis.cells_with_significant_change &&
          llmAnalysis.cells_with_significant_change.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  유의미한 변화 셀 (
                  {llmAnalysis.cells_with_significant_change.length}개)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {llmAnalysis.cells_with_significant_change.map(
                    (cell, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-700"
                      >
                        {cell}
                      </span>
                    )
                  )}
                </div>
              </div>
            </>
          )}

        {/* Action Plan - 단계별 실행 계획 */}
        {llmAnalysis.action_plan && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-teal-500" />
                단계별 실행 계획
              </h4>
              <p className="text-sm whitespace-pre-wrap bg-teal-50/30 p-3 rounded-lg border">
                {llmAnalysis.action_plan}
              </p>
            </div>
          </>
        )}

        {/* PEG 인사이트가 있다면 그리드로 표시 */}
        {llmAnalysis.peg_insights &&
          Object.keys(llmAnalysis.peg_insights).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  PEG 인사이트 ({Object.keys(llmAnalysis.peg_insights).length}
                  개)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(llmAnalysis.peg_insights).map(
                    ([pegName, insight], idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-3 bg-blue-50/30 hover:bg-blue-50/50 transition-colors"
                      >
                        <div className="font-semibold text-sm mb-1 text-blue-700">
                          {pegName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {insight}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          )}

        {/* 신뢰도 */}
        {llmAnalysis.confidence !== undefined && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">신뢰도:</span>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${llmAnalysis.confidence * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground">
                {(llmAnalysis.confidence * 100).toFixed(1)}%
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * PEG 비교 결과 표시
 *
 * 개선 사항:
 * - PEG 항목들을 그리드 레이아웃으로 배치 (가로 2-3열)
 * - 각 PEG 카드가 독립적으로 배치되어 한 화면에 더 많이 표시
 * - 반응형: 모바일 1열, 태블릿 2열, 데스크톱 3열
 */
const PEGComparisonsDisplay = ({ pegComparisons }) => {
  if (!pegComparisons || pegComparisons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            PEG 비교 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            PEG 비교 데이터가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          PEG 비교 분석 ({pegComparisons.length}개)
        </CardTitle>
        <CardDescription>N-1 기간과 N 기간의 성능 지표 변화</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 
          PEG 항목들을 그리드로 배치
          - 모바일: 1열
          - 태블릿: 2열
          - 데스크톱: 3열
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-auto">
          {pegComparisons.map((peg, idx) => {
            const isImproved = peg.change_percentage > 0;
            const isStable = Math.abs(peg.change_percentage) < 1;

            return (
              <div
                key={idx}
                className="border rounded-lg p-3 hover:bg-muted/20 transition-colors hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5
                    className="font-semibold text-sm truncate"
                    title={peg.peg_name}
                  >
                    {peg.peg_name}
                  </h5>
                  <Badge
                    variant={
                      isStable
                        ? "secondary"
                        : isImproved
                        ? "success"
                        : "destructive"
                    }
                    className="flex items-center gap-1 shrink-0 ml-2"
                  >
                    {!isStable &&
                      (isImproved ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      ))}
                    {peg.change_percentage > 0 ? "+" : ""}
                    {peg.change_percentage.toFixed(2)}%
                  </Badge>
                </div>

                {/* 통계 비교 */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-blue-600 font-semibold mb-1 text-center">
                      N-1 기간
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-base">
                        {peg.n_minus_1.avg.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        95%: {peg.n_minus_1.pct_95.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-green-600 font-semibold mb-1 text-center">
                      N 기간
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-base">
                        {peg.n.avg.toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        95%: {peg.n.pct_95.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 절대 변화량 */}
                <div className="text-xs text-muted-foreground text-center py-2 border-t">
                  절대 변화:{" "}
                  <span className="font-semibold">
                    {peg.change_absolute.toFixed(2)}
                  </span>
                </div>

                {/* LLM 인사이트 */}
                {peg.llm_insight && (
                  <div className="mt-2 text-xs bg-muted/30 p-2 rounded border-t">
                    <div className="flex items-start gap-1">
                      <span className="shrink-0">💡</span>
                      <span className="line-clamp-3" title={peg.llm_insight}>
                        {peg.llm_insight}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * V2 분석 결과 통합 표시 컴포넌트
 *
 * 레이아웃 설계:
 * - 반응형 그리드 레이아웃 (모바일: 1열, 태블릿: 2열, 데스크톱: 3열)
 * - 각 블럭은 독립적으로 배치되며 자동으로 높이 조정
 * - 추가 블럭이 들어와도 자동으로 그리드에 배치됨
 * - 세로 스크롤 자유롭게 가능
 */
const AnalysisResultV2Display = ({ result }) => {
  if (!result) {
    return (
      <div className="text-center text-muted-foreground p-8">
        분석 결과를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 기본 정보 - 전체 너비 */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>분석 기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">
                  NE ID
                </dt>
                <dd className="text-sm font-mono">{result.ne_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">
                  Cell ID
                </dt>
                <dd className="text-sm font-mono">{result.cell_id}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted-foreground">
                  Software
                </dt>
                <dd className="text-sm font-mono">{result.swname}</dd>
              </div>
              {result.rel_ver && (
                <div>
                  <dt className="text-sm font-semibold text-muted-foreground">
                    Release
                  </dt>
                  <dd className="text-sm font-mono">{result.rel_ver}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* 
        분석 결과 블럭들 - 그리드 레이아웃
        - 모바일: 1열 (grid-cols-1)
        - 태블릿: 2열 (md:grid-cols-2)
        - 데스크톱: 3열 (xl:grid-cols-3)
        - gap-6: 블럭 간 간격
        - auto-rows-auto: 각 행의 높이는 컨텐츠에 맞춰 자동 조정
        - items-start: 블럭들을 상단 정렬
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-auto items-start">
        {/* Choi 알고리즘 판정 */}
        <div className="w-full">
          <ChoiResultDisplay choiResult={result.choi_result} />
        </div>

        {/* LLM 분석 결과 - 더 넓게 (2열 차지) */}
        <div className="w-full md:col-span-2 xl:col-span-2">
          <LLMAnalysisDisplay llmAnalysis={result.llm_analysis} />
        </div>

        {/* PEG 비교 결과 - 전체 너비 (3열 차지) */}
        <div className="w-full md:col-span-2 xl:col-span-3">
          <PEGComparisonsDisplay pegComparisons={result.peg_comparisons} />
        </div>

        {/* 
          향후 추가 블럭을 위한 공간
          예시:
          <div className="w-full">
            <NewBlockComponent data={result.new_data} />
          </div>
        */}
      </div>
    </div>
  );
};

export default AnalysisResultV2Display;

// 각 하위 컴포넌트도 export (재사용 가능)
export { ChoiResultDisplay, LLMAnalysisDisplay, PEGComparisonsDisplay };
