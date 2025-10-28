import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ParticipationMetrics {
  totalAssigned: number;
  completed: number;
  pending: number;
  completionRate: number;
  avgDuration: number;
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

interface ExecutiveReportData {
  surveyName: string;
  participation: ParticipationMetrics;
  sentiment: SentimentMetrics;
  themes: ThemeInsight[];
  urgency: any[];
  departmentData?: any[];
  trendData?: any[];
  insights?: any[];
  generatedAt: Date;
  period: string;
}

export const exportExecutiveReport = async (data: ExecutiveReportData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add a new page
  const addNewPage = () => {
    pdf.addPage();
    yPosition = 20;
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      addNewPage();
      return true;
    }
    return false;
  };

  // Helper function to add a section header
  const addSectionHeader = (title: string, subtitle?: string) => {
    checkPageBreak(20);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, 20, yPosition);
    yPosition += 8;
    
    if (subtitle) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, 20, yPosition);
      yPosition += 6;
    }
    yPosition += 10;
  };

  // Helper function to add a metric box
  const addMetricBox = (label: string, value: string, status: 'good' | 'warning' | 'critical', x: number, width: number) => {
    const colors = {
      good: { bg: [240, 248, 255], border: [59, 130, 246], text: [30, 64, 175] },
      warning: { bg: [254, 249, 195], border: [245, 158, 11], text: [146, 64, 14] },
      critical: { bg: [254, 226, 226], border: [239, 68, 68], text: [153, 27, 27] }
    };

    const color = colors[status];
    
    // Draw background
    pdf.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
    pdf.rect(x, yPosition, width, 25, 'F');
    
    // Draw border
    pdf.setDrawColor(color.border[0], color.border[1], color.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, yPosition, width, 25);
    
    // Add label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(label, x + 5, yPosition + 8);
    
    // Add value
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color.text[0], color.text[1], color.text[2]);
    pdf.text(value, x + 5, yPosition + 18);
    
    yPosition += 30;
  };

  // Cover Page
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Spradley Executive Report', pageWidth / 2, 40, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.surveyName, pageWidth / 2, 55, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on ${data.generatedAt.toLocaleDateString()}`, pageWidth / 2, 65, { align: 'center' });
  pdf.text(`Period: ${data.period}`, pageWidth / 2, 72, { align: 'center' });

  // Add company logo placeholder
  pdf.setFillColor(240, 240, 240);
  pdf.rect(pageWidth / 2 - 30, 80, 60, 30, 'F');
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Company Logo', pageWidth / 2, 95, { align: 'center' });

  addNewPage();

  // Executive Summary
  addSectionHeader('Executive Summary', 'Key metrics and insights at a glance');

  // Traffic Light Metrics
  const completionStatus = data.participation.completionRate >= 80 ? 'good' : 
                          data.participation.completionRate >= 60 ? 'warning' : 'critical';
  const sentimentStatus = data.sentiment.avgScore >= 70 ? 'good' : 
                         data.sentiment.avgScore >= 50 ? 'warning' : 'critical';
  const urgencyStatus = data.urgency.filter(u => !u.resolved_at).length === 0 ? 'good' : 
                       data.urgency.filter(u => !u.resolved_at).length <= 3 ? 'warning' : 'critical';

  addMetricBox('Participation Rate', `${data.participation.completionRate.toFixed(1)}%`, completionStatus, 20, 35);
  addMetricBox('Employee Sentiment', data.sentiment.avgScore.toFixed(1), sentimentStatus, 60, 35);
  addMetricBox('Urgent Issues', data.urgency.filter(u => !u.resolved_at).length.toString(), urgencyStatus, 100, 35);
  addMetricBox('Total Responses', data.participation.completed.toString(), 'good', 140, 35);

  yPosition += 10;

  // Key Insights
  addSectionHeader('Key Insights', 'AI-generated insights and recommendations');

  const insights = [
    {
      title: 'Participation Analysis',
      content: data.participation.completionRate >= 80 
        ? `Excellent participation rate of ${data.participation.completionRate.toFixed(1)}% shows strong employee engagement.`
        : `Participation rate of ${data.participation.completionRate.toFixed(1)}% indicates ${data.participation.completionRate < 60 ? 'significant' : 'some'} engagement challenges.`,
      action: data.participation.completionRate < 80 
        ? 'Consider sending reminder emails, simplifying survey questions, or offering incentives.'
        : 'Maintain current engagement strategies and consider expanding survey frequency.'
    },
    {
      title: 'Sentiment Analysis',
      content: data.sentiment.avgScore >= 70 
        ? `Strong employee satisfaction with average sentiment of ${data.sentiment.avgScore.toFixed(1)}.`
        : `Employee sentiment of ${data.sentiment.avgScore.toFixed(1)} indicates ${data.sentiment.avgScore < 50 ? 'critical' : 'moderate'} dissatisfaction.`,
      action: data.sentiment.avgScore < 70 
        ? 'Investigate root causes, conduct focus groups, and implement immediate morale-boosting initiatives.'
        : 'Continue current practices and share positive feedback to reinforce good behaviors.'
    },
    {
      title: 'Urgency Assessment',
      content: data.urgency.filter(u => !u.resolved_at).length === 0 
        ? 'No urgent issues requiring immediate attention.'
        : `${data.urgency.filter(u => !u.resolved_at).length} urgent issues require immediate attention.`,
      action: data.urgency.filter(u => !u.resolved_at).length > 0 
        ? 'Prioritize urgent issues, assign dedicated resources, and implement escalation procedures.'
        : 'Maintain current monitoring and response procedures.'
    }
  ];

  insights.forEach(insight => {
    checkPageBreak(30);
    
    // Insight title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(insight.title, 20, yPosition);
    yPosition += 6;
    
    // Insight content
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const contentLines = pdf.splitTextToSize(insight.content, pageWidth - 40);
    pdf.text(contentLines, 20, yPosition);
    yPosition += contentLines.length * 4 + 2;
    
    // Action recommendation
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Recommended Action:', 20, yPosition);
    yPosition += 4;
    
    pdf.setFont('helvetica', 'normal');
    const actionLines = pdf.splitTextToSize(insight.action, pageWidth - 40);
    pdf.text(actionLines, 20, yPosition);
    yPosition += actionLines.length * 4 + 8;
  });

  addNewPage();

  // Theme Analysis
  addSectionHeader('Theme Analysis', 'Performance breakdown by feedback themes');

  const topThemes = data.themes.sort((a, b) => b.responseCount - a.responseCount).slice(0, 5);
  
  topThemes.forEach((theme, index) => {
    checkPageBreak(25);
    
    // Theme header
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${index + 1}. ${theme.name}`, 20, yPosition);
    yPosition += 6;
    
    // Theme metrics
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(`Responses: ${theme.responseCount} | Avg Sentiment: ${theme.avgSentiment.toFixed(1)} | Urgent: ${theme.urgencyCount}`, 25, yPosition);
    yPosition += 4;
    
    // Sentiment bar (visual representation)
    const barWidth = 100;
    const barHeight = 4;
    const sentimentRatio = theme.avgSentiment / 100;
    
    // Background bar
    pdf.setFillColor(240, 240, 240);
    pdf.rect(25, yPosition, barWidth, barHeight, 'F');
    
    // Sentiment bar
    const barColor = theme.avgSentiment >= 70 ? [34, 197, 94] : 
                     theme.avgSentiment >= 50 ? [245, 158, 11] : [239, 68, 68];
    pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
    pdf.rect(25, yPosition, barWidth * sentimentRatio, barHeight, 'F');
    
    yPosition += 10;
  });

  addNewPage();

  // Department Comparison (if available)
  if (data.departmentData && data.departmentData.length > 0) {
    addSectionHeader('Department Performance', 'Comparative analysis across departments');
    
    data.departmentData.forEach((dept, index) => {
      checkPageBreak(20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(dept.department, 20, yPosition);
      yPosition += 5;
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      pdf.text(`Sentiment: ${dept.sentiment.toFixed(1)} | Responses: ${dept.responses} | Urgent: ${dept.urgentFlags}`, 25, yPosition);
      yPosition += 8;
    });
  }

  // Trend Analysis (if available)
  if (data.trendData && data.trendData.length > 0) {
    addSectionHeader('Trend Analysis', 'Historical performance trends');
    
    const latest = data.trendData[data.trendData.length - 1];
    const previous = data.trendData[data.trendData.length - 2];
    
    if (previous) {
      const sentimentChange = latest.sentiment - previous.sentiment;
      const participationChange = latest.participation - previous.participation;
      
      checkPageBreak(30);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      
      pdf.text(`Sentiment Change: ${sentimentChange > 0 ? '+' : ''}${sentimentChange.toFixed(1)} points`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Participation Change: ${participationChange > 0 ? '+' : ''}${participationChange.toFixed(1)} percentage points`, 20, yPosition);
      yPosition += 5;
      
      const trendSummary = sentimentChange > 5 
        ? 'Positive trend detected - recent initiatives are working well.'
        : sentimentChange < -5 
        ? 'Negative trend detected - immediate attention required.'
        : 'Stable performance - maintain current strategies.';
      
      pdf.text(trendSummary, 20, yPosition);
      yPosition += 10;
    }
  }

  // Action Items
  addSectionHeader('Recommended Actions', 'Priority actions based on analysis');

  const actionItems = [];
  
  if (data.participation.completionRate < 80) {
    actionItems.push('Improve survey participation through targeted communications');
  }
  
  if (data.sentiment.avgScore < 70) {
    actionItems.push('Address employee sentiment concerns through leadership action');
  }
  
  if (data.urgency.filter(u => !u.resolved_at).length > 0) {
    actionItems.push('Resolve urgent issues and implement prevention measures');
  }
  
  const concerningThemes = data.themes.filter(t => t.avgSentiment < 50 || t.urgencyCount > 0);
  concerningThemes.forEach(theme => {
    actionItems.push(`Address concerns in ${theme.name} theme`);
  });

  actionItems.forEach((item, index) => {
    checkPageBreak(15);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text(`• ${item}`, 20, yPosition);
    yPosition += 5;
  });

  // Footer on all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Spradley Executive Report | Page ${i} of ${totalPages} | Generated ${data.generatedAt.toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  pdf.save(`spradley-executive-report-${data.generatedAt.getTime()}.pdf`);
};