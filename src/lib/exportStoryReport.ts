import jsPDF from 'jspdf';
import type { NarrativeReport, NarrativeChapter, NarrativeInsight } from '@/hooks/useNarrativeReports';
import type { ParticipationMetrics, SentimentMetrics, ThemeInsight } from '@/hooks/useAnalytics';

export interface QuoteLookup {
  [responseId: string]: {
    text: string;
    sentiment?: string;
  };
}

export interface StoryReportData {
  surveyName: string;
  generatedAt: Date;
  participation: ParticipationMetrics;
  sentiment: SentimentMetrics;
  themes: ThemeInsight[];
  narrativeReport: NarrativeReport;
  urgentCount: number;
  quotes?: QuoteLookup;
}

// Brand colors in RGB
const COLORS = {
  primary: [196, 164, 132] as [number, number, number],      // Terracotta #C4A484
  primaryDark: [166, 134, 102] as [number, number, number],  // Darker terracotta
  text: [45, 45, 45] as [number, number, number],            // Dark gray for text
  textLight: [100, 100, 100] as [number, number, number],    // Medium gray
  textMuted: [140, 140, 140] as [number, number, number],    // Light gray
  success: [16, 185, 129] as [number, number, number],       // Green
  warning: [245, 158, 11] as [number, number, number],       // Amber
  danger: [239, 68, 68] as [number, number, number],         // Red
  info: [59, 130, 246] as [number, number, number],          // Blue
  background: [251, 246, 243] as [number, number, number],   // Warm white
  cardBg: [255, 255, 255] as [number, number, number],       // White
  borderLight: [230, 230, 230] as [number, number, number],  // Light border
};

const CHAPTER_LABELS: Record<string, string> = {
  pulse: 'The Voices',
  voices: 'The Voices',
  working: 'The Landscape',
  landscape: 'The Landscape',
  warnings: 'Frictions',
  frictions: 'Frictions',
  why: 'Root Causes',
  root_causes: 'Root Causes',
  forward: 'The Path Forward',
  commitment: 'Our Commitment',
};

