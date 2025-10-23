import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, CheckCircle2 } from "lucide-react";

const AdminBootstrap = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const { data, error } = await supabase.rpc('has_any_admin');

      if (error) throw error;

      if (data) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error checking admin:', error);
    } finally {
      setChecking(false);
    }
  };

  const becomeAdmin = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to become an admin");
        navigate('/auth');
        return;
      }

      const { error } = await supabase.rpc('assign_initial_hr_admin');

      if (error) throw error;

      toast.success("Successfully assigned as HR Admin!");
      navigate('/hr/dashboard');
    } catch (error: any) {
      console.error('Error assigning admin role:', error);
      toast.error(error.message || "Failed to assign admin role");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Checking system status...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Spradley!</CardTitle>
          <CardDescription>
            You're the first user! Let's set you up as the HR Administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              As the first user, you'll automatically receive full administrative privileges.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold">As an HR Admin, you can:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Create and deploy AI-powered employee feedback surveys</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Access real-time analytics and sentiment insights</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Manage action commitments and share updates with employees</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Configure security, compliance, and data retention policies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Invite and manage team members with different roles</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={becomeAdmin} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Setting up your account..." : "Become HR Admin & Get Started"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can invite other team members and assign roles after setup
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBootstrap;
