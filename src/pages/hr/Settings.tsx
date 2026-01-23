import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserManagement } from "@/components/hr/settings/UserManagement";
import { SurveyDefaults } from "@/components/hr/settings/SurveyDefaults";
import { AuditLogs } from "@/components/hr/settings/AuditLogs";
import { SecuritySettings } from "@/components/hr/settings/SecuritySettings";
import { ComplianceGuide } from "@/components/hr/ComplianceGuide";
import { EmployeeInvitations } from "@/components/hr/settings/EmployeeInvitations";

const Settings = () => {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system configuration, security, and compliance</p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="defaults">Defaults</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="invitations">
            <EmployeeInvitations />
          </TabsContent>

          <TabsContent value="defaults">
            <SurveyDefaults />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogs />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceGuide />
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
};

export default Settings;
