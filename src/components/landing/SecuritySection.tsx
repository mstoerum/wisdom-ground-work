import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, FileCheck, Server, Users, CheckCircle2 } from "lucide-react";
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

const trustStats = [
  { value: "0", label: "Data breaches", suffix: "" },
  { value: "100", label: "GDPR compliance", suffix: "%" },
  { value: "256", label: "Bit encryption", suffix: "-bit" },
  { value: "99.9", label: "Uptime SLA", suffix: "%" },
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

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export const SecuritySection = () => {
  return (
    <section className="py-24 bg-card relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <Badge variant="secondary" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-0 mb-6 px-4 py-1.5 text-sm font-medium">
            Enterprise-Grade Security
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 tracking-tight">
            Trust is our foundation
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your employees trust you with their honest feedback. We built Spradley to be worthy of that trust.
          </p>
        </motion.div>

        {/* Trust stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {trustStats.map((stat, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-2xl bg-background border border-border/50"
            >
              <div className="text-4xl font-bold text-foreground mb-1">
                {stat.value}<span className="text-[hsl(var(--success))]">{stat.suffix}</span>
              </div>
              <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Security features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 gap-8"
        >
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative bg-background rounded-3xl p-8 border border-border/50 hover:border-[hsl(var(--success))]/30 transition-all duration-300 hover:shadow-lg"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--success))]/10 flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-[hsl(var(--success))]" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {feature.highlights.map((highlight, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--success))]/5 text-[hsl(var(--success))] text-sm font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {highlight}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom trust seal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-6 px-8 py-5 rounded-2xl bg-background border border-border/50">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[hsl(var(--success))]" />
              <span className="text-sm font-medium text-foreground">SOC 2 Type II</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[hsl(var(--success))]" />
              <span className="text-sm font-medium text-foreground">ISO 27001</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[hsl(var(--success))]" />
              <span className="text-sm font-medium text-foreground">GDPR Ready</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
