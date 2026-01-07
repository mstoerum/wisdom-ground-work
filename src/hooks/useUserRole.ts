import { useState, useEffect } from "react";
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles([]);
          setLoading(false);
          return;
        }

        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
        } else {
          setRoles(userRoles?.map(r => r.role) || []);
        }
      } catch (error) {
        console.error('Error in useUserRole:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    roles,
    isEmployee: roles.includes('employee'),
    isHRAdmin: roles.includes('hr_admin'),
    isHRAnalyst: roles.includes('hr_analyst'),
    loading,
  };
};
