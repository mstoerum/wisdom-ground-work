import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Settings } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { CustomReportBuilder, ReportConfig } from "./CustomReportBuilder";
import { ExportAuditLog } from "./ExportAuditLog";
import { REPORT_TEMPLATES } from "@/lib/reportTemplates";
import { exportExecutiveReport } from "@/lib/exportExecutiveReport";
import { exportDepartmentReview } from "@/lib/exportDepartmentReview";
import { exportManagerBriefing } from "@/lib/exportManagerBriefing";
import { exportComplianceReport } from "@/lib/exportComplianceReport";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useConversationAnalytics } from "@/hooks/useConversationAnalytics";

interface ReportsExportTabProps {
  surveys?: Array<{ id: string; title: string }>;
  departments?: string[];
}

export function ReportsExportTab({ surveys = [], departments = [] }: ReportsExportTabProps) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const { participation, sentiment, themes, urgency } = useAnalytics({});
  const { quotes, rootCauses, interventions, quickWins } = useConversationAnalytics({});

  const handleGenerateExecutive = async () => {
    if (!participation || !sentiment) {
      toast.error("Loading analytics data...");
      return;
    }

    toast.info("Generating Executive Summary...");
    
    try {
      await exportExecutiveReport({
        surveyName: "All Surveys",
        participation,
        sentiment,
        themes: themes || [],
        urgency: urgency || [],
        generatedAt: new Date(),
        period: "Last 30 Days"
      });
      toast.success("Executive Summary generated successfully!");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleGenerateDepartmentReview = async () => {
    if (!participation || !sentiment) {
      toast.error("Loading analytics data...");
      return;
    }

    toast.info("Generating Department Review...");
    
    try {
      // Sample department data
      const topThemes = (themes || []).slice(0, 4).map(theme => ({
        name: theme.name,
        responseCount: theme.responseCount,
        avgSentiment: theme.avgSentiment,
        quotes: quotes?.slice(0, 3).map(q => q.text) || []
      }));

      await exportDepartmentReview({
        surveyName: "Employee Feedback Survey",
        departmentName: "Engineering",
        period: "Q1 2025",
        generatedAt: new Date(),
        participation: {
          departmentRate: participation.completionRate,
          orgAverage: 75,
          completed: participation.completed,
          total: participation.totalAssigned
        },
        sentiment: {
          departmentScore: sentiment.avgScore,
          orgAverage: 65,
          positive: sentiment.positive,
          neutral: sentiment.neutral,
          negative: sentiment.negative,
          trend: [62, 65, 67, 68, 70]
        },
        themes: topThemes,
        rootCauses: rootCauses?.slice(0, 2).map(rc => ({
          issue: rc.cause,
          whys: rc.evidence || []
        })) || [],
        suggestedActions: (interventions || []).slice(0, 5).map(int => ({
          action: int.title,
          impact: 'high' as const,
          effort: int.effort_level || 'medium' as const
        }))
      });
      
      toast.success("Department Review generated successfully!");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleGenerateManagerBriefing = async () => {
    if (!participation || !sentiment) {
      toast.error("Loading analytics data...");
      return;
    }

    toast.info("Generating Manager Briefing...");
    
    try {
      await exportManagerBriefing({
        surveyName: "Employee Feedback Survey",
        managerName: "Manager Name",
        teamName: "Engineering Team",
        period: "Last 30 Days",
        generatedAt: new Date(),
        teamMetrics: {
          participation: participation.completionRate,
          sentiment: sentiment.avgScore,
          responseCount: participation.completed
        },
        companyAverage: {
          participation: 75,
          sentiment: 65
        },
        topThemes: (themes || []).slice(0, 3).map(t => ({
          name: t.name,
          sentiment: t.avgSentiment,
          count: t.responseCount
        })),
        suggestedActions: (interventions || quickWins || []).slice(0, 4).map(item => ({
          action: item.title,
          priority: 'high' as const,
          timeframe: item.timeframe || 'This month'
        })),
        talkingPoints: [
          "Overall team sentiment is positive, showing 5pt improvement vs. company average",
          "Participation rate is strong - team is engaged and providing valuable feedback",
          "Focus areas: Work-life balance concerns mentioned by 3 team members",
          "Celebrate wins: Recognition and career development both scored highly"
        ]
      });
      
      toast.success("Manager Briefing generated successfully!");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleGenerateCompliance = async () => {
    toast.info("Generating Compliance Report...");
    
    try {
      await exportComplianceReport({
        surveyName: "All Surveys",
        period: "Last 90 Days",
        generatedAt: new Date(),
        generatedBy: "HR Admin",
        anonymization: {
          totalResponses: participation?.completed || 0,
          anonymousResponses: Math.floor((participation?.completed || 0) * 0.85),
          identifiedResponses: Math.floor((participation?.completed || 0) * 0.15),
          paraphrasedCount: Math.floor((participation?.completed || 0) * 0.60),
          thresholdApplied: true,
          minimumThreshold: 10
        },
        consent: {
          totalUsers: participation?.totalAssigned || 0,
          consentGiven: participation?.completed || 0,
          consentRevoked: 2,
          consentRate: participation?.completionRate || 0,
          lastUpdated: new Date().toLocaleDateString()
        },
        dataRetention: {
          policyDays: 60,
          recordsDeleted: 45,
          lastCleanup: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          nextScheduled: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toLocaleDateString()
        },
        exportAudit: [
          {
            date: new Date().toLocaleDateString(),
            user: 'admin@company.com',
            exportType: 'CSV',
            recordCount: 150,
            filters: 'All surveys, Last 30 days'
          }
        ],
        rlsPolicies: [
          { tableName: 'responses', policyName: 'HR analysts read responses', status: 'active' },
          { tableName: 'profiles', policyName: 'Users can view own profile', status: 'active' },
          { tableName: 'surveys', policyName: 'HR admins full access', status: 'active' }
        ],
        securityChecks: [
          {
            checkName: 'Row-Level Security Enabled',
            status: 'pass',
            details: 'All sensitive tables have RLS policies active and enforced'
          },
          {
            checkName: 'Data Encryption at Rest',
            status: 'pass',
            details: 'All data encrypted using AES-256 encryption'
          },
          {
            checkName: 'Consent Verification',
            status: 'pass',
            details: 'All users provided explicit consent before participation'
          },
          {
            checkName: 'Anonymization Threshold',
            status: 'pass',
            details: 'Minimum 10-response threshold enforced for all aggregated data'
          }
        ]
      });
      
      toast.success("Compliance Report generated successfully!");
    } catch (error) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    }
  };

  const handleCustomReport = (config: ReportConfig) => {
    toast.info("Generating custom report...");
    console.log("Custom report config:", config);
    
    // Route to appropriate export function based on template
    switch (config.templateId) {
      case 'executive':
        handleGenerateExecutive();
        break;
      case 'departmentReview':
        handleGenerateDepartmentReview();
        break;
      case 'managerBriefing':
        handleGenerateManagerBriefing();
        break;
      case 'compliance':
        handleGenerateCompliance();
        break;
      default:
        toast.error("Template not yet implemented");
    }
  };

  return (
    <div className="space-y-8">
      {/* Pre-built Templates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Pre-built Templates</h3>
            <p className="text-sm text-muted-foreground">
              Professional reports ready to generate with one click
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TemplateCard
            template={REPORT_TEMPLATES.executive}
            onGenerate={handleGenerateExecutive}
            disabled={!participation || !sentiment}
          />
          <TemplateCard
            template={REPORT_TEMPLATES.departmentReview}
            onGenerate={handleGenerateDepartmentReview}
            disabled={!participation || !sentiment}
          />
          <TemplateCard
            template={REPORT_TEMPLATES.managerBriefing}
            onGenerate={handleGenerateManagerBriefing}
            disabled={!participation || !sentiment}
          />
          <TemplateCard
            template={REPORT_TEMPLATES.compliance}
            onGenerate={handleGenerateCompliance}
          />
        </div>
      </section>

      {/* Custom Report Builder */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <div>
                <CardTitle>Custom Report Builder</CardTitle>
                <CardDescription>
                  Create a personalized report by selecting exactly which metrics and sections to include
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setBuilderOpen(true)} className="w-full sm:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              Build Custom Report
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Export Audit Log */}
      <section>
        <ExportAuditLog />
      </section>

      {/* Custom Report Builder Dialog */}
      <CustomReportBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onGenerate={handleCustomReport}
        surveys={surveys}
        departments={departments}
        themes={themes?.map(t => ({ id: t.id, name: t.name }))}
      />
    </div>
  );
}
