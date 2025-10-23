import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'employee' | 'hr_admin' | 'hr_analyst';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { roles, loading } = useUserRole();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Still checking authentication
  if (isAuthenticated === null || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole) {
    const hasRole = roles.includes(requiredRole);
    
    if (!hasRole) {
      // Redirect to appropriate dashboard based on their actual role
      if (roles.includes('hr_admin') || roles.includes('hr_analyst')) {
        return <Navigate to="/hr/dashboard" replace />;
      }
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
