import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Search, UserX, UserCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('employee');
  const [actionType, setActionType] = useState<'add' | 'remove' | 'deactivate' | 'activate'>('add');
  const [searchTerm, setSearchTerm] = useState("");

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
    mutationFn: async ({ userId, role, action }: { userId: string; role?: AppRole; action: 'add' | 'remove' | 'deactivate' | 'activate' }) => {
      if (action === 'add' && role) {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
        
        // Log audit event
        await supabase.rpc('log_audit_event', {
          _action_type: 'role_assigned',
          _resource_type: 'user_role',
          _resource_id: userId,
          _metadata: { role }
        });
      } else if (action === 'remove' && role) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
        
        // Log audit event
        await supabase.rpc('log_audit_event', {
          _action_type: 'role_removed',
          _resource_type: 'user_role',
          _resource_id: userId,
          _metadata: { role }
        });
      } else if (action === 'deactivate') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', userId);
        if (error) throw error;
        
        // Log audit event
        await supabase.rpc('log_audit_event', {
          _action_type: 'user_deactivated',
          _resource_type: 'profile',
          _resource_id: userId
        });
      } else if (action === 'activate') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: true })
          .eq('id', userId);
        if (error) throw error;
        
        // Log audit event
        await supabase.rpc('log_audit_event', {
          _action_type: 'user_activated',
          _resource_type: 'profile',
          _resource_id: userId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      const messages = {
        add: 'Role added successfully',
        remove: 'Role removed successfully',
        deactivate: 'User deactivated successfully',
        activate: 'User activated successfully'
      };
      toast({
        title: "Success",
        description: messages[actionType],
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

  const handleRoleAction = (user: any, role: AppRole | undefined, action: 'add' | 'remove' | 'deactivate' | 'activate') => {
    setSelectedUser({ id: user.id, name: user.full_name || user.email });
    if (role) setSelectedRole(role);
    setActionType(action);
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    );
  });

  const confirmRoleChange = () => {
    if (selectedUser) {
      roleChangeMutation.mutate({
        userId: selectedUser.id,
        role: actionType === 'add' || actionType === 'remove' ? selectedRole : undefined,
        action: actionType,
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch(role) {
      case 'hr_admin': return 'destructive';
      case 'hr_analyst': return 'default';
      default: return 'secondary';
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
          Manage user roles and permissions. HR Admins can add or remove roles and deactivate users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className={!user.is_active ? "opacity-50" : ""}>
                <TableCell>{user.full_name || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.department || "-"}</TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "default" : "outline"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {user.roles.length === 0 ? (
                      <Badge variant="outline">employee</Badge>
                    ) : (
                      user.roles.map((role: string) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role)}>
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
                    {user.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleAction(user, undefined, 'deactivate')}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleAction(user, undefined, 'activate')}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
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
              {actionType === 'add' && 'Add Role'}
              {actionType === 'remove' && 'Remove Role'}
              {actionType === 'deactivate' && 'Deactivate User'}
              {actionType === 'activate' && 'Activate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(actionType === 'add' || actionType === 'remove') && (
                <>Are you sure you want to {actionType} the role "{selectedRole.replace('_', ' ')}" 
                {actionType === 'add' ? ' to ' : ' from '} 
                {selectedUser?.name}?</>
              )}
              {actionType === 'deactivate' && (
                <>Are you sure you want to deactivate {selectedUser?.name}? They will no longer be able to log in.</>
              )}
              {actionType === 'activate' && (
                <>Are you sure you want to activate {selectedUser?.name}? They will be able to log in again.</>
              )}
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
