import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Database, CheckCircle } from "lucide-react";

export const SecuritySettings = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "Row-Level Security (RLS)",
      description: "All database tables are protected with RLS policies",
      status: "enabled",
      details: "Employees can only access their own data. HR admins have controlled access to analytics.",
    },
    {
      icon: Lock,
      title: "Data Encryption",
      description: "All data encrypted at rest and in transit",
      status: "enabled",
      details: "AES-256 encryption at rest, TLS 1.3 for data in transit.",
    },
    {
      icon: Eye,
      title: "Anonymization Controls",
      description: "Configurable anonymization levels per survey",
      status: "enabled",
      details: "Supports anonymous, partial, and identified response modes.",
    },
    {
      icon: Database,
      title: "Automated Data Retention",
      description: "Automatic deletion of old responses",
      status: "enabled",
      details: "Responses automatically deleted based on configured retention periods.",
    },
  ];

  const rlsPolicies = [
    { table: "responses", policy: "HR admins and analysts only", risk: "low" },
    { table: "conversation_sessions", policy: "Users own data + HR access", risk: "low" },
    { table: "audit_logs", policy: "HR admins only", risk: "low" },
    { table: "consent_history", policy: "Users own data + HR access", risk: "low" },
    { table: "surveys", policy: "HR manage, employees view assigned", risk: "low" },
    { table: "user_roles", policy: "Users own roles + HR manage", risk: "low" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Features
          </CardTitle>
          <CardDescription>Active security controls protecting your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{feature.title}</h4>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                  <p className="text-xs text-muted-foreground">{feature.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Row-Level Security Policies</CardTitle>
          <CardDescription>Access control policies protecting sensitive tables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rlsPolicies.map((policy) => (
              <div key={policy.table} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium font-mono text-sm">{policy.table}</p>
                  <p className="text-xs text-muted-foreground">{policy.policy}</p>
                </div>
                <Badge variant={policy.risk === "low" ? "default" : "destructive"}>
                  {policy.risk === "low" ? "Secured" : "At Risk"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm">Security Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>All authentication handled securely via Lovable Cloud backend</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Employee responses protected from direct database access</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Audit logs track all sensitive operations for compliance</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Data retention policies ensure GDPR compliance</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
