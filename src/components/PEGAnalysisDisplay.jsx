import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Search, ChevronLeft } from "lucide-react";
import { useDashboardSettings } from "@/hooks/usePreference.js";
import usePegPreferences from "@/hooks/usePegPreferences.ts";
import AnalysisStatusIndicator from "./AnalysisStatusIndicator.jsx";

const logPegDisplay = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[PEGAnalysisDisplay:${timestamp}]`;
  // eslint-disable-next-line no-console
  console[
    level === "error"
      ? "error"
      : level === "warn"
      ? "warn"
      : level === "debug"
      ? "debug"
      : "log"
  ](`${prefix} ${message}`, data);
};

const weightMatch = (weightFilter, weight) => {
  if (weightFilter === "all") return true;
  if (weightFilter === "high") return (weight || 0) >= 8;
  if (weightFilter === "medium") return (weight || 0) >= 6 && (weight || 0) < 8;
  if (weightFilter === "low") return (weight || 0) < 6;
  return true;
};

export default function PEGAnalysisDisplay({ results = [] }) {
  const { settings: dashboardSettings, updateSettings } =
    useDashboardSettings() || {
      settings: { pegSearch: "", pegSort: "weight_desc" },
      updateSettings: () => {},
    };
  const { preferredPegs, setPreferredPegs } = usePegPreferences();

  const [pegFilter, setPegFilter] = useState(
    dashboardSettings?.pegSearch || ""
  );
  const [pegSort, setPegSort] = useState(
    dashboardSettings?.pegSort || "weight_desc"
  );
  const [weightFilter, setWeightFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");
  const [pegPage, setPegPage] = useState(0);
  const [pegPageSize, setPegPageSize] = useState(10);

  const filteredSorted = useMemo(() => {
    const filtered = (results || []).filter((p) => {
      const matchesName =
        !pegFilter ||
        String(p.peg_name).toLowerCase().includes(pegFilter.toLowerCase());
      const matchesWeight = weightMatch(weightFilter, p.weight || 0);
      const matchesTrend =
        trendFilter === "all" ? true : p.trend === trendFilter;
      return matchesName && matchesWeight && matchesTrend;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (pegSort) {
        case "weight_asc":
          return (a.weight || 0) - (b.weight || 0);
        case "change_desc":
          return (b.change_percent || 0) - (a.change_percent || 0);
        case "change_asc":
          return (a.change_percent || 0) - (b.change_percent || 0);
        case "name_asc":
          return String(a.peg_name).localeCompare(String(b.peg_name));
        case "name_desc":
          return String(b.peg_name).localeCompare(String(a.peg_name));
        case "weight_desc":
        default:
          return (b.weight || 0) - (a.weight || 0);
      }
    });
    return sorted;
  }, [results, pegFilter, weightFilter, trendFilter, pegSort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSorted.length / pegPageSize)
  );
  const pageItems = useMemo(() => {
    const start = pegPage * pegPageSize;
    return filteredSorted.slice(start, start + pegPageSize);
  }, [filteredSorted, pegPage, pegPageSize]);

  logPegDisplay("debug", "render", {
    total: results?.length,
    filtered: filteredSorted.length,
    page: pegPage,
  });

  if (!Array.isArray(results) || results.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        PEG 비교 데이터가 없습니다.
      </div>
    );
  }

  const visibleNames = filteredSorted.map((p) => p.peg_name);

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
            {results.length}
          </div>
          <div className="text-xs text-muted-foreground dark:text-muted-foreground/80">
            총 PEG 수
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/40 rounded-lg">
          <div className="text-lg font-bold text-green-600 dark:text-green-300">
            {results.filter((p) => p.trend === "up").length}
          </div>
          <div className="text-xs text-muted-foreground">개선 PEG</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-950/40 rounded-lg">
          <div className="text-lg font-bold text-red-600 dark:text-red-300">
            {results.filter((p) => p.trend === "down").length}
          </div>
          <div className="text-xs text-muted-foreground">하락 PEG</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-lg font-bold text-gray-600 dark:text-gray-300">
            {results.filter((p) => p.trend === "stable").length}
          </div>
          <div className="text-xs text-muted-foreground">안정 PEG</div>
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2 justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="PEG 이름 검색..."
              value={pegFilter}
              onChange={(e) => {
                const v = e.target.value;
                setPegFilter(v);
                updateSettings({ pegSearch: v });
                setPegPage(0);
              }}
              className="pl-8"
            />
          </div>
          <Select
            value={weightFilter}
            onValueChange={(v) => {
              setWeightFilter(v);
              setPegPage(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="가중치" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">가중치 전체</SelectItem>
              <SelectItem value="high">높음(≥8)</SelectItem>
              <SelectItem value="medium">중간(6~7.9)</SelectItem>
              <SelectItem value="low">낮음(&lt;6)</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={trendFilter}
            onValueChange={(v) => {
              setTrendFilter(v);
              setPegPage(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="트렌드" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">트렌드 전체</SelectItem>
              <SelectItem value="up">개선</SelectItem>
              <SelectItem value="down">하락</SelectItem>
              <SelectItem value="stable">안정</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={pegSort}
            onValueChange={(v) => {
              setPegSort(v);
              updateSettings({ pegSort: v });
              setPegPage(0);
            }}
          >
            <SelectTrigger className="w-[165px]">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight_desc">가중치 ↓</SelectItem>
              <SelectItem value="weight_asc">가중치 ↑</SelectItem>
              <SelectItem value="change_desc">변화율 ↓</SelectItem>
              <SelectItem value="change_asc">변화율 ↑</SelectItem>
              <SelectItem value="name_asc">이름 A→Z</SelectItem>
              <SelectItem value="name_desc">이름 Z→A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            선택 {preferredPegs.length} / 총 {results.length}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPreferredPegs(
                Array.from(new Set([...(preferredPegs || []), ...visibleNames]))
              )
            }
          >
            선택 모두
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreferredPegs([])}
          >
            선택 해제
          </Button>
          <Select
            value={String(pegPageSize)}
            onValueChange={(v) => {
              setPegPageSize(parseInt(v));
              setPegPage(0);
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="페이지 크기" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개</SelectItem>
              <SelectItem value="20">20개</SelectItem>
              <SelectItem value="50">50개</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPegPage(Math.max(0, pegPage - 1))}
            disabled={pegPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {pegPage + 1} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPegPage(Math.min(totalPages - 1, pegPage + 1))}
            disabled={pegPage >= totalPages - 1}
          >
            ▶
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 dark:bg-muted/20 sticky top-0">
              <tr className="text-left text-sm font-medium">
                <th scope="col" className="p-3">
                  PEG 이름
                </th>
                <th scope="col" className="p-3 text-center">
                  선택
                </th>
                <th scope="col" className="p-3 text-center">
                  가중치
                </th>
                <th scope="col" className="p-3 text-center">
                  N-1 평균
                </th>
                <th scope="col" className="p-3 text-center">
                  N 평균
                </th>
                <th scope="col" className="p-3 text-center">
                  N-1 RSD
                </th>
                <th scope="col" className="p-3 text-center">
                  N RSD
                </th>
                <th scope="col" className="p-3 text-center">
                  변화율
                </th>
                <th scope="col" className="p-3 text-center">
                  트렌드
                </th>
                <th scope="col" className="p-3 text-center">
                  상태
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((peg, idx) => (
                <tr key={idx} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{peg.peg_name}</td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={preferredPegs.includes(peg.peg_name)}
                      aria-label={`${peg.peg_name} 선택`}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(
                              new Set([...(preferredPegs || []), peg.peg_name])
                            )
                          : preferredPegs.filter((n) => n !== peg.peg_name);
                        setPreferredPegs(next);
                      }}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline">{peg.weight}</Badge>
                  </td>
                  <td className="p-3 text-center font-mono">
                    {peg.n1_avg.toFixed(2)}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {peg.n_avg.toFixed(2)}
                  </td>
                  <td className="p-3 text-center font-mono">
                    {peg.n1_rsd.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center font-mono">
                    {peg.n_rsd.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center">
                    <Badge
                      variant={
                        peg.significance === "high"
                          ? "destructive"
                          : peg.significance === "medium"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        peg.significance === "high"
                          ? ""
                          : peg.significance === "medium"
                          ? "text-slate-800"
                          : "text-slate-700 border-slate-400"
                      }
                    >
                      {peg.change_percent > 0 ? "+" : ""}
                      {peg.change_percent.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge
                      variant={
                        peg.trend === "up"
                          ? "default"
                          : peg.trend === "down"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {peg.trend === "up"
                        ? "📈"
                        : peg.trend === "down"
                        ? "📉"
                        : "➡️"}
                      {peg.trend === "up"
                        ? "개선"
                        : peg.trend === "down"
                        ? "하락"
                        : "안정"}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    {(() => {
                      const status =
                        peg.trend === "up"
                          ? "OK"
                          : peg.trend === "down"
                          ? "NOK"
                          : "PARTIAL_OK";
                      return <AnalysisStatusIndicator status={status} />;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
