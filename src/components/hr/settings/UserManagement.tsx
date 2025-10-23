import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { UserPlus, UserMinus } from "lucide-react";

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [confirmDialog, setConfirmDialog] = useState<{ userId: string; role: 'employee' | 'hr_admin' | 'hr_analyst'; action: 'add' | 'remove' } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id);

          return {
            ...profile,
            roles: roles?.map(r => r.role) || [],
          };
        })
      );

      return usersWithRoles;
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: 'employee' | 'hr_admin' | 'hr_analyst'; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: role as any });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, { action, role }) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: "Role updated",
        description: `Successfully ${action === 'add' ? 'added' : 'removed'} ${role.replace('_', ' ')} role`,
      });
      setConfirmDialog(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (userId: string, role: 'employee' | 'hr_admin' | 'hr_analyst', action: 'add' | 'remove') => {
    setConfirmDialog({ userId, role, action });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline">employee</Badge>
                      ) : (
                        user.roles.map((role: string) => (
                          <Badge key={role} variant="secondary">
                            {role.replace('_', ' ')}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(role) => handleRoleChange(user.id, role as 'employee' | 'hr_admin' | 'hr_analyst', 'add')}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Add role" />
                        </SelectTrigger>
                        <SelectContent>
                          {(['employee', 'hr_admin', 'hr_analyst'] as const)
                            .filter(role => !user.roles.includes(role))
                            .map(role => (
                              <SelectItem key={role} value={role}>
                                {role.replace('_', ' ')}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {user.roles.length > 0 && (
                        <Select
                          onValueChange={(role) => handleRoleChange(user.id, role as 'employee' | 'hr_admin' | 'hr_analyst', 'remove')}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Remove role" />
                          </SelectTrigger>
                          <SelectContent>
                            {user.roles.map((role: string) => (
                              <SelectItem key={role} value={role}>
                                {role.replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog?.action} the role{' '}
              <strong>{confirmDialog?.role.replace('_', ' ')}</strong>?
              This will immediately affect the user's permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  changeRoleMutation.mutate(confirmDialog);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
