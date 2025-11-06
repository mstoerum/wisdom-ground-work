import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ExportLog {
  id: string;
  user_id: string;
  export_type: string;
  timestamp: string;
  filters_applied: any;
  record_count: number;
  user_email?: string;
}

export function ExportAuditLog() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['export-audit-logs'],
    queryFn: async () => {
      // This would query a real export_logs table
      // For now, returning mock data
      const mockLogs: ExportLog[] = [
        {
          id: '1',
          user_id: 'user1',
          export_type: 'CSV',
          timestamp: new Date().toISOString(),
          filters_applied: { surveyId: 'all', department: 'Engineering' },
          record_count: 45,
          user_email: 'admin@company.com'
        }
      ];
      return mockLogs;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading audit logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs && logs.length > 0 ? (
            logs.map((log) => (
              <div 
                key={log.id}
                className="p-4 rounded-lg border bg-muted/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{log.export_type}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {log.record_count} records
                  </span>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3 w-3" />
                    {log.user_email || 'Unknown user'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>

                {log.filters_applied && Object.keys(log.filters_applied).length > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                    Filters: {JSON.stringify(log.filters_applied)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No export history available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
