import { useState, useEffect, useMemo } from "react";
import { Sparkles, Tag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  healthScore: number;
  conversationCount: number;
}

interface ConversationDot {
  id: number;
  theme: string;
  x: number;
  y: number;
  isCurrent?: boolean;
}

type Phase = "conversation" | "zooming" | "dotField";

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
    healthScore: 38,
    conversationCount: 23,
  },
  "Productivity": {
    name: "Productivity",
    healthLabel: "attention",
    keyInsight: "Deep work time being fragmented",
    healthScore: 52,
    conversationCount: 19,
  },
  "Workload": {
    name: "Workload",
    healthLabel: "attention",
    keyInsight: "Overtime becoming normalized",
    healthScore: 48,
    conversationCount: 16,
  },
  "Management": {
    name: "Management",
    healthLabel: "healthy",
    keyInsight: "Strong manager support acknowledged",
    healthScore: 76,
    conversationCount: 14,
  },
  "Team Culture": {
    name: "Team Culture",
    healthLabel: "thriving",
    keyInsight: "Team bonds driving retention",
    healthScore: 85,
    conversationCount: 18,
  },
};

const allThemes = ["Work-Life Balance", "Productivity", "Workload", "Management", "Team Culture"];

// Cluster centers for positioning
const clusterCenters: Record<string, { x: number; y: number }> = {
  "Work-Life Balance": { x: 20, y: 30 },
  "Productivity": { x: 50, y: 20 },
  "Workload": { x: 80, y: 35 },
  "Management": { x: 35, y: 70 },
  "Team Culture": { x: 70, y: 75 },
};

