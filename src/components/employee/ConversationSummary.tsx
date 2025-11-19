import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationSummaryProps {
  conversationId: string;
}

export const ConversationSummary = ({ conversationId }: ConversationSummaryProps) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Fetch responses for this conversation
        const { data: responsesData } = await supabase
          .from("responses")
          .select(`
            content,
            sentiment,
            survey_themes (
              name
            )
          `)
          .eq("conversation_session_id", conversationId)
          .order("created_at", { ascending: true });

        if (responsesData) {
          setResponses(responsesData);
          
          // Extract unique themes discussed
          const uniqueThemes = [...new Set(
            responsesData
              .map(r => r.survey_themes?.name)
              .filter(Boolean)
          )] as string[];
          
          setThemes(uniqueThemes);
        }
      } catch (error) {
        console.error("Error fetching conversation summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [conversationId]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-medium text-foreground">
          {responses.length} {responses.length === 1 ? "response" : "responses"} shared
        </p>
      </div>
      
      {themes.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1">Topics discussed:</p>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-full bg-[hsl(var(--coral-pink))]/20 text-[hsl(var(--terracotta-primary))] text-xs font-medium"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-muted-foreground text-xs">
        Your feedback covered {themes.length} {themes.length === 1 ? "area" : "areas"} and will be used to identify patterns and drive improvements.
      </p>
    </div>
  );
};
