import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  roles: AppRole[];
  isEmployee: boolean;
  isHRAdmin: boolean;
  isHRAnalyst: boolean;
  loading: boolean;
}

export const useUserRole = (): UserRoleData => {
  // DEMO MODE: All roles granted for showcase
  // TODO: Restore role checking before production
  return {
    roles: ['employee', 'hr_admin', 'hr_analyst'],
    isEmployee: true,
    isHRAdmin: true,
    isHRAnalyst: true,
    loading: false,
  };
};
