import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  roles: AppRole[];
  isEmployee: boolean;
  isHRAdmin: boolean;
  isHRAnalyst: boolean;
  loading: boolean;
}

// Demo Mode: Grant all roles to everyone
export const useUserRole = (): UserRoleData => {
  return {
    roles: ['employee', 'hr_admin', 'hr_analyst'],
    isEmployee: true,
    isHRAdmin: true,
    isHRAnalyst: true,
    loading: false,
  };
};
