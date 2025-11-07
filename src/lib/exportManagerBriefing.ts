import jsPDF from 'jspdf';

interface ManagerBriefingData {
  surveyName: string;
  managerName: string;
  teamName: string;
  period: string;
  generatedAt: Date;
  
  teamMetrics: {
    participation: number;
    sentiment: number;
    responseCount: number;
  };
  
  companyAverage: {
    participation: number;
    sentiment: number;
  };
  
  topThemes: Array<{
    name: string;
    sentiment: number;
    count: number;
  }>;
  
  suggestedActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  
  talkingPoints: string[];
}

export const exportManagerBriefing = async (data: ManagerBriefingData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ===== HEADER =====
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Team Feedback Briefing', margin, 25);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(226, 232, 240);
  pdf.text(`${data.teamName} | ${data.period}`, margin, 35);

  yPosition = 55;

  // ===== AT A GLANCE BOX =====
  pdf.setFillColor(240, 249, 255);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, 35);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.text('📊 At a Glance', margin + 5, yPosition + 8);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 65, 85);

  // Participation
  const partDelta = data.teamMetrics.participation - data.companyAverage.participation;
  pdf.text('Participation:', margin + 5, yPosition + 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(partDelta >= 0 ? 34 : 239, partDelta >= 0 ? 197 : 68, partDelta >= 0 ? 94 : 68);
  pdf.text(`${data.teamMetrics.participation.toFixed(1)}%`, margin + 40, yPosition + 16);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`(Co: ${data.companyAverage.participation.toFixed(1)}%, ${partDelta >= 0 ? '+' : ''}${partDelta.toFixed(1)}pts)`, margin + 60, yPosition + 16);

  // Sentiment
  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);
  const sentDelta = data.teamMetrics.sentiment - data.companyAverage.sentiment;
  pdf.text('Team Sentiment:', margin + 5, yPosition + 24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(sentDelta >= 0 ? 34 : 239, sentDelta >= 0 ? 197 : 68, sentDelta >= 0 ? 94 : 68);
  pdf.text(`${data.teamMetrics.sentiment.toFixed(1)}`, margin + 40, yPosition + 24);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`(Co: ${data.companyAverage.sentiment.toFixed(1)}, ${sentDelta >= 0 ? '+' : ''}${sentDelta.toFixed(1)}pts)`, margin + 60, yPosition + 24);

  // Response count
  pdf.setFontSize(10);
  pdf.setTextColor(51, 65, 85);
  pdf.text('Responses:', margin + 5, yPosition + 32);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.teamMetrics.responseCount}`, margin + 40, yPosition + 32);

  yPosition += 45;

  // ===== TOP THEMES =====
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('💬 What Your Team Is Saying', margin, yPosition);
  yPosition += 8;

  data.topThemes.slice(0, 3).forEach((theme, idx) => {
    checkPageBreak(20);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${idx + 1}. ${theme.name}`, margin + 5, yPosition);
    yPosition += 5;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${theme.count} mentions | Sentiment: ${theme.sentiment.toFixed(1)}`, margin + 8, yPosition);
    yPosition += 4;

    // Sentiment bar
    const barWidth = 60;
    const barHeight = 3;
    const sentimentRatio = theme.sentiment / 100;

    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin + 8, yPosition, barWidth, barHeight, 'F');

    const barColor = theme.sentiment >= 70 ? [34, 197, 94] :
                     theme.sentiment >= 50 ? [245, 158, 11] : [239, 68, 68];
    pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
    pdf.rect(margin + 8, yPosition, barWidth * sentimentRatio, barHeight, 'F');

    yPosition += 8;
  });

  yPosition += 5;

  // ===== SUGGESTED ACTIONS =====
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 65, 85);
  pdf.text('🎯 Suggested Actions for You', margin, yPosition);
  yPosition += 8;

  const priorityColors = {
    high: { bg: [254, 226, 226], text: [153, 27, 27], label: 'HIGH' },
    medium: { bg: [254, 249, 195], text: [146, 64, 14], label: 'MED' },
    low: { bg: [240, 253, 244], text: [22, 101, 52], label: 'LOW' }
  };

  data.suggestedActions.slice(0, 4).forEach((item, idx) => {
    checkPageBreak(18);

    const color = priorityColors[item.priority];

    // Priority badge
    pdf.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
    pdf.rect(margin + 5, yPosition - 3, 12, 5, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color.text[0], color.text[1], color.text[2]);
    pdf.text(color.label, margin + 6, yPosition);

    // Action text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    const actionLines = pdf.splitTextToSize(item.action, pageWidth - 2 * margin - 25);
    pdf.text(actionLines, margin + 20, yPosition);
    yPosition += actionLines.length * 4 + 2;

    // Timeframe
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`⏱️ ${item.timeframe}`, margin + 20, yPosition);
    yPosition += 8;
  });

  // ===== PAGE 2: TALKING POINTS =====
  if (data.talkingPoints && data.talkingPoints.length > 0) {
    pdf.addPage();
    yPosition = margin;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 65, 85);
    pdf.text('💡 Talking Points for Your Team', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Use these when discussing feedback results with your team:', margin, yPosition);
    yPosition += 10;

    data.talkingPoints.forEach((point, idx) => {
      checkPageBreak(15);

      pdf.setFillColor(248, 250, 252);
      const pointHeight = 8 + Math.ceil(point.length / 80) * 4;
      pdf.rect(margin, yPosition - 2, pageWidth - 2 * margin, pointHeight, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${idx + 1}.`, margin + 3, yPosition + 2);

      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(point, pageWidth - 2 * margin - 15);
      pdf.text(lines, margin + 10, yPosition + 2);
      yPosition += pointHeight + 3;
    });

    yPosition += 10;

    // Next steps box
    pdf.setDrawColor(99, 102, 241);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 30);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(67, 56, 202);
    pdf.text('📅 Next Steps', margin + 5, yPosition + 8);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text('1. Review this briefing before your next team meeting', margin + 5, yPosition + 15);
    pdf.text('2. Pick 1-2 actions to focus on this month', margin + 5, yPosition + 20);
    pdf.text('3. Schedule a follow-up conversation with HR if needed', margin + 5, yPosition + 25);
  }

  // Footer on all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      `Manager Briefing: ${data.teamName} | Page ${i} of ${totalPages} | Generated ${data.generatedAt.toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  pdf.save(`manager-briefing-${data.teamName.toLowerCase().replace(/\s+/g, '-')}-${data.generatedAt.getTime()}.pdf`);
};
