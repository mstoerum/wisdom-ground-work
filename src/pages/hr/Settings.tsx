import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage system configuration and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>HR Settings</CardTitle>
            <CardDescription>
              Settings and configuration options coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure survey defaults, manage team members, and customize system preferences.
            </p>
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  );
};

export default Settings;
