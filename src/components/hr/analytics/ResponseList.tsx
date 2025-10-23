import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface ResponseListProps {
  surveyId?: string;
}

export const ResponseList = ({ surveyId }: ResponseListProps) => {
  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  const { data: responses, isLoading } = useQuery({
    queryKey: ['responses-list', surveyId, sentimentFilter],
    queryFn: async () => {
      let query = supabase
        .from('responses')
        .select('*, survey_themes(name)')
        .order('created_at', { ascending: false });

      if (surveyId) {
        query = query.eq('survey_id', surveyId);
      }

      if (sentimentFilter !== 'all') {
        query = query.eq('sentiment', sentimentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredResponses = responses?.filter(r => 
    search === "" || r.content.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading responses...</p>
          ) : filteredResponses && filteredResponses.length > 0 ? (
            filteredResponses.map((response) => (
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
            ))
          ) : (
            <p className="text-muted-foreground">No responses found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
