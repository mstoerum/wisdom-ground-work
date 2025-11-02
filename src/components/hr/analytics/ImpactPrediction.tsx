import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";
import type { ImpactPrediction } from "@/lib/actionableIntelligence";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

interface ImpactPredictionProps {
  predictions: ImpactPrediction[];
  isLoading?: boolean;
}

export function ImpactPrediction({ predictions, isLoading }: ImpactPredictionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Predicting impact...</p>
        </CardContent>
      </Card>
    );
  }

  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Predictions Available</h3>
          <p className="text-muted-foreground">
            Impact predictions will appear here once interventions are recommended.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const chartData = predictions.map(p => ({
    theme: p.theme_name.length > 20 ? p.theme_name.substring(0, 20) + '...' : p.theme_name,
    current: p.current_sentiment,
    predicted: p.predicted_sentiment,
    improvement: p.improvement,
  }));

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-orange-100 text-orange-800 border-orange-300';
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <TrendingUp className="h-5 w-5" />
            Impact Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Predicted sentiment improvements if recommended interventions are implemented.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-green-600">
                +{Math.round(predictions.reduce((sum, p) => sum + p.improvement, 0) / predictions.length)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Improvement</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">
                {Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-2xl font-bold">{predictions.length}</div>
              <div className="text-xs text-muted-foreground">Themes Predicted</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Predicted Sentiment Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis 
                dataKey="theme" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'current') return [`Current: ${value.toFixed(1)}`, 'Current Sentiment'];
                  if (name === 'predicted') return [`Predicted: ${value.toFixed(1)}`, 'Predicted Sentiment'];
                  return [value, name];
                }}
              />
              <Bar dataKey="current" fill="#94a3b8" name="Current Sentiment" />
              <Bar dataKey="predicted" fill="#3b82f6" name="Predicted Sentiment" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Predictions */}
      <div className="space-y-6">
        {predictions
          .sort((a, b) => b.improvement - a.improvement)
          .map((prediction) => (
            <Card key={prediction.theme_id} className="border-l-4 border-blue-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{prediction.theme_name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Current: {prediction.current_sentiment.toFixed(1)}/100</span>
                      <span className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        Predicted: {prediction.predicted_sentiment.toFixed(1)}/100
                      </span>
                      <span className="font-medium text-green-600">
                        +{prediction.improvement.toFixed(1)} improvement
                      </span>
                    </div>
                  </div>
                  <Badge className={getConfidenceBadge(prediction.confidence)}>
                    {prediction.confidence}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Current Sentiment</span>
                      <span className="text-xs text-muted-foreground">
                        {prediction.current_sentiment.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          prediction.current_sentiment >= 70 ? 'bg-green-500' :
                          prediction.current_sentiment >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${prediction.current_sentiment}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Predicted Sentiment</span>
                      <span className="text-xs text-green-600 font-medium">
                        {prediction.predicted_sentiment.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${prediction.predicted_sentiment}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Interventions */}
                {prediction.interventions.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Recommended Interventions
                    </h5>
                    <ul className="space-y-1">
                      {prediction.interventions.map((intervention, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">?</span>
                          <span>{intervention}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence Indicator */}
                <div className="p-3 rounded bg-muted">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={`h-4 w-4 ${getConfidenceColor(prediction.confidence)}`} />
                    <span className="text-xs text-muted-foreground">
                      {prediction.confidence >= 80 
                        ? 'High confidence prediction based on strong evidence and proven interventions.'
                        : prediction.confidence >= 60
                        ? 'Moderate confidence prediction. Results may vary based on implementation.'
                        : 'Lower confidence prediction. Consider piloting before full implementation.'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
