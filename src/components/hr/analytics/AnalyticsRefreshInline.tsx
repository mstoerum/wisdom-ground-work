import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Radio } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsRefreshInlineProps {
  lastUpdated: Date | null;
  newResponseCount: number;
  isRefreshing: boolean;
  isLiveConnected: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number | null;
  onAutoRefreshChange: (interval: number | null) => void;
}

export function AnalyticsRefreshInline({
  lastUpdated,
  newResponseCount,
  isRefreshing,
  isLiveConnected,
  onRefresh,
  autoRefreshInterval,
  onAutoRefreshChange,
}: AnalyticsRefreshInlineProps) {
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    const update = () => {
      if (lastUpdated) {
        setRelativeTime(formatDistanceToNow(lastUpdated, { addSuffix: true }));
      }
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      {/* Live dot */}
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          isLiveConnected ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
        )}
      />
      <span className="hidden sm:inline text-xs">
        {relativeTime}
      </span>

      {/* New responses badge */}
      {newResponseCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-primary animate-pulse">
          <Radio className="h-3 w-3" />
          {newResponseCount} new
        </span>
      )}

      {/* Refresh button with auto-refresh dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              // Direct click refreshes, long press / right section opens menu
              e.preventDefault();
              onRefresh();
            }}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs">Auto-refresh</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {[
            { label: "Off", value: null },
            { label: "Every 1 min", value: 1 },
            { label: "Every 5 min", value: 5 },
            { label: "Every 15 min", value: 15 },
          ].map((opt) => (
            <DropdownMenuItem
              key={opt.label}
              onClick={() => onAutoRefreshChange(opt.value)}
              className={cn(
                autoRefreshInterval === opt.value && "font-semibold"
              )}
            >
              {opt.label}
              {autoRefreshInterval === opt.value && " ✓"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
