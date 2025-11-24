import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, User, LogOut, Building2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "sonner";

interface EmployeeLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: "Dashboard", url: "/employee/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/employee/profile", icon: User },
];

export const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {
  const navigate = useNavigate();
  const { isHRAdmin, isHRAnalyst } = useUserRole();
  const isHR = isHRAdmin || isHRAnalyst;

  const { data: profile } = useQuery({
    queryKey: ['employee-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  const handleSwitchToHR = () => {
    navigate("/hr/dashboard");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Spradley</h2>
            {profile && (
              <div className="mt-2">
                <p className="text-sm font-medium">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.department}</p>
              </div>
            )}
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url}
                          className={({ isActive }) =>
                            isActive ? "bg-accent text-accent-foreground" : ""
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {isHR && (
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={handleSwitchToHR}>
                        <Building2 className="h-4 w-4" />
                        <span>HR Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1">
          <header className="h-14 border-b flex items-center px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
