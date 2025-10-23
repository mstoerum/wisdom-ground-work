import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface ResponseListProps {
  surveyId?: string;
}

export const ResponseList = ({ surveyId }: ResponseListProps) => {
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: responsesData, isLoading } = useQuery({
    queryKey: ['responses-list', surveyId, sentimentFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select('*, survey_themes(name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (surveyId) {
        query = query.eq('survey_id', surveyId);
      }

      if (sentimentFilter !== 'all') {
        query = query.eq('sentiment', sentimentFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { responses: data, totalCount: count || 0 };
    },
  });

  const responses = responsesData?.responses || [];
  const totalCount = responsesData?.totalCount || 0;

  const filteredResponses = responses.filter(r => 
    search === "" || r.content.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anonymous Responses</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-4">
                <div className="flex justify-between mb-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            ))}
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
            <p className="text-muted-foreground max-w-md">
              {surveyId 
                ? "This survey is active. Responses will appear here once employees start sharing feedback."
                : "Responses from all surveys will appear here once employees complete their feedback sessions."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredResponses.map((response) => (
                <div key={response.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      {response.sentiment && (
                        <Badge variant={
                          response.sentiment === 'positive' ? 'default' : 
                          response.sentiment === 'negative' ? 'destructive' : 
                          'secondary'
                        }>
                          {response.sentiment}
                        </Badge>
                      )}
                      {response.survey_themes && (
                        <Badge variant="outline">{response.survey_themes.name}</Badge>
                      )}
                      {response.urgency_escalated && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(response.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{response.content}</p>
                </div>
              ))}
            </div>

            {totalCount > pageSize && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex}-{endIndex} of {totalCount} responses
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1 px-3">
                    <span className="text-sm">Page {page} of {totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
