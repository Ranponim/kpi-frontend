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
          LLM 분석 결과
        </CardTitle>
        {llmAnalysis.model_name && (
          <CardDescription>모델: {llmAnalysis.model_name}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 요약 */}
        {llmAnalysis.summary && (
          <div>
            <h4 className="font-semibold mb-2">📝 종합 요약</h4>
            <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
              {llmAnalysis.summary}
            </p>
          </div>
        )}

        <Separator />

        {/* 발견된 문제 */}
        {llmAnalysis.issues && llmAnalysis.issues.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              발견된 문제점 ({llmAnalysis.issues.length}개)
            </h4>
            <ul className="space-y-2">
              {llmAnalysis.issues.map((issue, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 권장 조치 */}
        {llmAnalysis.recommendations &&
          llmAnalysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                권장 조치 사항 ({llmAnalysis.recommendations.length}개)
              </h4>
              <ul className="space-y-2">
                {llmAnalysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* 신뢰도 */}
        {llmAnalysis.confidence !== undefined && (
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
        )}
      </CardContent>
    </Card>
  );
};

/**
 * PEG 비교 결과 표시
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
        <div className="space-y-3">
          {pegComparisons.map((peg, idx) => {
            const isImproved = peg.change_percentage > 0;
            const isStable = Math.abs(peg.change_percentage) < 1;

            return (
              <div
                key={idx}
                className="border rounded-lg p-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-sm">{peg.peg_name}</h5>
                  <Badge
                    variant={
                      isStable
                        ? "secondary"
                        : isImproved
                        ? "success"
                        : "destructive"
                    }
                    className="flex items-center gap-1"
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
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-blue-600 font-semibold mb-1">
                      N-1 기간
                    </div>
                    <div>평균: {peg.n_minus_1.avg.toFixed(2)}</div>
                    <div>95%: {peg.n_minus_1.pct_95.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-green-600 font-semibold mb-1">
                      N 기간
                    </div>
                    <div>평균: {peg.n.avg.toFixed(2)}</div>
                    <div>95%: {peg.n.pct_95.toFixed(2)}</div>
                  </div>
                </div>

                {/* 절대 변화량 */}
                <div className="mt-2 text-xs text-muted-foreground">
                  절대 변화: {peg.change_absolute.toFixed(2)}
                </div>

                {/* LLM 인사이트 */}
                {peg.llm_insight && (
                  <div className="mt-2 text-xs bg-muted/30 p-2 rounded">
                    <span className="font-semibold">💡 인사이트:</span>{" "}
                    {peg.llm_insight}
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
    <div className="space-y-6">
      {/* 기본 정보 */}
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

      {/* Choi 알고리즘 판정 */}
      <ChoiResultDisplay choiResult={result.choi_result} />

      {/* LLM 분석 결과 */}
      <LLMAnalysisDisplay llmAnalysis={result.llm_analysis} />

      {/* PEG 비교 결과 */}
      <PEGComparisonsDisplay pegComparisons={result.peg_comparisons} />
    </div>
  );
};

export default AnalysisResultV2Display;

// 각 하위 컴포넌트도 export (재사용 가능)
export { ChoiResultDisplay, LLMAnalysisDisplay, PEGComparisonsDisplay };






