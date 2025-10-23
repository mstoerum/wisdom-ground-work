import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, Trash2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const DataRetention = () => {
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const queryClient = useQueryClient();

  const { data: retentionLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["retention-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_retention_log")
        .select("*, surveys(title), profiles(full_name)")
        .order("deleted_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const { data: surveys } = useQuery({
    queryKey: ["surveys-retention-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surveys")
        .select("id, title, status, consent_config, created_at")
        .in("status", ["active", "completed"]);

      if (error) throw error;
      return data;
    },
  });

  const triggerCleanup = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("data-retention-cleanup");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Cleanup complete! Deleted ${data.totalDeleted} old responses.`);
      queryClient.invalidateQueries({ queryKey: ["retention-logs"] });
      setConfirmCleanup(false);
    },
    onError: (error) => {
      toast.error(`Cleanup failed: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention Policies
              </CardTitle>
              <CardDescription>Manage automated data cleanup and retention</CardDescription>
            </div>
            <Button onClick={() => setConfirmCleanup(true)} variant="outline" disabled={triggerCleanup.isPending}>
              <Trash2 className="h-4 w-4 mr-2" />
              Run Cleanup Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {surveys && surveys.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retention Period</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => {
                    const retentionDays = (survey.consent_config as any)?.dataRetentionDays || 60;
                    return (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium">{survey.title}</TableCell>
                        <TableCell>
                          <Badge variant={survey.status === "active" ? "default" : "secondary"}>
                            {survey.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{retentionDays} days</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(survey.created_at), "MMM dd, yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No active surveys</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deletion History</CardTitle>
          <CardDescription>Recent automated data cleanup operations</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading deletion history...</div>
          ) : !retentionLogs || retentionLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No deletion history yet</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Survey</TableHead>
                    <TableHead>Records Deleted</TableHead>
                    <TableHead>Retention Policy</TableHead>
                    <TableHead>Executed By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.deleted_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{(log.surveys as any)?.title || "Deleted Survey"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.records_deleted_count} responses</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.retention_policy_days} days</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.execution_type === "automatic" ? "Automatic" : (log.profiles as any)?.full_name || "Manual"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmCleanup} onOpenChange={setConfirmCleanup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Data Cleanup
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all responses older than their respective retention periods.
              This action cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => triggerCleanup.mutate()} className="bg-destructive text-destructive-foreground">
              Yes, Delete Old Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
