import { AlertTriangle, Check, Quote } from "lucide-react";
import { motion } from "framer-motion";

const satisfactionData = [
  { label: "Very Satisfied", value: 15, color: "bg-emerald-500" },
  { label: "Satisfied", value: 35, color: "bg-emerald-400" },
  { label: "Neutral", value: 25, color: "bg-gray-400" },
  { label: "Dissatisfied", value: 25, color: "bg-amber-500" },
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
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Traditional surveys tell you there's a problem. Spradley tells you how to solve it.
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
          {/* Traditional Survey Analytics Card */}
          <div className="bg-card rounded-xl p-6 lg:p-8 border border-border/50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Traditional Survey Analytics</h3>
              <p className="text-sm text-muted-foreground">Surface-level statistics without context</p>
            </div>

            {/* Bar Chart */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Work-Life Balance Satisfaction</p>
              <div className="space-y-2.5">
                {satisfactionData.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{item.label}</span>
                    <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-8">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Score */}
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-semibold text-foreground">6.2</span>
                <span className="text-lg text-muted-foreground">/10</span>
                <span className="text-sm text-destructive ml-2">-0.3 from last quarter</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
            </div>

            {/* Warning List */}
            <div className="space-y-2 mb-6">
              {[
                "50% report work-life balance concerns",
                "Satisfaction decreased this quarter",
                "25% are actively dissatisfied",
              ].map((warning, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{warning}</span>
                </div>
              ))}
            </div>

            {/* Conclusion Box */}
            <div className="bg-amber-50 border border-amber-200/50 rounded-lg p-4">
              <p className="text-sm text-amber-700">
                <strong>What you know:</strong> Half your team has work-life balance issues, but you don't know why or what to do about it.
              </p>
            </div>
          </div>

          {/* Spradley Insights Card */}
          <div className="bg-card rounded-xl p-6 lg:p-8 border border-border/50 shadow-lg ring-1 ring-[hsl(var(--success))]/20">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Spradley Insights</h3>
              <p className="text-sm text-muted-foreground">Deep understanding with actionable context</p>
            </div>

            {/* Key Themes */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Key Themes Identified</p>
              <div className="space-y-2.5">
                {themes.map((theme) => (
                  <div key={theme.name} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm">{theme.name}</span>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {theme.percentage}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Representative Voices */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Representative Voices</p>
              <div className="space-y-2.5">
                {representativeVoices.map((voice, index) => (
                  <div key={index} className="relative bg-muted/20 rounded-lg p-4 pl-10">
                    <Quote className="absolute left-3 top-3 w-4 h-4 text-primary/30" />
                    <p className="text-sm text-foreground italic mb-2">"{voice.quote}"</p>
                    <p className="text-xs text-muted-foreground">— {voice.attribution}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-emerald-50 border border-emerald-200/50 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-700 mb-3">Recommended Actions</p>
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
        </motion.div>
      </div>
    </section>
  );
};