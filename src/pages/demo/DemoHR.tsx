import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Sparkles, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const sentimentData = [
  { theme: "Work-Life Balance", positive: 45, negative: 78, neutral: 12 },
  { theme: "Career Growth", positive: 89, negative: 23, neutral: 23 },
  { theme: "Team Collaboration", positive: 112, negative: 8, neutral: 15 },
  { theme: "Leadership", positive: 67, negative: 34, neutral: 34 },
  { theme: "Compensation", positive: 56, negative: 45, neutral: 34 },
];

const participationData = [
  { name: "Completed", value: 187, color: "#22c55e" },
  { name: "In Progress", value: 23, color: "#f59e0b" },
  { name: "Not Started", value: 15, color: "#94a3b8" },
];

const urgentFlags = [
  {
    id: 1,
    theme: "Work-Life Balance",
    summary: "Multiple employees reporting after-hours work expectations during month-end",
    sentiment: "negative",
    responseCount: 12,
  },
  {
    id: 2,
    theme: "Compensation",
    summary: "Concerns about salary competitiveness compared to market rates",
    sentiment: "negative",
    responseCount: 8,
  },
];

const themeInsights = [
  {
    theme: "Work-Life Balance",
    sentiment: "negative",
    trend: "down",
    summary: "58% negative sentiment, down from 42% last quarter. Primary concern: after-hours expectations.",
    keyQuote: "I often find myself answering emails late at night... feels like there's an expectation to always be available.",
  },
  {
    theme: "Career Growth",
    sentiment: "positive",
    trend: "up",
    summary: "76% positive sentiment, up from 68%. Employees appreciate new mentorship program.",
    keyQuote: "The new career development workshops have been really helpful for my growth.",
  },
  {
    theme: "Team Collaboration",
    sentiment: "positive",
    trend: "up",
    summary: "83% positive sentiment. Strong team dynamics and communication.",
    keyQuote: "My team is supportive and we work really well together.",
  },
];

export default function DemoHR() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Demo Banner */}
      <div className="bg-primary/10 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Demo Mode - HR Admin View</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/demo')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Demo Menu
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Q1 2025 Employee Feedback</h1>
          <p className="text-muted-foreground">Real-time insights from 225 employees</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Theme Insights</TabsTrigger>
            <TabsTrigger value="urgent">Urgent Flags</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Row */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Participation Rate</div>
                <div className="text-3xl font-bold text-green-600">83%</div>
                <div className="text-xs text-muted-foreground mt-1">187 of 225 employees</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Avg. Sentiment</div>
                <div className="text-3xl font-bold">72/100</div>
                <div className="text-xs text-green-600 mt-1">+5 from last quarter</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Response Time</div>
                <div className="text-3xl font-bold">8.5m</div>
                <div className="text-xs text-muted-foreground mt-1">Avg. conversation length</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm text-muted-foreground mb-1">Action Items</div>
                <div className="text-3xl font-bold text-orange-600">3</div>
                <div className="text-xs text-muted-foreground mt-1">Requiring attention</div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Sentiment by Theme</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sentimentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="theme" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="positive" fill="#22c55e" name="Positive" />
                    <Bar dataKey="negative" fill="#ef4444" name="Negative" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Participation Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={participationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {participationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {themeInsights.map((insight) => (
              <Card key={insight.theme} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{insight.theme}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={insight.sentiment === "positive" ? "default" : "destructive"}>
                      {insight.sentiment === "positive" ? "Positive" : "Needs Attention"}
                    </Badge>
                    {insight.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                  <p className="text-sm italic">"{insight.keyQuote}"</p>
                  <p className="text-xs text-muted-foreground mt-2">— Anonymous Employee Response</p>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="urgent" className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">2 Issues Require Immediate Attention</h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    These themes show high negative sentiment and multiple employee concerns.
                  </p>
                </div>
              </div>
            </div>

            {urgentFlags.map((flag) => (
              <Card key={flag.id} className="p-6 border-l-4 border-orange-500">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="destructive" className="mb-2">{flag.theme}</Badge>
                    <h3 className="font-semibold text-lg mb-2">{flag.summary}</h3>
                    <p className="text-sm text-muted-foreground">
                      {flag.responseCount} employees mentioned this concern
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">Create Action Plan</Button>
                  <Button size="sm" variant="outline">View Responses</Button>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="p-6 mt-8 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Ready to get these insights for your team?</h3>
              <p className="text-sm text-muted-foreground">Start collecting authentic feedback in minutes.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/demo/employee')} variant="outline">
                Try Employee View
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started Free
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
