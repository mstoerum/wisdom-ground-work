import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock, MessageSquare, TrendingUp, TrendingDown, Minus,
  Lightbulb, Quote, CheckCircle2, SmilePlus, Bot, User,
  Activity, AlertTriangle, BarChart3,
} from "lucide-react";

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

  // Fetch session synthesis (Phase 2), fallback to session_insights
  const { data: synthesis, isLoading: loadingSynthesis } = useQuery({
    queryKey: ["session-synthesis", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_syntheses")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: legacyInsight, isLoading: loadingLegacy } = useQuery({
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
    enabled: !synthesis, // Only fetch if no synthesis
  });

  // Fetch survey first_message for transcript opener
  const { data: survey } = useQuery({
    queryKey: ["survey-first-message", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("first_message")
        .eq("id", surveyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch theme names
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

  const durationMin = startedAt && endedAt
    ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    : null;

  const transcript = (responses || []).filter(r => !r.content.startsWith("[SELECTED:"));

  // Use synthesis if available, otherwise fallback to legacy
  const hasSynthesis = !!synthesis;
  const insight = synthesis || legacyInsight;

  const keyQuotes = hasSynthesis
    ? (synthesis?.key_quotes as string[] || [])
    : ((legacyInsight?.key_quotes as string[]) || []);

  const recommendedActions = hasSynthesis
    ? (synthesis?.recommended_actions as Array<{ action: string; priority: string; timeframe: string; evidence?: string }> || [])
    : ((legacyInsight?.recommended_actions as Array<{ action: string; priority: string; timeframe: string }>) || []);

  const trajectory = (hasSynthesis ? synthesis?.sentiment_trajectory : legacyInsight?.sentiment_trajectory)
    ? trajectoryConfig[(hasSynthesis ? synthesis?.sentiment_trajectory : legacyInsight?.sentiment_trajectory) as string]
    : null;
  const TrajectoryIcon = trajectory?.icon;

  const emotionalArc = (synthesis?.emotional_arc as Array<{ position: number; sentiment: number; label: string }>) || [];
  const engagementQuality = (synthesis?.engagement_quality as { depth_score?: number; openness_score?: number; avg_response_length?: number }) || {};
  const escalationSummary = (synthesis?.escalation_summary as { flag_count?: number; urgent_count?: number; top_concerns?: string[] }) || {};
  const rootCauses = hasSynthesis
    ? (synthesis?.root_causes as Array<{ cause: string; evidence_count: number; severity: string }> || [])
    : [];
  const themesExplored = (synthesis?.themes_explored as Array<{ theme_id: string; theme_name: string; opinion_count: number; avg_sentiment: number }>) || [];
  const confidenceScore = hasSynthesis ? synthesis?.confidence_score : legacyInsight?.confidence_score;
  const narrativeSummary = synthesis?.narrative_summary;

  const isLoading = loadingResponses || loadingSynthesis || (!synthesis && loadingLegacy);

  if (isLoading) {
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
        {hasSynthesis && synthesis?.opinion_units_analyzed && (
          <Badge variant="outline" className="gap-1.5">
            <BarChart3 className="h-3 w-3" /> {synthesis.opinion_units_analyzed} signals
          </Badge>
        )}
        {themeIds.map(id => (
          <Badge key={id} variant="secondary" className="text-xs">
            {themeMap.get(id) || "Unknown"}
          </Badge>
        ))}
      </div>

      {/* Narrative Summary (Phase 2) */}
      {narrativeSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{narrativeSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Engagement & Escalation (Phase 2) */}
      {hasSynthesis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {engagementQuality.depth_score != null && (
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Depth</p>
                <p className="text-lg font-semibold">{engagementQuality.depth_score}%</p>
              </CardContent>
            </Card>
          )}
          {engagementQuality.openness_score != null && (
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Openness</p>
                <p className="text-lg font-semibold">{engagementQuality.openness_score}%</p>
              </CardContent>
            </Card>
          )}
          {escalationSummary.flag_count != null && (
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Flags</p>
                <p className="text-lg font-semibold">{escalationSummary.flag_count}</p>
              </CardContent>
            </Card>
          )}
          {escalationSummary.urgent_count != null && (
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Urgent</p>
                <p className={`text-lg font-semibold ${escalationSummary.urgent_count > 0 ? "text-red-600" : ""}`}>
                  {escalationSummary.urgent_count}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Emotional Arc (Phase 2) */}
      {emotionalArc.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Emotional Arc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-16">
              {emotionalArc.map((point, i) => {
                const height = ((point.sentiment + 1) / 2) * 100;
                const color = point.sentiment > 0.2
                  ? "bg-green-500"
                  : point.sentiment < -0.2
                    ? "bg-red-500"
                    : "bg-amber-500";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "48px" }}>
                      <div
                        className={`w-full max-w-8 rounded-t ${color}`}
                        style={{ height: `${Math.max(height, 8)}%` }}
                        title={`${point.label}: ${point.sentiment.toFixed(2)}`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground text-center leading-tight truncate w-full">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Coverage (Phase 2) */}
      {themesExplored.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Theme Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {themesExplored.map((theme, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{theme.theme_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{theme.opinion_count} signals</span>
                    <Badge variant="outline" className={
                      theme.avg_sentiment > 0.2 ? "text-green-600" :
                      theme.avg_sentiment < -0.2 ? "text-red-600" : "text-amber-600"
                    }>
                      {theme.avg_sentiment > 0 ? "+" : ""}{theme.avg_sentiment.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Root Causes (Phase 2) */}
      {rootCauses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Root Causes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rootCauses.map((rc, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border bg-card/50">
                <div className="flex-1">
                  <p className="text-sm">{rc.cause}</p>
                  <span className="text-xs text-muted-foreground">{rc.evidence_count} evidence points</span>
                </div>
                <Badge variant="secondary" className={priorityColors[rc.severity] || ""}>
                  {rc.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Insights (legacy fallback or enriched) */}
      {insight && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              {hasSynthesis ? "Insights & Actions" : "AI Insights"}
              {confidenceScore && (
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  Confidence: {confidenceScore}%
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Root cause (legacy only — Phase 2 shows root_causes card above) */}
            {!hasSynthesis && legacyInsight?.root_cause && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Core Issue</h4>
                <p className="text-sm leading-relaxed">{legacyInsight.root_cause}</p>
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
                          {'evidence' in a && (a as any).evidence && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 italic">{(a as any).evidence}</p>
                          )}
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
                  {msg.ai_response && (
                    <div className="flex gap-2">
                      <Bot className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm leading-relaxed">{msg.ai_response}</p>
                    </div>
                  )}
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
