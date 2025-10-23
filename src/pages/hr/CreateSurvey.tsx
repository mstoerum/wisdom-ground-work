import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateSurvey = () => {
  const navigate = useNavigate();

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hr/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Survey</h1>
            <p className="text-muted-foreground mt-1">Design an AI-powered feedback conversation</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Survey Wizard</CardTitle>
            <CardDescription>
              This feature is coming soon. The multi-step wizard will guide you through creating surveys with theme selection, employee targeting, scheduling, and privacy settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              In the meantime, you can explore the dashboard and other features.
            </p>
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  );
};

export default CreateSurvey;
