import { Shield, Lock, Eye, Server, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const securityFeatures = [
  {
    icon: Shield,
    title: "GDPR Compliant",
    description: "Built from the ground up to meet European data protection standards. Full audit trails and data subject rights support.",
    highlights: ["Right to erasure", "Data portability", "Consent tracking"],
  },
  {
    icon: Eye,
    title: "True Anonymization",
    description: "Responses are cryptographically separated from identities. Even we can't trace feedback back to individuals.",
    highlights: ["K-anonymity", "No IP logging", "Aggregate-only access"],
  },
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "AES-256 encryption at rest, TLS 1.3 in transit. Your data is protected at every step of its journey.",
    highlights: ["Zero-knowledge architecture", "Encrypted backups", "Secure key management"],
  },
  {
    icon: Server,
    title: "EU Data Residency",
    description: "All data stored exclusively in EU data centers. No transatlantic transfers, no compliance headaches.",
    highlights: ["Frankfurt servers", "SOC 2 certified", "ISO 27001"],
  },
];

export const SecuritySection = () => {
  return (
    <section id="security" className="py-24 bg-card relative overflow-hidden">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-[hsl(var(--success))] tracking-wide uppercase mb-4">
            Enterprise-Grade Security
          </p>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground mb-4">
            Trust is our foundation
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your employees trust you with their honest feedback. We built Spradley to be worthy of that trust.
          </p>
        </motion.div>

        {/* Security features grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-2 gap-6"
        >
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="group bg-background rounded-xl p-8 border border-border/50 hover:border-[hsl(var(--success))]/30 transition-all duration-300 hover:shadow-md"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--success))]/10 flex items-center justify-center mb-5">
                <feature.icon className="w-6 h-6 text-[hsl(var(--success))]" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground mb-5 leading-relaxed">{feature.description}</p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {feature.highlights.map((highlight, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--success))]/5 text-[hsl(var(--success))] text-xs font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-8 py-5 rounded-xl bg-background border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[hsl(var(--success))]" />
              </div>
              <span className="text-sm font-medium text-foreground">SOC 2 Type II</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-[hsl(var(--success))]" />
              </div>
              <span className="text-sm font-medium text-foreground">ISO 27001</span>
            </div>
            <div className="w-px h-6 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-[hsl(var(--success))]" />
              </div>
              <span className="text-sm font-medium text-foreground">GDPR Ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};