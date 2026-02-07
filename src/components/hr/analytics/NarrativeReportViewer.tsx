import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { StoryChapter } from "./StoryChapter";
import { AudienceToggle } from "./AudienceToggle";
import { StoryJourneyNav } from "./StoryJourneyNav";

import { NarrativeReport } from "@/hooks/useNarrativeReports";
import { CONFIDENCE_CONFIG, CHAPTER_LABELS } from "@/lib/reportDesignSystem";
import { format } from "date-fns";

interface NarrativeReportViewerProps {
  report: NarrativeReport;
  surveyId: string;
  onRegenerateWithAudience?: (audience: 'executive' | 'manager') => void;
  isGenerating?: boolean;
  onExport?: () => void;
}

export function NarrativeReportViewer({ 
  report,
  surveyId,
  onRegenerateWithAudience,
  isGenerating,
  onExport
}: NarrativeReportViewerProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const [audience, setAudience] = useState<'executive' | 'manager'>(
    report.audience_config.audience
  );
  const [visitedChapters, setVisitedChapters] = useState<number[]>([0]);

  const handleChapterChange = (index: number) => {
    setDirection(index > activeChapter ? 1 : -1);
    setActiveChapter(index);
    if (!visitedChapters.includes(index)) {
      setVisitedChapters(prev => [...prev, index]);
    }
  };

  const goToNextChapter = useCallback(() => {
    if (report.chapters && activeChapter < report.chapters.length - 1) {
      handleChapterChange(activeChapter + 1);
    }
  }, [activeChapter, report.chapters?.length]);

  const goToPrevChapter = useCallback(() => {
    if (activeChapter > 0) {
      handleChapterChange(activeChapter - 1);
    }
  }, [activeChapter]);

  // Feature 1: Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') goToNextChapter();
      if (e.key === 'ArrowLeft') goToPrevChapter();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextChapter, goToPrevChapter]);

  // Handle empty chapters case (after all hooks)
  if (!report.chapters || report.chapters.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm p-8">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-medium">No Report Data Available</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This report has no chapters. This may happen when response data was unavailable during generation.
            </p>
          </div>
          {onRegenerateWithAudience && (
            <Button 
              variant="outline" 
              onClick={() => onRegenerateWithAudience(audience)}
              disabled={isGenerating}
            >
              {isGenerating ? 'Regenerating...' : 'Try Regenerating Report'}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const handleAudienceChange = (newAudience: 'executive' | 'manager') => {
    setAudience(newAudience);
    if (onRegenerateWithAudience && newAudience !== report.audience_config.audience) {
      onRegenerateWithAudience(newAudience);
    }
  };

  const confidenceLabel = CONFIDENCE_CONFIG.labels[report.confidence_score] || 'Good';
  const confidenceColors = CONFIDENCE_CONFIG.colors[report.confidence_score] || CONFIDENCE_CONFIG.colors[3];

  // Direction-aware slide variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Story Report
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Generated {format(new Date(report.generated_at), 'MMMM d, yyyy')}
            </p>
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
        </div>
      </div>

      {/* Visual Journey Navigation */}
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <StoryJourneyNav
          chapters={report.chapters.map(c => ({ key: c.key, title: c.title }))}
          activeIndex={activeChapter}
          onChapterSelect={handleChapterChange}
          completedIndices={visitedChapters}
        />
      </Card>

      {/* Chapter Content with directional animations */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeChapter}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
          >
            <StoryChapter 
              chapter={report.chapters[activeChapter]}
              chapterNumber={activeChapter + 1}
              surveyId={surveyId}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-2 pt-4 border-t">
        <Button
          variant="ghost"
          onClick={goToPrevChapter}
          disabled={activeChapter === 0}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {activeChapter > 0 && (
            <span className="hidden sm:inline text-sm">
              {CHAPTER_LABELS[report.chapters[activeChapter - 1]?.key] || 'Previous'}
            </span>
          )}
        </Button>
        
        <Button
          variant="ghost"
          onClick={goToNextChapter}
          disabled={activeChapter === report.chapters.length - 1}
          className="gap-2"
        >
          {activeChapter < report.chapters.length - 1 && (
            <span className="hidden sm:inline text-sm">
              {CHAPTER_LABELS[report.chapters[activeChapter + 1]?.key] || 'Next'}
            </span>
          )}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
