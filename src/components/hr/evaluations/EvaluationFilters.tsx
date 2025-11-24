import { DateRangePicker } from "@/components/hr/analytics/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EvaluationFiltersProps {
  sentimentFilter: string | null;
  setSentimentFilter: (value: string | null) => void;
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start?: Date, end?: Date) => void;
  activeFilterCount: number;
  onClearAll: () => void;
  selectedSurveyId: string | null;
  setSelectedSurveyId: (id: string | null) => void;
}

export const EvaluationFilters = ({
  sentimentFilter,
  setSentimentFilter,
  startDate,
  endDate,
  onDateChange,
  activeFilterCount,
  onClearAll,
  selectedSurveyId,
  setSelectedSurveyId,
}: EvaluationFiltersProps) => {
  const { data: surveys } = useQuery({
    queryKey: ["surveys-for-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, title")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filters:</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary">{activeFilterCount} active</Badge>
        )}
      </div>

      <Select
        value={selectedSurveyId || "all"}
        onValueChange={(value) => setSelectedSurveyId(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="All surveys" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Surveys</SelectItem>
          {surveys?.map((survey) => (
            <SelectItem key={survey.id} value={survey.id}>
              {survey.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
