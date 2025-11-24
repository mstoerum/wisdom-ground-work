import { DateRangePicker } from "@/components/hr/analytics/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EvaluationFiltersProps {
  sentimentFilter: string | null;
  setSentimentFilter: (value: string | null) => void;
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start?: Date, end?: Date) => void;
  activeFilterCount: number;
  onClearAll: () => void;
}

export const EvaluationFilters = ({
  sentimentFilter,
  setSentimentFilter,
  startDate,
  endDate,
  onDateChange,
  activeFilterCount,
  onClearAll,
}: EvaluationFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filters:</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">{activeFilterCount} active</Badge>
        )}
      </div>

      <Select
        value={sentimentFilter || "all"}
        onValueChange={(value) => setSentimentFilter(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All sentiments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sentiments</SelectItem>
          <SelectItem value="positive">Positive (&gt;60%)</SelectItem>
          <SelectItem value="neutral">Neutral (40-60%)</SelectItem>
          <SelectItem value="negative">Negative (&lt;40%)</SelectItem>
        </SelectContent>
      </Select>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onDateChange={onDateChange}
      />

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="ml-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      )}
    </div>
  );
};
