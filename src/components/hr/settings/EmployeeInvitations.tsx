import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Mail, Copy, CheckCircle, XCircle, Clock, UserPlus } from "lucide-react";
import { format } from "date-fns";

export const EmployeeInvitations = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ['employee-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (inviteData: { email: string; full_name?: string; department?: string }) => {
      const { data, error } = await supabase.functions.invoke('invite-employee', {
        body: inviteData,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employee-invitations'] });
      setEmail("");
      setFullName("");
      setDepartment("");
      
      // Copy invitation link to clipboard
      const inviteUrl = `${window.location.origin}/invite/${data.invitation_token}`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Invitation created and link copied to clipboard!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create invitation");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    inviteMutation.mutate({
      email,
      full_name: fullName || undefined,
      department: department || undefined,
    });
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invitation link copied!");
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (status === 'accepted') {
      return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Accepted</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
    }
    if (isExpired || status === 'expired') {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Expired</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" /> Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite New Employee
          </CardTitle>
          <CardDescription>
            Send an invitation link to add new employees to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="employee@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? "Creating Invitation..." : "Send Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation History</CardTitle>
          <CardDescription>
            Track and manage employee invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !invitations || invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invitations sent yet</p>
              <p className="text-sm mt-1">Create an invitation above to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>{invitation.full_name || '—'}</TableCell>
                    <TableCell>{invitation.department || '—'}</TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invitation.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {invitation.status === 'pending' && new Date(invitation.expires_at) > new Date() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.invitation_token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
