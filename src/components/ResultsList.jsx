/**
 * LLM 분석 결과 목록을 표시하는 컴포넌트
 *
 * 이 컴포넌트는 분석 결과를 테이블 형태로 표시하고,
 * 필터링, 페이지네이션, 삭제 기능을 제공합니다.
 * Task 40: Frontend LLM 분석 결과 목록 UI 컴포넌트 개발
 */

import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";

import { Badge } from "@/components/ui/badge.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import {
  Eye,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  RefreshCcw,
  Trash2,
  Calendar,
  Loader2,
  ChevronDown,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAnalysisResults } from "@/hooks/useAnalysisResults.js";
import apiClient from "@/lib/apiClient.js";
import ResultFilter from "./ResultFilter.jsx";
import ResultDetail from "./ResultDetail.jsx";

/**
 * 분석 결과 목록 컴포넌트
 */
const ResultsList = () => {
  // === 커스텀 훅 사용 (안전한 초기화) ===
  const analysisResultsHook = useAnalysisResults({
    initialLimit: 20,
    autoFetch: true,
  });

  // 안전한 기본값으로 구조분해할당
  const {
    results = [],
    loading = false,
    error = null,
    isEmpty = true,
    hasMore = false,
    isFiltered = false,
    resultCount = 0,
    filters = {},
    updateFilters = () => {},
    clearFilters = () => {},
    refresh = () => {},
    loadMore = () => {},
    deleteResult = () => {},
  } = analysisResultsHook || {};

  // === 로컬 상태 (안전한 초기화) ===
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResults, setSelectedResults] = useState(() => new Set());
  const [sortConfig, setSortConfig] = useState(() => ({
    key: "analysisDate",
    direction: "desc",
  }));
  const [detailModal, setDetailModal] = useState(() => ({
    isOpen: false,
    resultIds: [],
    mode: "single", // 'single' | 'compare'
  }));

  // === 로깅 함수 ===
  const logInfo = useCallback((message, data = {}) => {
    console.log(`[ResultsList] ${message}`, data);
  }, []);

  // === 정렬 함수 (안전한 처리) ===
  const sortedResults = useMemo(() => {
    try {
      // 안전한 배열 확인
      if (!Array.isArray(results) || results.length === 0) {
        logInfo("정렬할 결과가 없습니다", {
          resultsLength: results?.length || 0,
        });
        return [];
      }

      // 안전한 정렬 설정 확인
      if (!sortConfig || !sortConfig.key || !sortConfig.direction) {
        logInfo("정렬 설정이 올바르지 않습니다", { sortConfig });
        return [...results]; // 원본 반환
      }

      const sorted = [...results].sort((a, b) => {
        try {
          const aValue = a?.[sortConfig.key];
          const bValue = b?.[sortConfig.key];

          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;

          // 날짜 정렬
          if (sortConfig.key === "analysisDate") {
            const aDate = new Date(aValue);
            const bDate = new Date(bValue);
            // 유효한 날짜인지 확인
            if (isNaN(aDate.getTime()) || isNaN(bDate.getTime())) {
              return 0;
            }
            return sortConfig.direction === "asc"
              ? aDate - bDate
              : bDate - aDate;
          }

          // 문자열 정렬
          if (typeof aValue === "string" && typeof bValue === "string") {
            const comparison = aValue.localeCompare(bValue);
            return sortConfig.direction === "asc" ? comparison : -comparison;
          }

          // 숫자 정렬
          if (typeof aValue === "number" && typeof bValue === "number") {
            return sortConfig.direction === "asc"
              ? aValue - bValue
              : bValue - aValue;
          }

          return 0;
        } catch (sortError) {
          logInfo("정렬 중 오류 발생", { error: sortError, a, b, sortConfig });
          return 0;
        }
      });

      logInfo("정렬 완료", {
        originalLength: results.length,
        sortedLength: sorted.length,
        sortKey: sortConfig.key,
        sortDirection: sortConfig.direction,
      });

      return sorted;
    } catch (error) {
      logInfo("정렬 함수 실행 중 오류", { error, results, sortConfig });
      return Array.isArray(results) ? [...results] : [];
    }
  }, [results, sortConfig, logInfo]);

  // === 정렬 핸들러 (안전한 처리) ===
  const handleSort = useCallback(
    (key) => {
      try {
        if (!key || typeof key !== "string") {
          logInfo("정렬 키가 유효하지 않습니다", { key });
          return;
        }

        setSortConfig((prev) => {
          const newDirection =
            prev?.key === key && prev?.direction === "asc" ? "desc" : "asc";
          logInfo("정렬 변경", { key, direction: newDirection });
          return {
            key,
            direction: newDirection,
          };
        });
      } catch (error) {
        logInfo("정렬 핸들러 오류", { error, key });
      }
    },
    [logInfo]
  );

  // === 선택 핸들러 (안전한 처리) ===
  const handleSelectResult = useCallback((resultId) => {
    try {
      if (!resultId) {
        logInfo("결과 ID가 유효하지 않습니다", { resultId });
        return;
      }

      setSelectedResults((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(resultId)) {
          newSet.delete(resultId);
        } else {
          newSet.add(resultId);
        }
        return newSet;
      });
    } catch (error) {
      logInfo("결과 선택 핸들러 오류", { error, resultId });
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    try {
      if (!Array.isArray(sortedResults)) {
        logInfo("정렬된 결과가 배열이 아닙니다", { sortedResults });
        return;
      }

      if (selectedResults.size === sortedResults.length) {
        setSelectedResults(new Set());
      } else {
        setSelectedResults(new Set(sortedResults.map((r) => r.id)));
      }
    } catch (error) {
      logInfo("전체 선택 핸들러 오류", {
        error,
        sortedResults,
        selectedResults,
      });
    }
  }, [selectedResults.size, sortedResults, logInfo]);

  // === 삭제 핸들러 (안전한 처리) ===
  const handleDelete = useCallback(
    async (resultId) => {
      try {
        if (!resultId) {
          logInfo("삭제할 결과 ID가 없습니다", { resultId });
          return;
        }

        if (typeof deleteResult !== "function") {
          logInfo("deleteResult 함수가 유효하지 않습니다", { deleteResult });
          return;
        }

        logInfo("분석 결과 삭제 시작", { resultId });
        await deleteResult(resultId);

        // 선택 상태에서 제거
        setSelectedResults((prev) => {
          const newSet = new Set(prev);
          newSet.delete(resultId);
          return newSet;
        });
      } catch (error) {
        logInfo("분석 결과 삭제 실패", { resultId, error });
      }
    },
    [deleteResult, logInfo]
  );

  // === 벌크 삭제 (안전한 처리) ===
  const handleBulkDelete = useCallback(async () => {
    try {
      if (!selectedResults || selectedResults.size === 0) {
        logInfo("삭제할 결과가 선택되지 않았습니다", { selectedResults });
        return;
      }

      if (typeof deleteResult !== "function") {
        logInfo("deleteResult 함수가 유효하지 않습니다", { deleteResult });
        return;
      }

      logInfo("벌크 삭제 시작", { count: selectedResults.size });

      const deletePromises = Array.from(selectedResults).map((id) =>
        deleteResult(id)
      );
      await Promise.all(deletePromises);

      setSelectedResults(new Set());
      toast.success(`${selectedResults.size}개의 결과가 삭제되었습니다.`);
    } catch (error) {
      logInfo("벌크 삭제 실패", { error });
      toast.error("일부 결과 삭제에 실패했습니다.");
    }
  }, [selectedResults, deleteResult, logInfo]);

  // === 상세 보기 (안전한 처리) ===
  const handleShowDetail = useCallback(
    (resultId) => {
      try {
        if (!resultId) {
          logInfo("상세 보기할 결과 ID가 없습니다", { resultId });
          return;
        }

        logInfo("상세 보기 요청", { resultId });
        setDetailModal({
          isOpen: true,
          resultIds: [resultId],
          mode: "single",
        });
      } catch (error) {
        logInfo("상세 보기 핸들러 오류", { error, resultId });
      }
    },
    [logInfo]
  );

  // === 비교 보기 (안전한 처리) ===
  const handleCompareResults = useCallback(() => {
    try {
      if (!selectedResults || selectedResults.size < 2) {
        toast.error("비교할 결과를 2개 이상 선택해주세요");
        return;
      }

      if (selectedResults.size > 5) {
        toast.error("최대 5개까지만 비교할 수 있습니다");
        return;
      }

      const resultIds = Array.from(selectedResults);
      logInfo("비교 보기 요청", { resultIds, count: resultIds.length });

      setDetailModal({
        isOpen: true,
        resultIds,
        mode: "compare",
      });
    } catch (error) {
      logInfo("비교 보기 핸들러 오류", { error, selectedResults });
    }
  }, [selectedResults, logInfo]);

  // === 모달 닫기 (안전한 처리) ===
  const handleCloseDetail = useCallback(() => {
    try {
      logInfo("상세 모달 닫기");
      setDetailModal({
        isOpen: false,
        resultIds: [],
        mode: "single",
      });
    } catch (error) {
      logInfo("모달 닫기 핸들러 오류", { error });
    }
  }, [logInfo]);

  // === 데이터 내보내기 (안전한 처리) ===
  const handleExport = useCallback(() => {
    try {
      if (!Array.isArray(sortedResults) || sortedResults.length === 0) {
        toast.error("내보낼 데이터가 없습니다.");
        return;
      }

      logInfo("데이터 내보내기 시작", { count: sortedResults.length });

      const exportData = sortedResults.map((result) => {
        try {
          return {
            "분석 날짜": result?.analysisDate
              ? new Date(result.analysisDate).toLocaleString("ko-KR")
              : "N/A",
            "NE ID": result?.neId || "N/A",
            "Cell ID": result?.cellId || "N/A",
            상태: result?.status || "N/A",
            "결과 수": Array.isArray(result?.results)
              ? result.results.length
              : 0,
            "통계 수": Array.isArray(result?.stats) ? result.stats.length : 0,
          };
        } catch (itemError) {
          logInfo("내보내기 데이터 항목 처리 오류", {
            error: itemError,
            result,
          });
          return {
            "분석 날짜": "N/A",
            "NE ID": "N/A",
            "Cell ID": "N/A",
            상태: "N/A",
            "결과 수": 0,
            "통계 수": 0,
          };
        }
      });

      if (exportData.length === 0) {
        toast.error("내보낼 유효한 데이터가 없습니다.");
        return;
      }

      const csvContent = [
        Object.keys(exportData[0]).join(","),
        ...exportData.map((row) => Object.values(row).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `analysis_results_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();

      toast.success("데이터가 내보내기 되었습니다.");
      logInfo("데이터 내보내기 완료");
    } catch (error) {
      logInfo("데이터 내보내기 실패", { error });
      toast.error("데이터 내보내기에 실패했습니다.");
    }
  }, [sortedResults, logInfo]);

  // === 상태별 뱃지 컬러 (안전한 처리) ===
  const getStatusBadgeVariant = useCallback(
    (status) => {
      try {
        if (!status || typeof status !== "string") {
          return "secondary"; // 기본값
        }

        switch (status.toLowerCase()) {
          case "success":
            return "default"; // 기본 (보통 파란색)
          case "error":
          case "failed":
            return "destructive"; // 빨간색
          case "warning":
            return "secondary"; // 회색
          case "pending":
          case "processing":
            return "outline"; // 테두리만
          default:
            return "secondary";
        }
      } catch (error) {
        logInfo("상태 뱃지 컬러 처리 오류", { error, status });
        return "secondary";
      }
    },
    [logInfo]
  );

  // === 날짜 포맷팅 (안전한 처리) ===
  const formatDate = useCallback(
    (dateString) => {
      try {
        if (!dateString) {
          return "-";
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          logInfo("유효하지 않은 날짜 형식", { dateString });
          return dateString || "-";
        }

        return date.toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (error) {
        logInfo("날짜 포맷팅 오류", { error, dateString });
        return dateString || "-";
      }
    },
    [logInfo]
  );

  // === 렌더링 ===
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">LLM 분석 결과</h2>
          <p className="text-muted-foreground">
            총 {resultCount}개의 분석 결과
            {isFiltered && " (필터 적용됨)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedResults.size > 0 && (
            <>
              {selectedResults.size >= 2 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCompareResults}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  비교하기 ({selectedResults.size})
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    선택 삭제 ({selectedResults.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>선택된 결과 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      선택된 {selectedResults.size}개의 분석 결과를
                      삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!sortedResults?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            필터
            <ChevronDown
              className={`h-4 w-4 ml-2 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCcw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            새로고침
          </Button>
        </div>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <ResultFilter
          filters={filters}
          onFilterChange={(key, value) => updateFilters({ [key]: value })}
          onClearFilters={clearFilters}
          isCollapsed={false}
          onToggleCollapse={() => setShowFilters(false)}
          showActiveCount={true}
        />
      )}

      {/* 메인 컨텐츠 */}
      <Card>
        <CardContent className="p-0">
          {/* 에러 상태 (개선된 UX) */}
          {error && (
            <div className="p-6 text-center border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-destructive">
                  데이터 로딩 오류
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
                <div className="flex gap-2">
                  <Button onClick={refresh} variant="outline" size="sm">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    다시 시도
                  </Button>
                  <Button onClick={clearFilters} variant="ghost" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    필터 초기화
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  문제가 지속되면 관리자에게 문의해주세요
                </p>
              </div>
            </div>
          )}

          {/* 로딩 상태 (개선된 UX) */}
          {loading && isEmpty && (
            <div className="p-12 text-center">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"></div>
              </div>
              <p className="text-muted-foreground mb-2">
                분석 결과를 불러오는 중...
              </p>
              <p className="text-xs text-muted-foreground/70">
                잠시만 기다려주세요
              </p>
            </div>
          )}

          {/* 부분 로딩 상태 (더 많은 데이터 로딩 중) */}
          {loading && !isEmpty && (
            <div className="flex items-center justify-center py-4 border-t bg-muted/30">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
              <span className="text-sm text-muted-foreground">
                더 많은 데이터를 불러오는 중...
              </span>
            </div>
          )}

          {/* 빈 상태 (개선된 UX) */}
          {!loading && isEmpty && !error && (
            <div className="p-12 text-center">
              <div className="relative mb-6">
                <Search className="h-12 w-12 text-muted-foreground mx-auto" />
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-muted-foreground/20 rounded-full"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {isFiltered
                  ? "🔍 검색 결과가 없습니다"
                  : "📊 분석 결과가 없습니다"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {isFiltered
                  ? "현재 필터 조건에 맞는 분석 결과가 없습니다. 다른 조건으로 검색해보세요."
                  : ""}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {isFiltered ? (
                  <>
                    <Button onClick={clearFilters} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      필터 초기화
                    </Button>
                    <Button
                      onClick={() => setShowFilters(true)}
                      variant="default"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      필터 수정
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* 테이블 */}
          {!isEmpty && !error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedResults.size === sortedResults.length &&
                          sortedResults.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("analysisDate")}
                    >
                      분석 날짜
                      {sortConfig.key === "analysisDate" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("neId")}
                    >
                      NE ID
                      {sortConfig.key === "neId" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("cellId")}
                    >
                      Cell ID
                      {sortConfig.key === "cellId" && (
                        <span className="ml-2">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-center">결과 수</TableHead>
                    <TableHead className="text-center">통계 수</TableHead>
                    <TableHead className="w-20">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedResults.map((result) => (
                    <TableRow
                      key={result.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleShowDetail(result.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedResults.has(result.id)}
                          onChange={() => handleSelectResult(result.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(result.analysisDate)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.neId || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.cellId || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(result.status)}>
                          {result.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.results?.length || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {result.stats?.length || 0}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowDetail(result.id)}
                            title="상세 보기"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="삭제">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  분석 결과 삭제
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 분석 결과를 삭제하시겠습니까? 이 작업은
                                  되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(result.id)}
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 더 보기 버튼 */}
          {hasMore && !loading && !error && (
            <div className="p-6 text-center border-t">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                더 보기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상세 보기 모달 */}
      <ResultDetail
        isOpen={detailModal.isOpen}
        onClose={handleCloseDetail}
        resultIds={detailModal.resultIds}
        mode={detailModal.mode}
      />
    </div>
  );
};

export default memo(ResultsList);
