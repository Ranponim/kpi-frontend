import { useCallback, useEffect, useMemo } from "react";
import { useDashboardSettings } from "@/hooks/usePreference.js";
import {
  logDebug,
  logError,
  logInfo,
  logWarning,
} from "@/utils/loggingUtils.js";

/**
 * PEG Preference 훅
 * - Preference에 저장된 selectedPegs를 노출
 * - 업데이트 함수 제공 (선택/해제 시 사용)
 */
export default function usePegPreferences() {
  // 대시보드 설정 훅에서 PEG 관련 설정을 위임받아 사용합니다.
  const { settings, updateSettings } = useDashboardSettings() || {
    settings: { selectedPegs: [] },
    updateSettings: () => {},
  };

  // 훅 초기화 로그 (디버그)
  try {
    logDebug("usePegPreferences 훅 초기화", {
      hasSettings: Boolean(settings),
      hasUpdate: typeof updateSettings === "function",
    });
  } catch (_) {
    // 로깅 오류는 무시 (런타임에 영향을 주지 않기 위함)
  }

  const preferredPegs = useMemo(
    () => (Array.isArray(settings?.selectedPegs) ? settings.selectedPegs : []),
    [settings?.selectedPegs]
  );

  // 선택 목록 변경 시 정보 로그
  useEffect(() => {
    try {
      logInfo("PEG 선택 목록 변경", {
        count: Array.isArray(preferredPegs) ? preferredPegs.length : 0,
      });
    } catch (_) {}
  }, [preferredPegs]);

  const setPreferredPegs = useCallback(
    (pegs: string[]) => {
      // 입력 검증 및 견고한 오류 처리
      if (!Array.isArray(pegs)) {
        try {
          logError("setPreferredPegs 입력이 배열이 아님", { received: pegs });
        } catch (_) {}
        return;
      }

      const allStrings = pegs.every((p) => typeof p === "string");
      if (!allStrings) {
        try {
          logWarning("setPreferredPegs: 문자열 배열이 아님", { pegs });
        } catch (_) {}
        return;
      }

      try {
        updateSettings({ selectedPegs: pegs });
        try {
          logInfo("PEG 선택 목록 업데이트", { count: pegs.length });
        } catch (_) {}
      } catch (error) {
        try {
          logError("PEG 선택 목록 업데이트 실패", error);
        } catch (_) {}
      }
    },
    [updateSettings]
  );

  return {
    preferredPegs,
    setPreferredPegs,
  };
}
