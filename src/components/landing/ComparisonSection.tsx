import { AlertTriangle, Check, Quote, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const satisfactionData = [
  { label: "Very Satisfied", value: 15, color: "bg-gray-400" },
  { label: "Satisfied", value: 35, color: "bg-gray-350" },
  { label: "Neutral", value: 25, color: "bg-gray-300" },
  { label: "Dissatisfied", value: 25, color: "bg-gray-400" },
];

const themes = [
  { name: "Meeting overload", percentage: 42, description: "Too many meetings reducing focus time for core work" },
  { name: "Unclear priorities", percentage: 38, description: "Shifting goals creating stress and overtime" },
  { name: "Deadline pressure", percentage: 28, description: "Tight timelines requiring extended hours regularly" },
];

const representativeVoices = [
  {
    quote: "I spend 4-5 hours daily in meetings. By the time I can focus on actual work, I'm already exhausted. I end up working evenings just to keep up.",
    attribution: "Product team member",
  },
  {
    quote: "Every week our priorities shift. I never know if what I'm working on will still matter by Friday. It's exhausting trying to keep up.",
    attribution: "Engineering team member",
  },
];

const recommendedActions = [
  "Implement 'No Meeting Wednesdays' for focus time",
  "Establish clearer sprint planning with locked priorities",
  "Create meeting efficiency guidelines (max 30min, clear agendas)",
];

export const ComparisonSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            The Difference
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-4">
            Stop asking "what" – Start discovering "why"
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
            Traditional surveys tell you there's a problem. Spradley tells you how to solve it.
          </p>
          <p className="text-sm text-muted-foreground/70">
            See the difference in action
          </p>
        </motion.div>

        {/* Comparison cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {/* Traditional Survey Analytics Card - GRAY & DULL */}
          <div className="bg-gray-50 rounded-xl p-6 lg:p-8 border border-gray-200 relative overflow-hidden">
            {/* Subtle desaturated overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-200/30 pointer-events-none" />
            
            <div className="relative">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-1">Traditional Survey Analytics</h3>
                <p className="text-sm text-gray-400">Surface-level statistics without context</p>
              </div>

              {/* Bar Chart - All grayscale */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 mb-3">Work-Life Balance Satisfaction</p>
                <div className="space-y-2.5">
                  {satisfactionData.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-24 shrink-0">{item.label}</span>
                      <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-400 w-8">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Score - Gray */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-semibold text-gray-500">6.2</span>
                  <span className="text-lg text-gray-400">/10</span>
                  <span className="text-sm text-gray-500 ml-2">-0.3 from last quarter</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Overall Score</p>
              </div>

              {/* Warning List - Gray icons */}
              <div className="space-y-2 mb-6">
                {[
                  "50% report work-life balance concerns",
                  "Satisfaction decreased this quarter",
                  "25% are actively dissatisfied",
                ].map((warning, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-400">{warning}</span>
                  </div>
                ))}
              </div>

              {/* Conclusion Box - Gray and dull */}
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-600">What you know:</strong> Half your team has work-life balance issues, but you don't know why or what to do about it.
                </p>
              </div>
            </div>
          </div>

          {/* Spradley Insights Card - VIBRANT & REVOLUTIONARY */}
          <div className="relative bg-gradient-to-br from-card via-card to-[hsl(var(--terracotta-pale))/40] rounded-xl p-6 lg:p-8 border border-primary/20 shadow-xl shadow-primary/10 ring-2 ring-primary/20 overflow-hidden">
            {/* Warm glow effect */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-radial from-[hsl(var(--coral-pink))/20] to-transparent blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-radial from-[hsl(var(--butter-yellow))/15] to-transparent blur-2xl pointer-events-none" />
            
            <div className="relative">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                    Spradley Insights
                    <Sparkles className="w-4 h-4 text-[hsl(var(--coral-pink))]" />
                  </h3>
                  <p className="text-sm text-muted-foreground">Deep understanding with actionable context</p>
                </div>
              </div>

              {/* Key Themes - Warm accents */}
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground/80 mb-3">Key Themes Identified</p>
                <div className="space-y-2.5">
                  {themes.map((theme, index) => (
                    <div 
                      key={theme.name} 
                      className="bg-card/80 backdrop-blur-sm rounded-lg p-3 border border-primary/10 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground text-sm">{theme.name}</span>
                        <span 
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            index === 0 
                              ? 'bg-[hsl(var(--terracotta))]/15 text-[hsl(var(--terracotta))]' 
                              : index === 1 
                                ? 'bg-[hsl(var(--coral-pink))]/15 text-[hsl(var(--coral-pink))]'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {theme.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Representative Voices - Warm quote styling */}
              <div className="mb-6">
                <p className="text-sm font-medium text-foreground/80 mb-3">Representative Voices</p>
                <div className="space-y-2.5">
                  {representativeVoices.map((voice, index) => (
                    <div key={index} className="relative bg-gradient-to-r from-[hsl(var(--terracotta-pale))/30] to-card/50 rounded-lg p-4 pl-10 border border-[hsl(var(--terracotta-light))]/20">
                      <Quote className="absolute left-3 top-3 w-4 h-4 text-[hsl(var(--coral-pink))]" />
                      <p className="text-sm text-foreground italic mb-2">"{voice.quote}"</p>
                      <p className="text-xs text-muted-foreground font-medium">— {voice.attribution}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions - Vibrant success styling with warm undertone */}
              <div className="bg-gradient-to-r from-emerald-50 to-[hsl(var(--butter-yellow))]/10 border border-emerald-200/70 rounded-lg p-4 shadow-sm">
                <p className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Recommended Actions
                </p>
                <div className="space-y-2">
                  {recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-emerald-700">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
