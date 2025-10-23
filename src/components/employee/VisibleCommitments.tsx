import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, Lightbulb } from "lucide-react";
import { format } from "date-fns";

interface VisibleCommitmentsProps {
  surveyId?: string;
}

export const VisibleCommitments = ({ surveyId }: VisibleCommitmentsProps) => {
  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['visible-commitments', surveyId],
    queryFn: async () => {
      let query = supabase
        .from('action_commitments')
        .select('*, surveys(title)')
        .eq('visible_to_employees', true)
        .order('created_at', { ascending: false });

      if (surveyId) {
        query = query.eq('survey_id', surveyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Your Feedback Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading actions...</p>
        </CardContent>
      </Card>
    );
  }

  if (commitments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Your Feedback Matters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When we take action based on feedback, you'll see updates here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          We're Taking Action
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what we're doing based on employee feedback
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {commitments.map((commitment) => (
          <div
            key={commitment.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={statusColors[commitment.status] || ""}>
                    {commitment.status === 'in_progress' ? 'In Progress' : 
                     commitment.status === 'completed' ? 'Completed' : 'Planned'}
                  </Badge>
                  {commitment.status === 'completed' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm font-medium">{commitment.action_description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {commitment.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Due {format(new Date(commitment.due_date), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Posted {format(new Date(commitment.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
