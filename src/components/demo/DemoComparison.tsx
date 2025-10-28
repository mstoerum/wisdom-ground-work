import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
import { ArrowRight, X, MessageSquare } from "lucide-react";

interface DemoComparisonProps {
  conversationMessages: DemoMessage[];
  onViewAnalytics: () => void;
  onBackToMenu: () => void;
}

export const DemoComparison = ({ 
  conversationMessages, 
  onViewAnalytics, 
  onBackToMenu 
}: DemoComparisonProps) => {
  // Extract user messages for the comparison
  const userMessages = conversationMessages.filter(msg => msg.role === "user");
  const conversationExcerpt = userMessages.slice(0, 2).map(msg => msg.content).join(" ... ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Badge variant="secondary" className="mb-4">
          Experience Comparison
        </Badge>
        <h2 className="text-3xl font-bold mb-3">Notice the Difference?</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Traditional surveys collect numbers. Spradley uncovers the "why" behind those numbers.
        </p>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Traditional Survey */}
        <Card className="p-6 relative border-2 border-muted">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <X className="h-3 w-3" />
              Traditional Survey
            </Badge>
          </div>
          
          <div className="space-y-6 mt-4">
            <div>
              <p className="font-medium mb-2">1. How satisfied are you with work-life balance?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <div 
                    key={num} 
                    className="w-10 h-10 rounded border-2 flex items-center justify-center text-sm opacity-40"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">2. How would you rate team collaboration?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <div 
                    key={num} 
                    className="w-10 h-10 rounded border-2 flex items-center justify-center text-sm opacity-40"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">3. Are you satisfied with career growth?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <div 
                    key={num} 
                    className="w-10 h-10 rounded border-2 flex items-center justify-center text-sm opacity-40"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">What HR sees:</span> Numbers without context
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                "Work-life balance: 2.8/5"
              </p>
            </div>
          </div>
        </Card>

        {/* Spradley Conversation */}
        <Card className="p-6 relative border-2 border-primary">
          <div className="absolute -top-3 left-4 bg-background px-2">
            <Badge className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Spradley Conversation
            </Badge>
          </div>
          
          <div className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm italic">
                "{conversationExcerpt.length > 200 
                  ? conversationExcerpt.substring(0, 200) + "..." 
                  : conversationExcerpt}"
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <p><span className="font-semibold">Context captured:</span> Specific challenges identified</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <p><span className="font-semibold">Sentiment detected:</span> Emotional tone understood</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <p><span className="font-semibold">Themes identified:</span> Connected pain points revealed</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <p><span className="font-semibold">Actionable insights:</span> Clear next steps for HR</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">What HR sees:</span> Rich, actionable insights
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                "Work-life balance challenges during month-end reporting due to tight deadlines and leadership pressure"
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-3">Why This Matters</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 text-primary" />
            <span><strong>Traditional surveys</strong> tell you satisfaction dropped to 2.8 - but not why</span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 text-primary" />
            <span><strong>Spradley conversations</strong> reveal that month-end deadlines and leadership pressure are the root causes</span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 text-primary" />
            <span><strong>Result:</strong> HR can take targeted action instead of guessing solutions</span>
          </li>
        </ul>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onViewAnalytics} size="lg">
          See How HR Would Analyze This
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={onBackToMenu} variant="outline" size="lg">
          Back to Demo Menu
        </Button>
      </div>
    </div>
  );
};
