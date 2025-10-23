import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shield, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const ConsentHistory = () => {
  const [revokeConsentId, setRevokeConsentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: consents, isLoading } = useQuery({
    queryKey: ["consent-history"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("consent_history")
        .select("*, surveys(title, status)")
        .eq("user_id", user.id)
        .order("consent_given_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const revokeConsent = useMutation({
    mutationFn: async (consentId: string) => {
      const consent = consents?.find((c) => c.id === consentId);
      if (!consent) throw new Error("Consent not found");

      // Mark consent as revoked
      const { error: updateError } = await supabase
        .from("consent_history")
        .update({ consent_revoked_at: new Date().toISOString() })
        .eq("id", consentId);

      if (updateError) throw updateError;

      // Delete user's responses for this survey
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: sessions } = await supabase
        .from("conversation_sessions")
        .select("id")
        .eq("employee_id", user.id)
        .eq("survey_id", consent.survey_id);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);

        // Delete responses
        await supabase.from("responses").delete().in("conversation_session_id", sessionIds);

        // Delete sessions
        await supabase.from("conversation_sessions").delete().in("id", sessionIds);
      }

      return consentId;
    },
    onSuccess: () => {
      toast.success("Consent revoked and data deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["consent-history"] });
      setRevokeConsentId(null);
    },
    onError: (error) => {
      toast.error(`Failed to revoke consent: ${error.message}`);
    },
  });

  const getStatusBadge = (consent: any) => {
    if (consent.consent_revoked_at) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Revoked
        </Badge>
      );
    }

    const survey = consent.surveys as any;
    if (survey?.status === "completed" || survey?.status === "archived") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Completed
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  };

  const getAnonymizationBadge = (level: string) => {
    const variants = {
      anonymous: "default",
      partial: "secondary",
      identified: "outline",
    } as const;

    return <Badge variant={variants[level as keyof typeof variants] || "outline"}>{level}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Consent History
          </CardTitle>
          <CardDescription>View and manage your survey participation consent</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading your consent history...</div>
          ) : !consents || consents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No consent records found. You haven't participated in any surveys yet.
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Survey</TableHead>
                    <TableHead>Consent Given</TableHead>
                    <TableHead>Anonymization</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consents.map((consent) => (
                    <TableRow key={consent.id}>
                      <TableCell className="font-medium">{(consent.surveys as any)?.title || "Unknown Survey"}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(consent.consent_given_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{getAnonymizationBadge(consent.anonymization_level)}</TableCell>
                      <TableCell className="text-sm">{consent.data_retention_days} days</TableCell>
                      <TableCell>{getStatusBadge(consent)}</TableCell>
                      <TableCell>
                        {!consent.consent_revoked_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokeConsentId(consent.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Your Rights:</p>
            <ul className="space-y-1">
              <li>• You can revoke consent at any time, and all your responses will be permanently deleted</li>
              <li>• Your data is automatically deleted after the retention period expires</li>
              <li>• Anonymized responses cannot be traced back to you</li>
              <li>• You control what information you share in surveys</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={revokeConsentId !== null} onOpenChange={() => setRevokeConsentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke Consent & Delete Data
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your responses for this survey. This action cannot be undone.
              Are you sure you want to revoke your consent and delete your data?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeConsentId && revokeConsent.mutate(revokeConsentId)}
              className="bg-destructive text-destructive-foreground"
            >
              Yes, Revoke & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
