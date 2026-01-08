import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { HeroInteractiveChat } from "./HeroInteractiveChat";
import { WaveBackground } from "./WaveBackground";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms - subtle movement
  const waveY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const decorativeY1 = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const decorativeY2 = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[90vh]">
      {/* Animated wave pattern background */}
      <motion.div style={{ y: waveY }} className="absolute inset-0">
        <WaveBackground />
      </motion.div>
      
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28" 
        style={{ y: contentY }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Copy with staggered entrance */}
          <div className="space-y-8">
            <motion.p 
              className="text-sm font-medium text-primary tracking-wide uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            >
              AI-POWERED WORKPLACE INSIGHTS
            </motion.p>
            
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-semibold text-foreground leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            >
              Beyond engagement scores:{" "}
              <span className="text-primary">
                real insight into your people.
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            >
              Spradley moves you beyond checkbox surveys to AI‑driven employee interviews that reveal what really works, what holds people back, and why. Uncover everyday frictions and hidden successes on the ground.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            >
              <Link to="/demo/employee">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-medium shadow-sm">
                  Try the Experience
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/demo/hr">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium border-foreground/20 text-foreground hover:bg-foreground/5">
                  View HR Dashboard
                </Button>
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div 
              className="flex flex-wrap items-center gap-6 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-primary" />
                <span>End-to-end Encrypted</span>
              </div>
            </motion.div>
          </div>

          {/* Right column - Interactive Chat */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          >
            {/* Decorative glow elements - Teal and Tan */}
            <motion.div 
              className="absolute -top-12 -right-12 w-40 h-40 bg-[hsl(var(--tan-primary))] rounded-full opacity-25 blur-3xl" 
              style={{ y: decorativeY1 }} 
            />
            <motion.div 
              className="absolute -bottom-12 -left-12 w-48 h-48 bg-[hsl(var(--teal-primary))] rounded-full opacity-15 blur-3xl" 
              style={{ y: decorativeY2 }} 
            />
            
            <HeroInteractiveChat />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
