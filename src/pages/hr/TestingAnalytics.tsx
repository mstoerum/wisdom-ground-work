import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTestingAnalytics } from '@/hooks/useTestingAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, MessageSquare, Mic, TrendingUp, Users, Clock, CheckCircle2 } from 'lucide-react';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

const METHOD_LABELS: Record<string, string> = {
  traditional_survey: 'Traditional Survey',
  chat: 'Chat Interface',
  voice: 'Voice Interface',
};

export const TestingAnalytics = () => {
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [personaFilter, setPersonaFilter] = useState<string>('all');

  const { data: analytics, isLoading } = useTestingAnalytics({
    organizationType: orgFilter !== 'all' ? orgFilter : undefined,
    personaId: personaFilter !== 'all' ? personaFilter : undefined,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center">No analytics data available</div>
      </div>
    );
  }

  // Prepare data for charts
  const methodData = Object.entries(analytics.interactions.byMethod).map(([method, data]) => ({
    method: METHOD_LABELS[method] || method,
    completionRate: data.completionRate,
    avgDuration: Math.round(data.avgDuration / 60), // Convert to minutes
    avgSentiment: data.avgSentiment,
    avgMessageCount: data.avgMessageCount,
    avgWordCount: data.avgWordCount,
  }));

  const questionnaireData = Object.entries(analytics.questionnaires.byType).map(([type, data]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    easeOfUse: data.avgEaseOfUse,
    comfort: data.avgComfort,
    trust: data.avgTrust,
    privacyConfidence: data.avgPrivacyConfidence,
    satisfaction: data.avgSatisfaction,
  }));

  const preferenceData = Object.entries(analytics.comparisons.preferenceDistribution).map(([method, count]) => ({
    name: METHOD_LABELS[method] || method,
    value: count,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Testing Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive analysis of chat and voice testing results
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Organization Type</label>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  <SelectItem value="large_corp">Large Corporation</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="ngo">NGO</SelectItem>
                  <SelectItem value="public_sector">Public Sector</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Persona</label>
              <Select value={personaFilter} onValueChange={setPersonaFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Personas</SelectItem>
                  {/* Add persona options dynamically */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sessions.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.sessions.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.sessions.total > 0
                ? Math.round((analytics.sessions.completed / analytics.sessions.total) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Methods Tested</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(analytics.interactions.byMethod).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Interaction methods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(analytics.interactions.byMethod).length > 0
                ? Math.round(
                    Object.values(analytics.interactions.byMethod).reduce(
                      (sum, m) => sum + m.completionRate,
                      0
                    ) / Object.values(analytics.interactions.byMethod).length
                  )
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all methods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="interactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Method</CardTitle>
                <CardDescription>Percentage of completed interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={methodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completionRate" fill="#8884d8" name="Completion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Duration</CardTitle>
                <CardDescription>Time spent per interaction (minutes)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={methodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgDuration" fill="#82ca9d" name="Avg Duration (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Sentiment Score</CardTitle>
                <CardDescription>Sentiment analysis across methods</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={methodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgSentiment" fill="#ffc658" name="Avg Sentiment" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Messages and word count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={methodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="avgMessageCount" fill="#8884d8" name="Avg Messages" />
                    <Bar yAxisId="right" dataKey="avgWordCount" fill="#82ca9d" name="Avg Words" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Questionnaires Tab */}
        <TabsContent value="questionnaires" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questionnaire Scores by Type</CardTitle>
              <CardDescription>Average scores from questionnaires</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={questionnaireData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="easeOfUse" fill="#8884d8" name="Ease of Use" />
                  <Bar dataKey="comfort" fill="#82ca9d" name="Comfort" />
                  <Bar dataKey="trust" fill="#ffc658" name="Trust" />
                  <Bar dataKey="privacyConfidence" fill="#ff7c7c" name="Privacy" />
                  <Bar dataKey="satisfaction" fill="#8dd1e1" name="Satisfaction" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comparisons Tab */}
        <TabsContent value="comparisons" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Method Preference</CardTitle>
                <CardDescription>Which method participants preferred</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={preferenceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {preferenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Comparison</CardTitle>
                <CardDescription>Which method took longer</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(analytics.comparisons.timeComparison).map(([key, value]) => ({
                      comparison: key,
                      count: value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="comparison" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessions by Organization Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(analytics.sessions.byOrganizationType).map(([org, count]) => ({
                      organization: org.replace('_', ' ').toUpperCase(),
                      sessions: count,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="organization" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions by Persona</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(analytics.sessions.byPersona).map(([persona, count]) => ({
                      persona: persona.replace('_', ' ').toUpperCase(),
                      sessions: count,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="persona" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
