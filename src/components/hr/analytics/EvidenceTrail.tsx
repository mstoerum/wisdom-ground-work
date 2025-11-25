import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { QuoteCarousel } from "./QuoteCarousel";

interface EvidenceTrailProps {
  evidenceIds: string[];
}

export function EvidenceTrail({ evidenceIds }: EvidenceTrailProps) {
  const { data: responses, isLoading } = useQuery({
    queryKey: ['evidence-responses', evidenceIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .in('id', evidenceIds);

      if (error) {
        console.error('Error fetching evidence responses:', error);
        throw error;
      }

      return data;
    },
    enabled: evidenceIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!responses || responses.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No evidence available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
        Supporting Evidence
      </h4>
      <QuoteCarousel responses={responses} />
    </div>
  );
}
