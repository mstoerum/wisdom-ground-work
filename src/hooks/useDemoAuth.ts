import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Demo authentication hook for creating temporary demo users
 * Allows demo users to experience the full system without real signup
 */
export const useDemoAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Create a temporary demo user and sign them in
   */
  const createDemoUser = useCallback(async (role: 'employee' | 'hr') => {
    setIsLoading(true);
    
    try {
      // Generate a unique demo user identifier
      const demoId = `demo_${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const demoEmail = `${demoId}@demo.spradley.ai`;
      const demoPassword = `demo_${Math.random().toString(36).substr(2, 12)}`;

      // Sign up the demo user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            role: role,
            is_demo_user: true,
            demo_id: demoId
          }
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user!.id,
          email: demoEmail,
          role: role,
          is_demo_user: true,
          demo_id: demoId,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('Profile creation failed:', profileError);
        // Continue anyway as the user is authenticated
      }

      // If HR user, create a demo organization
      if (role === 'hr') {
        const { error: orgError } = await supabase
          .from('organizations')
          .insert({
            id: authData.user!.id, // Use user ID as org ID for demo
            name: 'Demo Company',
            created_by: authData.user!.id,
            is_demo: true
          });

        if (orgError) {
          console.warn('Organization creation failed:', orgError);
        }
      }

      toast({
        title: "Demo session started",
        description: `Welcome to the ${role} demo experience!`,
      });

      return {
        user: authData.user,
        role,
        isDemo: true
      };

    } catch (error) {
      console.error('Demo auth error:', error);
      toast({
        title: "Demo setup failed",
        description: "Could not start demo session. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Clean up demo user data when demo ends
   */
  const cleanupDemoUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete demo user data
      await supabase
        .from('profiles')
        .delete()
        .eq('is_demo_user', true)
        .eq('id', user.id);

      // Sign out
      await supabase.auth.signOut();

      toast({
        title: "Demo ended",
        description: "Demo session cleaned up successfully.",
      });
    } catch (error) {
      console.error('Demo cleanup error:', error);
    }
  }, [toast]);

  return {
    createDemoUser,
    cleanupDemoUser,
    isLoading
  };
};