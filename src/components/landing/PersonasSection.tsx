import { Shield, MessageCircle, Sparkles, Brain, TrendingUp, Clock, BarChart3, Zap } from "lucide-react";
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
    accentColor: "hsl(var(--primary))",
    bgColor: "bg-[hsl(var(--terracotta-pale))]",
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
    accentColor: "hsl(var(--success))",
    bgColor: "bg-emerald-50",
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
    accentColor: "hsl(var(--coral-accent))",
    bgColor: "bg-[hsl(var(--coral-pale))]",
  },
];

export const PersonasSection = () => {
  return (
    <section className="py-24 bg-background overflow-hidden">
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
            Built For You
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-4">
            Find yourself in Spradley
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We built this with you in mind. Here's how your experience transforms.
          </p>
        </motion.div>

        {/* Persona cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {personas.map((persona) => (
            <div
              key={persona.name}
              className="group relative bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border/50"
            >
              {/* Subtle background */}
              <div className={`absolute inset-0 ${persona.bgColor} opacity-30`} />
              
              <div className="relative p-8 flex flex-col h-full">
                {/* Avatar and identity */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16 ring-2 ring-background shadow-md">
                    <AvatarImage src={persona.avatar} alt={persona.name} className="object-cover" />
                    <AvatarFallback className="text-xl font-semibold bg-muted">
                      {persona.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{persona.name}</h3>
                    <p className="text-muted-foreground text-sm">{persona.role}, {persona.age}</p>
                  </div>
                </div>

                {/* Quote */}
                <blockquote className="relative mb-6">
                  <p className="text-foreground/90 italic leading-relaxed">
                    "{persona.quote}"
                  </p>
                </blockquote>

                {/* Pain point */}
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Before: {persona.painPoint}
                  </span>
                </div>

                {/* Superpowers */}
                <div className="flex-1 mb-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Your Superpowers
                  </p>
                  <div className="space-y-3">
                    {persona.superpowers.map((power, powerIndex) => (
                      <div key={powerIndex} className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${persona.accentColor}15` }}
                        >
                          <power.icon className="w-4 h-4" style={{ color: persona.accentColor }} />
                        </div>
                        <span className="text-sm text-muted-foreground pt-1.5">{power.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Closer */}
                <div className="pt-5 border-t border-border/50">
                  <p 
                    className="text-lg font-semibold"
                    style={{ color: persona.accentColor }}
                  >
                    {persona.closer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};