import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SurveyList } from "@/components/hr/SurveyList";
import { PlusCircle, Users, TrendingUp, CheckSquare, AlertCircle } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HRDashboard = () => {
  const navigate = useNavigate();
  const { participation, urgency, isLoading } = useAnalytics();

  const { data: activeSurveysCount = 0 } = useQuery({
    queryKey: ['active-surveys-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('surveys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage surveys and track employee feedback</p>
          </div>
          <Button onClick={() => navigate('/hr/create-survey')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Survey
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Surveys</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : activeSurveysCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : participation?.completed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed surveys</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "-" : `${participation?.completionRate || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average completion</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Urgent Flags</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "-" : urgency?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Surveys List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Surveys</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <SurveyList />
          </TabsContent>
          
          <TabsContent value="active">
            <SurveyList status="active" />
          </TabsContent>
          
          <TabsContent value="draft">
            <SurveyList status="draft" />
          </TabsContent>
          
          <TabsContent value="scheduled">
            <SurveyList status="scheduled" />
          </TabsContent>
          
          <TabsContent value="completed">
            <SurveyList status="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  );
};

export default HRDashboard;
