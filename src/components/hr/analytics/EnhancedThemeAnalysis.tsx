import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Lightbulb,
  Quote,
  BarChart3
} from "lucide-react";
import { ThemeInsight } from "@/lib/conversationAnalytics";

interface EnhancedThemeAnalysisProps {
  themes: ThemeInsight[];
  isLoading?: boolean;
}

export function EnhancedThemeAnalysis({ themes, isLoading }: EnhancedThemeAnalysisProps) {
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());

  const toggleTheme = (themeId: string) => {
    const newExpanded = new Set(expandedThemes);
    if (newExpanded.has(themeId)) {
      newExpanded.delete(themeId);
    } else {
      newExpanded.add(themeId);
    }
    setExpandedThemes(newExpanded);
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'text-green-600';
    if (sentiment >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentBgColor = (sentiment: number) => {
    if (sentiment >= 70) return 'bg-green-100 dark:bg-green-950/20';
    if (sentiment >= 50) return 'bg-yellow-100 dark:bg-yellow-950/20';
    return 'bg-red-100 dark:bg-red-950/20';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Analyzing themes...</p>
        </CardContent>
      </Card>
    );
  }

  if (themes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Themes Available</h3>
          <p className="text-muted-foreground">
            Theme analysis will appear here as conversation data becomes available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort themes by response count (most mentioned first)
  const sortedThemes = [...themes].sort((a, b) => b.response_count - a.response_count);

  return (
    <div className="space-y-6">
      {sortedThemes.map((theme) => {
        const isExpanded = expandedThemes.has(theme.theme_id);
        const sentimentIcon = theme.avg_sentiment >= 70 
          ? <TrendingUp className="h-4 w-4 text-green-600" />
          : theme.avg_sentiment >= 50
          ? <BarChart3 className="h-4 w-4 text-yellow-600" />
          : <TrendingDown className="h-4 w-4 text-red-600" />;

        return (
          <Card key={theme.theme_id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleTheme(theme.theme_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg">{theme.theme_name}</CardTitle>
                    {sentimentIcon}
                    <Badge 
                      variant={theme.avg_sentiment >= 70 ? "default" : theme.avg_sentiment >= 50 ? "secondary" : "destructive"}
                    >
                      {theme.avg_sentiment.toFixed(1)}/100
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {theme.response_count} responses
                    </span>
                    {theme.sub_themes.length > 0 && (
                      <span>{theme.sub_themes.length} sub-themes identified</span>
                    )}
                    {theme.sentiment_drivers.length > 0 && (
                      <span>{theme.sentiment_drivers.length} sentiment drivers</span>
                    )}
                    {theme.quotes.length > 0 && (
                      <span>{theme.quotes.length} quotes available</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-6 pt-0">
                {/* Sentiment Score Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Sentiment</span>
                    <span className={`text-sm font-bold ${getSentimentColor(theme.avg_sentiment)}`}>
                      {theme.avg_sentiment.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${getSentimentBgColor(theme.avg_sentiment)}`}
                      style={{ width: `${theme.avg_sentiment}%` }}
                    />
                  </div>
                </div>

                {/* Sub-Themes */}
                {theme.sub_themes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Sub-Themes Identified
                    </h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      {theme.sub_themes.map((subTheme, index) => (
                        <Card key={index} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{subTheme.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {subTheme.frequency} mentions
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  subTheme.avg_sentiment >= 70 ? 'bg-green-500' :
                                  subTheme.avg_sentiment >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${subTheme.avg_sentiment}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {subTheme.avg_sentiment.toFixed(0)}/100
                            </span>
                          </div>
                          {subTheme.representative_quotes.length > 0 && (
                            <p className="text-xs italic text-muted-foreground mt-2">
                              "{subTheme.representative_quotes[0]}"
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentiment Drivers */}
                {theme.sentiment_drivers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Key Sentiment Drivers
                    </h4>
                    <div className="space-y-2">
                      {theme.sentiment_drivers.map((driver, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border ${
                            driver.sentiment_impact > 0 
                              ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
                              : 'border-red-200 bg-red-50 dark:bg-red-950/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">"{driver.phrase}"</span>
                            <div className="flex items-center gap-2">
                              {driver.sentiment_impact > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {driver.frequency} times
                              </Badge>
                            </div>
                          </div>
                          {driver.context.length > 0 && (
                            <p className="text-xs italic text-muted-foreground">
                              Example: "{driver.context[0]}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employee Quotes */}
                {theme.quotes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Quote className="h-4 w-4" />
                      Employee Voices ({theme.quotes.length})
                    </h4>
                    <div className="space-y-2">
                      {theme.quotes.slice(0, 5).map((quote) => (
                        <Card 
                          key={quote.id}
                          className={`p-3 border-l-4 ${
                            quote.sentiment === 'positive' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                            quote.sentiment === 'negative' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                            'border-gray-500 bg-gray-50 dark:bg-gray-950/20'
                          }`}
                        >
                          <p className="text-sm italic mb-1">"{quote.text}"</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {quote.department && <span>{quote.department}</span>}
                            {quote.sentiment_score && (
                              <span>Sentiment: {quote.sentiment_score.toFixed(0)}/100</span>
                            )}
                          </div>
                        </Card>
                      ))}
                      {theme.quotes.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          ... and {theme.quotes.length - 5} more quotes
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Follow-up Effectiveness */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Conversation Depth</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${theme.follow_up_effectiveness * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(theme.follow_up_effectiveness * 100)}% follow-up effectiveness
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This measures how effectively follow-up questions uncovered deeper insights in this theme.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
