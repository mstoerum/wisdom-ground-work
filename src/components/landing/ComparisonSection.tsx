import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Quote } from "lucide-react";

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
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-[hsl(var(--terracotta-pale))] text-[hsl(var(--terracotta-primary))] border-0 mb-4">
            The Difference
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Stop asking "what" – Start discovering "why"
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Traditional surveys tell you there's a problem. Spradley tells you how to solve it.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Traditional Survey Analytics Card */}
          <div className="bg-muted/50 border border-border rounded-2xl p-6 lg:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Traditional Survey Analytics</h3>
              <p className="text-sm text-muted-foreground">Surface-level statistics without context</p>
            </div>

            {/* Bar Chart */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Work-Life Balance Satisfaction</p>
              <div className="space-y-3">
                {satisfactionData.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{item.label}</span>
                    <div className="flex-1 h-6 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-8">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Score */}
            <div className="bg-background rounded-xl p-4 mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">6.2</span>
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
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>What you know:</strong> Half your team has work-life balance issues, but you don't know why or what to do about it.
              </p>
            </div>
          </div>

          {/* Spradley Insights Card */}
          <div className="bg-card border-l-4 border-l-[hsl(var(--success))] border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Spradley Insights</h3>
              <p className="text-sm text-muted-foreground">Deep understanding with actionable context</p>
            </div>

            {/* Key Themes */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Key Themes Identified</p>
              <div className="space-y-3">
                {themes.map((theme) => (
                  <div key={theme.name} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm">{theme.name}</span>
                      <Badge variant="secondary" className="bg-[hsl(var(--terracotta-pale))] text-[hsl(var(--terracotta-primary))] border-0 text-xs">
                        {theme.percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Representative Voices */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Representative Voices</p>
              <div className="space-y-3">
                {representativeVoices.map((voice, index) => (
                  <div key={index} className="relative bg-muted/30 rounded-lg p-4 pl-10">
                    <Quote className="absolute left-3 top-3 w-5 h-5 text-[hsl(var(--terracotta-primary))]/40" />
                    <p className="text-sm text-foreground italic mb-2">"{voice.quote}"</p>
                    <p className="text-xs text-muted-foreground">— {voice.attribution}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-[hsl(var(--success))]/10 border border-[hsl(var(--success))]/20 rounded-xl p-4">
              <p className="text-sm font-medium text-[hsl(var(--success))] mb-3">Recommended Actions</p>
              <div className="space-y-2">
                {recommendedActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                    <span className="text-sm text-foreground">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
