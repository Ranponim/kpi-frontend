import React, { useId, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card.jsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.jsx";
import { cn } from "@/lib/utils.js";

const logAnalysisSection = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const prefix = `[AnalysisSection:${timestamp}]`;
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
 * 재사용 가능한 분석 섹션 컴포넌트
 * - 접이기/펼치기 지원
 * - 카드 레이아웃
 * - 섹션 우측에 액션 슬롯 제공
 */
const AnalysisSection = ({
  title,
  defaultOpen = true,
  actions = null,
  className = "",
  children,
  "data-testid": dataTestId,
}) => {
  logAnalysisSection("debug", "렌더링", { title, defaultOpen });

  const generatedId = useId();
  const panelId = `${generatedId}-panel`;

  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen));

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <Collapsible defaultOpen={defaultOpen} data-testid={dataTestId}>
      <Card className={cn("w-full", className)}>
        <CardHeader className="border-b dark:border-border/60">
          <CardTitle className="flex items-center justify-between">
            <CollapsibleTrigger
              className="text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded"
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={handleToggle}
              onKeyDown={handleKeyDown}
            >
              <span className="inline-flex items-center gap-2">
                <span className="i-lucide-chevron-down mr-1 transition-transform data-[state=open]:rotate-180" />
                <span className="text-foreground dark:text-foreground">
                  {title}
                </span>
              </span>
            </CollapsibleTrigger>
            {actions ? <CardAction>{actions}</CardAction> : null}
          </CardTitle>
        </CardHeader>
        <CollapsibleContent id={panelId}>
          <CardContent className="py-4 text-foreground/90 dark:text-foreground/90">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AnalysisSection;
