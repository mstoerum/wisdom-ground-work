import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, AlertTriangle, CheckCircle, Users, Lock } from "lucide-react";

export const ComplianceGuide = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GDPR & Compliance Guide
          </CardTitle>
          <CardDescription>
            Spradley is designed to help you comply with GDPR and other data protection regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="gdpr-checklist">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  GDPR Compliance Checklist
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="mt-1">✓</Badge>
                    <div>
                      <p className="font-medium text-sm">Lawful Basis for Processing</p>
                      <p className="text-sm text-muted-foreground">
                        Employee feedback is processed based on explicit consent (Art. 6(1)(a)) or legitimate interest (Art. 6(1)(f))
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="mt-1">✓</Badge>
                    <div>
                      <p className="font-medium text-sm">Data Minimization (Art. 5(1)(c))</p>
                      <p className="text-sm text-muted-foreground">
                        Only necessary feedback data is collected. No unnecessary personal information is gathered.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="mt-1">✓</Badge>
                    <div>
                      <p className="font-medium text-sm">Storage Limitation (Art. 5(1)(e))</p>
                      <p className="text-sm text-muted-foreground">
                        Automated data retention policies ensure data is not kept longer than necessary
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="mt-1">✓</Badge>
                    <div>
                      <p className="font-medium text-sm">Security (Art. 32)</p>
                      <p className="text-sm text-muted-foreground">
                        End-to-end encryption, RLS policies, and access controls protect data
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="default" className="mt-1">✓</Badge>
                    <div>
                      <p className="font-medium text-sm">Right to Erasure (Art. 17)</p>
                      <p className="text-sm text-muted-foreground">
                        Employees can revoke consent and request deletion of their data at any time
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="employee-rights">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Employee Rights Under GDPR
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <div className="border-l-2 border-primary pl-4 space-y-2">
                    <div>
                      <p className="font-semibold text-sm">Right to Access (Art. 15)</p>
                      <p className="text-sm text-muted-foreground">
                        Employees can view their consent history and anonymization settings in their dashboard
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Right to Rectification (Art. 16)</p>
                      <p className="text-sm text-muted-foreground">
                        Employees can update their profile information at any time
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Right to Erasure (Art. 17)</p>
                      <p className="text-sm text-muted-foreground">
                        Employees can revoke consent and have their survey responses permanently deleted
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Right to Data Portability (Art. 20)</p>
                      <p className="text-sm text-muted-foreground">
                        Contact HR to request an export of your personal data in a structured format
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Right to Object (Art. 21)</p>
                      <p className="text-sm text-muted-foreground">
                        All survey participation is voluntary; employees can decline at any time
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="breach-response">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Data Breach Response Procedure
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">If you suspect a data breach:</p>
                  <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li><strong>Immediate containment:</strong> Disable affected accounts, revoke access tokens</li>
                    <li><strong>Assessment:</strong> Use audit logs to determine scope and affected data</li>
                    <li><strong>Notification (within 72 hours):</strong> Notify supervisory authority if high risk to rights</li>
                    <li><strong>Employee notification:</strong> Inform affected employees without undue delay</li>
                    <li><strong>Documentation:</strong> Record the breach in audit logs with full details</li>
                    <li><strong>Review & prevention:</strong> Analyze root cause and implement preventive measures</li>
                  </ol>
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold text-destructive">Emergency Contact</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      For immediate assistance with a suspected breach, contact your organization's Data Protection Officer (DPO)
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-processing">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Data Processing Agreement
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Spradley processes employee feedback data as a data controller for your organization. Key points:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm"><strong>Purpose:</strong> Collecting employee feedback to improve workplace conditions</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm"><strong>Data Categories:</strong> Survey responses, sentiment data, timestamps, optional demographics</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm"><strong>Data Subjects:</strong> Employees of the organization</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm"><strong>Retention:</strong> Configurable (default 60 days), with automated deletion</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm"><strong>Security:</strong> AES-256 encryption at rest, TLS 1.3 in transit, RLS policies</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm"><strong>Sub-processors:</strong> Lovable Cloud (hosting), AI providers (sentiment analysis)</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="transparency">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Transparency & Communication
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-medium">How to maintain transparency with employees:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Provide clear privacy notices before surveys explaining data use</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Share aggregated insights without revealing individual responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Use the "Share Update" feature to communicate actions taken based on feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Make this compliance guide available to all employees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">✓</span>
                      <span>Respond promptly to data subject access requests</span>
                    </li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm">Additional Resources</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <a href="https://gdpr-info.eu/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Official GDPR Text</a></p>
          <p>• <a href="https://ico.org.uk/for-organisations/guide-to-data-protection/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ICO Guide to Data Protection</a></p>
          <p>• <a href="https://ec.europa.eu/info/law/law-topic/data-protection_en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">European Commission - Data Protection</a></p>
        </CardContent>
      </Card>
    </div>
  );
};
