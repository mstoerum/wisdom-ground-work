import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { FloatingBubbles } from "./FloatingBubbles";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden min-h-screen bg-background">
      {/* Subtle gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--teal-pale) / 0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, hsl(var(--tan-pale) / 0.2) 0%, transparent 50%)'
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section - Headlines */}
        <div className="pt-20 lg:pt-28 pb-8 text-center">
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-semibold text-foreground leading-[1.05] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Beyond engagement
          </motion.h1>
          
          <motion.p 
            className="mt-6 text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          >
            Watch insights emerge in real-time
          </motion.p>

          {/* CTAs */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          >
            <Link to="/demo/employee">
              <Button size="lg" className="w-full sm:w-auto gap-2 font-medium shadow-md px-8">
                Try the Experience
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/demo/hr">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto font-medium border-border text-foreground hover:bg-muted/50 gap-2"
              >
                <Play className="w-4 h-4" />
                Watch Demo
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Floating bubbles visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <FloatingBubbles />
        </motion.div>

        {/* Bottom section - Value proposition */}
        <motion.div 
          className="pb-20 lg:pb-28 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium text-foreground leading-snug max-w-3xl mx-auto">
            Why we think{" "}
            <span className="text-primary">workplace intelligence</span>{" "}
            is the next step for companies
          </h2>
          
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-driven conversations replace checkbox surveys to reveal what really works, 
            what holds people back, and why—giving you the full picture of your organization.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
