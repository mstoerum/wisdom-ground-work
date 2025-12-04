import { AlertTriangle, Check } from "lucide-react";
import { motion } from "framer-motion";
const satisfactionData = [{
  label: "Very Satisfied",
  value: 15
}, {
  label: "Satisfied",
  value: 35
}, {
  label: "Neutral",
  value: 25
}, {
  label: "Dissatisfied",
  value: 25
}];
const themes = [
// Positive first
{
  name: "Team collaboration",
  percentage: 78,
  description: "Strong peer support and knowledge sharing across teams",
  sentiment: "positive" as const
}, {
  name: "Career development",
  percentage: 65,
  description: "Employees feel growth opportunities are expanding",
  sentiment: "positive" as const
},
// Then constructive
{
  name: "Meeting overload",
  percentage: 42,
  description: "Too many meetings reducing focus time for core work",
  sentiment: "attention" as const
}];
const representativeVoices = [
// Positive first
{
  quote: "The mentorship program has been fantastic. My manager genuinely invests in my growth and I can see a clear path forward.",
  attribution: "Engineering team member",
  sentiment: "positive" as const
},
// Then constructive
{
  quote: "I love my team, but I spend 4-5 hours daily in meetings. By the time I can focus on actual work, I'm already exhausted.",
  attribution: "Product team member",
  sentiment: "attention" as const
}];
const recommendedActions = ["Implement 'No Meeting Wednesdays' for focus time", "Establish clearer sprint planning with locked priorities", "Create meeting efficiency guidelines (max 30min, clear agendas)"];
export const ComparisonSection = () => {
  return <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true,
        amount: 0.3
      }} transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }} className="text-center mb-16">
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
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true,
        amount: 0.2
      }} transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }} className="grid lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Traditional Survey Analytics Card - Clinical but readable */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Header bar - dark slate */}
            <div className="bg-slate-700 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Traditional Survey Analytics</h3>
              <p className="text-sm text-slate-300">Surface-level statistics without context</p>
            </div>
            
            <div className="p-6 lg:p-8">
              {/* Bar Chart - Black bars for readability */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-3">Work-Life Balance Satisfaction</p>
                <div className="space-y-2.5">
                  {satisfactionData.map(item => <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-24 shrink-0">{item.label}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-800 rounded-full" style={{
                      width: `${item.value}%`
                    }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-8">{item.value}%</span>
                    </div>)}
                </div>
              </div>

              {/* Overall Score */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-semibold text-gray-700">6.2</span>
                  <span className="text-lg text-gray-500">/10</span>
                  <span className="text-sm text-gray-500 ml-2">-0.3 from last quarter</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Overall Score</p>
              </div>

              {/* Warning List */}
              <div className="space-y-2 mb-6">
                {["50% report work-life balance concerns", "Satisfaction decreased this quarter", "25% are actively dissatisfied"].map((warning, index) => <div key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{warning}</span>
                  </div>)}
              </div>

              {/* Conclusion Box - Amber accent */}
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong className="text-amber-900">What you know:</strong> Half your team has work-life balance issues, but you don't know why or what to do about it.
                </p>
              </div>
            </div>
          </div>

          {/* Spradley Insights Card - Warm & Inviting */}
          <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-50/60 rounded-xl overflow-hidden border border-orange-200/60 shadow-lg">
            {/* Header bar - terracotta */}
            <div className="bg-[hsl(var(--terracotta))] px-6 py-4">
              <h3 className="text-lg font-semibold text-primary">Spradley Insights</h3>
              <p className="text-sm font-medium text-primary">Deep understanding with actionable context</p>
            </div>
            
            <div className="p-6 lg:p-8">
              {/* Key Themes - Left border accent cards */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Key Themes Identified</p>
                <div className="space-y-2.5">
                  {themes.map(theme => <div key={theme.name} className={`bg-white rounded-lg p-3 border-l-4 shadow-sm ${theme.sentiment === "positive" ? "border-emerald-500" : "border-[hsl(var(--terracotta))]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 text-sm">{theme.name}</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.sentiment === "positive" ? "bg-emerald-100 text-emerald-700" : "bg-[hsl(var(--terracotta))]/15 text-[hsl(var(--terracotta))]"}`}>
                          {theme.percentage}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{theme.description}</p>
                    </div>)}
                </div>
              </div>

              {/* Representative Voices - Teal left border accent */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Representative Voices</p>
                <div className="space-y-2.5">
                  {representativeVoices.map((voice, index) => <div key={index} className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${voice.sentiment === "positive" ? "border-emerald-500" : "border-amber-500"}`}>
                      <p className="text-sm text-gray-700 italic mb-2">"{voice.quote}"</p>
                      <p className="text-xs text-gray-500 font-medium">— {voice.attribution}</p>
                    </div>)}
                </div>
              </div>

              {/* Recommended Actions - Emerald left border accent */}
              <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4 shadow-sm">
                <p className="text-sm font-semibold text-emerald-800 mb-3">
                  Recommended Actions
                </p>
                <div className="space-y-2">
                  {recommendedActions.map((action, index) => <div key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-sm text-emerald-700">{action}</span>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>;
};