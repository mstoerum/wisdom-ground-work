import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

export const SocialProof = () => {
  const { data: stats } = useQuery({
    queryKey: ['social-proof-stats'],
    queryFn: async () => {
      // Get total completed sessions
      const { count: completedSessions } = await supabase
        .from('conversation_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get total responses
      const { count: totalResponses } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true });

      // Get average mood improvement
      const { data: sessions } = await supabase
        .from('conversation_sessions')
        .select('initial_mood, final_mood')
        .eq('status', 'completed')
        .not('final_mood', 'is', null);

      let avgImprovement = 0;
      if (sessions && sessions.length > 0) {
        const improvements = sessions.map(s => (s.final_mood || 0) - (s.initial_mood || 0));
        avgImprovement = Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length);
      }

      return {
        completedSessions: completedSessions || 0,
        totalResponses: totalResponses || 0,
        avgImprovement
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!stats || stats.completedSessions === 0) return null;

  return (
    <Card className="p-4 bg-muted/30 border-border/50">
      <p className="text-xs font-medium text-muted-foreground mb-3 text-center">
        You're part of a growing community
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{stats.completedSessions.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Voices heard</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{stats.totalResponses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Insights shared</p>
        </div>

        {stats.avgImprovement > 0 && (
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-lg font-bold text-success">+{stats.avgImprovement}</p>
            <p className="text-xs text-muted-foreground">Avg mood lift</p>
          </div>
        )}
      </div>
    </Card>
  );
};
