import { useEffect, useState } from "react";
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
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
        setRoles((data || []).map(r => r.role));
      }
      setLoading(false);
    };

    fetchRoles();
  }, []);

  return {
    roles,
    isEmployee: roles.includes('employee'),
    isHRAdmin: roles.includes('hr_admin'),
    isHRAnalyst: roles.includes('hr_analyst'),
    loading,
  };
};
