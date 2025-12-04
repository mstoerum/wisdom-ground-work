import { useState, useEffect } from "react";
import { Sparkles, Tag } from "lucide-react";
import { motion } from "framer-motion";

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

const themeColors: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  "Work-Life Balance": {
    bg: "bg-[hsl(var(--terracotta-pale))]",
    border: "border-primary/30",
    dot: "bg-primary",
    text: "text-primary",
  },
  "Productivity": {
    bg: "bg-blue-50",
    border: "border-blue-300/50",
    dot: "bg-blue-500",
    text: "text-blue-600",
  },
  "Workload": {
    bg: "bg-amber-50",
    border: "border-amber-300/50",
    dot: "bg-amber-500",
    text: "text-amber-600",
  },
  "Management": {
    bg: "bg-emerald-50",
    border: "border-emerald-300/50",
    dot: "bg-emerald-500",
    text: "text-emerald-600",
  },
  "Team Culture": {
    bg: "bg-purple-50",
    border: "border-purple-300/50",
    dot: "bg-purple-500",
    text: "text-purple-600",
  },
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
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
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

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
          {/* Conversation panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 bg-card rounded-xl overflow-hidden shadow-sm border border-border/50"
          >
            <div className="bg-gradient-to-r from-primary/90 to-[hsl(var(--coral-accent)/0.85)] px-5 py-3.5 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="text-sm font-medium text-white">Live Conversation</span>
            </div>
            
            <div className="p-6 space-y-4 min-h-[320px]">
              {conversationSteps.slice(0, visibleSteps).map((step, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${step.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
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
                      <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
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
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--coral-accent))] flex-shrink-0 opacity-90" />
                  <div className="bg-muted/80 px-4 py-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Themes panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 bg-card rounded-xl overflow-hidden shadow-sm border border-border/50"
          >
            <div className="bg-foreground px-5 py-3.5 flex items-center gap-2">
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
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          isDetected ? colors.dot : "bg-muted-foreground/30"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium transition-colors flex-1 ${
                          isDetected ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {theme}
                      </span>
                      {isDetected && (
                        <span className={`text-xs font-medium ${colors.text} animate-scale-in`}>
                          Detected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-muted-foreground mt-6 text-center">
                Themes are extracted automatically as the conversation unfolds
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
