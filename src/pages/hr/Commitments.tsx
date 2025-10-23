import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Commitments = () => {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Action Commitments</h1>
          <p className="text-muted-foreground mt-1">Track and manage follow-up actions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Commitments Management</CardTitle>
            <CardDescription>
              This feature is part of Phase 4 and will be implemented soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The commitments dashboard will help you create, track, and communicate action plans based on employee feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  );
};

export default Commitments;