const getHealthStatus = (health: number): { label: string; color: [number, number, number] } => {
  if (health >= 70) return { label: 'Thriving', color: COLORS.success };
  if (health >= 50) return { label: 'Healthy', color: COLORS.info };
  if (health >= 35) return { label: 'Attention', color: COLORS.warning };
  return { label: 'Critical', color: COLORS.danger };
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

  const checkPageBreak = (requiredSpace: number): boolean => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
      addPageHeader();
      return true;
    }
    return false;
  };

  const addPageHeader = () => {
    // Subtle header line
    pdf.setDrawColor(...COLORS.borderLight);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 12, pageWidth - margin, 12);
  };

  const drawCard = (x: number, y: number, width: number, height: number, shadowOffset: number = 1) => {
    // Shadow
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(x + shadowOffset, y + shadowOffset, width, height, 4, 4, 'F');
    // Card
    pdf.setFillColor(...COLORS.cardBg);
    pdf.roundedRect(x, y, width, height, 4, 4, 'F');
    // Border
    pdf.setDrawColor(...COLORS.borderLight);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, y, width, height, 4, 4, 'S');
  };

  // ============= COVER PAGE =============
  pdf.setFillColor(...COLORS.background);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative top accent
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, pageWidth, 8, 'F');

  // Title
  yPosition = 50;
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.text);
  pdf.text('Story Report', pageWidth / 2, yPosition, { align: 'center' });

  // Subtitle line
  yPosition += 12;
  pdf.setDrawColor(...COLORS.primary);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 30, yPosition, pageWidth / 2 + 30, yPosition);

  // Survey name
  yPosition += 20;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.textLight);
  const surveyLines = pdf.splitTextToSize(data.surveyName, contentWidth - 40);
  surveyLines.forEach((line: string) => {
    pdf.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
  });

  // Generated date
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.textMuted);
  pdf.text(
    `Generated ${data.generatedAt.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  // Key metrics cards
  yPosition = 140;
  const cardWidth = 80;
  const cardHeight = 50;
  const cardSpacing = 10;
  const totalCardsWidth = cardWidth * 2 + cardSpacing;
  let cardX = (pageWidth - totalCardsWidth) / 2;

  const coverMetrics = [
    { 
      label: 'Participation', 
      value: `${data.participation.completionRate}%`, 
      sublabel: `${data.participation.completed} of ${data.participation.totalAssigned} completed`,
      color: data.participation.completionRate >= 70 ? COLORS.success : COLORS.warning
    },
    { 
      label: 'Overall Sentiment', 
      value: data.sentiment.avgScore.toFixed(0), 
      sublabel: `${data.sentiment.positive}% positive responses`,
      color: data.sentiment.avgScore >= 60 ? COLORS.success : data.sentiment.avgScore >= 40 ? COLORS.warning : COLORS.danger
    },
  ];

  coverMetrics.forEach((metric) => {
    drawCard(cardX, yPosition, cardWidth, cardHeight);
    
    // Color accent bar at top
    pdf.setFillColor(...metric.color);
    pdf.rect(cardX, yPosition, cardWidth, 4, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text(metric.label, cardX + cardWidth / 2, yPosition + 16, { align: 'center' });
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.text);
    pdf.text(metric.value, cardX + cardWidth / 2, yPosition + 32, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.textMuted);
    pdf.text(metric.sublabel, cardX + cardWidth / 2, yPosition + 42, { align: 'center' });
    
    cardX += cardWidth + cardSpacing;
  });

  // Second row of metrics
  yPosition += cardHeight + 15;
  cardX = (pageWidth - totalCardsWidth) / 2;

  const secondRowMetrics = [
    { 
      label: 'Urgent Flags', 
      value: data.urgentCount.toString(), 
      sublabel: 'Items requiring attention',
      color: data.urgentCount > 5 ? COLORS.danger : data.urgentCount > 0 ? COLORS.warning : COLORS.success
    },
    { 
      label: 'Confidence Score', 
      value: `${data.narrativeReport.confidence_score || 0}/5`, 
      sublabel: 'Data quality rating',
      color: (data.narrativeReport.confidence_score || 0) >= 4 ? COLORS.success : COLORS.info
    },
  ];

  secondRowMetrics.forEach((metric) => {
    drawCard(cardX, yPosition, cardWidth, cardHeight);
    
    pdf.setFillColor(...metric.color);
    pdf.rect(cardX, yPosition, cardWidth, 4, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(...COLORS.textLight);
    pdf.text(metric.label, cardX + cardWidth / 2, yPosition + 16, { align: 'center' });
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.text);
    pdf.text(metric.value, cardX + cardWidth / 2, yPosition + 32, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.textMuted);
    pdf.text(metric.sublabel, cardX + cardWidth / 2, yPosition + 42, { align: 'center' });
    
    cardX += cardWidth + cardSpacing;
  });

  // Data snapshot
  yPosition += cardHeight + 20;
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORS.textMuted);
  const snapshotText = `Based on ${data.narrativeReport.data_snapshot?.total_sessions || 0} sessions and ${data.narrativeReport.data_snapshot?.total_responses || 0} responses`;
  pdf.text(snapshotText, pageWidth / 2, yPosition, { align: 'center' });

  // ============= THEME HEALTH PAGE =============
  pdf.addPage();
  pdf.setFillColor(...COLORS.cardBg);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  addPageHeader();
  yPosition = margin + 5;

  // Section header with accent
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(margin, yPosition, 4, 20, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.text);
  pdf.text('Theme Health Overview', margin + 10, yPosition + 14);
  yPosition += 30;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.textLight);
  pdf.text('Health scores indicate overall satisfaction levels per theme (0-100)', margin, yPosition);
  yPosition += 20;

  // Theme cards (2 per row)
  const sortedThemes = [...data.themes].sort((a, b) => b.responseCount - a.responseCount);
  const themeCardWidth = (contentWidth - 10) / 2;
  const themeCardHeight = 65;
  
  sortedThemes.slice(0, 8).forEach((theme, index) => {
    const isLeft = index % 2 === 0;
    const cardXPos = isLeft ? margin : margin + themeCardWidth + 10;
    
    if (isLeft && index > 0) {
      yPosition += themeCardHeight + 10;
    }
    
    if (isLeft) {
      checkPageBreak(themeCardHeight + 15);
    }

    const health = Math.round(theme.avgSentiment);
    const status = getHealthStatus(health);

    // Card background
    drawCard(cardXPos, yPosition, themeCardWidth, themeCardHeight, 1);

    // Status color bar on left
    pdf.setFillColor(...status.color);
    pdf.rect(cardXPos, yPosition, 4, themeCardHeight, 'F');

    // Theme name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.text);
    const themeName = theme.name.length > 25 ? theme.name.substring(0, 22) + '...' : theme.name;
    pdf.text(themeName, cardXPos + 10, yPosition + 14);

    // Status badge
    const badgeWidth = 50;
    pdf.setFillColor(...status.color);
    pdf.roundedRect(cardXPos + themeCardWidth - badgeWidth - 8, yPosition + 6, badgeWidth, 14, 3, 3, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(status.label, cardXPos + themeCardWidth - badgeWidth / 2 - 8, yPosition + 15, { align: 'center' });

    // Health bar
    const barY = yPosition + 26;
    const barWidth = themeCardWidth - 50;
    pdf.setFillColor(...COLORS.borderLight);
    pdf.roundedRect(cardXPos + 10, barY, barWidth, 6, 2, 2, 'F');
    pdf.setFillColor(...status.color);
    pdf.roundedRect(cardXPos + 10, barY, (health / 100) * barWidth, 6, 2, 2, 'F');

    // Health score text
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...status.color);
    pdf.text(`${health}`, cardXPos + barWidth + 18, barY + 5);

    // Response count
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.textMuted);
    pdf.text(`${theme.responseCount} responses`, cardXPos + 10, yPosition + 45);

    // Key signal (if available)
    if (theme.keySignals?.concerns?.length || theme.keySignals?.positives?.length) {
      const firstConcern = theme.keySignals?.concerns?.[0];
      const firstPositive = theme.keySignals?.positives?.[0];
      const signal = firstConcern ? (typeof firstConcern === 'string' ? firstConcern : firstConcern.text) : (firstPositive ? (typeof firstPositive === 'string' ? firstPositive : firstPositive.text) : '');
      const isConcern = !!firstConcern;
      
      pdf.setFontSize(8);
      const signalColor = isConcern ? COLORS.danger : COLORS.success;
      pdf.setTextColor(signalColor[0], signalColor[1], signalColor[2]);
      const signalPrefix = isConcern ? '! ' : '+ ';
      const truncatedSignal = signal.length > 50 ? signal.substring(0, 47) + '...' : signal;
      pdf.text(signalPrefix + truncatedSignal, cardXPos + 10, yPosition + 57);
    }
  });

  // ============= STORY CHAPTERS =============
  data.narrativeReport.chapters.forEach((chapter, chapterIndex) => {
    pdf.addPage();
    pdf.setFillColor(...COLORS.cardBg);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    addPageHeader();
    yPosition = margin + 5;

    // Chapter number badge
    pdf.setFillColor(...COLORS.primary);
    pdf.roundedRect(margin, yPosition, 70, 18, 3, 3, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Chapter ${chapterIndex + 1}`, margin + 35, yPosition + 12, { align: 'center' });
    yPosition += 28;

    // Chapter title
    const chapterTitle = CHAPTER_LABELS[chapter.key] || chapter.title;
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.text);
    pdf.text(chapterTitle, margin, yPosition);
    yPosition += 15;

    // Decorative line under title
    pdf.setDrawColor(...COLORS.primary);
    pdf.setLineWidth(1.5);
    pdf.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 15;

    // Chapter narrative
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.textLight);
    
    const narrativeLines = pdf.splitTextToSize(chapter.narrative, contentWidth);
    narrativeLines.forEach((line: string) => {
      checkPageBreak(7);
      pdf.text(line, margin, yPosition);
      yPosition += 7;
    });
    
    yPosition += 15;

    // Insights section
    if (chapter.insights && chapter.insights.length > 0) {
      checkPageBreak(25);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...COLORS.text);
      pdf.text('Key Insights', margin, yPosition);
      yPosition += 12;

      chapter.insights.forEach((insight: NarrativeInsight, insightIndex: number) => {
        // Calculate card height based on content
        const insightLines = pdf.splitTextToSize(insight.text, contentWidth - 20);
        let cardHeight = 25 + (insightLines.length * 6);
        
        // Add space for quote if available
        const quoteText = getQuoteForInsight(insight, data.quotes);
        let quoteLines: string[] = [];
        if (quoteText) {
          quoteLines = pdf.splitTextToSize(`"${quoteText}"`, contentWidth - 30);
          cardHeight += 15 + (quoteLines.length * 5);
        }
        
        checkPageBreak(cardHeight + 10);

        // Insight card
        drawCard(margin, yPosition, contentWidth, cardHeight, 1);

        // Insight number circle
        pdf.setFillColor(...COLORS.primary);
        pdf.circle(margin + 12, yPosition + 12, 8, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${insightIndex + 1}`, margin + 12, yPosition + 15, { align: 'center' });

        // Insight text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...COLORS.text);
        let insightY = yPosition + 10;
        insightLines.forEach((line: string) => {
          pdf.text(line, margin + 25, insightY);
          insightY += 6;
        });

        // Metrics row
        const metricsY = insightY + 2;
        pdf.setFontSize(8);
        pdf.setTextColor(...COLORS.textMuted);
        
        let metricsText = `Confidence: ${insight.confidence}/5`;
        if (insight.agreement_percentage !== undefined) {
          metricsText += `  |  ${insight.agreement_percentage}% agreement`;
          if (insight.sample_size) {
            metricsText += ` (n=${insight.sample_size})`;
          }
        }
        pdf.text(metricsText, margin + 25, metricsY);

        // Supporting quote
        if (quoteText && quoteLines.length > 0) {
          const quoteY = metricsY + 10;
          pdf.setFillColor(248, 248, 248);
          pdf.roundedRect(margin + 20, quoteY - 3, contentWidth - 30, quoteLines.length * 5 + 8, 2, 2, 'F');
          
          // Quote mark
          pdf.setFontSize(16);
          pdf.setTextColor(...COLORS.primary);
          pdf.text('"', margin + 23, quoteY + 4);
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'italic');
          pdf.setTextColor(...COLORS.textLight);
          let quoteLineY = quoteY + 3;
          quoteLines.forEach((line: string) => {
            pdf.text(line, margin + 30, quoteLineY);
            quoteLineY += 5;
          });
        }

        yPosition += cardHeight + 8;
      });
    }
  });

  // ============= ACTION ITEMS PAGE =============
  pdf.addPage();
  pdf.setFillColor(...COLORS.cardBg);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  addPageHeader();
  yPosition = margin + 5;

  // Section header
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(margin, yPosition, 4, 20, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.text);
  pdf.text('Recommended Actions', margin + 10, yPosition + 14);
  yPosition += 35;

  // Find "Path Forward" chapter for actions
  const pathForwardChapter = data.narrativeReport.chapters.find(c => c.key === 'forward');
  
  if (pathForwardChapter?.insights && pathForwardChapter.insights.length > 0) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.textLight);
    pdf.text('Based on analysis from "The Path Forward" chapter:', margin, yPosition);
    yPosition += 15;

    pathForwardChapter.insights.forEach((insight, idx) => {
      const actionLines = pdf.splitTextToSize(insight.text, contentWidth - 50);
      const actionHeight = Math.max(25, actionLines.length * 6 + 15);
      
      checkPageBreak(actionHeight + 10);

      // Action card
      drawCard(margin, yPosition, contentWidth, actionHeight, 1);

      // Priority indicator
      const priorityColor = idx < 2 ? COLORS.danger : idx < 4 ? COLORS.warning : COLORS.info;
      pdf.setFillColor(...priorityColor);
      pdf.rect(margin, yPosition, 4, actionHeight, 'F');

      // Action number
      pdf.setFillColor(...COLORS.primary);
      pdf.circle(margin + 18, yPosition + 12, 10, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${idx + 1}`, margin + 18, yPosition + 16, { align: 'center' });

      // Action text
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.text);
      let actionY = yPosition + 10;
      actionLines.forEach((line: string) => {
        pdf.text(line, margin + 35, actionY);
        actionY += 6;
      });

      // Support percentage
      if (insight.agreement_percentage !== undefined) {
        pdf.setFontSize(9);
        pdf.setTextColor(...COLORS.success);
        pdf.text(`${insight.agreement_percentage}% support`, pageWidth - margin - 35, yPosition + 12);
      }

      yPosition += actionHeight + 8;
    });
  } else {
    pdf.setFontSize(11);
    pdf.setTextColor(...COLORS.textMuted);
    pdf.text('No specific action items were extracted from this report.', margin, yPosition);
    yPosition += 8;
    pdf.text('Review the chapter insights for recommended next steps.', margin, yPosition);
  }

  // ============= FOOTER ON ALL PAGES =============
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(...COLORS.borderLight);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.textMuted);
    pdf.text('Generated by Spradley', margin, pageHeight - 8);
    pdf.text('Confidential', pageWidth / 2, pageHeight - 8, { align: 'center' });
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Save or return
  if (returnPdf) {
    return pdf;
  }

  const filename = `spradley-story-report-${data.surveyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  pdf.save(filename);
}

// Helper function to get a quote for an insight
function getQuoteForInsight(insight: NarrativeInsight, quotes?: QuoteLookup): string | null {
  if (!quotes || !insight.evidence_ids || insight.evidence_ids.length === 0) {
    return null;
  }
  
  // Try to find a quote from evidence_ids
  for (const evidenceId of insight.evidence_ids) {
    if (quotes[evidenceId]) {
      const quote = quotes[evidenceId].text;
      // Return a reasonable length quote
      if (quote.length > 150) {
        return quote.substring(0, 147) + '...';
      }
      return quote;
    }
  }
  
  return null;
}