const themeColors: Record<string, { bg: string; text: string; dot: string }> = {
  "Work-Life Balance": {
    bg: "bg-[hsl(var(--terracotta-pale))]",
    text: "text-primary",
    dot: "hsl(347, 77%, 50%)",
  },
  "Productivity": {
    bg: "bg-blue-50",
    text: "text-blue-600",
    dot: "hsl(217, 91%, 60%)",
  },
  "Workload": {
    bg: "bg-amber-50",
    text: "text-amber-600",
    dot: "hsl(38, 92%, 50%)",
  },
  "Management": {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "hsl(142, 71%, 45%)",
  },
  "Team Culture": {
    bg: "bg-purple-50",
    text: "text-purple-600",
    dot: "hsl(271, 81%, 56%)",
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

const getHealthColorHex = (healthLabel: ThemeInsight["healthLabel"]): string => {
  switch (healthLabel) {
    case "critical":
      return "hsl(347, 77%, 50%)";
    case "attention":
      return "hsl(38, 92%, 50%)";
    case "healthy":
    case "thriving":
      return "hsl(142, 71%, 45%)";
    default:
      return "transparent";
  }
};

// Generate conversation dot clusters for each theme
const generateDotClusters = (): ConversationDot[] => {
  const dots: ConversationDot[] = [];

  let id = 0;
  allThemes.forEach((theme) => {
    const center = clusterCenters[theme];
    // 15-20 dots per cluster
    const dotsPerCluster = 15 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < dotsPerCluster; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 14 + 2;
      dots.push({
        id: id++,
        theme,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      });
    }
  });

  // Mark one dot as current (in Work-Life Balance cluster)
  const wlbDots = dots.filter(d => d.theme === "Work-Life Balance");
  if (wlbDots.length > 0) {
    wlbDots[Math.floor(wlbDots.length / 2)].isCurrent = true;
  }

  return dots;
};

export const AIAnalysisDemo = () => {
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [detectedThemes, setDetectedThemes] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [phase, setPhase] = useState<Phase>("conversation");
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const dots = useMemo(() => generateDotClusters(), []);

  // Conversation progression - FASTER interval (1500ms)
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
    }, 1500); // Fast conversation exchanges

    return () => clearInterval(interval);
  }, [hasCompleted]);

  // Phase transitions after completion - FASTER zoom delay
  useEffect(() => {
    if (!hasCompleted) return;

    const timer1 = setTimeout(() => setPhase("zooming"), 800);  // Faster zoom delay
    const timer2 = setTimeout(() => setPhase("dotField"), 1800); // Faster dotField

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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
    <section id="how-it-works" className="py-24 bg-muted/30 overflow-hidden">
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
            As employees share, our AI detects patterns—clustering conversations to reveal organizational truths.
          </p>
        </motion.div>

        {/* Main demo area with phase transitions */}
        <div className="relative min-h-[500px]">
          {/* Phase 1 & 2: Conversation + Themes panels */}
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: phase === "zooming" ? 0.8 : phase === "dotField" ? 0 : 1,
              scale: phase === "zooming" ? 0.6 : phase === "dotField" ? 0.1 : 1,
              y: phase === "zooming" ? -50 : 0,
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={`grid lg:grid-cols-5 gap-6 lg:gap-8 items-start ${
              phase === "dotField" ? "pointer-events-none absolute inset-0" : ""
            }`}
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

            {/* Themes panel */}
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
                
                <div className="mt-4 pt-3 border-t border-border/50 text-center">
                  <p className="text-xs text-muted-foreground">
                    {hasCompleted 
                      ? "Clustering conversations..."
                      : "Detecting patterns..."
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* "From one voice..." - only during zooming phase, centered */}
          <AnimatePresence>
            {phase === "zooming" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              >
                <h3 className="text-3xl sm:text-4xl font-display font-semibold text-foreground">
                  From one voice...
                </h3>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Simple Dot Field */}
          <AnimatePresence>
            {phase === "dotField" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
                onMouseLeave={() => setHoveredTheme(null)}
              >
              <div className="relative w-full h-[500px]">
                  {/* "...to the full picture" - centered in dot field */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute z-20 pointer-events-none"
                    style={{
                      left: "50%",
                      top: "45%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <h3 className="text-2xl sm:text-3xl font-display font-semibold text-primary whitespace-nowrap px-4 py-2 bg-background/70 backdrop-blur-sm rounded-full">
                      ...to the full picture
                    </h3>
                  </motion.div>

                  {/* Conversation Dots */}
                  {dots.map((dot, index) => (
                    <motion.div
                      key={dot.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.7, scale: 1 }}
                      transition={{
                        delay: index * 0.004,
                        duration: 0.25,
                        ease: "easeOut",
                      }}
                      onMouseEnter={() => setHoveredTheme(dot.theme)}
                      className={`absolute rounded-full cursor-pointer ${dot.isCurrent ? "z-10" : ""}`}
                      style={{
                        left: `${dot.x}%`,
                        top: `${dot.y}%`,
                        width: dot.isCurrent ? "12px" : "5px",
                        height: dot.isCurrent ? "12px" : "5px",
                        backgroundColor: themeColors[dot.theme]?.dot || "hsl(var(--muted-foreground))",
                        opacity: hoveredTheme === null 
                          ? (dot.isCurrent ? 1 : 0.7) 
                          : hoveredTheme === dot.theme 
                            ? (dot.isCurrent ? 1 : 0.85) 
                            : 0.12,
                        transform: `scale(${
                          dot.isCurrent 
                            ? 1.2 
                            : hoveredTheme === dot.theme 
                              ? 1.4 
                              : hoveredTheme !== null 
                                ? 0.8 
                                : 1
                        })`,
                        boxShadow: dot.isCurrent || hoveredTheme === dot.theme 
                          ? `0 0 20px ${themeColors[dot.theme]?.dot}` 
                          : "none",
                        transition: "opacity 80ms ease-out, transform 80ms ease-out, box-shadow 80ms ease-out",
                      }}
                    />
                  ))}

                  {/* Theme cluster labels */}
                  {allThemes.map((theme, index) => {
                    const labelPositions: Record<string, { x: number; y: number }> = {
                      "Work-Life Balance": { x: 20, y: 48 },
                      "Productivity": { x: 50, y: 38 },
                      "Workload": { x: 80, y: 52 },
                      "Management": { x: 35, y: 85 },
                      "Team Culture": { x: 70, y: 90 },
                    };
                    const pos = labelPositions[theme];
                    const isHovered = hoveredTheme === theme;
                    
                    return (
                      <motion.div
                        key={theme}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.08, duration: 0.3 }}
                        onMouseEnter={() => setHoveredTheme(theme)}
                        className="absolute text-xs cursor-pointer"
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: `translateX(-50%) scale(${isHovered ? 1.1 : 1})`,
                          opacity: hoveredTheme === null || isHovered ? 1 : 0.3,
                          color: isHovered ? themeColors[theme]?.dot : "hsl(var(--muted-foreground))",
                          fontWeight: isHovered ? 600 : 500,
                          transition: "opacity 80ms ease-out, transform 80ms ease-out, color 80ms ease-out",
                        }}
                      >
                        {theme}
                      </motion.div>
                    );
                  })}

                  {/* Simple Floating Tooltip */}
                  <AnimatePresence>
                    {hoveredTheme && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-30 bg-card rounded-xl shadow-lg border border-border/50 p-4 min-w-[200px] pointer-events-none"
                        style={{
                          left: `${(() => {
                            const positions: Record<string, number> = {
                              "Work-Life Balance": 20,
                              "Productivity": 50,
                              "Workload": 75,
                              "Management": 35,
                              "Team Culture": 65,
                            };
                            return positions[hoveredTheme] || 50;
                          })()}%`,
                          top: `${(() => {
                            const positions: Record<string, number> = {
                              "Work-Life Balance": 8,
                              "Productivity": 0,
                              "Workload": 12,
                              "Management": 55,
                              "Team Culture": 58,
                            };
                            return positions[hoveredTheme] || 10;
                          })()}%`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        {/* Theme name with color */}
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: themeColors[hoveredTheme]?.dot }}
                          />
                          <span 
                            className="font-semibold text-sm"
                            style={{ color: themeColors[hoveredTheme]?.dot }}
                          >
                            {hoveredTheme}
                          </span>
                        </div>
                        
                        {/* Conversation count */}
                        <p className="text-xs text-muted-foreground mb-2">
                          <span className="font-medium text-foreground">{themeInsights[hoveredTheme]?.conversationCount}</span> conversations
                        </p>
                        
                        {/* Health score */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${getHealthColor(themeInsights[hoveredTheme]?.healthLabel)}`} />
                          <span className="text-lg font-bold text-foreground">
                            {themeInsights[hoveredTheme]?.healthScore}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {themeInsights[hoveredTheme]?.healthLabel}
                          </span>
                        </div>
                        
                        {/* Key insight */}
                        <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">
                          {themeInsights[hoveredTheme]?.keyInsight}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Current conversation indicator */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredTheme ? 0.3 : 1 }}
                    transition={{ delay: 0.3, duration: 0.2 }}
                    className="absolute text-xs font-medium text-primary"
                    style={{
                      left: "20%",
                      top: "18%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    ↑ This conversation
                  </motion.div>
                </div>

                {/* CTA Below Dot Field */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-4 mt-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Hover over clusters to explore themes
                  </p>
                  <Button asChild size="lg" className="group">
                    <Link to="/demo/hr">
                      Explore Full Dashboard
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
};
