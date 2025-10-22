/**
 * ResultFilterV2.jsx
 *
 * V2 API 분석 결과 필터링 컴포넌트
 * ne_id, cell_id, swname, rel_ver, date_from, date_to, choi_status 필터 지원
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { X, Filter, ChevronUp } from "lucide-react";

const ResultFilterV2 = ({
  filters = {},
  onFilterChange,
  onClearFilters,
  isCollapsed = false,
  onToggleCollapse,
  showActiveCount = false,
}) => {
  // === 로깅 함수 ===
  const logInfo = useCallback((message, data = {}) => {
    console.log(`[ResultFilterV2] ${message}`, data);
  }, []);

  // === 활성 필터 개수 계산 ===
  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;

    let count = 0;
    if (filters.ne_id?.trim()) count++;
    if (filters.cell_id?.trim()) count++;
    if (filters.swname?.trim()) count++;
    if (filters.rel_ver?.trim()) count++;
    if (filters.date_from) count++;
    if (filters.date_to) count++;
    // "all"은 필터가 아니므로 카운트하지 않음
    if (filters.choi_status?.trim() && filters.choi_status !== "all") count++;

    return count;
  }, [filters]);

  // === 필터 변경 핸들러 ===
  const handleFilterChange = useCallback(
    (key, value) => {
      try {
        logInfo("필터 변경", { key, value });

        if (typeof onFilterChange !== "function") {
          logInfo("onFilterChange가 함수가 아닙니다", { onFilterChange });
          return;
        }

        onFilterChange(key, value);
      } catch (error) {
        logInfo("필터 변경 핸들러 오류", { error, key, value });
      }
    },
    [onFilterChange, logInfo]
  );

  // === 필터 초기화 핸들러 ===
  const handleClearFilters = useCallback(() => {
    try {
      logInfo("필터 초기화 요청");

      if (typeof onClearFilters !== "function") {
        logInfo("onClearFilters가 함수가 아닙니다", { onClearFilters });
        return;
      }

      onClearFilters();
    } catch (error) {
      logInfo("필터 초기화 핸들러 오류", { error });
    }
  }, [onClearFilters, logInfo]);

  // === 축소/확장 핸들러 ===
  const handleToggleCollapse = useCallback(() => {
    try {
      logInfo("필터 패널 토글");

      if (typeof onToggleCollapse !== "function") {
        logInfo("onToggleCollapse가 함수가 아닙니다", { onToggleCollapse });
        return;
      }

      onToggleCollapse();
    } catch (error) {
      logInfo("토글 핸들러 오류", { error });
    }
  }, [onToggleCollapse, logInfo]);

  // === Choi 상태 옵션 ===
  // 주의: Select.Item은 빈 문자열을 value로 허용하지 않으므로 "all" 사용
  const choiStatusOptions = [
    { value: "all", label: "전체" },
    { value: "normal", label: "정상" },
    { value: "warning", label: "주의" },
    { value: "critical", label: "위험" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">필터 (V2)</CardTitle>
            {showActiveCount && activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFilterCount}개 활성
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                초기화
              </Button>
            )}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className="h-8"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NE ID 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-ne-id">NE ID</Label>
              <Input
                id="filter-ne-id"
                placeholder="예: nvgnb#10000"
                value={filters.ne_id || ""}
                onChange={(e) => handleFilterChange("ne_id", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Cell ID 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-cell-id">Cell ID</Label>
              <Input
                id="filter-cell-id"
                placeholder="예: 2010"
                value={filters.cell_id || ""}
                onChange={(e) => handleFilterChange("cell_id", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Software 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-swname">Software</Label>
              <Input
                id="filter-swname"
                placeholder="예: host01"
                value={filters.swname || ""}
                onChange={(e) => handleFilterChange("swname", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Release Version 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-rel-ver">Release</Label>
              <Input
                id="filter-rel-ver"
                placeholder="예: R23A"
                value={filters.rel_ver || ""}
                onChange={(e) => handleFilterChange("rel_ver", e.target.value)}
                className="h-9"
              />
            </div>

            {/* 시작 날짜 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-date-from">시작 날짜</Label>
              <Input
                id="filter-date-from"
                type="date"
                value={filters.date_from || ""}
                onChange={(e) =>
                  handleFilterChange("date_from", e.target.value)
                }
                className="h-9"
              />
            </div>

            {/* 종료 날짜 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-date-to">종료 날짜</Label>
              <Input
                id="filter-date-to"
                type="date"
                value={filters.date_to || ""}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
                className="h-9"
              />
            </div>

            {/* Choi 판정 상태 필터 */}
            <div className="space-y-2">
              <Label htmlFor="filter-choi-status">Choi 판정</Label>
              <Select
                value={filters.choi_status || "all"}
                onValueChange={(value) => {
                  // "all"이면 필터를 제거 (빈 문자열로 전달)
                  handleFilterChange(
                    "choi_status",
                    value === "all" ? "" : value
                  );
                }}
              >
                <SelectTrigger id="filter-choi-status" className="h-9">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  {choiStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 필터 적용 안내 */}
          {activeFilterCount > 0 && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>{activeFilterCount}개</strong>의 필터가 적용되어
                있습니다.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default ResultFilterV2;
