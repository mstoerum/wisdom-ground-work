import { Badge } from "@/components/ui/badge";
import { Shield, Sparkles, BarChart3, MessageCircle, Settings, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const personas = [
  {
    name: "Maria",
    role: "Employee",
    tagline: "Finally feel heard",
    description: "Share authentic feedback in a safe, conversational space. No more checkbox fatigue—just natural dialogue that respects your time and privacy.",
    benefits: [
      { icon: Shield, text: "Complete anonymity guaranteed" },
      { icon: MessageCircle, text: "Natural conversation, not forms" },
      { icon: Sparkles, text: "Your voice shapes real change" },
    ],
    gradient: "from-[hsl(var(--terracotta-pale))] to-[hsl(var(--butter-pale))]",
    accentColor: "text-[hsl(var(--terracotta-primary))]",
    borderColor: "border-[hsl(var(--terracotta-primary))]/20",
  },
  {
    name: "Jens",
    role: "HR Admin",
    tagline: "Launch in minutes, not weeks",
    description: "Create targeted feedback campaigns with drag-and-drop simplicity. Preview conversations, set schedules, and deploy—all without IT support.",
    benefits: [
      { icon: Settings, text: "Intuitive survey builder" },
      { icon: Shield, text: "Built-in GDPR compliance" },
      { icon: Sparkles, text: "AI-powered theme detection" },
    ],
    gradient: "from-[hsl(var(--lime-pale))] to-[hsl(var(--butter-pale))]",
    accentColor: "text-[hsl(var(--success))]",
    borderColor: "border-[hsl(var(--success))]/20",
  },
  {
    name: "Sofie",
    role: "People Analytics",
    tagline: "Insights that drive action",
    description: "Transform qualitative feedback into strategic decisions. Real-time dashboards, AI-generated narratives, and actionable recommendations at your fingertips.",
    benefits: [
      { icon: BarChart3, text: "Real-time sentiment tracking" },
      { icon: TrendingUp, text: "Predictive trend analysis" },
      { icon: Sparkles, text: "AI narrative reports" },
    ],
    gradient: "from-[hsl(var(--coral-pale))] to-[hsl(var(--terracotta-pale))]",
    accentColor: "text-[hsl(var(--coral-primary))]",
    borderColor: "border-[hsl(var(--coral-primary))]/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const PersonasSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="bg-[hsl(var(--terracotta-pale))] text-[hsl(var(--terracotta-primary))] border-0 mb-4">
            Built For Everyone
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Superpowers for every role
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're sharing feedback, creating surveys, or analyzing insights—Spradley transforms your experience.
          </p>
        </motion.div>

        {/* Persona cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {personas.map((persona) => (
            <motion.div
              key={persona.name}
              variants={cardVariants}
              className={`group relative bg-card border ${persona.borderColor} rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-lg transition-shadow duration-300`}
            >
              {/* Gradient background accent */}
              <div className={`absolute inset-0 bg-gradient-to-br ${persona.gradient} opacity-30 rounded-2xl`} />
              
              <div className="relative">
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${persona.gradient} flex items-center justify-center`}>
                      <span className="text-lg font-bold text-foreground">{persona.name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{persona.name}</p>
                      <p className="text-sm text-muted-foreground">{persona.role}</p>
                    </div>
                  </div>
                  <h3 className={`text-xl font-bold ${persona.accentColor} mb-2`}>
                    {persona.tagline}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {persona.description}
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  {persona.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center`}>
                        <benefit.icon className={`w-4 h-4 ${persona.accentColor}`} />
                      </div>
                      <span className="text-sm text-foreground">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
