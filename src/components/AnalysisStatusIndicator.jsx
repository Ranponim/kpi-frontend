import React from "react";
import { Badge } from "@/components/ui/badge.jsx";

const logStatus = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[AnalysisStatusIndicator:${timestamp}]`;
  switch (level) {
    case "info":
      console.log(`${prefix} ${message}`, data);
      break;
    case "error":
      console.error(`${prefix} ${message}`, data);
      break;
    case "warn":
      console.warn(`${prefix} ${message}`, data);
      break;
    case "debug":
      console.debug(`${prefix} ${message}`, data);
      break;
    default:
      console.log(`${prefix} ${message}`, data);
  }
};

/**
 * 분석 상태 배지 컴포넌트
 * props:
 * - status: "OK" | "NOK" | "PARTIAL_OK"
 */
const AnalysisStatusIndicator = ({ status, className = "" }) => {
  const map = {
    OK: {
      label: "OK",
      variant: "outline",
      className:
        "border-green-600 text-green-700 dark:border-green-400 dark:text-green-300",
    },
    NOK: {
      label: "NOK",
      variant: "destructive",
      className: "dark:text-destructive-foreground",
    },
    PARTIAL_OK: {
      label: "Partial",
      variant: "secondary",
      className: "text-amber-800 dark:text-amber-200",
    },
  };

  const v = map[status] || {
    label: String(status || "N/A"),
    variant: "outline",
    className: "",
  };

  logStatus("debug", "상태 렌더링", { status });

  return (
    <Badge variant={v.variant} className={`${v.className} ${className}`}>
      {v.label}
    </Badge>
  );
};

export default AnalysisStatusIndicator;
