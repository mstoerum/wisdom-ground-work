import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type { ThemeInsight } from "@/hooks/useAnalytics";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ThemeDrillDownPanelProps {
  theme: ThemeInsight;
  open: boolean;
  onClose: () => void;
}

export function ThemeDrillDownPanel({ theme, open, onClose }: ThemeDrillDownPanelProps) {
  // Generate expanded trend data (30 days)
  const generateTrendData = () => {
    const baseValue = theme.avgSentiment;
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      sentiment: Math.max(0, Math.min(100, baseValue + (Math.random() - 0.5) * 10)),
    }));
  };

  const trendData = generateTrendData();
  const sentimentChange = trendData[29].sentiment - trendData[0].sentiment;

  // Mock quotes (would come from actual data)
  const mockQuotes = [
    { text: "The recent changes have really helped with work-life balance.", sentiment: "positive" },
    { text: "Communication from leadership could be more transparent.", sentiment: "neutral" },
    { text: "I appreciate the new remote work policy.", sentiment: "positive" },
  ];

  const getSentimentColor = (score: number) => {
    if (score >= 60) return 'hsl(var(--green))';
    if (score >= 40) return 'hsl(var(--yellow))';
    return 'hsl(var(--destructive))';
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl overflow-y-auto"
        aria-describedby="theme-drill-down-description"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl flex items-center gap-3">
            {theme.name}
            <ConfidenceIndicator 
              level={theme.responseCount >= 30 ? 'high' : theme.responseCount >= 15 ? 'medium' : 'low'}
              sampleSize={theme.responseCount}
            />
          </SheetTitle>
          <SheetDescription id="theme-drill-down-description">
            Detailed insights and trend analysis for this theme
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sentiment Score</p>
                  <p className="text-3xl font-bold" style={{ color: getSentimentColor(theme.avgSentiment) }}>
                    {Math.round(theme.avgSentiment)}
                    <span className="text-lg text-muted-foreground">/100</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responses</p>
                  <p className="text-3xl font-bold flex items-center gap-2">
                    {theme.responseCount}
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </p>
                </div>
              </div>

              {theme.urgencyCount > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">{theme.urgencyCount} urgent {theme.urgencyCount === 1 ? 'flag' : 'flags'}</span>
                  </div>
                </div>
              )}

              <div className={`flex items-center gap-2 text-sm ${
                sentimentChange > 0 ? 'text-green-600' : sentimentChange < 0 ? 'text-red-600' : 'text-muted-foreground'
              }`}>
                {sentimentChange > 0 ? <TrendingUp className="h-4 w-4" /> : 
                 sentimentChange < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                <span>
                  {sentimentChange > 0 ? 'Improving' : sentimentChange < 0 ? 'Declining' : 'Stable'} 
                  {' '}({Math.abs(Math.round(sentimentChange))} points over 30 days)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">30-Day Sentiment Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    label={{ value: 'Day', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Sentiment', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke={getSentimentColor(theme.avgSentiment)}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employee Quotes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employee Voices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockQuotes.map((quote, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border bg-muted/50"
                >
                  <p className="text-sm italic mb-2">"{quote.text}"</p>
                  <Badge variant="outline" className="text-xs">
                    {quote.sentiment}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export */}
          <Button className="w-full" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Theme Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
