import { MessageCircle, Brain, LineChart, Check } from "lucide-react";
import { motion } from "framer-motion";

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
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-4">
            The Spradley Difference
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Replace surveys with conversations. Replace data with understanding.
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-border/50"
            >
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--terracotta-pale))] flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {feature.description}
              </p>

              <ul className="space-y-3">
                {feature.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--success)/0.1)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[hsl(var(--success))]" />
                    </div>
                    <span className="text-sm text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};