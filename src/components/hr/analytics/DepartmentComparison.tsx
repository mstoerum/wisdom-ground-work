import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Building2,
  Target,
  MessageSquare,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface DepartmentComparisonProps {
  surveyId?: string;
}

interface DepartmentData {
  department: string;
  participation: number;
  sentiment: number;
  responses: number;
  urgentFlags: number;
  themes: string[];
  trend: 'up' | 'down' | 'stable';
  rank: number;
}

interface ThemeComparison {
  theme: string;
  departments: {
    [department: string]: {
      sentiment: number;
      responses: number;
      urgentFlags: number;
    };
  };
}

export const DepartmentComparison = ({ surveyId }: DepartmentComparisonProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');

  // Fetch department data
  const { data: departmentData, isLoading: deptLoading } = useQuery({
    queryKey: ['department-comparison', surveyId],
    queryFn: async () => {
      // Fetch responses with department information
      const { data: responses, error } = await supabase
        .from('responses')
        .select(`
          id,
          sentiment_score,
          sentiment,
          urgency_escalated,
          theme_id,
          survey_themes(name),
          conversation_sessions!inner(
            survey_id,
            survey_assignments!inner(
              employee_id,
              employees!inner(department)
            )
          )
        `)
        .eq('conversation_sessions.survey_id', surveyId || '');

      if (error) throw error;

      // Group by department
      const deptMap = new Map<string, any[]>();
      responses?.forEach(response => {
        const dept = response.conversation_sessions?.survey_assignments?.employees?.department || 'Unknown';
        if (!deptMap.has(dept)) {
          deptMap.set(dept, []);
        }
        deptMap.get(dept)!.push(response);
      });

      // Calculate metrics for each department
      const departments: DepartmentData[] = Array.from(deptMap.entries()).map(([dept, responses]) => {
        const avgSentiment = responses.length > 0 
          ? responses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / responses.length 
          : 0;
        
        const urgentFlags = responses.filter(r => r.urgency_escalated).length;
        const uniqueThemes = [...new Set(responses.map(r => r.theme_id).filter(Boolean))];
        
        return {
          department: dept,
          participation: 0, // Would need assignment data to calculate
          sentiment: avgSentiment,
          responses: responses.length,
          urgentFlags,
          themes: uniqueThemes,
          trend: 'stable', // Would need historical data
          rank: 0 // Will be calculated after sorting
        };
      });

      // Sort by sentiment and assign ranks
      departments.sort((a, b) => b.sentiment - a.sentiment);
      departments.forEach((dept, index) => {
        dept.rank = index + 1;
      });

      return departments;
    },
  });

  // Fetch theme comparison data
  const { data: themeComparison, isLoading: themeLoading } = useQuery({
    queryKey: ['theme-comparison', surveyId],
    queryFn: async () => {
      const { data: responses, error } = await supabase
        .from('responses')
        .select(`
          sentiment_score,
          urgency_escalated,
          theme_id,
          survey_themes(name),
          conversation_sessions!inner(
            survey_assignments!inner(
              employees!inner(department)
            )
          )
        `)
        .eq('conversation_sessions.survey_id', surveyId || '');

      if (error) throw error;

      // Group by theme and department
      const themeMap = new Map<string, Map<string, any[]>>();
      
      responses?.forEach(response => {
        const theme = response.survey_themes?.name || 'Unknown';
        const dept = response.conversation_sessions?.survey_assignments?.employees?.department || 'Unknown';
        
        if (!themeMap.has(theme)) {
          themeMap.set(theme, new Map());
        }
        if (!themeMap.get(theme)!.has(dept)) {
          themeMap.get(theme)!.set(dept, []);
        }
        themeMap.get(theme)!.get(dept)!.push(response);
      });

      // Convert to comparison format
      const comparisons: ThemeComparison[] = Array.from(themeMap.entries()).map(([theme, deptMap]) => {
        const departments: any = {};
        
        deptMap.forEach((responses, dept) => {
          const avgSentiment = responses.length > 0 
            ? responses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / responses.length 
            : 0;
          
          departments[dept] = {
            sentiment: avgSentiment,
            responses: responses.length,
            urgentFlags: responses.filter(r => r.urgency_escalated).length
          };
        });

        return { theme, departments };
      });

      return comparisons;
    },
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'text-green-600';
    if (sentiment >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentBadge = (sentiment: number) => {
    if (sentiment >= 70) return 'bg-green-100 text-green-800';
    if (sentiment >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (deptLoading || themeLoading) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading Department Analysis</h3>
        <p className="text-muted-foreground">Comparing performance across departments...</p>
      </Card>
    );
  }

  if (!departmentData || departmentData.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Department Data</h3>
        <p className="text-muted-foreground">Department information not available for this survey.</p>
      </Card>
    );
  }

  const filteredDepartments = selectedDepartment === 'all' 
    ? departmentData 
    : departmentData.filter(d => d.department === selectedDepartment);

  const chartData = filteredDepartments.map(dept => ({
    department: dept.department,
    sentiment: dept.sentiment,
    responses: dept.responses,
    urgentFlags: dept.urgentFlags
  }));

  return (
    <div className="space-y-6">
      {/* Department Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentData.map((dept, index) => (
              <div key={dept.department} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    <span className="text-sm font-bold">#{dept.rank}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{dept.department}</div>
                    <div className="text-sm text-muted-foreground">
                      {dept.responses} responses • {dept.urgentFlags} urgent flags
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getSentimentColor(dept.sentiment)}`}>
                      {dept.sentiment.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Sentiment</div>
                  </div>
                  <Badge className={getSentimentBadge(dept.sentiment)}>
                    {dept.sentiment >= 70 ? 'Excellent' : dept.sentiment >= 50 ? 'Good' : 'Needs Attention'}
                  </Badge>
                  {getTrendIcon(dept.trend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Comparison Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              sentiment: { label: "Average Sentiment", color: "hsl(var(--chart-1))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sentiment" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Response Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Response Volume by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              responses: { label: "Responses", color: "hsl(var(--chart-2))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ department, responses }) => `${department}: ${responses}`}
                    outerRadius={80}
                    fill="hsl(var(--chart-2))"
                    dataKey="responses"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 4) + 1}))`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Theme Comparison Across Departments */}
      {themeComparison && themeComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Theme Performance Across Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {themeComparison.slice(0, 3).map((theme, index) => (
                <div key={theme.theme}>
                  <h4 className="font-semibold mb-3">{theme.theme}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(theme.departments).map(([dept, data]) => (
                      <div key={dept} className="p-3 rounded-lg border">
                        <div className="font-medium text-sm">{dept}</div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-2xl font-bold text-muted-foreground">
                            {data.sentiment.toFixed(1)}
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{data.responses} responses</div>
                            {data.urgentFlags > 0 && (
                              <div className="text-red-600">{data.urgentFlags} urgent</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Department Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentData
              .filter(dept => dept.sentiment < 60 || dept.urgentFlags > 0)
              .map(dept => (
                <div key={dept.department} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                  <div>
                    <div className="font-semibold text-red-900">{dept.department}</div>
                    <div className="text-sm text-red-700">
                      {dept.sentiment < 60 && `Low sentiment: ${dept.sentiment.toFixed(1)}`}
                      {dept.sentiment < 60 && dept.urgentFlags > 0 && ' • '}
                      {dept.urgentFlags > 0 && `${dept.urgentFlags} urgent flags`}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                    Create Action Plan
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};