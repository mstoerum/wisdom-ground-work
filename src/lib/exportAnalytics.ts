import { ParticipationMetrics, SentimentMetrics, ThemeInsight } from "@/hooks/useAnalytics";

export const exportToCSV = (
  participation: ParticipationMetrics | undefined,
  sentiment: SentimentMetrics | undefined,
  themes: ThemeInsight[]
) => {
  if (!participation || !sentiment) return;

  const csvContent = [
    ['Spradley Analytics Export', ''],
    ['Generated', new Date().toLocaleString()],
    ['', ''],
    ['Participation Metrics', ''],
    ['Total Assigned', participation.totalAssigned],
    ['Completed', participation.completed],
    ['Pending', participation.pending],
    ['Completion Rate', `${participation.completionRate.toFixed(1)}%`],
    ['', ''],
    ['Sentiment Metrics', ''],
    ['Positive', sentiment.positive],
    ['Neutral', sentiment.neutral],
    ['Negative', sentiment.negative],
    ['Average Score', sentiment.avgScore.toFixed(1)],
    ['Mood Improvement', sentiment.moodImprovement],
    ['', ''],
    ['Theme Insights', ''],
    ['Theme', 'Responses', 'Avg Sentiment', 'Urgent Count'],
    ...themes.map(t => [t.name, t.responseCount, t.avgSentiment.toFixed(1), t.urgencyCount])
  ];

  const csv = csvContent.map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spradley-analytics-${Date.now()}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
