import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Network, 
  TrendingUp, 
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Quote
} from "lucide-react";
import { PatternInsight } from "@/lib/conversationAnalytics";

interface PatternDiscoveryProps {
  patterns: PatternInsight[];
  isLoading?: boolean;
}

export function PatternDiscovery({ patterns, isLoading }: PatternDiscoveryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Discovering patterns...</p>
        </CardContent>
      </Card>
    );
  }

  if (patterns.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Patterns Found</h3>
          <p className="text-muted-foreground">
            Cross-conversation patterns will appear here as more conversations are completed.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by frequency (most common first)
  const sortedPatterns = [...patterns].sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Pattern Discovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These patterns represent themes and phrases that appear across multiple employee conversations, 
            revealing common concerns, experiences, and insights.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{patterns.length}</div>
              <div className="text-xs text-muted-foreground">Patterns Identified</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {Math.round(patterns.reduce((sum, p) => sum + p.correlation_strength, 0) / patterns.length * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Average Correlation</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {new Set(patterns.flatMap(p => p.affected_themes)).size}
              </div>
              <div className="text-xs text-muted-foreground">Themes Affected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern List */}
      <div className="space-y-4">
        {sortedPatterns.map((pattern, index) => {
          const isHighFrequency = pattern.frequency >= 5;
          const isStrongCorrelation = pattern.correlation_strength >= 0.3;

          return (
            <Card 
              key={index}
              className={`${
                isHighFrequency && isStrongCorrelation 
                  ? 'border-orange-300 dark:border-orange-800' 
                  : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">
                        Pattern #{index + 1}: "{pattern.pattern}"
                      </CardTitle>
                      {isHighFrequency && (
                        <Badge variant="destructive" className="text-xs">
                          High Frequency
                        </Badge>
                      )}
                      {isStrongCorrelation && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                          Strong Correlation
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Appears in {pattern.frequency} conversations
                      </span>
                      <span>
                        Correlation: {Math.round(pattern.correlation_strength * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Affected Themes */}
                {pattern.affected_themes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Affected Themes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {pattern.affected_themes.map((themeId, idx) => (
                        <Badge key={idx} variant="outline">
                          Theme {idx + 1}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Representative Quotes */}
                {pattern.representative_quotes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Quote className="h-4 w-4" />
                      Representative Quotes
                    </h4>
                    <div className="space-y-2">
                      {pattern.representative_quotes.map((quote, idx) => (
                        <Card 
                          key={quote.id}
                          className={`p-3 border-l-4 ${
                            quote.sentiment === 'positive' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                            quote.sentiment === 'negative' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                            'border-gray-500 bg-gray-50 dark:bg-gray-950/20'
                          }`}
                        >
                          <p className="text-sm italic">"{quote.text}"</p>
                          {quote.theme_name && (
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">
                                {quote.theme_name}
                              </Badge>
                              {quote.sentiment_score && (
                                <span className="text-xs text-muted-foreground">
                                  {quote.sentiment_score.toFixed(0)}/100
                                </span>
                              )}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insight */}
                <div className={`p-3 rounded-lg ${
                  isHighFrequency && isStrongCorrelation
                    ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900'
                    : 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {isHighFrequency && isStrongCorrelation ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {isHighFrequency && isStrongCorrelation 
                          ? 'Action Required' 
                          : 'Insight'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isHighFrequency && isStrongCorrelation
                          ? `This pattern appears frequently across conversations and shows strong correlation. Consider investigating the root cause and implementing targeted interventions.`
                          : `This pattern suggests a common experience or concern. Monitor for trends and consider addressing proactively.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
