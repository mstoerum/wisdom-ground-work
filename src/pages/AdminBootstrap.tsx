import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const AdminBootstrap = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'hr_admin')
        .limit(1);

      if (error) throw error;

      // If admin already exists, redirect
      if (data && data.length > 0) {
        navigate('/');
      }
    } catch (error) {
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Initial Admin Setup</CardTitle>
          <CardDescription>
            No HR administrators have been assigned yet. Become the first admin to start managing surveys and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-semibold mb-2">As an HR Admin, you will be able to:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Create and manage employee feedback surveys</li>
              <li>• View analytics and insights from responses</li>
              <li>• Assign roles to other team members</li>
              <li>• Track action commitments and outcomes</li>
            </ul>
          </div>
          <Button 
            onClick={becomeAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Assigning Role..." : "Become First Admin"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBootstrap;
