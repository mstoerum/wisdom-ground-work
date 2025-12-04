import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";
import { StoryChapter } from "./StoryChapter";
import { AudienceToggle } from "./AudienceToggle";
import { NarrativeReport } from "@/hooks/useNarrativeReports";
import { format } from "date-fns";

interface NarrativeReportViewerProps {
  report: NarrativeReport;
  onRegenerateWithAudience?: (audience: 'executive' | 'manager') => void;
  isGenerating?: boolean;
}

export function NarrativeReportViewer({ 
  report, 
  onRegenerateWithAudience,
  isGenerating 
}: NarrativeReportViewerProps) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [audience, setAudience] = useState<'executive' | 'manager'>(
    report.audience_config.audience
  );

  const handleAudienceChange = (newAudience: 'executive' | 'manager') => {
    setAudience(newAudience);
    if (onRegenerateWithAudience && newAudience !== report.audience_config.audience) {
      onRegenerateWithAudience(newAudience);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-semibold">Story Report</h2>
            <Badge variant="outline" className="text-xs sm:text-sm">
              Confidence: {report.confidence_score}/5
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>Generated {format(new Date(report.generated_at), 'MMM d, yyyy h:mm a')}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{report.data_snapshot.total_sessions} sessions</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{report.data_snapshot.total_responses} responses</span>
          </div>
        </div>
        
        <AudienceToggle 
          value={audience}
          onChange={handleAudienceChange}
          disabled={isGenerating}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chapter Navigation Sidebar */}
        <Card className="lg:col-span-1 p-4 h-fit sticky top-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">
            Chapters
          </h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {report.chapters.map((chapter, index) => (
                <Button
                  key={chapter.key}
                  variant={activeChapter === index ? "secondary" : "ghost"}
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => setActiveChapter(index)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="font-medium">{chapter.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {chapter.insights.length} insights
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Active Chapter Content */}
        <div className="lg:col-span-3">
          <StoryChapter 
            chapter={report.chapters[activeChapter]}
            chapterNumber={activeChapter + 1}
          />
        </div>
      </div>
    </div>
  );
}
