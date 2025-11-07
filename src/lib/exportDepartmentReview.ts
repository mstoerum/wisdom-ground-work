import jsPDF from 'jspdf';

interface DepartmentReviewData {
  surveyName: string;
  departmentName: string;
  period: string;
  generatedAt: Date;
  
  // Metrics
  participation: {
    departmentRate: number;
    orgAverage: number;
    completed: number;
    total: number;
  };
  sentiment: {
    departmentScore: number;
    orgAverage: number;
    positive: number;
    neutral: number;
    negative: number;
    trend: number[];
  };
  
  // Themes with quotes
  themes: Array<{
    name: string;
    responseCount: number;
    avgSentiment: number;
    quotes: string[];
  }>;
  
  // Root causes
  rootCauses: Array<{
    issue: string;
    whys: string[];
  }>;
  
  // Actions
  suggestedActions: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }>;
  
  // Meeting metadata
  meetingDate?: string;
  attendees?: string[];
}

export const exportDepartmentReview = async (data: DepartmentReviewData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const addNewPage = () => {
    pdf.addPage();
    yPosition = margin;
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  };

  const addSectionHeader = (title: string, icon: string = '●') => {
    checkPageBreak(15);
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 12, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text(`${icon} ${title}`, margin + 3, yPosition + 3);
    yPosition += 15;
  };

  const addDiscussionPrompt = (prompt: string) => {
    checkPageBreak(10);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    const lines = pdf.splitTextToSize(`💬 ${prompt}`, pageWidth - 2 * margin - 10);
    pdf.text(lines, margin + 5, yPosition);
    yPosition += lines.length * 4 + 3;
  };

  const addNotesSpace = (lines: number = 3) => {
    checkPageBreak(lines * 6);
    pdf.setDrawColor(203, 213, 225);
    for (let i = 0; i < lines; i++) {
      pdf.line(margin + 5, yPosition + i * 6, pageWidth - margin - 5, yPosition + i * 6);
    }
    yPosition += lines * 6 + 5;
  };

  // ===== COVER PAGE =====
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 80, 'F');
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Department After-Action Review', pageWidth / 2, 30, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.departmentName, pageWidth / 2, 42, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setTextColor(226, 232, 240);
  pdf.text(data.surveyName, pageWidth / 2, 52, { align: 'center' });
  pdf.text(`Period: ${data.period}`, pageWidth / 2, 62, { align: 'center' });

  yPosition = 100;
  
  // Meeting details box
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 40);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('Meeting Details', margin + 5, yPosition + 8);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Date:', margin + 5, yPosition + 16);
  pdf.line(margin + 20, yPosition + 18, margin + 70, yPosition + 18);
  
  pdf.text('Facilitator:', margin + 5, yPosition + 24);
  pdf.line(margin + 25, yPosition + 26, margin + 70, yPosition + 26);
  
  pdf.text('Attendees:', margin + 5, yPosition + 32);
  pdf.line(margin + 25, yPosition + 34, pageWidth - margin - 5, yPosition + 34);
  
  yPosition += 45;
  
  // Purpose statement
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(71, 85, 105);
  const purpose = pdf.splitTextToSize(
    'This After-Action Review helps us reflect on employee feedback, understand root causes, and commit to concrete actions. The goal is collaborative problem-solving, not blame.',
    pageWidth - 2 * margin
  );
  pdf.text(purpose, margin, yPosition);
  yPosition += purpose.length * 5;

  addNewPage();

  // ===== SECTION 1: HOW DID WE DO? =====
  addSectionHeader('1. How Did We Do?', '📊');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);
  
  // Participation comparison
  const partDelta = data.participation.departmentRate - data.participation.orgAverage;
  pdf.text('Participation Rate:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(partDelta >= 0 ? 34 : 239, partDelta >= 0 ? 197 : 68, partDelta >= 0 ? 94 : 68);
  pdf.text(`${data.participation.departmentRate.toFixed(1)}%`, margin + 50, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`(Org: ${data.participation.orgAverage.toFixed(1)}%, ${partDelta >= 0 ? '+' : ''}${partDelta.toFixed(1)}pts)`, margin + 70, yPosition);
  yPosition += 7;
  
  // Sentiment comparison
  const sentDelta = data.sentiment.departmentScore - data.sentiment.orgAverage;
  pdf.setTextColor(51, 65, 85);
  pdf.text('Employee Sentiment:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(sentDelta >= 0 ? 34 : 239, sentDelta >= 0 ? 197 : 68, sentDelta >= 0 ? 94 : 68);
  pdf.text(`${data.sentiment.departmentScore.toFixed(1)}`, margin + 50, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`(Org: ${data.sentiment.orgAverage.toFixed(1)}, ${sentDelta >= 0 ? '+' : ''}${sentDelta.toFixed(1)}pts)`, margin + 70, yPosition);
  yPosition += 10;
  
  // Simple 30-day trend sparkline
  if (data.sentiment.trend.length > 0) {
    const sparkWidth = 60;
    const sparkHeight = 15;
    const sparkX = margin + 5;
    const sparkY = yPosition;
    
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('30-Day Trend:', sparkX, sparkY);
    
    const maxVal = Math.max(...data.sentiment.trend);
    const minVal = Math.min(...data.sentiment.trend);
    const range = maxVal - minVal || 1;
    
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(0.5);
    
    for (let i = 0; i < data.sentiment.trend.length - 1; i++) {
      const x1 = sparkX + 22 + (i / (data.sentiment.trend.length - 1)) * sparkWidth;
      const y1 = sparkY + 5 + sparkHeight - ((data.sentiment.trend[i] - minVal) / range) * sparkHeight;
      const x2 = sparkX + 22 + ((i + 1) / (data.sentiment.trend.length - 1)) * sparkWidth;
      const y2 = sparkY + 5 + sparkHeight - ((data.sentiment.trend[i + 1] - minVal) / range) * sparkHeight;
      pdf.line(x1, y1, x2, y2);
    }
    
    yPosition += 25;
  }
  
  addDiscussionPrompt('What explains our performance vs. the organization average?');
  addNotesSpace(2);
  
  addDiscussionPrompt('What are we doing well that we should continue?');
  addNotesSpace(2);

  addNewPage();

  // ===== SECTION 2: WHAT DID PEOPLE SAY? =====
  addSectionHeader('2. What Did People Say?', '💬');
  
  const topThemes = data.themes.slice(0, 4);
  
  topThemes.forEach((theme, idx) => {
    checkPageBreak(30);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 65, 85);
    pdf.text(`${theme.name}`, margin + 5, yPosition);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${theme.responseCount} mentions | Sentiment: ${theme.avgSentiment.toFixed(1)}`, margin + 5, yPosition + 5);
    yPosition += 10;
    
    // Display quotes
    const quotesToShow = theme.quotes.slice(0, 3);
    quotesToShow.forEach(quote => {
      checkPageBreak(15);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(71, 85, 105);
      const quoteLines = pdf.splitTextToSize(`"${quote}"`, pageWidth - 2 * margin - 15);
      pdf.text(quoteLines, margin + 10, yPosition);
      yPosition += quoteLines.length * 4 + 3;
    });
    
    yPosition += 3;
  });
  
  addDiscussionPrompt('Which themes surprise us? Which align with what we already knew?');
  addNotesSpace(2);

  addNewPage();

  // ===== SECTION 3: ROOT CAUSE ANALYSIS =====
  addSectionHeader('3. Why Is This Happening?', '🔍');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Use the "5 Whys" technique to dig deeper into root causes:', margin + 5, yPosition);
  yPosition += 8;
  
  if (data.rootCauses.length > 0) {
    data.rootCauses.slice(0, 2).forEach(cause => {
      checkPageBreak(35);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Issue: ${cause.issue}`, margin + 5, yPosition);
      yPosition += 7;
      
      cause.whys.forEach((why, idx) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(71, 85, 105);
        pdf.text(`Why ${idx + 1}: ${why}`, margin + 10, yPosition);
        yPosition += 5;
      });
      
      yPosition += 5;
    });
  } else {
    // Blank template for team to fill in
    for (let i = 0; i < 2; i++) {
      checkPageBreak(35);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Issue ${i + 1}:`, margin + 5, yPosition);
      pdf.line(margin + 20, yPosition + 1, pageWidth - margin - 5, yPosition + 1);
      yPosition += 8;
      
      for (let j = 1; j <= 5; j++) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Why ${j}:`, margin + 10, yPosition);
        pdf.line(margin + 25, yPosition + 1, pageWidth - margin - 5, yPosition + 1);
        yPosition += 6;
      }
      yPosition += 5;
    }
  }

  addNewPage();

  // ===== SECTION 4: ACTION PLANNING =====
  addSectionHeader('4. What Will We Do About It?', '🎯');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Prioritize actions using Impact vs. Effort matrix:', margin + 5, yPosition);
  yPosition += 10;
  
  // Impact/Effort Matrix
  const matrixSize = 50;
  const matrixX = margin + 5;
  const matrixY = yPosition;
  
  // Draw matrix
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.3);
  pdf.rect(matrixX, matrixY, matrixSize, matrixSize);
  pdf.line(matrixX + matrixSize / 2, matrixY, matrixX + matrixSize / 2, matrixY + matrixSize);
  pdf.line(matrixX, matrixY + matrixSize / 2, matrixX + matrixSize, matrixY + matrixSize / 2);
  
  // Labels
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Low Effort', matrixX + 5, matrixY - 2);
  pdf.text('High Effort', matrixX + matrixSize - 15, matrixY - 2);
  pdf.text('High', matrixX - 10, matrixY + 5, { angle: 90 });
  pdf.text('Impact', matrixX - 10, matrixY + 15, { angle: 90 });
  pdf.text('Low', matrixX - 10, matrixY + matrixSize - 2, { angle: 90 });
  
  // Quadrant labels
  pdf.setFontSize(6);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Quick Wins', matrixX + 3, matrixY + 12);
  pdf.text('Major Projects', matrixX + matrixSize / 2 + 3, matrixY + 12);
  pdf.text('Fill-ins', matrixX + 3, matrixY + matrixSize - 3);
  pdf.text('Thankless', matrixX + matrixSize / 2 + 3, matrixY + matrixSize - 3);
  
  yPosition += matrixSize + 10;
  
  // Action commitments table
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('Committed Actions:', margin + 5, yPosition);
  yPosition += 8;
  
  // Table header
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin + 5, yPosition, pageWidth - 2 * margin - 10, 8, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Action', margin + 7, yPosition + 5);
  pdf.text('Owner', margin + 80, yPosition + 5);
  pdf.text('Due Date', margin + 115, yPosition + 5);
  pdf.text('Success?', margin + 145, yPosition + 5);
  yPosition += 10;
  
  // Empty rows for filling in
  pdf.setFont('helvetica', 'normal');
  pdf.setDrawColor(203, 213, 225);
  for (let i = 0; i < 5; i++) {
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    yPosition += 8;
  }
  
  yPosition += 5;
  addDiscussionPrompt('Who will follow up on these actions? When will we meet again to review progress?');
  addNotesSpace(1);

  addNewPage();

  // ===== SECTION 5: CLOSING & NEXT STEPS =====
  addSectionHeader('5. Key Takeaways & Next Steps', '✅');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('Top 3 Insights from Today:', margin + 5, yPosition);
  yPosition += 8;
  
  for (let i = 1; i <= 3; i++) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${i}.`, margin + 7, yPosition);
    pdf.line(margin + 12, yPosition + 1, pageWidth - margin - 5, yPosition + 1);
    yPosition += 7;
  }
  
  yPosition += 5;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('How Will We Share These Results?', margin + 5, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const shareOptions = [
    '☐ Team all-hands presentation',
    '☐ Written summary to all employees',
    '☐ 1-on-1 conversations with key stakeholders',
    '☐ Update on company intranet/portal'
  ];
  
  shareOptions.forEach(option => {
    pdf.text(option, margin + 7, yPosition);
    yPosition += 6;
  });
  
  yPosition += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Follow-up Meeting:', margin + 5, yPosition);
  yPosition += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Date:', margin + 7, yPosition);
  pdf.line(margin + 20, yPosition + 1, margin + 60, yPosition + 1);
  pdf.text('Focus:', margin + 70, yPosition);
  pdf.line(margin + 85, yPosition + 1, pageWidth - margin - 5, yPosition + 1);

  // Footer on all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `${data.departmentName} After-Action Review | Page ${i} of ${totalPages} | ${data.generatedAt.toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  pdf.save(`department-review-${data.departmentName.toLowerCase().replace(/\s+/g, '-')}-${data.generatedAt.getTime()}.pdf`);
};
