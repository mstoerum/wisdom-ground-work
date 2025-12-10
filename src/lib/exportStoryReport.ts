import jsPDF from 'jspdf';
import type { NarrativeReport, NarrativeChapter, NarrativeInsight } from '@/hooks/useNarrativeReports';
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from '@/hooks/useAnalytics';

export interface StoryReportData {
  surveyName: string;
  generatedAt: Date;
  participation: ParticipationMetrics;
  sentiment: SentimentMetrics;
  themes: ThemeInsight[];
  narrativeReport: NarrativeReport;
  urgentCount: number;
}

const CHAPTER_ICONS: Record<string, string> = {
  pulse: '📊',
  working: '✅',
  warnings: '⚠️',
  why: '🔍',
  forward: '🚀',
};

const getHealthStatus = (health: number): { label: string; color: [number, number, number] } => {
  if (health >= 70) return { label: 'Thriving', color: [16, 185, 129] };
  if (health >= 50) return { label: 'Healthy', color: [59, 130, 246] };
  if (health >= 35) return { label: 'Attention', color: [245, 158, 11] };
  return { label: 'Critical', color: [239, 68, 68] };
};

const getSentimentColor = (score: number): [number, number, number] => {
  if (score >= 0.6) return [16, 185, 129];
  if (score >= 0.4) return [245, 158, 11];
  return [239, 68, 68];
};

