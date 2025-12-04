import { MessageCircle, Brain, LineChart, Check } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Empathetic Conversations",
    description: "AI that listens like a trusted colleague, not a checkbox machine.",
    bullets: [
      "Natural dialogue that adapts to each person",
      "Follow-up questions that dig deeper",
      "Safe space for honest sharing",
    ],
  },
  {
    icon: Brain,
    title: "Real-Time Understanding",
    description: "Every response is analyzed for sentiment, themes, and urgency as it happens.",
    bullets: [
      "Instant theme detection",
      "Sentiment analysis per response",
      "Urgency flags for critical issues",
    ],
  },
  {
    icon: LineChart,
    title: "Actionable Intelligence",
    description: "Move from data to decisions with AI-generated insights and recommendations.",
    bullets: [
      "Executive summaries that tell a story",
      "Root cause analysis, not just symptoms",
      "Prioritized action items",
    ],
  },
];

export const DifferenceSection = () => {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            The Spradley Difference
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Replace surveys with conversations. Replace data with understanding.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card border-2 border-foreground rounded-2xl p-8 hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-[hsl(var(--terracotta-pale))] flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-[hsl(var(--terracotta-primary))]" />
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-6">
                {feature.description}
              </p>

              <ul className="space-y-3">
                {feature.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[hsl(var(--success))]" />
                    </div>
                    <span className="text-sm text-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
