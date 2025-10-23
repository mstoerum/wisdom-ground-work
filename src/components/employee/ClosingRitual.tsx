import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart } from "lucide-react";

interface ClosingRitualProps {
  onComplete: () => void;
}

export const ClosingRitual = ({ onComplete }: ClosingRitualProps) => {
  return (
    <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success" />
          <CardTitle className="text-2xl">Thank You</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-foreground">
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

        <Button onClick={onComplete} className="w-full" size="lg">
          Complete Session
        </Button>
      </CardContent>
    </Card>
  );
};
