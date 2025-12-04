import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight } from "lucide-react";

const traditionalFeatures = [
  { text: "Static multiple choice questions", negative: true },
  { text: "Low response rates (15-30%)", negative: true },
  { text: "Surface-level insights", negative: true },
  { text: "Weeks to analyze results", negative: true },
  { text: "Survey fatigue", negative: true },
  { text: "Data without context", negative: true },
];

const spradleyFeatures = [
  { text: "Natural AI conversations", positive: true },
  { text: "High engagement (70%+ completion)", positive: true },
  { text: "Deep qualitative understanding", positive: true },
  { text: "Real-time theme detection", positive: true },
  { text: "Employees feel heard", positive: true },
  { text: "Actionable narrative insights", positive: true },
];

export const ComparisonSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="bg-[hsl(var(--terracotta-pale))] text-[hsl(var(--terracotta-primary))] border-0 mb-4">
            Why Switch?
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Not just another survey tool
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how Spradley transforms employee feedback from a checkbox exercise into meaningful dialogue.
          </p>
        </div>

        {/* Comparison cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Traditional surveys card */}
          <div className="bg-muted/50 border border-border rounded-2xl p-8 relative">
            <div className="absolute -top-3 left-6">
              <Badge variant="outline" className="bg-background text-muted-foreground border-border">
                Traditional Surveys
              </Badge>
            </div>
            
            <div className="mt-4 space-y-4">
              {traditionalFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-destructive" />
                  </div>
                  <span className="text-muted-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground italic">
                "We run surveys every year but nothing really changes..."
              </p>
            </div>
          </div>

          {/* Spradley card */}
          <div className="bg-card border-2 border-[hsl(var(--terracotta-primary))] rounded-2xl p-8 relative shadow-lg">
            <div className="absolute -top-3 left-6">
              <Badge className="bg-[hsl(var(--terracotta-primary))] text-white border-0">
                Spradley
              </Badge>
            </div>
            
            <div className="mt-4 space-y-4">
              {spradleyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[hsl(var(--success))]" />
                  </div>
                  <span className="text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-foreground italic">
                "For the first time, I actually understand what my team needs."
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <a 
            href="#demo" 
            className="inline-flex items-center gap-2 text-[hsl(var(--terracotta-primary))] font-medium hover:underline"
          >
            See Spradley in action
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
