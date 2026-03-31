import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Clock, MessageSquare, ChevronDown, ChevronRight,
  TrendingUp, TrendingDown, Minus, SmilePlus, Users,
} from "lucide-react";
import { format } from "date-fns";
import { SessionDetailPanel } from "./SessionDetailPanel";

interface SessionExplorerProps {
  surveyId: string | null;
}

const trajectoryConfig: Record<string, { label: string; icon: typeof TrendingUp; color: string; dot: string }> = {
  improving: { label: "Improving", icon: TrendingUp, color: "text-green-600", dot: "bg-green-500" },
  declining: { label: "Declining", icon: TrendingDown, color: "text-red-600", dot: "bg-red-500" },
  stable: { label: "Stable", icon: Minus, color: "text-blue-600", dot: "bg-blue-500" },
  mixed: { label: "Mixed", icon: Minus, color: "text-amber-600", dot: "bg-amber-500" },
};

export const SessionExplorer = ({ surveyId }: SessionExplorerProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch sessions
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["session-explorer-sessions", surveyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_sessions")
        .select("id, started_at, ended_at, initial_mood, final_mood, status")
        .eq("survey_id", surveyId!)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!surveyId,
  });

  // Fetch response counts per session
  const sessionIds = (sessions || []).map(s => s.id);
  const { data: responseCounts } = useQuery({
    queryKey: ["session-response-counts", sessionIds],
    queryFn: async () => {
      if (sessionIds.length === 0) return {};
      const { data, error } = await supabase
        .from("responses")
        .select("conversation_session_id, id")
        .in("conversation_session_id", sessionIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach(r => {
        if (r.conversation_session_id) {
          counts[r.conversation_session_id] = (counts[r.conversation_session_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: sessionIds.length > 0,
  });

  // Fetch syntheses (Phase 2), fallback to session_insights
  const { data: insights } = useQuery({
    queryKey: ["session-explorer-syntheses", sessionIds],
    queryFn: async () => {
      if (sessionIds.length === 0) return {};
      // Try session_syntheses first
      const { data: syntheses } = await supabase
        .from("session_syntheses")
        .select("session_id, sentiment_trajectory, confidence_score, opinion_units_analyzed")
        .in("session_id", sessionIds);
      // Also fetch legacy insights for sessions without syntheses
      const { data: legacyInsights } = await supabase
        .from("session_insights")
        .select("session_id, sentiment_trajectory, confidence_score")
        .in("session_id", sessionIds);
      const map: Record<string, { sentiment_trajectory: string | null; confidence_score: number | null; opinion_units_analyzed?: number }> = {};
      // Legacy first, then syntheses override
      (legacyInsights || []).forEach(i => { map[i.session_id] = i; });
      (syntheses || []).forEach(s => { map[s.session_id] = s; });
      return map;
    },
    enabled: sessionIds.length > 0,
  });

  if (!surveyId) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Select a survey above to explore sessions.</p>
        </CardContent>
      </Card>
    );
  }

  if (loadingSessions) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No sessions found for this survey.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        {sessions.length} session{sessions.length !== 1 ? "s" : ""} · Click to expand
      </p>

      {sessions.map((session, idx) => {
        const isOpen = expandedId === session.id;
        const count = responseCounts?.[session.id] || 0;
        const durationMin = session.started_at && session.ended_at
          ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
          : null;
        const insightData = insights?.[session.id];
        const traj = insightData?.sentiment_trajectory
          ? trajectoryConfig[insightData.sentiment_trajectory]
          : null;
        const TrajIcon = traj?.icon;

        return (
          <Collapsible
            key={session.id}
            open={isOpen}
            onOpenChange={() => setExpandedId(isOpen ? null : session.id)}
          >
            <CollapsibleTrigger asChild>
              <Card className={`cursor-pointer transition-colors hover:bg-muted/50 ${isOpen ? "ring-1 ring-primary/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      session.status === "completed" ? (traj?.dot || "bg-green-500") : "bg-muted-foreground/40"
                    }`} />

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          Session #{sessions.length - idx}
                        </span>
                        {session.started_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(session.started_at), "MMM d, HH:mm")}
                          </span>
                        )}
                        <Badge variant={session.status === "completed" ? "default" : "outline"} className="text-[10px] h-5">
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {count} responses
                        </span>
                        {durationMin !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {durationMin}m
                          </span>
                        )}
                        {session.initial_mood !== null && session.final_mood !== null && (
                          <span className="flex items-center gap-1">
                            <SmilePlus className="h-3 w-3" /> {session.initial_mood}→{session.final_mood}
                          </span>
                        )}
                        {traj && TrajIcon && (
                          <span className={`flex items-center gap-1 ${traj.color}`}>
                            <TrajIcon className="h-3 w-3" /> {traj.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </CardContent>
              </Card>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="pl-4 border-l-2 border-primary/20 ml-5 mb-4">
                <SessionDetailPanel
                  sessionId={session.id}
                  surveyId={surveyId}
                  startedAt={session.started_at}
                  endedAt={session.ended_at}
                  initialMood={session.initial_mood}
                  finalMood={session.final_mood}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};
