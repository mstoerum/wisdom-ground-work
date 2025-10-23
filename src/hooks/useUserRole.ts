import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return (data || []).map(r => r.role);
    },
  });

  return {
    roles,
    isEmployee: roles.includes('employee'),
    isHRAdmin: roles.includes('hr_admin'),
    isHRAnalyst: roles.includes('hr_analyst'),
    loading: isLoading,
  };
};
