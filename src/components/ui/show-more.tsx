"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ShowMoreProps {
  children: React.ReactNode;
  maxHeight?: number;
  showMoreText?: string;
  showLessText?: string;
  className?: string;
  gradient?: boolean;
}

export function ShowMore({
  children,
  maxHeight = 200,
  showMoreText = "Mehr anzeigen",
  showLessText = "Weniger anzeigen",
  className,
  gradient = true,
}: ShowMoreProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [shouldShowButton, setShouldShowButton] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setShouldShowButton(contentHeight > maxHeight);
    }
  }, [maxHeight]);

  return (
    <div className={cn("relative", className)}>
      <div
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          !isExpanded && shouldShowButton && "relative"
        )}
        style={{
          maxHeight: isExpanded ? "none" : shouldShowButton ? `${maxHeight}px` : "none",
        }}
      >
        {children}
      </div>
      
      {!isExpanded && shouldShowButton && gradient && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      )}

      {shouldShowButton && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                {showLessText}
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                {showMoreText}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
