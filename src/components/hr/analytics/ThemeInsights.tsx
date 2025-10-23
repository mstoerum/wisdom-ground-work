import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeInsight } from "@/hooks/useAnalytics";
import { MessageSquare, TrendingUp, AlertTriangle, Layers } from "lucide-react";

interface ThemeInsightsProps {
  themes: ThemeInsight[];
}

export const ThemeInsights = ({ themes }: ThemeInsightsProps) => {
  const sortedThemes = [...themes].sort((a, b) => b.responseCount - a.responseCount);

  if (sortedThemes.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Layers className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No theme data yet</h3>
        <p className="text-muted-foreground max-w-md">
          Theme insights will appear here once employees complete surveys and share feedback on different topics.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedThemes.map((theme) => (
        <Card key={theme.id}>
          <CardHeader>
            <CardTitle className="text-lg">{theme.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{theme.responseCount} responses</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Avg sentiment</span>
              </div>
              <Badge variant={theme.avgSentiment > 60 ? "default" : theme.avgSentiment > 40 ? "secondary" : "destructive"}>
                {theme.avgSentiment.toFixed(1)}
              </Badge>
            </div>

            {theme.urgencyCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{theme.urgencyCount} urgent</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
