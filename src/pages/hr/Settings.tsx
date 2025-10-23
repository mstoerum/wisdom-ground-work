import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/hr/settings/UserManagement";
import { SurveyDefaults } from "@/components/hr/settings/SurveyDefaults";

const Settings = () => {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="defaults">Survey Defaults</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="defaults">
            <SurveyDefaults />
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
};

export default Settings;
