import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'employee' | 'hr_admin' | 'hr_analyst';
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // DEMO MODE: Authentication bypassed for showcase
  // TODO: Restore authentication checks before production
  return <>{children}</>;
};
