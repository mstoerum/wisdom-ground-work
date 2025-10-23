import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ParticipationMetrics {
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface SentimentMetrics {
  positive: number;
  neutral: number;
  negative: number;
  avgScore: number;
  moodImprovement: number;
}

interface ThemeInsight {
  id: string;
  name: string;
  responseCount: number;
  avgSentiment: number;
  urgencyCount: number;
}

export const exportAnalyticsToPDF = async (
  surveyName: string,
  participation: ParticipationMetrics,
  sentiment: SentimentMetrics,
  themes: ThemeInsight[],
  urgency: any[]
) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cover Page
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Spradley Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(surveyName, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  // Executive Summary
  yPosition = 50;
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Executive Summary', 20, yPosition);
  
  yPosition += 15;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  // Key Metrics in a grid
  const metrics = [
    { label: 'Total Responses', value: participation.completed.toString() },
    { label: 'Completion Rate', value: `${participation.completionRate}%` },
    { label: 'Average Sentiment', value: sentiment.avgScore.toFixed(2) },
    { label: 'Urgent Flags', value: urgency.filter(u => !u.resolved_at).length.toString() }
  ];

  const boxWidth = 80;
  const boxHeight = 30;
  const spacing = 10;
  let xPosition = 20;

  metrics.forEach((metric, index) => {
    if (index === 2) {
      xPosition = 20;
      yPosition += boxHeight + spacing;
    }

    // Draw box
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(xPosition, yPosition, boxWidth, boxHeight);
    
    // Draw label
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(metric.label, xPosition + 5, yPosition + 10);
    
    // Draw value
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(metric.value, xPosition + 5, yPosition + 22);
    
    xPosition += boxWidth + spacing;
  });

  // Sentiment Distribution
  yPosition += boxHeight + 25;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sentiment Distribution', 20, yPosition);
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Positive: ${sentiment.positive} | Neutral: ${sentiment.neutral} | Negative: ${sentiment.negative}`, 20, yPosition);
  
  yPosition += 10;
  pdf.text(`Mood Improvement: ${sentiment.moodImprovement > 0 ? '+' : ''}${sentiment.moodImprovement.toFixed(1)}`, 20, yPosition);

  // Capture sentiment chart if exists
  const sentimentChartElement = document.getElementById('sentiment-chart');
  if (sentimentChartElement && yPosition + 80 < pageHeight) {
    try {
      const canvas = await html2canvas(sentimentChartElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      yPosition += 10;
      pdf.addImage(imgData, 'PNG', 20, yPosition, 170, 70);
      yPosition += 75;
    } catch (error) {
      console.error('Error capturing sentiment chart:', error);
    }
  }

  // Add new page for themes
  pdf.addPage();
  yPosition = 20;
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Themes', 20, yPosition);
  
  yPosition += 15;
  const topThemes = themes.sort((a, b) => b.responseCount - a.responseCount).slice(0, 5);
  
  pdf.setFontSize(10);
  topThemes.forEach((theme, index) => {
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${theme.name}`, 20, yPosition);
    
    yPosition += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Responses: ${theme.responseCount} | Avg Sentiment: ${theme.avgSentiment.toFixed(2)} | Urgent: ${theme.urgencyCount}`, 25, yPosition);
    
    yPosition += 10;
  });

  // Urgent Flags Summary
  if (yPosition > pageHeight - 50) {
    pdf.addPage();
    yPosition = 20;
  } else {
    yPosition += 10;
  }

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Urgent Flags', 20, yPosition);
  
  yPosition += 10;
  const unresolvedUrgencies = urgency.filter(u => !u.resolved_at);
  
  if (unresolvedUrgencies.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    unresolvedUrgencies.slice(0, 5).forEach((item) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setTextColor(220, 38, 38);
      pdf.text(`• ${item.escalation_type}`, 20, yPosition);
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 6;
      const contentPreview = item.responses?.content?.substring(0, 100) || 'No content';
      const lines = pdf.splitTextToSize(contentPreview + '...', pageWidth - 50);
      pdf.text(lines, 25, yPosition);
      
      yPosition += lines.length * 5 + 5;
    });

    if (unresolvedUrgencies.length > 5) {
      yPosition += 5;
      pdf.setTextColor(100, 100, 100);
      pdf.text(`... and ${unresolvedUrgencies.length - 5} more urgent items`, 20, yPosition);
      pdf.setTextColor(0, 0, 0);
    }
  } else {
    pdf.setFontSize(10);
    pdf.setTextColor(34, 197, 94);
    pdf.text('No urgent flags at this time 🎉', 20, yPosition);
    pdf.setTextColor(0, 0, 0);
  }

  // Footer on all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Generated by Spradley | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  pdf.save(`spradley-analytics-${new Date().getTime()}.pdf`);
};
