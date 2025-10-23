import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('employee');
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');

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

  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: AppRole; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: "Success",
        description: `Role ${actionType === 'add' ? 'added' : 'removed'} successfully`,
      });
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleAction = (user: any, role: AppRole, action: 'add' | 'remove') => {
    setSelectedUser({ id: user.id, name: user.full_name || user.email });
    setSelectedRole(role);
    setActionType(action);
  };

  const confirmRoleChange = () => {
    if (selectedUser) {
      roleChangeMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
        action: actionType,
      });
    }
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
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          Manage user roles and permissions. HR Admins can add or remove roles.
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
              <TableHead className="text-right">Actions</TableHead>
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
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Select onValueChange={(role) => handleRoleAction(user, role as AppRole, 'add')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Add role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr_admin">HR Admin</SelectItem>
                        <SelectItem value="hr_analyst">HR Analyst</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    {user.roles.length > 0 && (
                      <Select onValueChange={(role) => handleRoleAction(user, role as AppRole, 'remove')}>
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

      <AlertDialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'add' ? 'Add' : 'Remove'} Role
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} the role "{selectedRole.replace('_', ' ')}" 
              {actionType === 'add' ? ' to ' : ' from '} 
              {selectedUser?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
