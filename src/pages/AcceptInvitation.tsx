import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch invitation details
  const { data: invitation, isLoading, error } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ email, password, fullName, department }: {
      email: string;
      password: string;
      fullName?: string;
      department?: string;
    }) => {
      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            department: department,
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Failed to create user');

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('employee_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('invitation_token', token);

      if (updateError) throw updateError;

      return authData;
    },
    onSuccess: () => {
      toast.success("Account created successfully! Redirecting to dashboard...");
      setTimeout(() => {
        navigate('/employee/dashboard');
      }, 1500);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    acceptMutation.mutate({
      email: invitation.email,
      password,
      fullName: invitation.full_name || undefined,
      department: invitation.department || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                This invitation link is invalid or has expired. Please contact your HR administrator for a new invitation.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAlreadyAccepted = invitation.status === 'accepted';

  if (isExpired || isAlreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {isAlreadyAccepted ? 'Invitation Already Used' : 'Invitation Expired'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {isAlreadyAccepted
                  ? 'This invitation has already been accepted. Please sign in with your credentials.'
                  : 'This invitation has expired. Please contact your HR administrator for a new invitation.'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/auth')} className="w-full mt-4">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Complete Your Registration
          </CardTitle>
          <CardDescription>
            You've been invited to join the organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={invitation.email}
                disabled
                className="bg-muted"
              />
            </div>

            {invitation.full_name && (
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={invitation.full_name}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            {invitation.department && (
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={invitation.department}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Create Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                "Creating Account..."
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Create Account & Join
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitation;
