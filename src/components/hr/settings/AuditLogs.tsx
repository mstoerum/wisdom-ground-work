import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search, Shield } from "lucide-react";
import { format } from "date-fns";

export const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", searchTerm, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*, profiles(full_name, email)")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (actionFilter !== "all") {
        query = query.eq("action_type", actionFilter);
      }

      if (searchTerm) {
        query = query.or(`action_type.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const exportToCSV = () => {
    if (!logs) return;

    const csvContent = [
      ["Timestamp", "User", "Action", "Resource Type", "Resource ID", "IP Address"],
      ...logs.map((log) => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        (log.profiles as any)?.email || "System",
        log.action_type,
        log.resource_type || "-",
        log.resource_id || "-",
        log.ip_address || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getActionBadge = (action: string) => {
    if (action.includes("login")) return <Badge variant="default">Auth</Badge>;
    if (action.includes("survey")) return <Badge variant="secondary">Survey</Badge>;
    if (action.includes("analytics")) return <Badge>Analytics</Badge>;
    if (action.includes("role")) return <Badge variant="destructive">Admin</Badge>;
    return <Badge variant="outline">System</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>Track all sensitive actions and data access</CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline" size="sm" disabled={!logs || logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="user_login">User Login</SelectItem>
              <SelectItem value="survey_deployed">Survey Deployed</SelectItem>
              <SelectItem value="analytics_viewed">Analytics Viewed</SelectItem>
              <SelectItem value="user_role_changed">Role Changed</SelectItem>
              <SelectItem value="consent_revoked">Consent Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>{(log.profiles as any)?.email || "System"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action_type)}
                        <span className="text-sm">{log.action_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.resource_type && (
                        <span className="text-muted-foreground">
                          {log.resource_type}
                          {log.resource_id && <span className="ml-1 font-mono text-xs">({log.resource_id.slice(0, 8)}...)</span>}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.ip_address || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
