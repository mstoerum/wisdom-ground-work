import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { MessageSquare, PlayCircle, Sparkles, Shield } from "lucide-react";
import { SocialProof } from "@/components/employee/SocialProof";
import { DebugPanel } from "@/components/DebugPanel";
import { toast } from "sonner";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isGrantingAccess, setIsGrantingAccess] = useState(false);
  const { roles, loading } = useUserRole();
  const navigate = useNavigate();

  const handleGrantHRAccess = async () => {
    setIsGrantingAccess(true);
    try {
      const { error } = await supabase.rpc('assign_demo_hr_admin');
      if (error) throw error;
      
      toast.success("HR Admin access granted! Redirecting...");
      
      // Refresh the page to update roles
      setTimeout(() => {
        window.location.href = '/hr/dashboard';
      }, 1000);
    } catch (error) {
      console.error('Error granting HR access:', error);
      toast.error("Failed to grant access. Please try again.");
      setIsGrantingAccess(false);
    }
  };

  useEffect(() => {
    console.log('🔍 INDEX DEBUG - Starting auth check...');
    
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('🔍 INDEX DEBUG - getSession result:');
      console.log('  Session:', session);
      console.log('  Error:', error);
      setIsAuthenticated(!!session);
    }).catch(err => {
      console.error('❌ INDEX DEBUG - getSession failed:', err);
      setIsAuthenticated(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 INDEX DEBUG - Auth state changed:');
      console.log('  Event:', event);
      console.log('  Session exists:', !!session);
      console.log('  User:', session?.user?.email || 'No user');
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log('🔍 INDEX DEBUG - Navigation check:');
    console.log('  isAuthenticated:', isAuthenticated);
    console.log('  loading:', loading);
    console.log('  roles:', roles);
    
    if (isAuthenticated && !loading && roles.length > 0) {
      // Priority: HR roles over employee role
      if (roles.includes('hr_admin') || roles.includes('hr_analyst')) {
        console.log('  → Navigating to /hr/dashboard');
        navigate('/hr/dashboard');
      } else if (roles.includes('employee')) {
        console.log('  → Navigating to /employee/dashboard');
        navigate('/employee/dashboard');
      }
    } else if (isAuthenticated && !loading && roles.length === 0) {
      // No role assigned, default to employee
      console.log('  → No roles, navigating to /employee/dashboard');
      navigate('/employee/dashboard');
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl text-center space-y-8 p-6">
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to Spradley
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The only employee feedback tool employees actually want to use
          </p>
          <p className="text-sm text-muted-foreground">
            AI-powered conversations that replace rigid surveys with empathetic dialogue
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={() => navigate('/demo')} 
            size="lg"
            className="gap-2 text-lg px-8"
          >
            <PlayCircle className="h-5 w-5" />
            Try Interactive Demo
          </Button>
          <Button onClick={() => navigate('/auth')} variant="outline" size="lg" className="px-8">
            Sign In
          </Button>
        </div>

        {isAuthenticated && !roles.includes('hr_admin') && (
          <div className="pt-4">
            <Button 
              onClick={handleGrantHRAccess}
              disabled={isGrantingAccess}
              size="lg"
              className="gap-2"
            >
              <Shield className="h-5 w-5" />
              {isGrantingAccess ? "Granting Access..." : "Grant HR Admin Access"}
            </Button>
          </div>
        )}

        <div className="pt-4 max-w-md mx-auto">
          <SocialProof />
        </div>

        <DebugPanel />

        <div className="pt-8 grid gap-6 sm:grid-cols-3 text-left">
          <div className="space-y-2 p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Empathetic Conversations</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-driven dialogues that adapt to employee responses for authentic feedback
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Actionable Insights</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time analytics and sentiment tracking for informed decision-making
            </p>
          </div>
          <div className="space-y-2 p-4 rounded-lg border border-border/50 bg-card/50">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="font-semibold">Privacy First</h3>
            </div>
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
