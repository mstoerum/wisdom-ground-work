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
    <section ref={sectionRef} className="relative overflow-hidden bg-background">
      {/* Wave pattern background - hero only */}
      <motion.div style={{ y: waveY }} className="absolute inset-0">
        <WaveBackground />
      </motion.div>
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      
      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28" 
        style={{ y: contentY }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Copy */}
          <div className="space-y-8">
            <p className="text-sm font-medium text-accent tracking-wide uppercase">
              AI-POWERED WORKPLACE INSIGHTS
            </p>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-semibold text-foreground leading-[1.1]">
              Beyond engagement scores:{" "}
              <span className="text-primary">
                real insight into your people.
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Spradley moves you beyond checkbox surveys to AI‑driven employee interviews that reveal what really works, what holds people back, and why. Uncover everyday frictions and hidden successes on the ground.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/demo/employee">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-medium shadow-sm">
                  Try the Experience
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/demo/hr">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
                  View HR Dashboard
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-accent" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-accent" />
                <span>End-to-end Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right column - Interactive Chat */}
          <div className="relative">
            {/* Decorative elements - using new palette */}
            <motion.div 
              className="absolute -top-12 -right-12 w-40 h-40 bg-[hsl(var(--tan-primary))] rounded-full opacity-20 blur-3xl" 
              style={{ y: decorativeY1 }} 
            />
            <motion.div 
              className="absolute -bottom-12 -left-12 w-48 h-48 bg-[hsl(var(--teal-accent))] rounded-full opacity-15 blur-3xl" 
              style={{ y: decorativeY2 }} 
            />
            
            <HeroInteractiveChat />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
