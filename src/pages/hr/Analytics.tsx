import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Analytics = () => {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track insights and sentiment trends</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>
              This feature is part of Phase 3 and will be implemented soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The analytics dashboard will provide real-time insights, sentiment tracking, theme breakdowns, and exportable reports.
            </p>
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  );
};

export default Analytics;
