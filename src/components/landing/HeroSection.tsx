import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { HeroInteractiveChat } from "./HeroInteractiveChat";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--terracotta-pale))] via-background to-background" />
      
      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-[hsl(var(--terracotta-light)/0.3)] to-transparent opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left column - Copy */}
          <div className="space-y-8">
            <p className="text-sm font-medium text-primary tracking-wide uppercase">
              AI-Powered Employee Feedback
            </p>
            
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-semibold text-foreground leading-[1.1]">
              Understand your people,{" "}
              <span className="text-primary">
                not just their answers
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Spradley replaces static surveys with empathetic AI conversations 
              that uncover authentic insights. Your employees share more because 
              they feel heard—not interrogated.
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
            {/* Decorative elements - softened */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-[hsl(var(--butter-yellow))] rounded-full opacity-20 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[hsl(var(--coral-pink))] rounded-full opacity-15 blur-3xl" />
            
            <HeroInteractiveChat />
          </div>
        </div>
      </div>
    </section>
  );
};
