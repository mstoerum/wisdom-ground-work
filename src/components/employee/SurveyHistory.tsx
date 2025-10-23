import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, Shield } from "lucide-react";
import { format } from "date-fns";

export const SurveyHistory = () => {
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['employee-survey-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('survey_assignments')
        .select(`
          *,
          surveys(
            title,
            description,
            consent_config
          ),
          conversation_sessions(
            anonymization_level
          )
        `)
        .eq('employee_id', user.id)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Survey History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Survey History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No surveys yet. When you participate in feedback sessions, they'll appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    active: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Your Feedback Sessions
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Track your participation and privacy settings
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.map((assignment) => {
          const survey = assignment.surveys as any;
          const sessions = Array.isArray(assignment.conversation_sessions) 
            ? assignment.conversation_sessions 
            : [];
          const session = sessions[0] as any;
          const anonymizationLevel = session?.anonymization_level || 
            survey?.consent_config?.anonymization_level || 'anonymous';

          return (
            <div
              key={assignment.id}
              className="border rounded-lg p-4 space-y-3 bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{survey?.title}</h4>
                  {survey?.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {survey.description}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={statusColors[assignment.status] || ""}
                >
                  {assignment.status === 'completed' && (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {assignment.status === 'completed' && assignment.completed_at
                      ? `Completed ${format(new Date(assignment.completed_at), 'MMM d, yyyy')}`
                      : `Assigned ${format(new Date(assignment.assigned_at), 'MMM d, yyyy')}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="capitalize">{anonymizationLevel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
