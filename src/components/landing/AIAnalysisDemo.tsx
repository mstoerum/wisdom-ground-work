import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Tag } from "lucide-react";

interface ConversationStep {
  role: "assistant" | "user";
  content: string;
  highlights?: string[];
  detectedThemes?: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

const conversationSteps: ConversationStep[] = [
  {
    role: "assistant",
    content: "What's been the most challenging part of your work lately?",
  },
  {
    role: "user",
    content: "Honestly, it's the constant meetings. I feel like I never have time for deep work anymore. By the time I get focused, there's another call.",
    highlights: ["constant meetings", "never have time for deep work"],
    detectedThemes: ["Work-Life Balance", "Productivity"],
    sentiment: "negative",
  },
  {
    role: "assistant",
    content: "That sounds frustrating. How is this affecting your ability to deliver on your projects?",
  },
  {
    role: "user",
    content: "I'm staying late most days just to catch up. My manager is supportive, but the workload keeps growing. I love my team though—they're what keeps me here.",
    highlights: ["staying late", "manager is supportive", "love my team"],
    detectedThemes: ["Workload", "Management", "Team Culture"],
    sentiment: "neutral",
  },
];

const allThemes = ["Work-Life Balance", "Productivity", "Workload", "Management", "Team Culture"];

// Distinct color map for each theme
const themeColors: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  "Work-Life Balance": {
    bg: "bg-[hsl(var(--terracotta-pale))]",
    border: "border-[hsl(var(--terracotta-primary))]",
    dot: "bg-[hsl(var(--terracotta-primary))]",
    text: "text-[hsl(var(--terracotta-primary))]",
  },
  "Productivity": {
    bg: "bg-[hsl(210_60%_95%)]",
    border: "border-[hsl(210_60%_50%)]",
    dot: "bg-[hsl(210_60%_50%)]",
    text: "text-[hsl(210_60%_45%)]",
  },
  "Workload": {
    bg: "bg-[hsl(38_80%_92%)]",
    border: "border-[hsl(var(--warning))]",
    dot: "bg-[hsl(var(--warning))]",
    text: "text-[hsl(38_80%_40%)]",
  },
  "Management": {
    bg: "bg-[hsl(142_65%_92%)]",
    border: "border-[hsl(var(--success))]",
    dot: "bg-[hsl(var(--success))]",
    text: "text-[hsl(142_65%_35%)]",
  },
  "Team Culture": {
    bg: "bg-[hsl(280_60%_94%)]",
    border: "border-[hsl(280_60%_55%)]",
    dot: "bg-[hsl(280_60%_55%)]",
    text: "text-[hsl(280_60%_45%)]",
  },
};

export const AIAnalysisDemo = () => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [detectedThemes, setDetectedThemes] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Don't run if already completed
    if (hasCompleted) return;

    const interval = setInterval(() => {
      setVisibleSteps((prev) => {
        if (prev >= conversationSteps.length) {
          // Stop playing - don't reset
          setHasCompleted(true);
          return prev;
        }
        
        // Add themes from current step
        const currentStep = conversationSteps[prev];
        if (currentStep?.detectedThemes) {
          setDetectedThemes((prevThemes) => {
            const newThemes = [...prevThemes];
            currentStep.detectedThemes?.forEach((theme) => {
              if (!newThemes.includes(theme)) {
                newThemes.push(theme);
              }
            });
            return newThemes;
          });
        }
        
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [hasCompleted]);

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "text-[hsl(var(--success))]";
      case "negative":
        return "text-[hsl(var(--destructive))]";
      default:
        return "text-[hsl(var(--warning))]";
    }
  };

  const highlightText = (content: string, highlights?: string[]) => {
    if (!highlights) return content;
    
    let result = content;
    highlights.forEach((phrase) => {
      result = result.replace(
        phrase,
        `<mark class="bg-[hsl(var(--butter-yellow))] px-1 rounded">${phrase}</mark>`
      );
    });
    return result;
  };

  const getThemeColor = (theme: string) => {
    return themeColors[theme] || themeColors["Work-Life Balance"];
  };

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-[hsl(var(--butter-yellow))] text-foreground border-0 mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered Analysis
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Watch insights emerge in real-time
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            As employees share, our AI identifies themes, sentiment, and urgency—giving you understanding, not just data.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Conversation panel */}
          <div className="lg:col-span-3 bg-card border-2 border-foreground rounded-2xl overflow-hidden">
            <div className="bg-[hsl(var(--terracotta-primary))] px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/30" />
              <span className="text-sm font-medium text-white">Live Conversation</span>
            </div>
            
            <div className="p-6 space-y-4 min-h-[320px]">
              {conversationSteps.slice(0, visibleSteps).map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${step.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {step.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-pink))] flex-shrink-0" />
                  )}
                  
                  <div className={`max-w-[80%] ${step.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        step.role === "user"
                          ? "bg-[hsl(var(--coral-pink))] text-foreground rounded-tr-md"
                          : "bg-muted text-foreground rounded-tl-md"
                      }`}
                    >
                      <p 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightText(step.content, step.highlights) 
                        }}
                      />
                    </div>
                    
                    {/* Detected themes badge - color-coded */}
                    {step.detectedThemes && step.detectedThemes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 animate-fade-in">
                        {step.detectedThemes.map((theme) => {
                          const colors = getThemeColor(theme);
                          return (
                            <Badge 
                              key={theme} 
                              variant="outline" 
                              className={`text-xs bg-background ${colors.border} ${colors.text}`}
                            >
                              <Tag className="w-2.5 h-2.5 mr-1" />
                              {theme}
                            </Badge>
                          );
                        })}
                        {step.sentiment && (
                          <span className={`text-xs ${getSentimentColor(step.sentiment)}`}>
                            • {step.sentiment}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {step.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] flex-shrink-0" />
                  )}
                </div>
              ))}
              
              {visibleSteps < conversationSteps.length && (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta-primary))] to-[hsl(var(--coral-pink))] flex-shrink-0" />
                  <div className="bg-muted px-4 py-3 rounded-2xl rounded-tl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Themes panel - color-coded */}
          <div className="lg:col-span-2 bg-card border-2 border-foreground rounded-2xl overflow-hidden">
            <div className="bg-foreground px-4 py-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-background" />
              <span className="text-sm font-medium text-background">Themes Identified</span>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {allThemes.map((theme) => {
                  const isDetected = detectedThemes.includes(theme);
                  const colors = getThemeColor(theme);
                  return (
                    <div
                      key={theme}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${
                        isDetected
                          ? `${colors.bg} ${colors.border}`
                          : "bg-muted/30 border-transparent opacity-40"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full transition-colors ${
                          isDetected
                            ? colors.dot
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isDetected ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {theme}
                      </span>
                      {isDetected && (
                        <Badge className={`ml-auto text-xs ${colors.dot} animate-scale-in`}>
                          Detected
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-muted-foreground mt-6 text-center">
                Themes are extracted automatically as the conversation unfolds
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
