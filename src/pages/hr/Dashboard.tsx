import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SurveyList } from "@/components/hr/SurveyList";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Users, TrendingUp, CheckSquare, AlertCircle, UserPlus } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingTour } from "@/components/hr/OnboardingTour";
import { MetricCard } from "@/components/hr/analytics/MetricCard";

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

  const { data: employeeCount = 0 } = useQuery({
    queryKey: ['employee-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <HRLayout>
      <OnboardingTour />
      <div className="space-y-12">
        {/* Hero Header with breathing space */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[hsl(var(--terracotta-primary))] via-[hsl(var(--coral-accent))] to-[hsl(var(--butter-yellow))] bg-clip-text text-transparent">
              HR Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">Manage surveys and track employee feedback</p>
          </div>
          <Button 
            onClick={() => navigate('/hr/create-survey')} 
            data-tour="create-survey"
            variant="coral"
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Survey
          </Button>
        </div>

        {/* Empty state alert for no employees */}
        {employeeCount === 0 && (
          <Alert className="border-[hsl(var(--coral-accent))] bg-[hsl(var(--coral-pink))]">
            <UserPlus className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>No employees in your organization yet. Add employees to start sending surveys.</span>
              <Button onClick={() => navigate('/hr/settings')} variant="outline" size="sm">
                Invite Employees
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards - Asymmetric Layout */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-8 rounded-3xl bg-card">
                <Skeleton className="h-14 w-14 rounded-2xl mb-6" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-12 w-16 mb-3" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-4">
            <MetricCard
              title="Active Surveys"
              value={activeSurveysCount}
              icon={TrendingUp}
              description="Currently running"
            />
            
            <MetricCard
              title="Total Responses"
              value={participation?.completed || 0}
              icon={Users}
              description="Completed surveys"
            />

            <MetricCard
              title="Participation Rate"
              value={participation?.completionRate || 0}
              suffix="%"
              icon={CheckSquare}
              description="Average completion"
            />

            <MetricCard
              title="Urgent Flags"
              value={urgency?.length || 0}
              icon={AlertCircle}
              description="Requiring attention"
            />
          </div>
        )}

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
