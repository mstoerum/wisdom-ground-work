import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, BarChart3, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Demo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Interactive Demo
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Experience Spradley</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how AI-powered conversational feedback transforms employee engagement.
            Try both employee and HR admin perspectives.
          </p>
        </div>

        {/* Demo Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Employee Experience */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Employee View</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Experience our empathetic AI conversation that makes sharing feedback feel natural and safe.
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>See how anonymization builds trust</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Interactive AI-powered conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <span>Mood tracking and closing ritual</span>
              </li>
            </ul>
            <Button 
              onClick={() => navigate('/demo/employee')} 
              className="w-full"
              size="lg"
            >
              Try as Employee
            </Button>
          </Card>

          {/* HR Admin Experience */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">HR Admin View</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Discover actionable insights and powerful analytics that help you make data-driven decisions.
            </p>
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <span>Real-time sentiment analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                <span>AI-generated theme insights</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <span>Privacy-preserving analytics</span>
              </li>
            </ul>
            <Button 
              onClick={() => navigate('/demo/hr')} 
              variant="secondary"
              className="w-full"
              size="lg"
            >
              Try as HR Admin
            </Button>
          </Card>
        </div>

        {/* Features Highlight */}
        <div className="bg-card rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">What Makes Spradley Different?</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="font-medium mb-2">📊 85% Higher Participation</div>
              <p className="text-muted-foreground">vs. traditional surveys</p>
            </div>
            <div>
              <div className="font-medium mb-2">🔒 GDPR Compliant</div>
              <p className="text-muted-foreground">Built-in privacy by design</p>
            </div>
            <div>
              <div className="font-medium mb-2">⚡ 5-Minute Setup</div>
              <p className="text-muted-foreground">From signup to first survey</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Ready to transform your employee feedback?</p>
          <Button onClick={() => navigate('/auth')} size="lg" variant="default">
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}
