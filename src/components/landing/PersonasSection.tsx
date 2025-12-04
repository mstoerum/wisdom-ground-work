import { Badge } from "@/components/ui/badge";
import { Shield, MessageCircle, Sparkles, Settings, Brain, TrendingUp, Clock, BarChart3, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const personas = [
  {
    name: "Maria",
    role: "Employee",
    age: 34,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    quote: "I used to dread survey season. Now I actually look forward to sharing my thoughts.",
    painPoint: "Ignored feedback, checkbox fatigue",
    superpowers: [
      { icon: MessageCircle, text: "Natural conversation that actually listens" },
      { icon: Shield, text: "Complete anonymity you can trust" },
      { icon: Sparkles, text: "See real change from your words" },
    ],
    closer: "Your voice finally matters.",
    gradient: "from-[hsl(var(--terracotta-primary))] to-[hsl(var(--terracotta-accent))]",
    bgGradient: "from-[hsl(var(--terracotta-pale))] via-[hsl(var(--terracotta-pale)/0.5)] to-transparent",
    accentColor: "hsl(var(--terracotta-primary))",
    borderColor: "border-l-[hsl(var(--terracotta-primary))]",
  },
  {
    name: "Jens",
    role: "HR Admin",
    age: 45,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    quote: "What took 3 weeks now takes 30 minutes. And the insights are actually useful.",
    painPoint: "Weeks of setup, questionable data",
    superpowers: [
      { icon: Zap, text: "Drag-and-drop setup in minutes" },
      { icon: Shield, text: "Auto-anonymization, zero legal risk" },
      { icon: Brain, text: "AI catches what surveys miss" },
    ],
    closer: "Command your people strategy.",
    gradient: "from-[hsl(var(--success))] to-[hsl(var(--lime-pale))]",
    bgGradient: "from-[hsl(var(--lime-pale))] via-[hsl(var(--lime-pale)/0.5)] to-transparent",
    accentColor: "hsl(var(--success))",
    borderColor: "border-l-[hsl(var(--success))]",
  },
  {
    name: "Sofie",
    role: "People Analytics",
    age: 38,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    quote: "I finally have conversations with my data, not just dashboards.",
    painPoint: "Spreadsheets that tell you nothing",
    superpowers: [
      { icon: TrendingUp, text: "Real-time sentiment, not quarterly guesses" },
      { icon: BarChart3, text: "AI-written executive reports" },
      { icon: Clock, text: "Predict issues before they explode" },
    ],
    closer: "See around corners.",
    gradient: "from-[hsl(var(--coral-primary))] to-[hsl(var(--coral-accent))]",
    bgGradient: "from-[hsl(var(--coral-pale))] via-[hsl(var(--coral-pale)/0.5)] to-transparent",
    accentColor: "hsl(var(--coral-primary))",
    borderColor: "border-l-[hsl(var(--coral-primary))]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const PersonasSection = () => {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 mb-6 px-4 py-1.5 text-sm font-medium">
            Built For You
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Find yourself in Spradley
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We built this with you in mind. Here's how your experience transforms.
          </p>
        </motion.div>

        {/* Persona cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {personas.map((persona, index) => (
            <motion.div
              key={persona.name}
              variants={cardVariants}
              className={`group relative bg-card rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-l-4 ${persona.borderColor}`}
              style={{ borderLeftColor: persona.accentColor }}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${persona.bgGradient} opacity-60`} />
              
              <div className="relative p-8 lg:p-10 flex flex-col h-full">
                {/* Avatar and identity */}
                <div className="flex items-center gap-5 mb-8">
                  <Avatar className="w-20 h-20 ring-4 ring-background shadow-xl">
                    <AvatarImage src={persona.avatar} alt={persona.name} className="object-cover" />
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br text-foreground" style={{ background: `linear-gradient(135deg, ${persona.accentColor}, transparent)` }}>
                      {persona.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{persona.name}</h3>
                    <p className="text-muted-foreground font-medium">{persona.role}, {persona.age}</p>
                  </div>
                </div>

                {/* Quote - the emotional hook */}
                <blockquote className="relative mb-8">
                  <div 
                    className="absolute -left-2 -top-2 text-6xl opacity-20 font-serif leading-none"
                    style={{ color: persona.accentColor }}
                  >
                    "
                  </div>
                  <p className="text-lg text-foreground/90 italic pl-6 leading-relaxed">
                    {persona.quote}
                  </p>
                </blockquote>

                {/* Pain point - the before */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    The Before: {persona.painPoint}
                  </div>
                </div>

                {/* Superpowers - the transformation */}
                <div className="flex-1 mb-8">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Your Superpowers
                  </h4>
                  <div className="space-y-4">
                    {persona.superpowers.map((power, powerIndex) => (
                      <motion.div
                        key={powerIndex}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + powerIndex * 0.1, duration: 0.4 }}
                        className="flex items-start gap-4"
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: `${persona.accentColor}20` }}
                        >
                          <power.icon className="w-5 h-5" style={{ color: persona.accentColor }} />
                        </div>
                        <span className="text-foreground/80 pt-2 leading-tight">{power.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Emotional closer */}
                <div 
                  className="pt-6 border-t border-border/50"
                >
                  <p 
                    className="text-xl font-bold tracking-tight"
                    style={{ color: persona.accentColor }}
                  >
                    {persona.closer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16 text-lg text-muted-foreground"
        >
          Which role resonates with you?
        </motion.p>
      </div>
    </section>
  );
};
