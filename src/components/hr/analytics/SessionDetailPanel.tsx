import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock, MessageSquare, TrendingUp, TrendingDown, Minus,
  Lightbulb, Quote, CheckCircle2, SmilePlus, Bot, User,
} from "lucide-react";
import { format } from "date-fns";

interface SessionDetailPanelProps {
  sessionId: string;
  surveyId: string;
  startedAt: string | null;
  endedAt: string | null;
  initialMood: number | null;
  finalMood: number | null;
}

const trajectoryConfig: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  improving: { label: "Improving", icon: TrendingUp, color: "text-green-600 dark:text-green-400" },
  declining: { label: "Declining", icon: TrendingDown, color: "text-red-600 dark:text-red-400" },
  stable: { label: "Stable", icon: Minus, color: "text-blue-600 dark:text-blue-400" },
  mixed: { label: "Mixed", icon: Minus, color: "text-amber-600 dark:text-amber-400" },
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export const SessionDetailPanel = ({
  sessionId, surveyId, startedAt, endedAt, initialMood, finalMood,
}: SessionDetailPanelProps) => {
  // Fetch transcript
  const { data: responses, isLoading: loadingResponses } = useQuery({
    queryKey: ["session-transcript", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responses")
        .select("id, content, ai_response, sentiment, theme_id, created_at")
        .eq("conversation_session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch session insight
  const { data: insight, isLoading: loadingInsight } = useQuery({
    queryKey: ["session-insight", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_insights")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch theme names for touched themes
  const themeIds = [...new Set((responses || []).map(r => r.theme_id).filter(Boolean))] as string[];
  const { data: themes } = useQuery({
    queryKey: ["theme-names", themeIds],
    queryFn: async () => {
      if (themeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("survey_themes")
        .select("id, name")
        .in("id", themeIds);
      if (error) throw error;
      return data || [];
    },
    enabled: themeIds.length > 0,
  });

  const themeMap = new Map((themes || []).map(t => [t.id, t.name]));

  // Compute duration
  const durationMin = startedAt && endedAt
    ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    : null;

  // Filter out [SELECTED:] signals from transcript
  const transcript = (responses || []).filter(
    r => !r.content.startsWith("[SELECTED:")
  );

  const keyQuotes = (insight?.key_quotes as string[] | null) || [];
  const recommendedActions = (insight?.recommended_actions as Array<{ action: string; priority: string; timeframe: string }> | null) || [];
  const trajectory = insight?.sentiment_trajectory
    ? trajectoryConfig[insight.sentiment_trajectory]
    : null;
  const TrajectoryIcon = trajectory?.icon;

  if (loadingResponses || loadingInsight) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {/* Metadata bar */}
      <div className="flex flex-wrap gap-3 text-sm">
        {durationMin !== null && (
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" /> {durationMin} min
          </Badge>
        )}
        <Badge variant="outline" className="gap-1.5">
          <MessageSquare className="h-3 w-3" /> {transcript.length} messages
        </Badge>
        {initialMood !== null && finalMood !== null && (
          <Badge variant="outline" className="gap-1.5">
            <SmilePlus className="h-3 w-3" /> Mood {initialMood} → {finalMood}
          </Badge>
        )}
        {trajectory && TrajectoryIcon && (
          <Badge variant="outline" className={`gap-1.5 ${trajectory.color}`}>
            <TrajectoryIcon className="h-3 w-3" /> {trajectory.label}
          </Badge>
        )}
        {themeIds.map(id => (
          <Badge key={id} variant="secondary" className="text-xs">
            {themeMap.get(id) || "Unknown"}
          </Badge>
        ))}
      </div>

      {/* AI Insights */}
      {insight && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              AI Insights
              {insight.confidence_score && (
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  Confidence: {insight.confidence_score}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {insight.root_cause && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Core Issue</h4>
                <p className="text-sm leading-relaxed">{insight.root_cause}</p>
              </div>
            )}

            {keyQuotes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Quote className="h-3 w-3" /> Key Quotes
                </h4>
                <div className="space-y-1.5">
                  {keyQuotes.map((q, i) => (
                    <p key={i} className="text-sm italic text-muted-foreground pl-3 border-l-2 border-primary/20">
                      "{q}"
                    </p>
                  ))}
                </div>
              </div>
            )}

            {recommendedActions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" /> Recommended Actions
                </h4>
                <div className="space-y-2">
                  {recommendedActions
                    .sort((a, b) => {
                      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
                      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
                    })
                    .map((a, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-card/50">
                        <div className="flex-1">
                          <p className="text-sm">{a.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3 inline mr-1" />{a.timeframe}
                          </p>
                        </div>
                        <Badge variant="secondary" className={priorityColors[a.priority] || ""}>
                          {a.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          {transcript.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No messages in this session.</p>
          ) : (
            <div className="space-y-3">
              {transcript.map((msg, i) => (
                <div key={msg.id} className="space-y-1.5">
                  {/* AI question */}
                  {msg.ai_response && (
                    <div className="flex gap-2">
                      <Bot className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm leading-relaxed">{msg.ai_response}</p>
                    </div>
                  )}
                  {/* Employee answer */}
                  <div className="flex gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{msg.content}</p>
                      <div className="flex gap-2 mt-0.5">
                        {msg.sentiment && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                            {msg.sentiment}
                          </span>
                        )}
                        {msg.theme_id && themeMap.get(msg.theme_id) && (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                            · {themeMap.get(msg.theme_id)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {i < transcript.length - 1 && <hr className="border-border/50" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
