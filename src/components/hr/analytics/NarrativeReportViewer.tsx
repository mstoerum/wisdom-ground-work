import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { StoryChapter } from "./StoryChapter";
import { AudienceToggle } from "./AudienceToggle";
import { ChapterProgressNav } from "./ChapterProgressNav";
import { ReadingTimeEstimate } from "./ReadingTimeEstimate";
import { NarrativeReport } from "@/hooks/useNarrativeReports";
import { CONFIDENCE_CONFIG } from "@/lib/reportDesignSystem";
import { format } from "date-fns";

interface NarrativeReportViewerProps {
  report: NarrativeReport;
  onRegenerateWithAudience?: (audience: 'executive' | 'manager') => void;
  isGenerating?: boolean;
  onExport?: () => void;
}

export function NarrativeReportViewer({ 
  report, 
  onRegenerateWithAudience,
  isGenerating,
  onExport
}: NarrativeReportViewerProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [audience, setAudience] = useState<'executive' | 'manager'>(
    report.audience_config.audience
  );
  const [visitedChapters, setVisitedChapters] = useState<number[]>([0]);

  const handleAudienceChange = (newAudience: 'executive' | 'manager') => {
    setAudience(newAudience);
    if (onRegenerateWithAudience && newAudience !== report.audience_config.audience) {
      onRegenerateWithAudience(newAudience);
    }
  };

  const handleChapterChange = (index: number) => {
    setActiveChapter(index);
    if (!visitedChapters.includes(index)) {
      setVisitedChapters(prev => [...prev, index]);
    }
  };

  const goToNextChapter = () => {
    if (activeChapter < report.chapters.length - 1) {
      handleChapterChange(activeChapter + 1);
    }
  };

  const goToPrevChapter = () => {
    if (activeChapter > 0) {
      handleChapterChange(activeChapter - 1);
    }
  };

  const confidenceLabel = CONFIDENCE_CONFIG.labels[report.confidence_score] || 'Good';
  const confidenceColors = CONFIDENCE_CONFIG.colors[report.confidence_score] || CONFIDENCE_CONFIG.colors[3];

  return (
    <div className="space-y-8">
      {/* Header - Apple-inspired clean design */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Story Report
              </h2>
            </div>
            <div className="w-12 h-0.5 bg-primary/60 rounded-full" />
          </div>
          
          <div className="flex items-center gap-3">
            <AudienceToggle 
              value={audience}
              onChange={handleAudienceChange}
              disabled={isGenerating}
            />
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
          </div>
        </div>

        {/* Metrics pills */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge 
            variant="outline" 
            className={`px-3 py-1.5 ${confidenceColors.bg} ${confidenceColors.text} border-0`}
          >
            {confidenceLabel} Confidence
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            {report.data_snapshot.total_sessions} sessions
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            {report.data_snapshot.total_responses} responses
          </Badge>
          <ReadingTimeEstimate chapters={report.chapters} />
        </div>

        {/* Generation date */}
        <p className="text-sm text-muted-foreground">
          Generated {format(new Date(report.generated_at), 'MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Chapter Progress Navigation */}
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <ChapterProgressNav
          chapters={report.chapters.map(c => ({ key: c.key, title: c.title }))}
          activeIndex={activeChapter}
          onChapterSelect={handleChapterChange}
          completedIndices={visitedChapters}
        />
      </Card>

      {/* Active Chapter Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeChapter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <StoryChapter 
            chapter={report.chapters[activeChapter]}
            chapterNumber={activeChapter + 1}
            totalChapters={report.chapters.length}
          />
        </motion.div>
      </AnimatePresence>

      {/* Chapter Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={goToPrevChapter}
          disabled={activeChapter === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {activeChapter + 1} of {report.chapters.length}
        </span>
        
        <Button
          variant="ghost"
          onClick={goToNextChapter}
          disabled={activeChapter === report.chapters.length - 1}
          className="gap-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
