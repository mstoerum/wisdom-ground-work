import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'employee' | 'hr_admin' | 'hr_analyst';
}

// Demo Mode: All routes are accessible without authentication
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return <>{children}</>;
};
