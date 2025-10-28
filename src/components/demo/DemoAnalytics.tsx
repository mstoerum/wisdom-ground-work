import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, FileText, Clock, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  generateMockParticipation, 
  generateMockSentiment, 
  generateMockThemes, 
  generateMockUrgencyFlags, 
  generateTimeSeriesData,
  generateDepartmentData,
  generateTrendData,
} from "@/utils/demoAnalyticsData";
import { toast } from "sonner";

interface DemoAnalyticsProps {
  onBackToMenu: () => void;
}

export const DemoAnalytics = ({ onBackToMenu }: DemoAnalyticsProps) => {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTheme, setSelectedTheme] = useState("all");

  // Generate comprehensive mock data
  const participation = generateMockParticipation();
  const sentiment = generateMockSentiment();
  const themes = generateMockThemes();
  const urgency = generateMockUrgencyFlags();
  const timeSeriesData = generateTimeSeriesData();
  const departmentData = generateDepartmentData();
  const trendData = generateTrendData();

  // Filter data based on selections
  const filteredThemes = selectedTheme === "all" ? themes : themes.filter(t => t.id === selectedTheme);
  const filteredDepartmentData = selectedDepartment === "all" ? departmentData : departmentData.filter(d => d.department === selectedDepartment);

  const handleExport = () => {
    toast.success("CSV export started (Demo)");
    console.log("Exporting demo data...");
  };

  const handlePDFExport = () => {
    toast.success("PDF export started (Demo)");
    console.log("Exporting PDF...");
  };

  return (
    <HRLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Demo Banner */}
        <div className="bg-primary/10 border-b -mx-6 -mt-6 mb-6">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Demo Mode - HR Analytics</span>
              <Badge variant="secondary">247 Employees • Q1 2025</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onBackToMenu}>
              Back to Demo Menu
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Employee Feedback Analytics</h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive insights from {participation.completed} completed conversations
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={handlePDFExport} variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Participation Rate</p>
                    <p className="text-3xl font-bold text-green-600">{participation.completionRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{participation.completed} of {participation.totalAssigned} employees</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Sentiment</p>
                    <p className="text-3xl font-bold">{sentiment.avgScore}/100</p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +{sentiment.moodImprovement} improvement
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                    <p className="text-3xl font-bold">{participation.avgDuration}m</p>
                    <p className="text-xs text-muted-foreground mt-1">per conversation</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Urgent Flags</p>
                    <p className="text-3xl font-bold text-orange-600">{urgencyFlags.filter(u => !u.resolved_at).length}</p>
                    <p className="text-xs text-muted-foreground mt-1">requiring attention</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departmentData.map(d => (
                  <SelectItem key={d.department} value={d.department}>{d.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All themes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All themes</SelectItem>
                {themes.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
              <TabsTrigger value="themes">Theme Insights</TabsTrigger>
              <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
              <TabsTrigger value="departments">Department View</TabsTrigger>
              <TabsTrigger value="urgency">Urgent Flags</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sentiment Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      positive: { label: "Positive", color: "hsl(var(--chart-1))" },
                      neutral: { label: "Neutral", color: "hsl(var(--chart-2))" },
                      negative: { label: "Negative", color: "hsl(var(--chart-3))" },
                    }} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Positive', value: sentiment.positive, fill: 'hsl(var(--chart-1))' },
                              { name: 'Neutral', value: sentiment.neutral, fill: 'hsl(var(--chart-2))' },
                              { name: 'Negative', value: sentiment.negative, fill: 'hsl(var(--chart-3))' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Positive', value: sentiment.positive, fill: 'hsl(var(--chart-1))' },
                              { name: 'Neutral', value: sentiment.neutral, fill: 'hsl(var(--chart-2))' },
                              { name: 'Negative', value: sentiment.negative, fill: 'hsl(var(--chart-3))' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Participation by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle>Participation by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      participation: { label: "Participation %", color: "hsl(var(--chart-1))" },
                      avgSentiment: { label: "Avg Sentiment", color: "hsl(var(--chart-2))" }
                    }} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredDepartmentData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} fontSize={12} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="participation" fill="hsl(var(--chart-1))" name="Participation %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Response Activity Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    completed: { label: "Responses", color: "hsl(var(--chart-1))" },
                    positive: { label: "Positive", color: "hsl(var(--chart-2))" },
                    negative: { label: "Negative", color: "hsl(var(--chart-3))" }
                  }} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="completed" stackId="1" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" />
                        <Area type="monotone" dataKey="positive" stackId="2" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" />
                        <Area type="monotone" dataKey="negative" stackId="2" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sentiment" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Positive</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(sentiment.positive / (sentiment.positive + sentiment.neutral + sentiment.negative)) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium">{sentiment.positive}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Neutral</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(sentiment.neutral / (sentiment.positive + sentiment.neutral + sentiment.negative)) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium">{sentiment.neutral}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Negative</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(sentiment.negative / (sentiment.positive + sentiment.neutral + sentiment.negative)) * 100}%` }} />
                          </div>
                          <span className="text-sm font-medium">{sentiment.negative}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mood Improvement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">+{sentiment.moodImprovement}</div>
                      <p className="text-muted-foreground">Average mood improvement from start to end of conversations</p>
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          "The AI conversation helped me process my thoughts and feel more optimistic about work."
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-1">— Anonymous Employee</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="themes" className="space-y-6">
              <div className="grid gap-4">
                {filteredThemes.map((theme) => (
                  <Card key={theme.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{theme.name}</h3>
                        <p className="text-sm text-muted-foreground">{theme.responseCount} responses</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={theme.avgSentiment > 60 ? "default" : theme.avgSentiment > 40 ? "secondary" : "destructive"}>
                          {theme.avgSentiment > 60 ? "Positive" : theme.avgSentiment > 40 ? "Mixed" : "Needs Attention"}
                        </Badge>
                        {theme.urgencyCount > 0 && (
                          <Badge variant="destructive">
                            {theme.urgencyCount} urgent
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Sentiment</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                theme.avgSentiment > 60 ? 'bg-green-500' : 
                                theme.avgSentiment > 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${theme.avgSentiment}%` }} 
                            />
                          </div>
                          <span className="text-sm font-medium">{theme.avgSentiment}/100</span>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm italic">
                          {theme.name === "Work-Life Balance" && "I often find myself answering emails late at night... feels like there's an expectation to always be available."}
                          {theme.name === "Career Growth" && "The new career development workshops have been really helpful for my growth."}
                          {theme.name === "Team Collaboration" && "My team is supportive and we work really well together."}
                          {theme.name === "Leadership" && "The leadership team is approachable and really listens to employee feedback."}
                          {theme.name === "Compensation" && "Compensation could be more competitive. I know I could earn more elsewhere, but I stay for the culture."}
                          {theme.name === "Company Culture" && "The company culture is inclusive and welcoming. I feel comfortable being myself at work."}
                          {theme.name === "Work Environment" && "The office environment is modern and comfortable. Great facilities and amenities."}
                          {theme.name === "Communication" && "Communication from leadership could be more transparent. Sometimes important decisions are made without much explanation."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">— Anonymous Employee Response</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quarterly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{
                    participation: { label: "Participation %", color: "hsl(var(--chart-1))" },
                    avgSentiment: { label: "Avg Sentiment", color: "hsl(var(--chart-2))" },
                    urgentFlags: { label: "Urgent Flags", color: "hsl(var(--chart-3))" }
                  }} className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="participation" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                        <Line type="monotone" dataKey="avgSentiment" stroke="hsl(var(--chart-2))" strokeWidth={3} />
                        <Line type="monotone" dataKey="urgentFlags" stroke="hsl(var(--chart-3))" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Participation Growth</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">+14%</div>
                  <p className="text-xs text-muted-foreground">Q3 2024 → Q1 2025</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Sentiment Improvement</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">+10.1</div>
                  <p className="text-xs text-muted-foreground">Q3 2024 → Q1 2025</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Urgent Issues</span>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">-8</div>
                  <p className="text-xs text-muted-foreground">Q3 2024 → Q1 2025</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="departments" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDepartmentData.map((dept) => (
                  <Card key={dept.department} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{dept.department}</h3>
                      <Badge variant={dept.avgSentiment > 70 ? "default" : dept.avgSentiment > 50 ? "secondary" : "destructive"}>
                        {dept.avgSentiment}/100
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Participation</span>
                        <span className="text-sm font-medium">{dept.participation}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${dept.participation}%` }} 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Responses</span>
                        <span className="text-sm font-medium">{dept.responseCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg Sentiment</span>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                dept.avgSentiment > 70 ? 'bg-green-500' : 
                                dept.avgSentiment > 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${dept.avgSentiment}%` }} 
                            />
                          </div>
                          <span className="text-xs">{dept.avgSentiment}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="urgency" className="space-y-6">
              {!urgency || urgency.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Urgent Flags</h3>
                  <p className="text-muted-foreground">Great news! There are no urgent issues requiring immediate attention.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                          {urgency.filter(u => !u.resolved_at).length} Issues Require Immediate Attention
                        </h3>
                        <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                          These themes show high negative sentiment and multiple employee concerns.
                        </p>
                      </div>
                    </div>
                  </div>

                  {urgency.map((flag) => (
                    <Card key={flag.id} className={`p-6 ${!flag.resolved_at ? 'border-l-4 border-orange-500' : 'border-l-4 border-green-500'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={!flag.resolved_at ? "destructive" : "default"}>
                              {flag.responses?.survey_themes?.name || 'Theme'}
                            </Badge>
                            {!flag.resolved_at ? (
                              <Badge variant="outline">Urgent</Badge>
                            ) : (
                              <Badge variant="outline">Resolved</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{flag.responses?.content || 'No content'}</h3>
                          <p className="text-sm text-muted-foreground">
                            Escalated on {new Date(flag.escalated_at).toLocaleDateString()}
                            {flag.resolved_at && ` • Resolved on ${new Date(flag.resolved_at).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {!flag.resolved_at && (
                          <>
                            <Button size="sm">Create Action Plan</Button>
                            <Button size="sm" variant="outline">View Details</Button>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
    </HRLayout>
  );
};