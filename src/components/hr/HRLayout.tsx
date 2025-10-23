import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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
import { LayoutDashboard, PlusCircle, BarChart3, ListChecks, Settings, LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HRLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { title: "Dashboard", url: "/hr/dashboard", icon: LayoutDashboard, tourId: undefined },
  { title: "Create Survey", url: "/hr/create-survey", icon: PlusCircle, tourId: undefined },
  { title: "Analytics", url: "/hr/analytics", icon: BarChart3, tourId: "analytics" },
  { title: "Action Commitments", url: "/hr/commitments", icon: ListChecks, tourId: "commitments" },
  { title: "Settings", url: "/hr/settings", icon: Settings, tourId: "settings" },
];

export const HRLayout = ({ children }: HRLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Spradley HR</h2>
            <p className="text-sm text-muted-foreground">Admin Portal</p>
          </div>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title} data-tour={item.tourId}>
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
