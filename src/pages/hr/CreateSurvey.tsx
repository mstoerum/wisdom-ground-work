import { HRLayout } from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SurveyFormData, surveyFormSchema, getDefaultSurveyValues } from "@/lib/surveySchema";
import { useSurveyDefaults } from "@/hooks/useSurveyDefaults";
import { WizardProgress } from "@/components/hr/wizard/WizardProgress";
import { WizardNavigation } from "@/components/hr/wizard/WizardNavigation";
import { SurveyDetails } from "@/components/hr/wizard/SurveyDetails";
import { ThemeSelector } from "@/components/hr/wizard/ThemeSelector";
import { EmployeeTargeting } from "@/components/hr/wizard/EmployeeTargeting";
import { ScheduleSettings } from "@/components/hr/wizard/ScheduleSettings";
import { ConsentSettings } from "@/components/hr/wizard/ConsentSettings";
import { DeployConfirmationModal } from "@/components/hr/wizard/DeployConfirmationModal";
import { SurveyPreview } from "@/components/hr/wizard/SurveyPreview";
import { useState, useEffect, useCallback } from "react";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { number: 1, title: "Details" },
  { number: 2, title: "Themes" },
  { number: 3, title: "Targeting" },
  { number: 4, title: "Schedule" },
  { number: 5, title: "Privacy" },
];

