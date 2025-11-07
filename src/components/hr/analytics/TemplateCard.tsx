import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, TrendingUp, Shield, PlusCircle } from "lucide-react";
import { ReportTemplate } from "@/lib/reportTemplates";

interface TemplateCardProps {
  template: ReportTemplate;
  onGenerate: () => void;
  disabled?: boolean;
}

const iconMap = {
  FileText,
  Users,
  TrendingUp,
  Shield,
  PlusCircle
};

export function TemplateCard({ template, onGenerate, disabled }: TemplateCardProps) {
  const IconComponent = iconMap[template.icon as keyof typeof iconMap] || FileText;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{template.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {template.audience}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 min-h-[60px]">
          {template.description}
        </CardDescription>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>{template.pageCount > 0 ? `${template.pageCount} pages` : 'Custom length'}</span>
          <div className="flex gap-2">
            {template.includesCharts && <Badge variant="secondary" className="text-xs">Charts</Badge>}
            {template.includesQuotes && <Badge variant="secondary" className="text-xs">Quotes</Badge>}
            {template.interactive && <Badge variant="secondary" className="text-xs">Interactive</Badge>}
          </div>
        </div>
        
        <Button 
          onClick={onGenerate} 
          className="w-full"
          disabled={disabled}
        >
          Generate Report
        </Button>
      </CardContent>
    </Card>
  );
}
