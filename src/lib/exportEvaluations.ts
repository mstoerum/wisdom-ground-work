export const exportEvaluationsToCSV = (evaluations: any[]) => {
  if (!evaluations || evaluations.length === 0) return;

  const csvContent = [
    ['Spradley Evaluations Export', ''],
    ['Generated', new Date().toLocaleString()],
    ['Total Evaluations', evaluations.length],
    ['', ''],
    ['Evaluation Details', ''],
    ['Completed At', 'Survey', 'Employee', 'Duration (s)', 'Questions', 'Sentiment', 'Sentiment Score'],
    ...evaluations.map(e => [
      new Date(e.completed_at).toLocaleString(),
      e.survey?.title || 'N/A',
      e.employee?.full_name || 'Anonymous',
      e.duration_seconds || 0,
      (e.key_insights as any)?.total_questions || 0,
      e.overall_sentiment || 'neutral',
      e.sentiment_score ? (e.sentiment_score * 100).toFixed(1) : 'N/A'
    ]),
    ['', ''],
    ['Response Details', ''],
    ...evaluations.flatMap(e => {
      const responses = e.evaluation_responses as any[] || [];
      return [
        ['', ''],
        ['Survey', e.survey?.title || 'N/A'],
        ['Completed', new Date(e.completed_at).toLocaleString()],
        ['Question', 'Answer'],
        ...responses.map((r: any) => [r.question, r.answer])
      ];
    })
  ];

  const csv = csvContent.map(row => 
    row.map(cell => {
      const str = String(cell);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spradley-evaluations-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
