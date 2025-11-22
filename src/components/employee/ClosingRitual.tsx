import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Heart, MessageCircle } from "lucide-react";
import { SocialProof } from "./SocialProof";

interface ClosingRitualProps {
  conversationId: string;
  onComplete: () => void;
  surveyType?: 'employee_satisfaction' | 'course_evaluation';
}

export const ClosingRitual = ({ conversationId, onComplete, surveyType = 'employee_satisfaction' }: ClosingRitualProps) => {
  const isCourseEvaluation = surveyType === 'course_evaluation';

  const { data: themesDiscussed = [] } = useQuery({
    queryKey: ['themes-discussed', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responses')
        .select('theme_id, survey_themes(name)')
        .eq('conversation_session_id', conversationId)
        .not('theme_id', 'is', null);

      if (error) throw error;
      
      // Get unique themes
      const uniqueThemes = Array.from(
        new Map(data.map(item => [item.theme_id, item.survey_themes]))
      ).map(([_, theme]) => theme);
      
      return uniqueThemes.filter(Boolean);
    },
  });

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <CardTitle className="text-2xl">Thank You</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Themes Discussed Summary */}
        {themesDiscussed.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Topics You Shared Feedback On</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {themesDiscussed.map((theme: any, index: number) => (
                <Badge key={index} variant="secondary">
                  {theme.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-foreground font-medium">
            Thank you for taking the time to share your thoughts! 🙏
          </p>
          {themesDiscussed.length > 0 ? (
            <p className="text-foreground text-sm">
              Your feedback has been securely recorded and will help us {isCourseEvaluation 
                ? 'improve the learning experience for future students'
                : 'create a better workplace'
              }.
            </p>
          ) : (
            <p className="text-foreground text-sm">
              Your conversation has been recorded. Even brief feedback helps us understand your {isCourseEvaluation ? 'course experience' : 'work experience'} better.
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            Remember, your responses are completely anonymous. Your voice matters, and we're
            grateful for your honesty and time.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
          <Heart className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium mb-1">What happens next?</p>
            {isCourseEvaluation ? (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your feedback is analyzed with other student responses</li>
                <li>• Instructors review aggregated insights to improve the course</li>
                <li>• Common themes help shape future course improvements</li>
                <li>• Your voice contributes to a better learning experience</li>
              </ul>
            ) : (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your feedback is analyzed with others to identify trends</li>
                <li>• Leadership reviews aggregated insights</li>
                <li>• Action plans are developed based on common themes</li>
                <li>• You'll hear about outcomes and changes made</li>
              </ul>
            )}
          </div>
        </div>

        <SocialProof />

        <Button onClick={onComplete} className="w-full" size="lg">
          Complete Session
        </Button>
      </CardContent>
    </Card>
  );
};
