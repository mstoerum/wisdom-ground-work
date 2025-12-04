import { MessageSquareOff, TrendingDown, Clock } from "lucide-react";
import { motion } from "framer-motion";

const painPoints = [
  {
    icon: MessageSquareOff,
    title: "Surface-Level Responses",
    description: "Multiple choice answers tell you what employees picked—not why. You're left guessing at root causes.",
  },
  {
    icon: TrendingDown,
    title: "Declining Participation",
    description: "Survey fatigue is real. Each cycle sees fewer responses, making your data less reliable.",
  },
  {
    icon: Clock,
    title: "Insights Too Late",
    description: "By the time you analyze results and act, the moment has passed. Problems fester, talent leaves.",
  },
];

export const ProblemSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-[hsl(var(--coral-pale))] to-background">
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
            Traditional surveys are broken
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You're collecting data, but are you really understanding your people?
          </p>
        </motion.div>

        {/* Pain point cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-border/50"
            >
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--coral-accent)/0.1)] flex items-center justify-center mb-6">
                <point.icon className="w-6 h-6 text-[hsl(var(--coral-accent))]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {point.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};