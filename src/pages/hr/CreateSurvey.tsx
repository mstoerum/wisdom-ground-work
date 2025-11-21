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
import { SurveyTypeSelector } from "@/components/hr/wizard/SurveyTypeSelector";
import { ThemeSelector } from "@/components/hr/wizard/ThemeSelector";
import { EmployeeTargeting } from "@/components/hr/wizard/EmployeeTargeting";
import { ScheduleSettings } from "@/components/hr/wizard/ScheduleSettings";
import { ConsentSettings } from "@/components/hr/wizard/ConsentSettings";
import { DeployConfirmationModal } from "@/components/hr/wizard/DeployConfirmationModal";
import { ReviewAndDeployStep } from "@/components/hr/wizard/ReviewAndDeployStep";
import { CompleteEmployeeExperiencePreview } from "@/components/hr/wizard/CompleteEmployeeExperiencePreview";
import { useState, useEffect, useCallback } from "react";
import { Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { number: 1, title: "Type" },
  { number: 2, title: "Details" },
  { number: 3, title: "Themes" },
  { number: 4, title: "Targeting" },
  { number: 5, title: "Schedule" },
  { number: 6, title: "Privacy" },
  { number: 7, title: "Review & Deploy" },
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
    defaultValues: getDefaultSurveyValues(surveyDefaults, 'employee_satisfaction'),
    mode: "onChange",
  });

  // Update form when defaults load
  useEffect(() => {
    if (surveyDefaults && !draftId) {
      const surveyType = form.getValues('survey_type') || 'employee_satisfaction';
      const defaults = getDefaultSurveyValues(surveyDefaults, surveyType);
      form.reset(defaults);
    }
  }, [surveyDefaults, draftId, form]);

  // Update consent_message when survey_type changes (only if not manually edited)
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'survey_type' && value.survey_type) {
        const currentConsentMessage = form.getValues('consent_message');
        const newDefaults = getDefaultSurveyValues(surveyDefaults, value.survey_type);
        
        // Only update if current message matches default (hasn't been manually edited)
        const oldDefaults = getDefaultSurveyValues(surveyDefaults, value.survey_type === 'course_evaluation' ? 'employee_satisfaction' : 'course_evaluation');
        if (currentConsentMessage === oldDefaults.consent_message || !currentConsentMessage) {
          form.setValue('consent_message', newDefaults.consent_message);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, surveyDefaults]);

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
      const surveyType = draftData.survey_type || 'employee_satisfaction';
      const defaults = getDefaultSurveyValues(surveyDefaults, surveyType);
      
      // Ensure fallback consent message
      const safeConsentMessage = (draftData.consent_config as any)?.consent_message || defaults.consent_message;
      
      form.reset({
        survey_type: surveyType,
        title: draftData.title,
        description: draftData.description || "",
        themes: (draftData.themes as string[]) || [],
        target_type: schedule.target_type || 'all',
        target_departments: schedule.target_departments || [],
        target_employees: schedule.target_employees || [],
        schedule_type: schedule.schedule_type || 'immediate',
        start_date: schedule.start_date || null,
        end_date: schedule.end_date || null,
        reminder_frequency: schedule.reminder_frequency,
        anonymization_level: (draftData.consent_config as any)?.anonymization_level || 'identified',
        consent_message: safeConsentMessage,
        data_retention_days: (draftData.consent_config as any)?.data_retention_days || '60',
        enable_spradley_evaluation: (draftData.consent_config as any)?.enable_spradley_evaluation || false,
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
          enable_spradley_evaluation: values.enable_spradley_evaluation,
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
        return !!values.survey_type;
      case 2:
        return !!values.title;
      case 3:
        return values.themes.length > 0;
      case 4:
        if (values.target_type === 'department') {
          return values.target_departments && values.target_departments.length > 0;
        }
        if (values.target_type === 'manual') {
          return values.target_employees && values.target_employees.length > 0;
        }
        return true;
      case 5:
        if (values.schedule_type === 'scheduled') {
          return values.start_date !== null;
        }
        return true;
      case 6:
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
        fieldsToValidate = ['survey_type'];
        break;
      case 2:
        fieldsToValidate = ['title'];
        break;
      case 3:
        fieldsToValidate = ['themes'];
        break;
      case 4:
        fieldsToValidate = ['target_type', 'target_departments', 'target_employees'];
        break;
      case 5:
        fieldsToValidate = ['schedule_type', 'start_date', 'end_date'];
        break;
      case 6:
        fieldsToValidate = ['consent_message', 'anonymization_level', 'data_retention_days'];
        break;
      case 7:
        // Step 7 doesn't have validation - it's the review step
        return;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid || !validateCurrentStep()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
      await saveDraft(false);
      // Update target count when moving to step 7
      if (currentStep === 6) {
        calculateTargetCount();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculate target count for display
  const calculateTargetCount = useCallback(async () => {
    const values = form.getValues();
    const targetType = values.target_type;

    if (targetType === 'public_link') {
      setTargetCount(0); // Public links don't have a fixed count
      return;
    }

    try {
      if (targetType === 'all') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true);
        setTargetCount(profiles?.length || 0);
      } else if (targetType === 'department' && values.target_departments) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id')
          .eq('is_active', true)
          .in('department', values.target_departments);
        setTargetCount(profiles?.length || 0);
      } else if (targetType === 'manual' && values.target_employees) {
        setTargetCount(values.target_employees.length);
      } else {
        setTargetCount(0);
      }
    } catch (error) {
      console.error('Error calculating target count:', error);
      setTargetCount(0);
    }
  }, [form]);

  // Recalculate target count when relevant values change
  useEffect(() => {
    if (currentStep >= 3) {
      calculateTargetCount();
    }
  }, [
    form.watch('target_type'),
    form.watch('target_departments'),
    form.watch('target_employees'),
    currentStep,
    calculateTargetCount,
  ]);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const id = await saveDraft(false);
      
      if (!id) {
        toast.error('Unable to save survey before deployment');
        setIsDeploying(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('deploy-survey', {
        body: { survey_id: id },
      });

      if (error) throw error;

      // Store deploy result for display in ReviewAndDeployStep
      setDeployResult(data);

      // Show appropriate success message
      if (data.public_link) {
        toast.success('Survey deployed! Public link created.');
      } else if (data.message) {
        toast.error(data.message);
      } else {
        toast.success(`Survey deployed! ${data.assignment_count || 0} employees assigned.`);
      }
      
      // After deployment, user can see the result in step 6
      // Reset deploying state after showing result
      setTimeout(() => {
        setIsDeploying(false);
        // Auto-navigate for non-public links after a delay
        if (!data.public_link && data.assignment_count !== undefined) {
          setTimeout(() => {
            navigate('/hr/dashboard');
          }, 3000);
        }
      }, 1000);
    } catch (error: any) {
      console.error('Error deploying survey:', error);
      const message = error?.message || 'Failed to deploy survey';
      toast.error(message);
      setIsDeploying(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SurveyTypeSelector form={form} />;
      case 2:
        return <SurveyDetails form={form} />;
      case 3:
        return <ThemeSelector form={form} />;
      case 4:
        return <EmployeeTargeting form={form} />;
      case 5:
        return <ScheduleSettings form={form} />;
      case 6:
        return <ConsentSettings form={form} />;
      case 7:
        return (
          <ReviewAndDeployStep
            formData={form.getValues()}
            themeCount={form.watch("themes").length}
            targetCount={targetCount}
            onDeploy={handleDeploy}
            isDeploying={isDeploying}
            surveyId={surveyId}
            deployResult={deployResult}
          />
        );
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
          {currentStep < 7 && (
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview as {form.watch("survey_type") === 'course_evaluation' ? 'Student' : 'Employee'}
            </Button>
          )}
        </div>

        <WizardProgress currentStep={currentStep} steps={STEPS} />

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 7 ? (
              renderStep()
            ) : (
              <Card>
                <CardContent className="pt-6">
                  {renderStep()}
                  <WizardNavigation
                    currentStep={currentStep}
                    totalSteps={7}
                    onBack={handleBack}
                    onNext={handleNext}
                    onSaveDraft={() => saveDraft(true)}
                    isNextDisabled={!validateCurrentStep()}
                    isSaving={isSaving}
                  />
                </CardContent>
              </Card>
            )}
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

        <CompleteEmployeeExperiencePreview
          open={showPreview}
          onOpenChange={setShowPreview}
          surveyData={{
            survey_type: form.watch("survey_type"),
            title: form.watch("title") || "Untitled Survey",
            themes: form.watch("themes") || [],
            consent_config: {
              anonymization_level: form.watch("anonymization_level") || "anonymous",
              data_retention_days: Number(form.watch("data_retention_days")) || 60,
              consent_message: form.watch("consent_message") || getDefaultSurveyValues(surveyDefaults, form.watch("survey_type") || 'employee_satisfaction').consent_message,
              ...(form.watch("enable_spradley_evaluation") !== undefined && { enable_spradley_evaluation: form.watch("enable_spradley_evaluation") }),
            } as any,
          }}
        />
      </div>
    </HRLayout>
  );
};

export default CreateSurvey;
