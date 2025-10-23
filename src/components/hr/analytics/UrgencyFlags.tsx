import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UrgencyFlagsProps {
  urgencies: any[];
  onUpdate?: () => void;
}

export const UrgencyFlags = ({ urgencies, onUpdate }: UrgencyFlagsProps) => {
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  const filteredUrgencies = showResolved 
    ? urgencies 
    : urgencies.filter(u => !u.resolved_at);

  const unresolvedCount = urgencies.filter(u => !u.resolved_at).length;
  const resolvedCount = urgencies.filter(u => u.resolved_at).length;

  const handleResolve = async (urgencyId: string) => {
    setResolvingIds(prev => new Set(prev).add(urgencyId));
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('escalation_log')
        .update({ 
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', urgencyId);

      if (error) throw error;

      toast.success('Flag marked as resolved');
      onUpdate?.();
    } catch (error) {
      console.error('Error resolving flag:', error);
      toast.error('Failed to resolve flag');
    } finally {
      setResolvingIds(prev => {
        const next = new Set(prev);
        next.delete(urgencyId);
        return next;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Urgent Flags ({unresolvedCount} unresolved)
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch 
              id="show-resolved" 
              checked={showResolved}
              onCheckedChange={setShowResolved}
            />
            <Label htmlFor="show-resolved" className="text-sm cursor-pointer">
              Show Resolved ({resolvedCount})
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUrgencies.length > 0 ? (
            filteredUrgencies.map((urgency) => (
              <div key={urgency.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={urgency.resolved_at ? "secondary" : "destructive"}>
                      {urgency.escalation_type}
                    </Badge>
                    {urgency.responses?.survey_themes && (
                      <Badge variant="outline">{urgency.responses.survey_themes.name}</Badge>
                    )}
                    {urgency.resolved_at && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(urgency.escalated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mb-2">
                  {urgency.responses?.content?.substring(0, 150)}...
                </p>
                {urgency.resolution_notes && (
                  <p className="text-sm text-muted-foreground mb-2 italic">
                    Resolution: {urgency.resolution_notes}
                  </p>
                )}
                {urgency.resolved_at ? (
                  <p className="text-xs text-muted-foreground">
                    Resolved on {new Date(urgency.resolved_at).toLocaleDateString()}
                  </p>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleResolve(urgency.id)}
                    disabled={resolvingIds.has(urgency.id)}
                  >
                    {resolvingIds.has(urgency.id) ? 'Resolving...' : 'Mark as Resolved'}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              {unresolvedCount === 0 && !showResolved ? (
                <>
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium text-primary mb-2">Great news! 🎉</p>
                  <p className="text-muted-foreground">No urgent flags at this time. All feedback is being addressed normally.</p>
                </>
              ) : (
                <p className="text-muted-foreground">No {showResolved ? 'resolved' : 'unresolved'} flags found.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
