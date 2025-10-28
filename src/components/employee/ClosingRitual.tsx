import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Heart, TrendingUp, Minus, MessageCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { SocialProof } from "./SocialProof";

interface ClosingRitualProps {
  initialMood: number;
  conversationId: string;
  onComplete: (finalMood: number) => void;
}

export const ClosingRitual = ({ initialMood, conversationId, onComplete }: ClosingRitualProps) => {
  const [finalMood, setFinalMood] = useState(50);

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

  const moodLabels = [
    { value: 0, label: "Very Low", emoji: "😢" },
    { value: 25, label: "Low", emoji: "😕" },
    { value: 50, label: "Neutral", emoji: "😐" },
    { value: 75, label: "Good", emoji: "🙂" },
    { value: 100, label: "Great", emoji: "😊" }
  ];

  const getCurrentMood = (value: number) => {
    return moodLabels.reduce((prev, curr) => 
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
  };

  const currentMood = getCurrentMood(finalMood);
  const moodChange = finalMood - initialMood;

  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <CardTitle className="text-2xl">Thank You</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Final Mood Selection */}
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3 className="font-medium text-center">How are you feeling now?</h3>
          <div className="text-center">
            <div className="text-6xl mb-2">{currentMood.emoji}</div>
            <p className="text-lg font-medium">{currentMood.label}</p>
          </div>
          <Slider
            value={[finalMood]}
            onValueChange={(value) => setFinalMood(value[0])}
            max={100}
            step={1}
            className="w-full"
          />
          
          {/* Mood Change Indicator */}
          {moodChange !== 0 && (
            <div className="text-center pt-2">
              {moodChange > 0 ? (
                <div className="flex items-center justify-center gap-2 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Your mood improved by +{moodChange} points! 🎉
                  </span>
                </div>
              ) : moodChange < 0 ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Minus className="h-4 w-4" />
                  <span className="text-sm">Thank you for sharing honestly</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
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
          <p className="text-foreground text-sm">
            Your feedback has been securely recorded and will help us create a better workplace.
          </p>
          <p className="text-muted-foreground text-sm">
            Remember, your responses are completely anonymous. Your voice matters, and we're
            grateful for your honesty and time.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
          <Heart className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your feedback is analyzed with others to identify trends</li>
              <li>• Leadership reviews aggregated insights</li>
              <li>• Action plans are developed based on common themes</li>
              <li>• You'll hear about outcomes and changes made</li>
            </ul>
          </div>
        </div>

        <SocialProof />

        <Button onClick={() => onComplete(finalMood)} className="w-full" size="lg">
          Complete Session
        </Button>
      </CardContent>
    </Card>
  );
};