export async function exportStoryReport(
  data: StoryReportData,
  returnPdf: true
): Promise<jsPDF>;
export async function exportStoryReport(
  data: StoryReportData,
  returnPdf?: false
): Promise<void>;
export async function exportStoryReport(
  data: StoryReportData,
  returnPdf: boolean = false
): Promise<jsPDF | void> {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ============= COVER PAGE =============
  // Background gradient simulation
  pdf.setFillColor(251, 246, 243);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text('Story Report', pageWidth / 2, 60, { align: 'center' });

  // Survey name
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const surveyLines = pdf.splitTextToSize(data.surveyName, contentWidth);
  pdf.text(surveyLines, pageWidth / 2, 75, { align: 'center' });

  // Generated date
  pdf.setFontSize(11);
  pdf.text(
    `Generated ${data.generatedAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    pageWidth / 2,
    95,
    { align: 'center' }
  );

  // Key metrics boxes
  yPosition = 120;
  const boxWidth = 42;
  const boxHeight = 35;
  const boxSpacing = 6;
  const totalBoxWidth = boxWidth * 4 + boxSpacing * 3;
  let boxX = (pageWidth - totalBoxWidth) / 2;

  const coverMetrics = [
    { label: 'Participation', value: `${data.participation.completionRate}%`, sublabel: 'completion' },
    { label: 'Sentiment', value: data.sentiment.avgScore.toFixed(1), sublabel: 'avg score' },
    { label: 'Urgent Flags', value: data.urgentCount.toString(), sublabel: 'requiring attention' },
    { label: 'Confidence', value: `${data.narrativeReport.confidence_score}/5`, sublabel: 'data quality' },
  ];

  coverMetrics.forEach((metric) => {
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(boxX, yPosition, boxWidth, boxHeight, 3, 3, 'F');
    
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(metric.label, boxX + boxWidth / 2, yPosition + 10, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text(metric.value, boxX + boxWidth / 2, yPosition + 22, { align: 'center' });
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(140, 140, 140);
    pdf.text(metric.sublabel, boxX + boxWidth / 2, yPosition + 30, { align: 'center' });
    
    boxX += boxWidth + boxSpacing;
  });

  // Data snapshot info
  yPosition = 175;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Based on ${data.narrativeReport.data_snapshot.total_sessions} sessions • ${data.narrativeReport.data_snapshot.total_responses} responses`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  // ============= THEME HEALTH PAGE =============
  pdf.addPage();
  yPosition = margin;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text('Theme Health Overview', margin, yPosition);
  yPosition += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Health scores indicate overall satisfaction levels per theme (0-100)', margin, yPosition);
  yPosition += 15;

  // Theme table header
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition, contentWidth, 10, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(80, 80, 80);
  pdf.text('Theme', margin + 3, yPosition + 7);
  pdf.text('Health', margin + 90, yPosition + 7);
  pdf.text('Status', margin + 115, yPosition + 7);
  pdf.text('Responses', margin + 145, yPosition + 7);
  yPosition += 12;

  // Theme rows
  const sortedThemes = [...data.themes].sort((a, b) => b.responseCount - a.responseCount);
  sortedThemes.slice(0, 10).forEach((theme) => {
    checkPageBreak(15);
    
    // Calculate health from avgSentiment (avgSentiment is 0-100 scale)
    const health = Math.round(theme.avgSentiment);
    const status = getHealthStatus(health);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    
    // Theme name (truncate if needed)
    const themeName = theme.name.length > 30 ? theme.name.substring(0, 27) + '...' : theme.name;
    pdf.text(themeName, margin + 3, yPosition + 5);
    
    // Health score with bar
    const barWidth = 20;
    const barHeight = 4;
    const barX = margin + 90;
    pdf.setFillColor(230, 230, 230);
    pdf.rect(barX, yPosition + 2, barWidth, barHeight, 'F');
    pdf.setFillColor(...status.color);
    pdf.rect(barX, yPosition + 2, (health / 100) * barWidth, barHeight, 'F');
    pdf.text(`${health}`, barX + barWidth + 3, yPosition + 5);
    
    // Status badge
    pdf.setFillColor(...status.color);
    pdf.roundedRect(margin + 115, yPosition + 1, 25, 6, 2, 2, 'F');
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(status.label, margin + 127.5, yPosition + 5, { align: 'center' });
    
    // Response count
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(theme.responseCount.toString(), margin + 155, yPosition + 5);
    
    yPosition += 12;
  });

  // Key signals section
  yPosition += 10;
  checkPageBreak(40);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text('Key Signals', margin, yPosition);
  yPosition += 10;

  // Find themes with key signals
  const themesWithSignals = sortedThemes.filter(t => t.keySignals && 
    (t.keySignals.concerns?.length || t.keySignals.positives?.length));
  
  themesWithSignals.slice(0, 3).forEach((theme) => {
    checkPageBreak(25);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(80, 80, 80);
    pdf.text(theme.name, margin, yPosition);
    yPosition += 6;
    
    // Show concerns
    if (theme.keySignals?.concerns?.length) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(239, 68, 68);
      const concern = theme.keySignals.concerns[0];
      const concernText = concern.length > 80 ? concern.substring(0, 77) + '...' : concern;
      pdf.text(`⚠ ${concernText}`, margin + 5, yPosition);
      yPosition += 5;
    }
    
    // Show positives
    if (theme.keySignals?.positives?.length) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(16, 185, 129);
      const positive = theme.keySignals.positives[0];
      const positiveText = positive.length > 80 ? positive.substring(0, 77) + '...' : positive;
      pdf.text(`✓ ${positiveText}`, margin + 5, yPosition);
      yPosition += 5;
    }
    
    yPosition += 5;
  });

  // ============= STORY CHAPTERS =============
  data.narrativeReport.chapters.forEach((chapter, chapterIndex) => {
    pdf.addPage();
    yPosition = margin;

    // Chapter header
    const icon = CHAPTER_ICONS[chapter.key] || '📄';
    pdf.setFontSize(12);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Chapter ${chapterIndex + 1}`, margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text(`${icon} ${chapter.title}`, margin, yPosition);
    yPosition += 15;

    // Chapter narrative
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    
    const narrativeLines = pdf.splitTextToSize(chapter.narrative, contentWidth);
    narrativeLines.forEach((line: string) => {
      checkPageBreak(8);
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;

    // Insights
    if (chapter.insights && chapter.insights.length > 0) {
      checkPageBreak(20);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      pdf.text('Key Insights', margin, yPosition);
      yPosition += 10;

      chapter.insights.forEach((insight: NarrativeInsight) => {
        checkPageBreak(30);

        // Insight card background
        pdf.setFillColor(250, 250, 250);
        const insightHeight = 25;
        pdf.roundedRect(margin, yPosition, contentWidth, insightHeight, 3, 3, 'F');

        // Insight text
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        const insightText = insight.text.length > 120 
          ? insight.text.substring(0, 117) + '...' 
          : insight.text;
        const insightLines = pdf.splitTextToSize(insightText, contentWidth - 60);
        pdf.text(insightLines, margin + 5, yPosition + 8);

        // Confidence badge
        const confidenceX = pageWidth - margin - 50;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Confidence: ${insight.confidence}/5`, confidenceX, yPosition + 8);

        // Agreement percentage if available
        if (insight.agreement_percentage !== undefined) {
          pdf.text(`${insight.agreement_percentage}% agree`, confidenceX, yPosition + 15);
          if (insight.sample_size) {
            pdf.setFontSize(7);
            pdf.setTextColor(130, 130, 130);
            pdf.text(`(n=${insight.sample_size})`, confidenceX, yPosition + 20);
          }
        }

        yPosition += insightHeight + 5;
      });
    }
  });

  // ============= ACTION ITEMS PAGE =============
  pdf.addPage();
  yPosition = margin;

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(60, 60, 60);
  pdf.text('🎯 Extracted Action Items', margin, yPosition);
  yPosition += 15;

  // Find "Path Forward" chapter for actions
  const pathForwardChapter = data.narrativeReport.chapters.find(c => c.key === 'forward');
  
  if (pathForwardChapter?.insights && pathForwardChapter.insights.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Based on "The Path Forward" chapter recommendations:', margin, yPosition);
    yPosition += 12;

    pathForwardChapter.insights.forEach((insight, idx) => {
      checkPageBreak(20);

      // Action number
      pdf.setFillColor(59, 130, 246);
      pdf.circle(margin + 5, yPosition + 3, 4, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${idx + 1}`, margin + 5, yPosition + 4.5, { align: 'center' });

      // Action text
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const actionLines = pdf.splitTextToSize(insight.text, contentWidth - 20);
      pdf.text(actionLines, margin + 15, yPosition + 4);

      // Agreement percentage
      if (insight.agreement_percentage !== undefined) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `${insight.agreement_percentage}% support`,
          pageWidth - margin - 25,
          yPosition + 4
        );
      }

      yPosition += actionLines.length * 6 + 10;
    });
  } else {
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text('No specific action items extracted from this report.', margin, yPosition);
    yPosition += 8;
    pdf.text('Review the chapter insights above for recommended next steps.', margin, yPosition);
  }

  // ============= FOOTER ON ALL PAGES =============
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

  // Save or return
  if (returnPdf) {
    return pdf;
  }

  const filename = `spradley-story-report-${data.surveyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  pdf.save(filename);
};
