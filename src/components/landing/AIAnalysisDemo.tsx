import { useState, useEffect } from "react";
import { Sparkles, Tag, TrendingUp, TrendingDown, Users, AlertTriangle } from "lucide-react";
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
  health: number;
  healthLabel: "critical" | "attention" | "healthy" | "thriving";
  employeeCount: number;
  urgentFlags: number;
  keyInsight: string;
  keyPhrase: string;
  phrasePercentage: number;
  sentiment: { positive: number; neutral: number; negative: number };
  trend: "up" | "down" | "stable";
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
    health: 38,
    healthLabel: "critical",
    employeeCount: 47,
    urgentFlags: 8,
    keyInsight: "Meeting overload impacting focus time",
    keyPhrase: "constant meetings",
    phrasePercentage: 23,
    sentiment: { positive: 15, neutral: 25, negative: 60 },
    trend: "down",
  },
  "Productivity": {
    name: "Productivity",
    health: 62,
    healthLabel: "attention",
    employeeCount: 31,
    urgentFlags: 2,
    keyInsight: "Deep work time being fragmented",
    keyPhrase: "no time to focus",
    phrasePercentage: 18,
    sentiment: { positive: 30, neutral: 35, negative: 35 },
    trend: "stable",
  },
  "Workload": {
    name: "Workload",
    health: 45,
    healthLabel: "attention",
    employeeCount: 52,
    urgentFlags: 5,
    keyInsight: "Overtime becoming normalized",
    keyPhrase: "staying late",
    phrasePercentage: 31,
    sentiment: { positive: 20, neutral: 30, negative: 50 },
    trend: "down",
  },
  "Management": {
    name: "Management",
    health: 78,
    healthLabel: "healthy",
    employeeCount: 28,
    urgentFlags: 0,
    keyInsight: "Strong manager support acknowledged",
    keyPhrase: "supportive",
    phrasePercentage: 42,
    sentiment: { positive: 65, neutral: 25, negative: 10 },
    trend: "up",
  },
  "Team Culture": {
    name: "Team Culture",
    health: 85,
    healthLabel: "thriving",
    employeeCount: 41,
    urgentFlags: 0,
    keyInsight: "Team bonds driving retention",
    keyPhrase: "love my team",
    phrasePercentage: 38,
    sentiment: { positive: 75, neutral: 20, negative: 5 },
    trend: "up",
  },
};

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

const getHealthBgColor = (healthLabel: ThemeInsight["healthLabel"]) => {
  switch (healthLabel) {
    case "critical":
      return "bg-rose-50 border-rose-200/50";
    case "attention":
      return "bg-amber-50 border-amber-200/50";
    case "healthy":
      return "bg-emerald-50 border-emerald-200/50";
    case "thriving":
      return "bg-emerald-50/80 border-emerald-300/50";
    default:
      return "bg-muted/30 border-transparent";
  }
};

export const AIAnalysisDemo = () => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [detectedThemes, setDetectedThemes] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [animatedCounts, setAnimatedCounts] = useState<Record<string, number>>({});

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
                // Animate the employee count for this theme
                animateCount(theme);
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

  const animateCount = (theme: string) => {
    const insight = themeInsights[theme];
    if (!insight) return;
    
    const target = insight.employeeCount;
    const duration = 800;
    const steps = 20;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedCounts(prev => ({ ...prev, [theme]: target }));
        clearInterval(timer);
      } else {
        setAnimatedCounts(prev => ({ ...prev, [theme]: Math.floor(current) }));
      }
    }, duration / steps);
  };

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

  const totalConversations = Object.values(themeInsights).reduce((sum, t) => sum + t.employeeCount, 0);

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

          {/* Enhanced Themes panel */}
          <div className="lg:col-span-2 bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
            <div className="bg-foreground px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-background" />
                <span className="text-sm font-medium text-background">Organization Insights</span>
              </div>
              {detectedThemes.length > 0 && (
                <span className="text-xs text-background/70">
                  {totalConversations} conversations
                </span>
              )}
            </div>
            
            <div className="p-4">
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {allThemes.map((theme) => {
                    const isDetected = detectedThemes.includes(theme);
                    const insight = themeInsights[theme];
                    const displayCount = animatedCounts[theme] || 0;
                    
                    return (
                      <motion.div
                        key={theme}
                        layout
                        initial={{ opacity: 0.4, scale: 0.98 }}
                        animate={{ 
                          opacity: isDetected ? 1 : 0.4, 
                          scale: isDetected ? 1 : 0.98 
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`rounded-lg border transition-all duration-500 overflow-hidden ${
                          isDetected
                            ? getHealthBgColor(insight.healthLabel)
                            : "bg-muted/20 border-transparent"
                        }`}
                      >
                        {/* Compact header row */}
                        <div className="px-3 py-2.5 flex items-center gap-2">
                          <div
                            className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${
                              isDetected ? getHealthColor(insight.healthLabel) : "bg-muted-foreground/30"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium transition-colors duration-500 flex-1 ${
                              isDetected ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {theme}
                          </span>
                          
                          {isDetected && (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center gap-2"
                            >
                              <span className={`text-xs font-semibold ${
                                insight.healthLabel === "critical" || insight.healthLabel === "attention" 
                                  ? "text-foreground/80" 
                                  : "text-emerald-600"
                              }`}>
                                {insight.health}
                              </span>
                              {insight.trend === "up" ? (
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                              ) : insight.trend === "down" ? (
                                <TrendingDown className="w-3 h-3 text-rose-500" />
                              ) : null}
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Expanded insight content */}
                        <AnimatePresence>
                          {isDetected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 space-y-2">
                                {/* Stats row */}
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <motion.span
                                      key={displayCount}
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                    >
                                      {displayCount} employees
                                    </motion.span>
                                  </span>
                                  {insight.urgentFlags > 0 && (
                                    <span className="flex items-center gap-1 text-rose-600">
                                      <AlertTriangle className="w-3 h-3" />
                                      {insight.urgentFlags} urgent
                                    </span>
                                  )}
                                </div>
                                
                                {/* Key insight */}
                                <p className="text-xs text-foreground/80 leading-relaxed">
                                  {insight.keyInsight}
                                </p>
                                
                                {/* Key phrase indicator */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground">
                                    "{insight.keyPhrase}" in {insight.phrasePercentage}% of responses
                                  </span>
                                </div>
                                
                                {/* Sentiment bar */}
                                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted/50">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insight.sentiment.positive}%` }}
                                    transition={{ delay: 0.4, duration: 0.5 }}
                                    className="bg-emerald-400" 
                                  />
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insight.sentiment.neutral}%` }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                    className="bg-amber-300" 
                                  />
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${insight.sentiment.negative}%` }}
                                    transition={{ delay: 0.6, duration: 0.5 }}
                                    className="bg-rose-400" 
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              
              {/* Footer CTA */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: hasCompleted ? 1 : 0.5 }}
                className="mt-4 pt-3 border-t border-border/50 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  {hasCompleted 
                    ? "One conversation adds to the organizational picture"
                    : "Themes aggregate across all conversations"
                  }
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
