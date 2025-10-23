import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users, Edit, BarChart3, Archive, Trash2 } from "lucide-react";
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
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor((survey.status || 'draft') as SurveyStatus)}>
                {survey.status || 'draft'}
              </Badge>
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
            
            <div className="text-xs text-muted-foreground">
              Created {format(new Date(survey.created_at), 'MMM d, yyyy')}
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
    </div>
  );
};
