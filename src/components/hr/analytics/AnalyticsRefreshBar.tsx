import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Clock, Radio, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsRefreshBarProps {
  lastUpdated: Date | null;
  responseCount: number;
  newResponseCount: number;
  isRefreshing: boolean;
  isLiveConnected: boolean;
  onRefresh: () => void;
  autoRefreshInterval: number | null;
  onAutoRefreshChange: (interval: number | null) => void;
}

export function AnalyticsRefreshBar({
  lastUpdated,
  responseCount,
  newResponseCount,
  isRefreshing,
  isLiveConnected,
  onRefresh,
  autoRefreshInterval,
  onAutoRefreshChange,
}: AnalyticsRefreshBarProps) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  // Update relative time every 30 seconds
  useEffect(() => {
    const updateRelativeTime = () => {
      if (lastUpdated) {
        setRelativeTime(formatDistanceToNow(lastUpdated, { addSuffix: true }));
      } else {
        setRelativeTime("never");
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const handleIntervalChange = (value: string) => {
    onAutoRefreshChange(value === "off" ? null : parseInt(value, 10));
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border">
      {/* Left side: Status info */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Updated {relativeTime}</span>
        </div>

        {/* Response count */}
        <Badge variant="secondary" className="gap-1">
          <MessageSquare className="h-3 w-3" />
          {responseCount} responses
        </Badge>

        {/* Live connection indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isLiveConnected
                ? "bg-primary animate-pulse"
                : "bg-muted-foreground"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {isLiveConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* New responses indicator */}
        {newResponseCount > 0 && (
          <Badge
            variant="outline"
            className="gap-1 border-primary text-primary animate-pulse"
          >
            <Radio className="h-3 w-3" />
            {newResponseCount} new
          </Badge>
        )}
      </div>

      {/* Right side: Controls */}
      <div className="flex items-center gap-2">
        {/* Auto-refresh selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Auto-refresh:
          </span>
          <Select
            value={autoRefreshInterval?.toString() || "off"}
            onValueChange={handleIntervalChange}
          >
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="1">1 min</SelectItem>
              <SelectItem value="5">5 min</SelectItem>
              <SelectItem value="15">15 min</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Manual refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
          />
          {isRefreshing ? (
            "Refreshing..."
          ) : newResponseCount > 0 ? (
            `Refresh (${newResponseCount})`
          ) : (
            "Refresh"
          )}
        </Button>
      </div>
    </div>
  );
}
