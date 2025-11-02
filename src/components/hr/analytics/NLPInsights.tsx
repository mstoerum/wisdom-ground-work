import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp,
  Sparkles,
  Loader2,
  Quote
} from "lucide-react";
import { NLPAnalysis } from "@/lib/advancedNLP";

interface NLPInsightsProps {
  nlpAnalysis: NLPAnalysis | null;
  isLoading?: boolean;
}

export function NLPInsights({ nlpAnalysis, isLoading }: NLPInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Analyzing conversations with NLP...</p>
        </CardContent>
      </Card>
    );
  }

  if (!nlpAnalysis) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No NLP Analysis Available</h3>
          <p className="text-muted-foreground">
            NLP insights will appear here once conversation data is analyzed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            NLP Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{nlpAnalysis.topics.length}</div>
              <div className="text-xs text-muted-foreground">Topic Clusters</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{nlpAnalysis.emotions.length}</div>
              <div className="text-xs text-muted-foreground">Emotions Detected</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{nlpAnalysis.semantic_patterns.length}</div>
              <div className="text-xs text-muted-foreground">Semantic Patterns</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{nlpAnalysis.quality_score}/100</div>
              <div className="text-xs text-muted-foreground">Analysis Quality</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emerging Topics */}
      {nlpAnalysis.emerging_topics.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
              Emerging Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nlpAnalysis.emerging_topics.map((topic) => (
                <div key={topic.id} className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{topic.label}</h4>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">
                      {topic.frequency} mentions
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Appearing in recent conversations - may require attention
                  </p>
                  {topic.representative_quotes.length > 0 && (
                    <p className="text-xs italic text-muted-foreground">
                      "{topic.representative_quotes[0]}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Top Topic Clusters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nlpAnalysis.topics.slice(0, 10).map((topic) => (
              <div key={topic.id} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{topic.label}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{topic.frequency} mentions</Badge>
                    <span className={`text-sm font-medium ${
                      topic.avg_sentiment >= 70 ? 'text-green-600' :
                      topic.avg_sentiment >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {topic.avg_sentiment}/100
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {topic.keywords.slice(0, 5).map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                {topic.representative_quotes.length > 0 && (
                  <p className="text-xs italic text-muted-foreground">
                    "{topic.representative_quotes[0]}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Semantic Patterns */}
      {nlpAnalysis.semantic_patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Semantic Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nlpAnalysis.semantic_patterns.map((pattern, idx) => (
                <div key={idx} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">"{pattern.pattern}"</h4>
                    <Badge variant="outline">{pattern.frequency} times</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Also expressed as: {pattern.semantic_variants.slice(0, 3).join(', ')}
                  </p>
                  {pattern.contexts.length > 0 && (
                    <p className="text-xs italic text-muted-foreground">
                      "{pattern.contexts[0]}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
