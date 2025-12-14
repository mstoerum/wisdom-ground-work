import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReportTierSelector } from "./ReportTierSelector";
import { VoicesFirstSection } from "./VoicesFirstSection";
import { SprintBoard } from "./SprintActionCard";
import { CommitmentSection } from "./CommitmentSection";
import { EmotionIndicator, EmotionBadge, EmotionSpectrumBar } from "./EmotionIndicator";
import { ChapterCard, ChapterNavigation } from "./ChapterCard";
import { CHAPTER_STRUCTURE, type ReportTier, type CommitmentSignature } from "@/lib/reportDesignSystem";
import {
  SAMPLE_QUOTES,
  SAMPLE_THEME_HEALTH,
  SAMPLE_SPRINT_ACTIONS,
  SAMPLE_COMMITMENTS,
  SAMPLE_PULSE_METRICS,
  SAMPLE_CHAPTER_NARRATIVES
} from "@/lib/sampleReportData";
import { X, Download, Users, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface InteractiveReportViewerProps {
  open: boolean;
  onClose: () => void;
  surveyName?: string;
  onExportPDF?: () => void;
}

export function InteractiveReportViewer({
  open,
  onClose,
  surveyName = "Employee Feedback Survey",
  onExportPDF
}: InteractiveReportViewerProps) {
  const [selectedTier, setSelectedTier] = useState<ReportTier['id'] | null>('story');
  const [activeChapter, setActiveChapter] = useState(0);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [commitments, setCommitments] = useState<CommitmentSignature[]>(SAMPLE_COMMITMENTS);

  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    );
  };

  const handleAddCommitment = (commitment: CommitmentSignature) => {
    setCommitments(prev => [...prev, commitment]);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">Interactive Report Preview</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Explore the new report design components
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={onExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="tier" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="tier">Report Tiers</TabsTrigger>
              <TabsTrigger value="voices">Voices Chapter</TabsTrigger>
              <TabsTrigger value="chapters">All Chapters</TabsTrigger>
              <TabsTrigger value="actions">Sprint Actions</TabsTrigger>
              <TabsTrigger value="commitments">Commitments</TabsTrigger>
              <TabsTrigger value="indicators">Emotion Indicators</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            {/* Tier Selection Tab */}
            <TabsContent value="tier" className="mt-0 space-y-6">
              <ReportTierSelector
                selectedTier={selectedTier}
                onSelect={setSelectedTier}
              />
              
              {selectedTier && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Selected: {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {selectedTier === 'spark' && "Quick 1-page summary for time-pressed executives. Key metrics and top 3 insights at a glance."}
                      {selectedTier === 'story' && "Narrative-driven 5-8 page report. Perfect for leadership presentations and team discussions."}
                      {selectedTier === 'strategy' && "Comprehensive strategy deck with full data access. Ideal for deep-dive sessions and planning."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Voices Chapter Tab */}
            <TabsContent value="voices" className="mt-0 space-y-6">
              {/* Pulse Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      Participation
                    </div>
                    <div className="text-2xl font-bold">{SAMPLE_PULSE_METRICS.participationRate}%</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      ↑ from last survey
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Sentiment
                    </div>
                    <div className="text-2xl font-bold">{SAMPLE_PULSE_METRICS.overallSentiment}%</div>
                    <Badge variant="secondary" className="mt-1 text-xs text-emerald-600">
                      +{SAMPLE_PULSE_METRICS.sentimentImprovement}pt
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Urgent Flags
                    </div>
                    <div className="text-2xl font-bold text-destructive">{SAMPLE_PULSE_METRICS.urgentFlags}</div>
                    <Badge variant="destructive" className="mt-1 text-xs">
                      Needs attention
                    </Badge>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Target className="h-4 w-4" />
                      Confidence
                    </div>
                    <div className="text-2xl font-bold">{SAMPLE_PULSE_METRICS.confidenceScore}%</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      High reliability
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <VoicesFirstSection
                totalVoices={SAMPLE_PULSE_METRICS.totalVoices}
                participationRate={SAMPLE_PULSE_METRICS.participationRate}
                quotes={SAMPLE_QUOTES}
                participationTrend={5}
              />
            </TabsContent>

            {/* All Chapters Tab */}
            <TabsContent value="chapters" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                  <ChapterNavigation
                    activeChapter={activeChapter}
                    onChapterSelect={setActiveChapter}
                    chapters={CHAPTER_STRUCTURE.map((ch, idx) => ({
                      key: ch.key,
                      insights: idx === 1 ? [{}, {}, {}] : idx === 2 ? [{}, {}] : [] // Sample insight counts
                    }))}
                  />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  {CHAPTER_STRUCTURE.map((chapter, index) => (
                    <ChapterCard
                      key={chapter.key}
                      chapter={chapter}
                      chapterNumber={index + 1}
                      narrative={SAMPLE_CHAPTER_NARRATIVES[chapter.key as keyof typeof SAMPLE_CHAPTER_NARRATIVES]}
                      isActive={activeChapter === index}
                      onClick={() => setActiveChapter(index)}
                      insights={index === 1 ? [
                        { text: "Meeting overload affects 73% of respondents", confidence: 85, agreement_percentage: 73, sample_size: 47 },
                        { text: "Career development satisfaction at all-time high", confidence: 92, agreement_percentage: 68, sample_size: 32 }
                      ] : undefined}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Sprint Actions Tab */}
            <TabsContent value="actions" className="mt-0">
              <SprintBoard
                actions={SAMPLE_SPRINT_ACTIONS}
                onActionComplete={handleActionComplete}
                completedActions={completedActions}
              />
            </TabsContent>

            {/* Commitments Tab */}
            <TabsContent value="commitments" className="mt-0">
              <CommitmentSection
                commitments={commitments}
                onAddCommitment={handleAddCommitment}
                surveyTitle={surveyName}
              />
            </TabsContent>

            {/* Emotion Indicators Tab */}
            <TabsContent value="indicators" className="mt-0 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Emotion Spectrum Bar</h3>
                <EmotionSpectrumBar showMarker currentScore={62} />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Health Score Indicators (Various Sizes)</h3>
                <div className="flex flex-wrap gap-6 items-end">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Small</p>
                    <EmotionIndicator score={38} size="sm" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Medium</p>
                    <EmotionIndicator score={52} size="md" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Large</p>
                    <EmotionIndicator score={85} size="lg" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Emotion Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <EmotionBadge score={15} />
                  <EmotionBadge score={35} />
                  <EmotionBadge score={55} />
                  <EmotionBadge score={75} />
                  <EmotionBadge score={95} />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Theme Health with Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SAMPLE_THEME_HEALTH.map(theme => (
                    <Card key={theme.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{theme.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{theme.keyInsight}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">{theme.responseCount} responses</span>
                              <Badge variant={theme.trend === 'improving' ? 'default' : theme.trend === 'declining' ? 'destructive' : 'secondary'} className="text-xs">
                                {theme.trend}
                              </Badge>
                            </div>
                          </div>
                          <EmotionIndicator score={theme.healthScore} size="sm" showScore />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