const CreateSurvey = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft_id');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [surveyId, setSurveyId] = useState<string | null>(draftId);
  const [targetCount, setTargetCount] = useState(0);
  const [deployResult, setDeployResult] = useState<any>(null);

  // Load survey defaults
  const { data: surveyDefaults } = useSurveyDefaults();

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: getDefaultSurveyValues(surveyDefaults),
    mode: "onChange",
  });

  // Update form when defaults load
  useEffect(() => {
    if (surveyDefaults && !draftId) {
      const defaults = getDefaultSurveyValues(surveyDefaults);
      // Ensure consent_message and first_message are never empty
      if (!defaults.consent_message || defaults.consent_message.trim() === '') {
        defaults.consent_message = "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.";
      }
      if (!defaults.first_message || defaults.first_message.trim() === '') {
        defaults.first_message = "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.";
      }
      form.reset(defaults);
    }
  }, [surveyDefaults, draftId, form]);

  // Load draft if editing
  const { data: draftData } = useQuery({
    queryKey: ['survey-draft', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!draftId,
  });

  useEffect(() => {
    if (draftData) {
      const schedule = draftData.schedule as any;
      const defaults = getDefaultSurveyValues(surveyDefaults);
      
      // Ensure fallback values are never empty strings
      const safeFirstMessage = draftData.first_message || defaults.first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.";
      const safeConsentMessage = (draftData.consent_config as any)?.consent_message || defaults.consent_message || "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.";
      
      form.reset({
        title: draftData.title,
        description: draftData.description || "",
        first_message: safeFirstMessage.trim() ? safeFirstMessage : "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
        themes: (draftData.themes as string[]) || [],
        target_type: schedule.target_type || 'all',
        target_departments: schedule.target_departments || [],
        target_employees: schedule.target_employees || [],
        schedule_type: schedule.schedule_type || 'immediate',
        start_date: schedule.start_date || null,
        end_date: schedule.end_date || null,
        reminder_frequency: schedule.reminder_frequency,
        anonymization_level: (draftData.consent_config as any)?.anonymization_level || 'identified',
        consent_message: safeConsentMessage.trim() ? safeConsentMessage : "Your responses will be kept confidential and used to improve our workplace. We take your privacy seriously and follow strict data protection guidelines.",
        data_retention_days: (draftData.consent_config as any)?.data_retention_days || '60',
      });
    }
  }, [draftData, form, surveyDefaults]);

  const saveDraft = useCallback(async (showToast = true): Promise<string | null> => {
    setIsSaving(true);
    try {
      const values = form.getValues();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const surveyData = {
        title: values.title || 'Untitled Survey',
        description: values.description,
        first_message: values.first_message,
        themes: values.themes,
        schedule: {
          target_type: values.target_type,
          target_departments: values.target_departments,
          target_employees: values.target_employees,
          schedule_type: values.schedule_type,
          start_date: values.start_date,
          end_date: values.end_date,
          reminder_frequency: values.reminder_frequency,
          link_expires_at: values.link_expires_at,
          max_link_responses: values.max_link_responses,
        },
        consent_config: {
          anonymization_level: values.anonymization_level,
          consent_message: values.consent_message,
          data_retention_days: values.data_retention_days,
        },
        created_by: user.id,
        status: 'draft',
      };

      let savedId = surveyId;

      if (surveyId) {
        const { error } = await supabase
          .from('surveys')
          .update(surveyData)
          .eq('id', surveyId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('surveys')
          .insert(surveyData)
          .select()
          .single();
        
        if (error) throw error;
        savedId = data.id;
        setSurveyId(data.id);
      }

      if (showToast) {
        toast.success('Draft saved successfully');
      }

      return savedId;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [form, surveyId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (form.formState.isDirty) {
        saveDraft(false);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [form.formState.isDirty, saveDraft]);

  const validateCurrentStep = () => {
    const values = form.getValues();
    
    switch (currentStep) {
      case 1:
        return values.title && values.first_message;
      case 2:
        return values.themes.length > 0;
      case 3:
        if (values.target_type === 'department') {
          return values.target_departments && values.target_departments.length > 0;
        }
        if (values.target_type === 'manual') {
          return values.target_employees && values.target_employees.length > 0;
        }
        return true;
      case 4:
        if (values.schedule_type === 'scheduled') {
          return values.start_date !== null;
        }
        return true;
      case 5:
        return values.consent_message;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    // Only validate fields relevant to the current step
    let fieldsToValidate: (keyof SurveyFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['title', 'first_message'];
        break;
      case 2:
        fieldsToValidate = ['themes'];
        break;
      case 3:
        fieldsToValidate = ['target_type', 'target_departments', 'target_employees'];
        break;
      case 4:
        fieldsToValidate = ['schedule_type', 'start_date', 'end_date'];
        break;
      case 5:
        fieldsToValidate = ['consent_message', 'anonymization_level', 'data_retention_days'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid || !validateCurrentStep()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      await saveDraft(false);
    } else {
      setShowDeployModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const id = await saveDraft(false);
      
      if (!id) {
        toast.error('Unable to save survey before deployment');
        setIsDeploying(false);
        setShowDeployModal(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('deploy-survey', {
        body: { survey_id: id },
      });

      if (error) throw error;

      // Store deploy result for modal to display
      setDeployResult(data);

      // Show appropriate success message
      if (data.public_link) {
        toast.success('Survey deployed! Public link created.');
      } else if (data.message) {
        toast.error(data.message);
        setShowDeployModal(false);
      } else {
        toast.success(`Survey deployed! ${data.assignment_count || 0} employees assigned.`);
      }
      
      // Don't navigate immediately if it's a public link - let user see the link
      if (!data.public_link) {
        navigate('/hr/dashboard');
      }
    } catch (error: any) {
      console.error('Error deploying survey:', error);
      const message = error?.message || 'Failed to deploy survey';
      toast.error(message);
      setIsDeploying(false);
      setShowDeployModal(false);
    } finally {
      setIsDeploying(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SurveyDetails form={form} />;
      case 2:
        return <ThemeSelector form={form} />;
      case 3:
        return <EmployeeTargeting form={form} />;
      case 4:
        return <ScheduleSettings form={form} />;
      case 5:
        return <ConsentSettings form={form} />;
      default:
        return null;
    }
  };

  return (
    <HRLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/hr/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Survey</h1>
              <p className="text-muted-foreground mt-1">Design an AI-powered feedback conversation</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview as Employee
          </Button>
        </div>

        <WizardProgress currentStep={currentStep} steps={STEPS} />

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Card>
              <CardContent className="pt-6">
                {renderStep()}
                <WizardNavigation
                  currentStep={currentStep}
                  totalSteps={5}
                  onBack={handleBack}
                  onNext={handleNext}
                  onSaveDraft={() => saveDraft(true)}
                  isNextDisabled={!validateCurrentStep()}
                  isSaving={isSaving}
                />
              </CardContent>
            </Card>
          </form>
        </Form>

        <DeployConfirmationModal
          open={showDeployModal}
          onOpenChange={(open) => {
            setShowDeployModal(open);
            if (!open && deployResult) {
              navigate('/hr/dashboard');
            }
          }}
          formData={form.getValues()}
          themeCount={form.watch("themes").length}
          targetCount={targetCount}
          onConfirm={handleDeploy}
          isDeploying={isDeploying}
          deployResult={deployResult}
        />

        <SurveyPreview
          open={showPreview}
          onOpenChange={setShowPreview}
          surveyData={{
            title: form.watch("title"),
            first_message: form.watch("first_message"),
            themes: form.watch("themes"),
            consent_config: {
              anonymization_level: form.watch("anonymization_level"),
              data_retention_days: Number(form.watch("data_retention_days")),
              consent_message: form.watch("consent_message"),
            },
          }}
        />
      </div>
    </HRLayout>
  );
};

export default CreateSurvey;
