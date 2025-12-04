import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Lock } from "lucide-react";
import { HeroInteractiveChat } from "./HeroInteractiveChat";

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--terracotta-pale))] to-background" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Copy */}
          <div className="space-y-8">
            <Badge variant="secondary" className="bg-[hsl(var(--butter-yellow))] text-foreground border-0">
              AI-Powered Employee Feedback
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Understand your people,{" "}
              <span className="text-[hsl(var(--terracotta-primary))]">
                not just their answers
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl">
              Spradley replaces static surveys with empathetic AI conversations 
              that uncover authentic insights. Your employees share more because 
              they feel heard—not interrogated.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/demo/employee">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Try the Experience
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/demo/hr">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
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
            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[hsl(var(--butter-yellow))] rounded-full opacity-50 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[hsl(var(--coral-pink))] rounded-full opacity-30 blur-3xl" />
            
            <HeroInteractiveChat />
          </div>
        </div>
      </div>
    </section>
  );
};
