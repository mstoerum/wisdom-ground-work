import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { HeroInteractiveChat } from "./HeroInteractiveChat";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
export const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const {
    scrollYProgress
  } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms - subtle movement
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const radialGlowY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const decorativeY1 = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const decorativeY2 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  return <section ref={sectionRef} className="relative overflow-hidden">
      {/* Subtle background gradient - parallax */}
      <motion.div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--terracotta-pale))] via-background to-background" style={{
      y: backgroundY
    }} />
      
      {/* Subtle radial glow - parallax */}
      <motion.div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-[hsl(var(--terracotta-light)/0.3)] to-transparent opacity-50" style={{
      y: radialGlowY
    }} />
      
      <motion.div style={{
      y: contentY
    }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 bg-primary-foreground">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Copy */}
          <div className="space-y-8">
            <p className="text-sm font-medium text-primary tracking-wide uppercase">AI-POWERED WORKPLACE INSIGHTS</p>
            
            <h1 className="text-5xl sm:text-6xl text-foreground leading-[1.25] lg:text-8xl font-serif font-normal my-0 py-0">Go beyond benchmarks</h1>
            
            <p className="text-lg max-w-xl leading-relaxed text-sidebar-foreground">Spradley moves you beyond checkbox surveys to AI‑driven employee interviews that reveal what really works, what holds people back, and why. Uncover everyday frictions and hidden successes on the ground.</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/demo/employee">
                <Button size="lg" className="w-full sm:w-auto gap-2 font-medium shadow-sm rounded-md">
                  Try the Experience
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/demo/hr">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium rounded-md">
                  View HR Dashboard
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-[hsl(var(--success))]" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-[hsl(var(--success))]" />
                <span>End-to-end Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right column - Interactive Chat */}
          <div className="relative">
            {/* Decorative elements - parallax with different speeds for depth */}
            <motion.div className="absolute -top-12 -right-12 w-40 h-40 bg-[hsl(var(--butter-yellow))] rounded-full opacity-20 blur-3xl" style={{
            y: decorativeY1
          }} />
            <motion.div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[hsl(var(--coral-pink))] rounded-full opacity-15 blur-3xl" style={{
            y: decorativeY2
          }} />
            
            <HeroInteractiveChat />
          </div>
        </div>
      </motion.div>
    </section>;
};