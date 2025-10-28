import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  MessageSquare,
  Target,
  Mail,
  Phone,
  Calendar,
  ArrowRight,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'sentiment' | 'participation' | 'urgency' | 'trend' | 'system';
  data: any;
  createdAt: Date;
  acknowledged: boolean;
  resolved: boolean;
  actionRequired: boolean;
  suggestedActions: string[];
}

interface AlertSystemProps {
  surveyId?: string;
  onAlertAction?: (alertId: string, action: string) => void;
}

export const AlertSystem = ({ surveyId, onAlertAction }: AlertSystemProps) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate alerts based on data patterns
  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['alerts', surveyId],
    queryFn: async () => {
      // Fetch current analytics data
      const { data: responses, error: responsesError } = await supabase
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

      if (responsesError) throw responsesError;

      const { data: assignments, error: assignmentsError } = await supabase
        .from('survey_assignments')
        .select('id, status, assigned_at, completed_at')
        .eq('survey_id', surveyId || '');

      if (assignmentsError) throw assignmentsError;

      const { data: urgency, error: urgencyError } = await supabase
        .from('escalation_log')
        .select('*, responses(content, sentiment, survey_themes(name))')
        .order('escalated_at', { ascending: false });

      if (urgencyError) throw urgencyError;

      // Calculate metrics
      const totalAssigned = assignments?.length || 0;
      const completed = assignments?.filter(a => a.status === 'completed').length || 0;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;
      
      const avgSentiment = responses?.length > 0 
        ? responses.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / responses.length 
        : 0;
      
      const urgentFlags = urgency?.filter(u => !u.resolved_at).length || 0;
      const negativeResponses = responses?.filter(r => r.sentiment === 'negative').length || 0;
      const negativePercentage = responses?.length > 0 ? (negativeResponses / responses.length) * 100 : 0;

      // Generate alerts
      const generatedAlerts: Alert[] = [];

      // Critical alerts
      if (avgSentiment < 40) {
        generatedAlerts.push({
          id: 'critical-sentiment',
          type: 'critical',
          title: 'Critical: Extremely Low Employee Sentiment',
          description: `Average sentiment score of ${avgSentiment.toFixed(1)} indicates severe employee dissatisfaction. Immediate intervention required.`,
          priority: 'high',
          category: 'sentiment',
          data: { avgSentiment, totalResponses: responses?.length || 0 },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: true,
          suggestedActions: [
            'Schedule emergency leadership meeting',
            'Conduct immediate employee focus groups',
            'Implement crisis communication plan',
            'Review recent policy changes'
          ]
        });
      }

      if (urgentFlags > 10) {
        generatedAlerts.push({
          id: 'critical-urgency',
          type: 'critical',
          title: 'Critical: High Volume of Urgent Issues',
          description: `${urgentFlags} urgent issues require immediate attention. This may indicate systemic problems.`,
          priority: 'high',
          category: 'urgency',
          data: { urgentFlags, totalResponses: responses?.length || 0 },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: true,
          suggestedActions: [
            'Prioritize urgent issues by severity',
            'Assign dedicated crisis response team',
            'Implement escalation procedures',
            'Schedule daily status updates'
          ]
        });
      }

      // Warning alerts
      if (completionRate < 50) {
        generatedAlerts.push({
          id: 'warning-participation',
          type: 'warning',
          title: 'Low Survey Participation',
          description: `Only ${completionRate.toFixed(1)}% of employees have completed surveys. This may indicate survey fatigue or accessibility issues.`,
          priority: 'medium',
          category: 'participation',
          data: { completionRate, totalAssigned, completed },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: true,
          suggestedActions: [
            'Send reminder emails to non-respondents',
            'Simplify survey questions',
            'Offer incentives for completion',
            'Check survey accessibility'
          ]
        });
      }

      if (avgSentiment < 60 && avgSentiment >= 40) {
        generatedAlerts.push({
          id: 'warning-sentiment',
          type: 'warning',
          title: 'Declining Employee Sentiment',
          description: `Average sentiment of ${avgSentiment.toFixed(1)} shows concerning employee dissatisfaction trends.`,
          priority: 'medium',
          category: 'sentiment',
          data: { avgSentiment, negativePercentage },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: true,
          suggestedActions: [
            'Conduct pulse surveys to identify issues',
            'Schedule team meetings to discuss concerns',
            'Review recent organizational changes',
            'Implement morale-boosting initiatives'
          ]
        });
      }

      if (negativePercentage > 30) {
        generatedAlerts.push({
          id: 'warning-negative-trend',
          type: 'warning',
          title: 'High Negative Response Rate',
          description: `${negativePercentage.toFixed(1)}% of responses are negative, indicating significant employee concerns.`,
          priority: 'medium',
          category: 'trend',
          data: { negativePercentage, totalResponses: responses?.length || 0 },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: true,
          suggestedActions: [
            'Analyze negative response patterns',
            'Identify common themes in negative feedback',
            'Develop targeted improvement plans',
            'Increase communication frequency'
          ]
        });
      }

      // Info alerts
      if (completionRate > 90) {
        generatedAlerts.push({
          id: 'info-high-participation',
          type: 'info',
          title: 'Excellent Survey Participation',
          description: `${completionRate.toFixed(1)}% completion rate shows strong employee engagement with the feedback process.`,
          priority: 'low',
          category: 'participation',
          data: { completionRate },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: false,
          suggestedActions: [
            'Maintain current engagement strategies',
            'Consider increasing survey frequency',
            'Share positive participation metrics with leadership'
          ]
        });
      }

      if (avgSentiment > 80) {
        generatedAlerts.push({
          id: 'info-high-sentiment',
          type: 'info',
          title: 'Strong Employee Satisfaction',
          description: `Average sentiment of ${avgSentiment.toFixed(1)} indicates excellent employee satisfaction.`,
          priority: 'low',
          category: 'sentiment',
          data: { avgSentiment },
          createdAt: new Date(),
          acknowledged: false,
          resolved: false,
          actionRequired: false,
          suggestedActions: [
            'Document successful practices',
            'Share positive feedback with teams',
            'Consider expanding successful initiatives'
          ]
        });
      }

      return generatedAlerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    },
  });

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    // In a real implementation, this would update the database
    toast.success('Alert acknowledged');
    refetch();
  };

  const handleResolveAlert = async (alertId: string) => {
    // In a real implementation, this would update the database
    toast.success('Alert resolved');
    refetch();
  };

  const handleTakeAction = (alertId: string, action: string) => {
    if (onAlertAction) {
      onAlertAction(alertId, action);
    }
    toast.success(`Action taken: ${action}`);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Bell className="h-5 w-5 text-blue-600" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
    }
  };

  const getPriorityColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const filteredAlerts = alerts?.filter(alert => 
    !dismissedAlerts.has(alert.id) && 
    (selectedCategory === 'all' || alert.category === selectedCategory)
  ) || [];

  const criticalAlerts = filteredAlerts.filter(a => a.type === 'critical');
  const warningAlerts = filteredAlerts.filter(a => a.type === 'warning');
  const infoAlerts = filteredAlerts.filter(a => a.type === 'info');

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Loading Alert System</h3>
        <p className="text-muted-foreground">Analyzing data for potential issues...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{infoAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Info</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{filteredAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts
            <Badge variant="secondary" className="ml-2">
              {filteredAlerts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No active alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-lg">{alert.title}</h4>
                          <Badge variant="outline" className={getPriorityColor(alert.priority)}>
                            {alert.priority} priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {alert.actionRequired && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {alert.suggestedActions.map((action, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            onClick={() => handleTakeAction(alert.id, action)}
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alert.createdAt.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};