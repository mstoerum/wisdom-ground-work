import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileImage } from "lucide-react";
import { REPORT_TEMPLATES, AVAILABLE_METRICS, CHART_STYLES } from "@/lib/reportTemplates";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CustomReportBuilderProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: ReportConfig) => void;
  surveys?: Array<{ id: string; title: string }>;
  departments?: string[];
  themes?: Array<{ id: string; name: string }>;
}

export interface ReportConfig {
  templateId: string;
  surveyId: string;
  startDate?: Date;
  endDate?: Date;
  department?: string;
  themeFilter?: string;
  metrics: string[];
  chartStyle: string;
  includeCharts: boolean;
  confidentialityLevel: 'public' | 'internal' | 'confidential';
}

export function CustomReportBuilder({
  open,
  onClose,
  onGenerate,
  surveys = [],
  departments = [],
  themes = []
}: CustomReportBuilderProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Partial<ReportConfig>>({
    templateId: 'executive',
    metrics: [],
    chartStyle: 'professional',
    includeCharts: true,
    confidentialityLevel: 'internal'
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = () => {
    onGenerate(config as ReportConfig);
    onClose();
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return !!config.templateId;
      case 2:
        return !!config.surveyId;
      case 3:
        return config.metrics && config.metrics.length > 0;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const selectedTemplate = config.templateId ? REPORT_TEMPLATES[config.templateId] : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Report Builder</DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}: {
              step === 1 ? 'Choose Template' :
              step === 2 ? 'Select Data Scope' :
              step === 3 ? 'Choose Metrics' :
              step === 4 ? 'Customize Visuals' :
              'Preview & Export'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                i < step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Choose Template */}
        {step === 1 && (
          <div className="space-y-4">
            <RadioGroup
              value={config.templateId}
              onValueChange={(value) => setConfig({ ...config, templateId: value })}
            >
              {Object.values(REPORT_TEMPLATES).map((template) => (
                <div
                  key={template.id}
                  className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setConfig({ ...config, templateId: template.id })}
                >
                  <RadioGroupItem value={template.id} id={template.id} />
                  <div className="flex-1">
                    <Label htmlFor={template.id} className="cursor-pointer font-medium">
                      {template.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{template.audience}</Badge>
                      {template.pageCount > 0 && (
                        <Badge variant="secondary">{template.pageCount} pages</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Select Data Scope */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Survey</Label>
              <Select
                value={config.surveyId}
                onValueChange={(value) => setConfig({ ...config, surveyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select survey" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Surveys</SelectItem>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.startDate ? format(config.startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.startDate}
                      onSelect={(date) => setConfig({ ...config, startDate: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {config.endDate ? format(config.endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={config.endDate}
                      onSelect={(date) => setConfig({ ...config, endDate: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {departments.length > 0 && (
              <div className="space-y-2">
                <Label>Department (Optional)</Label>
                <Select
                  value={config.department}
                  onValueChange={(value) => setConfig({ ...config, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {themes.length > 0 && (
              <div className="space-y-2">
                <Label>Theme Filter (Optional)</Label>
                <Select
                  value={config.themeFilter}
                  onValueChange={(value) => setConfig({ ...config, themeFilter: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All themes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Themes</SelectItem>
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Choose Metrics */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which metrics to include in your report:
            </p>
            
            {['participation', 'sentiment', 'themes', 'actions', 'compliance'].map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium capitalize">{category}</h4>
                <div className="space-y-2 pl-4">
                  {AVAILABLE_METRICS.filter(m => m.category === category).map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.id}
                        checked={config.metrics?.includes(metric.id)}
                        onCheckedChange={(checked) => {
                          const newMetrics = checked
                            ? [...(config.metrics || []), metric.id]
                            : config.metrics?.filter(m => m !== metric.id) || [];
                          setConfig({ ...config, metrics: newMetrics });
                        }}
                      />
                      <Label htmlFor={metric.id} className="cursor-pointer">
                        {metric.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          {metric.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Customize Visuals */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Chart Style</Label>
              <RadioGroup
                value={config.chartStyle}
                onValueChange={(value) => setConfig({ ...config, chartStyle: value })}
              >
                {CHART_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setConfig({ ...config, chartStyle: style.id })}
                  >
                    <RadioGroupItem value={style.id} id={`style-${style.id}`} />
                    <div className="flex-1">
                      <Label htmlFor={`style-${style.id}`} className="cursor-pointer font-medium">
                        {style.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                      <div className="flex gap-1 mt-2">
                        {style.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Confidentiality Level</Label>
              <Select
                value={config.confidentialityLevel}
                onValueChange={(value: any) => setConfig({ ...config, confidentialityLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="internal">Internal Only</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={config.includeCharts}
                onCheckedChange={(checked) => setConfig({ ...config, includeCharts: !!checked })}
              />
              <Label htmlFor="include-charts">Include charts and visualizations</Label>
            </div>
          </div>
        )}

        {/* Step 5: Preview & Export */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Report Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template:</span>
                  <span className="font-medium">{selectedTemplate?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metrics:</span>
                  <span className="font-medium">{config.metrics?.length || 0} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chart Style:</span>
                  <span className="font-medium capitalize">{config.chartStyle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidentiality:</span>
                  <Badge variant="outline" className="capitalize">
                    {config.confidentialityLevel}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 min-h-[200px]">
              <FileImage className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Report preview will appear here</p>
              <p className="text-xs text-muted-foreground">
                Estimated pages: {selectedTemplate?.pageCount || 'Custom'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!isStepValid()}>
              Generate Report
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
