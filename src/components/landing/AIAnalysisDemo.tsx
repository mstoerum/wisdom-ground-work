import { useState, useEffect } from "react";
import { Sparkles, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationStep {
  role: "assistant" | "user";
  content: string;
  highlights?: string[];
  detectedThemes?: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

interface ThemeInsight {
  name: string;
  healthLabel: "critical" | "attention" | "healthy" | "thriving";
  keyInsight: string;
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

const themeInsights: Record<string, ThemeInsight> = {
  "Work-Life Balance": {
    name: "Work-Life Balance",
    healthLabel: "critical",
    keyInsight: "Meeting overload impacting focus time",
  },
  "Productivity": {
    name: "Productivity",
    healthLabel: "attention",
    keyInsight: "Deep work time being fragmented",
  },
  "Workload": {
    name: "Workload",
    healthLabel: "attention",
    keyInsight: "Overtime becoming normalized",
  },
  "Management": {
    name: "Management",
    healthLabel: "healthy",
    keyInsight: "Strong manager support acknowledged",
  },
  "Team Culture": {
    name: "Team Culture",
    healthLabel: "thriving",
    keyInsight: "Team bonds driving retention",
  },
};

const allThemes = ["Work-Life Balance", "Productivity", "Workload", "Management", "Team Culture"];

const themeColors: Record<string, { bg: string; text: string }> = {
  "Work-Life Balance": {
    bg: "bg-[hsl(var(--terracotta-pale))]",
    text: "text-primary",
  },
  "Productivity": {
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  "Workload": {
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  "Management": {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  "Team Culture": {
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
};

const getHealthColor = (healthLabel: ThemeInsight["healthLabel"]) => {
  switch (healthLabel) {
    case "critical":
      return "bg-rose-500";
    case "attention":
      return "bg-amber-500";
    case "healthy":
      return "bg-emerald-500";
    case "thriving":
      return "bg-emerald-400";
    default:
      return "bg-muted-foreground/30";
  }
};

export const AIAnalysisDemo = () => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [detectedThemes, setDetectedThemes] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (hasCompleted) return;

    const interval = setInterval(() => {
      setVisibleSteps((prev) => {
        if (prev >= conversationSteps.length) {
          setHasCompleted(true);
          return prev;
        }
        
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
        return "text-emerald-600";
      case "negative":
        return "text-rose-600";
      default:
        return "text-amber-600";
    }
  };

  const highlightText = (content: string, highlights?: string[], themes?: string[]) => {
    if (!highlights) return content;
    
    let result = content;
    highlights.forEach((phrase, index) => {
      const themeKey = themes?.[Math.min(index, (themes?.length || 1) - 1)] || "Work-Life Balance";
      const colorMap: Record<string, string> = {
        "Work-Life Balance": "border-primary/60",
        "Productivity": "border-blue-400/60",
        "Workload": "border-amber-400/60",
        "Management": "border-emerald-400/60",
        "Team Culture": "border-purple-400/60",
      };
      const borderClass = colorMap[themeKey] || colorMap["Work-Life Balance"];
      result = result.replace(
        phrase,
        `<span class="border-b-2 ${borderClass} pb-0.5">${phrase}</span>`
      );
    });
    return result;
  };

  const getThemeColor = (theme: string) => {
    return themeColors[theme] || themeColors["Work-Life Balance"];
  };

  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI-Powered Analysis
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-4">
            Watch insights emerge in real-time
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            As employees share, our AI identifies themes, sentiment, and urgency—giving you understanding, not just data.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start"
        >
          {/* Conversation panel */}
          <div className="lg:col-span-3 bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
            <div className="bg-gradient-to-r from-primary/90 to-[hsl(var(--coral-accent)/0.85)] px-5 py-3.5 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="text-sm font-medium text-white">Live Conversation</span>
            </div>
            
            <div className="p-6 space-y-4 min-h-[320px]">
              {conversationSteps.slice(0, visibleSteps).map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${step.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {step.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--coral-accent))] flex-shrink-0 opacity-90" />
                  )}
                  
                  <div className={`max-w-[80%] ${step.role === "user" ? "order-first" : ""}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        step.role === "user"
                          ? "bg-primary/10 text-foreground rounded-tr-sm"
                          : "bg-muted/80 text-foreground rounded-tl-sm"
                      }`}
                    >
                      <p 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightText(step.content, step.highlights, step.detectedThemes) 
                        }}
                      />
                    </div>
                    
                    {step.detectedThemes && step.detectedThemes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {step.detectedThemes.map((theme) => {
                          const colors = getThemeColor(theme);
                          return (
                            <span 
                              key={theme} 
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {theme}
                            </span>
                          );
                        })}
                        {step.sentiment && (
                          <span className={`text-xs font-medium ${getSentimentColor(step.sentiment)}`}>
                            • {step.sentiment}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {step.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--butter-yellow))] to-[hsl(var(--coral-pink))] flex-shrink-0 opacity-90" />
                  )}
                </div>
              ))}
              
              {visibleSteps < conversationSteps.length && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--coral-accent))] flex-shrink-0 opacity-90" />
                  <div className="bg-muted/80 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-subtle" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-subtle delay-100" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse-subtle delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simplified Themes panel */}
          <div className="lg:col-span-2 bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
            <div className="bg-foreground px-5 py-3.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-background" />
              <span className="text-sm font-medium text-background">Themes Detected</span>
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                <AnimatePresence>
                  {allThemes.map((theme) => {
                    const isDetected = detectedThemes.includes(theme);
                    const insight = themeInsights[theme];
                    
                    return (
                      <motion.div
                        key={theme}
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: isDetected ? 1 : 0.4 }}
                        transition={{ duration: 0.3 }}
                        className={`px-3 py-2.5 rounded-lg border-l-3 transition-colors duration-300 ${
                          isDetected
                            ? "bg-muted/40 border-l-[3px]"
                            : "bg-transparent border-l-[3px] border-transparent"
                        }`}
                        style={{
                          borderLeftColor: isDetected ? getHealthColorHex(insight.healthLabel) : "transparent"
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                              isDetected ? getHealthColor(insight.healthLabel) : "bg-muted-foreground/20"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium transition-colors duration-300 ${
                              isDetected ? "text-foreground" : "text-muted-foreground/60"
                            }`}
                          >
                            {theme}
                          </span>
                        </div>
                        
                        {isDetected && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15, duration: 0.2 }}
                            className="text-xs text-muted-foreground mt-1.5 pl-[18px]"
                          >
                            {insight.keyInsight}
                          </motion.p>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              
              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-border/50 text-center">
                <p className="text-xs text-muted-foreground">
                  {hasCompleted 
                    ? "Themes aggregate across all conversations"
                    : "Detecting patterns..."
                  }
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Helper for inline border color
function getHealthColorHex(healthLabel: ThemeInsight["healthLabel"]): string {
  switch (healthLabel) {
    case "critical":
      return "hsl(347, 77%, 50%)"; // rose-500
    case "attention":
      return "hsl(38, 92%, 50%)"; // amber-500
    case "healthy":
    case "thriving":
      return "hsl(142, 71%, 45%)"; // emerald-500
    default:
      return "transparent";
  }
}
