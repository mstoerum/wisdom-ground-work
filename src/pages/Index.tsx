import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { roles, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && !loading) {
      // Redirect based on role
      if (roles.includes('hr_admin') || roles.includes('hr_analyst')) {
        navigate('/hr/dashboard');
      } else if (roles.includes('employee')) {
        navigate('/employee/dashboard');
      } else {
        // No role assigned, default to employee
        navigate('/employee/dashboard');
      }
    }
  }, [isAuthenticated, roles, loading, navigate]);

  if (isAuthenticated === null || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-2xl text-center space-y-8 p-6">
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Spradley</h1>
          <p className="text-xl text-muted-foreground">
            AI-powered employee feedback that drives meaningful change
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/auth')} size="lg">
            Get Started
          </Button>
          <Button onClick={() => navigate('/auth')} variant="outline" size="lg">
            Sign In
          </Button>
        </div>

        <div className="pt-8 grid gap-6 sm:grid-cols-3 text-left">
          <div className="space-y-2">
            <h3 className="font-semibold">Empathetic Conversations</h3>
            <p className="text-sm text-muted-foreground">
              AI-driven dialogues that adapt to employee responses for authentic feedback
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Actionable Insights</h3>
            <p className="text-sm text-muted-foreground">
              Real-time analytics and sentiment tracking for informed decision-making
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Privacy First</h3>
            <p className="text-sm text-muted-foreground">
              GDPR-compliant with robust anonymization and encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
