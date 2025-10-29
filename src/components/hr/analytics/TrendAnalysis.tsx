import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  MessageSquare,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TrendAnalysisProps {
  surveyId?: string;
}

interface TrendData {
  period: string;
  participation: number;
  sentiment: number;
  responses: number;
  urgentFlags: number;
  themes: number;
}

interface DepartmentTrend {
  department: string;
  data: TrendData[];
}

export const TrendAnalysis = ({ surveyId }: TrendAnalysisProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '6m' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'participation' | 'sentiment' | 'responses' | 'urgency'>('sentiment');

  // Fetch trend data
  const { data: trendData, isLoading } = useQuery({
    queryKey: ['trend-analysis', surveyId, selectedPeriod],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch survey assignments with completion data
      const { data: assignments, error: assignmentsError } = await supabase
        .from('survey_assignments')
        .select(`
          id,
          assigned_at,
          completed_at,
          status,
          survey_id,
          responses!inner(
            sentiment_score,
            urgency_escalated,
            theme_id,
            survey_themes(name)
          )
        `)
        .gte('assigned_at', startDate.toISOString())
        .lte('assigned_at', endDate.toISOString())
        .order('assigned_at', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Group data by time periods
      const periodGroups = new Map<string, any[]>();
      
      assignments?.forEach(assignment => {
        const date = new Date(assignment.assigned_at);
        let periodKey: string;
        
        switch (selectedPeriod) {
          case '7d':
            periodKey = date.toISOString().split('T')[0];
            break;
          case '30d':
            periodKey = date.toISOString().split('T')[0];
            break;
          case '90d':
            // Group by week
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
            break;
          case '6m':
            // Group by month
            periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
          case '1y':
            // Group by quarter
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `${date.getFullYear()}-Q${quarter}`;
            break;
          default:
            periodKey = date.toISOString().split('T')[0];
        }
        
        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, []);
        }
        periodGroups.get(periodKey)!.push(assignment);
      });

      // Calculate metrics for each period
      const trendData: TrendData[] = Array.from(periodGroups.entries())
        .map(([period, assignments]) => {
          const completed = assignments.filter(a => a.status === 'completed');
          const totalAssigned = assignments.length;
          const completionRate = totalAssigned > 0 ? (completed.length / totalAssigned) * 100 : 0;
          
          const responses = completed.flatMap(a => a.responses || []);
          const avgSentiment = responses.length > 0 
            ? responses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / responses.length 
            : 0;
          
          const urgentFlags = responses.filter(r => r.urgency_escalated).length;
          const uniqueThemes = new Set(responses.map(r => r.theme_id)).size;

          return {
            period,
            participation: completionRate,
            sentiment: avgSentiment,
            responses: completed.length,
            urgentFlags,
            themes: uniqueThemes
          };
        })
        .sort((a, b) => a.period.localeCompare(b.period));

      return trendData;
    },
  });

  // Calculate trend indicators
  const getTrendIndicator = (data: TrendData[], metric: keyof TrendData) => {
    if (data.length < 2) return { direction: 'neutral', change: 0 };
    
    const first = data[0][metric] as number;
    const last = data[data.length - 1][metric] as number;
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change: changePercent
    };
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'neutral': return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMetricConfig = (metric: string) => {
    switch (metric) {
      case 'participation':
        return {
          label: 'Participation Rate',
          color: 'hsl(var(--chart-1))',
          icon: <Users className="h-4 w-4" />,
          suffix: '%'
        };
      case 'sentiment':
        return {
          label: 'Average Sentiment',
          color: 'hsl(var(--chart-2))',
          icon: <MessageSquare className="h-4 w-4" />,
          suffix: ''
        };
      case 'responses':
        return {
          label: 'Total Responses',
          color: 'hsl(var(--chart-3))',
          icon: <Target className="h-4 w-4" />,
          suffix: ''
        };
      case 'urgency':
        return {
          label: 'Urgent Flags',
          color: 'hsl(var(--chart-4))',
          icon: <TrendingUp className="h-4 w-4" />,
          suffix: ''
        };
      default:
        return {
          label: 'Metric',
          color: 'hsl(var(--chart-1))',
          icon: <TrendingUp className="h-4 w-4" />,
          suffix: ''
        };
    }
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading Trend Analysis</h3>
        <p className="text-muted-foreground">Analyzing historical data patterns...</p>
      </Card>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Trend Data Available</h3>
        <p className="text-muted-foreground">Not enough historical data to show trends. Check back after more surveys are completed.</p>
      </Card>
    );
  }

  const currentMetric = getMetricConfig(selectedMetric);
  const trend = getTrendIndicator(trendData, selectedMetric as keyof TrendData);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Metric" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="participation">Participation Rate</SelectItem>
            <SelectItem value="sentiment">Average Sentiment</SelectItem>
            <SelectItem value="responses">Total Responses</SelectItem>
            <SelectItem value="urgency">Urgent Flags</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trend Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {(['participation', 'sentiment', 'responses', 'urgency'] as const).map((metric) => {
          const config = getMetricConfig(metric);
          const metricTrend = getTrendIndicator(trendData || [], metric as keyof TrendData);
          const currentValue = trendData?.[trendData.length - 1]?.[metric as keyof TrendData] as number || 0;
          
          return (
            <Card key={metric}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {config.icon}
                    {config.label}
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metricTrend.direction as 'up' | 'down' | 'neutral')}
                    <span className={`text-xs ${
                      metricTrend.direction === 'up' ? 'text-green-600' : 
                      metricTrend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {Math.abs(metricTrend.change).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {currentValue.toFixed(metric === 'participation' ? 1 : 0)}{config.suffix}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentMetric.icon}
            {currentMetric.label} Trend
            <Badge variant="outline" className="ml-2">
              {selectedPeriod}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{
            [selectedMetric]: { 
              label: currentMetric.label, 
              color: currentMetric.color 
            }
          }} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke={currentMetric.color}
                  strokeWidth={3}
                  dot={{ fill: currentMetric.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: currentMetric.color, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Additional Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Participation vs Sentiment Correlation */}
        <Card>
          <CardHeader>
            <CardTitle>Participation vs Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              participation: { label: "Participation Rate", color: "hsl(var(--chart-1))" },
              sentiment: { label: "Average Sentiment", color: "hsl(var(--chart-2))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="participation" 
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Response Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Response Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              responses: { label: "Responses", color: "hsl(var(--chart-3))" }
            }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="responses" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};