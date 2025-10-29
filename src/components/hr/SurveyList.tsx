import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, Edit, BarChart3, Archive, Trash2, Link as LinkIcon, ExternalLink, Copy, Eye } from "lucide-react";
import { PublicLinkDetails } from "./PublicLinkDetails";
import { CompleteEmployeeExperiencePreview } from "./wizard/CompleteEmployeeExperiencePreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";

interface SurveyListProps {
  status?: 'active' | 'draft' | 'scheduled' | 'completed';
}

type SurveyStatus = 'active' | 'draft' | 'scheduled' | 'completed' | 'archived';

// Helper: Get color class for survey status badge
const getStatusColor = (status: SurveyStatus): string => {
  const colorMap: Record<SurveyStatus, string> = {
    active: 'bg-green-500/10 text-green-500',
    draft: 'bg-gray-500/10 text-gray-500',
    scheduled: 'bg-blue-500/10 text-blue-500',
    completed: 'bg-purple-500/10 text-purple-500',
    archived: 'bg-gray-500/10 text-gray-500',
  };
  
  return colorMap[status] || colorMap.draft;
};

export const SurveyList = ({ status }: SurveyListProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedSurveyForPreview, setSelectedSurveyForPreview] = useState<any>(null);
  
  // Fetch surveys with optional status filter
  const { data: surveys, isLoading, refetch } = useQuery({
    queryKey: ['surveys', status],
    queryFn: async () => {
      let query = supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch public survey links
  const { data: publicLinks } = useQuery({
    queryKey: ["public-survey-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_survey_links")
        .select("id, survey_id, link_token, is_active, expires_at, max_responses, current_responses")
        .eq("is_active", true);
      
      if (error) throw error;
      
      // Create a map of survey_id -> link data
      const linkMap = new Map();
      data?.forEach(link => {
        const isExpired = link.expires_at && new Date(link.expires_at) < new Date();
        const isMaxed = link.max_responses && link.current_responses >= link.max_responses;
        if (!isExpired && !isMaxed) {
          linkMap.set(link.survey_id, link);
        }
      });
      return linkMap;
    },
  });

  // Delete draft survey
  const handleDeleteDraft = async () => {
    if (!surveyToDelete) return;

    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyToDelete);

      if (error) throw error;

      toast.success('Draft deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    } finally {
      setDeleteDialogOpen(false);
      setSurveyToDelete(null);
    }
  };

  // Close active survey
  const handleCloseSurvey = async (surveyId: string) => {
    if (!window.confirm("Close this survey? No new responses will be accepted.")) return;
    
    await supabase.from('surveys').update({ status: 'completed' }).eq('id', surveyId);
    refetch();
    toast.success("Survey closed successfully");
  };

  // Archive completed survey
  const handleArchiveSurvey = async (surveyId: string) => {
    if (!window.confirm("Archive this survey? It will be hidden from the main list.")) return;
    
    await supabase.from('surveys').update({ status: 'archived' }).eq('id', surveyId);
    refetch();
    toast.success("Survey archived");
  };

  // Duplicate survey
  const handleDuplicateSurvey = async (surveyId: string) => {
    const { data } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
    if (data) {
      const { data: newSurvey } = await supabase.from('surveys').insert({
        ...data,
        id: undefined,
        title: `${data.title} - Copy`,
        status: 'draft',
        created_at: undefined,
      }).select().single();
      
      if (newSurvey) {
        navigate(`/hr/create-survey?draft_id=${newSurvey.id}`);
      }
    }
  };

  // Confirm draft deletion
  const confirmDeleteDraft = (surveyId: string) => {
    setSurveyToDelete(surveyId);
    setDeleteDialogOpen(true);
  };

  // Copy public link to clipboard
  const handleCopyPublicLink = (linkToken: string) => {
    const surveyUrl = `${window.location.origin}/public-survey/${linkToken}`;
    navigator.clipboard.writeText(surveyUrl);
    toast.success("Link copied to clipboard");
  };

  // View public link details
  const handleViewPublicLink = (surveyId: string) => {
    const link = publicLinks?.get(surveyId);
    if (link) {
      setSelectedLink(link);
      setLinkDialogOpen(true);
    }
  };

  // Open preview experience
  const handlePreviewExperience = (survey: any) => {
    setSelectedSurveyForPreview(survey);
    setPreviewDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading surveys...</div>;
  }

  if (!surveys || surveys.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No surveys found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {status ? `No ${status} surveys yet` : 'Create your first survey to get started'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {surveys.map((survey) => (
        <Card key={survey.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{survey.title}</CardTitle>
                {survey.description && (
                  <CardDescription className="mt-1">{survey.description}</CardDescription>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handlePreviewExperience(survey)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Experience
                  </DropdownMenuItem>
                  {publicLinks?.has(survey.id) && (
                    <DropdownMenuItem onClick={() => handleViewPublicLink(survey.id)}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View & Copy Link
                    </DropdownMenuItem>
                  )}
                  {survey.status === 'draft' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/hr/create-survey?draft_id=${survey.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Continue Editing
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => confirmDeleteDraft(survey.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Draft
                      </DropdownMenuItem>
                    </>
                  )}
                  {survey.status !== 'draft' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(`/hr/analytics?survey_id=${survey.id}`)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </DropdownMenuItem>
                      {survey.status === 'active' && (
                        <DropdownMenuItem onClick={() => handleCloseSurvey(survey.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Close Survey
                        </DropdownMenuItem>
                      )}
                      {survey.status === 'completed' && (
                        <>
                          <DropdownMenuItem onClick={() => handleArchiveSurvey(survey.id)}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Survey
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateSurvey(survey.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Duplicate Survey
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor((survey.status || 'draft') as SurveyStatus)}>
                {survey.status || 'draft'}
              </Badge>
              {publicLinks?.has(survey.id) && (
                <Badge variant="outline" className="gap-1">
                  <LinkIcon className="h-3 w-3" />
                  Public link
                </Badge>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>0 responses</span>
              </div>
            </div>
            
            {Array.isArray(survey.themes) && survey.themes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {survey.themes.slice(0, 3).map((theme: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {theme.name || theme}
                  </Badge>
                ))}
                {survey.themes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{survey.themes.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Created {format(new Date(survey.created_at), 'MMM d, yyyy')}
              </div>
              {publicLinks?.has(survey.id) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyPublicLink(publicLinks.get(survey.id).link_token)}
                  className="gap-1.5 h-8"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The draft survey will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDraft}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PublicLinkDetails
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        linkData={selectedLink}
      />

      {/* Complete Employee Experience Preview */}
      {selectedSurveyForPreview && (
        <CompleteEmployeeExperiencePreview
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          surveyData={{
            title: selectedSurveyForPreview.title,
            first_message: selectedSurveyForPreview.first_message,
            themes: selectedSurveyForPreview.themes || [],
            consent_config: selectedSurveyForPreview.consent_config,
          }}
          surveyId={selectedSurveyForPreview.id}
        />
      )}
    </div>
  );
};
