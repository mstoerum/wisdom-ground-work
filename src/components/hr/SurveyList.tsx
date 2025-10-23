import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

interface SurveyListProps {
  status?: 'active' | 'draft' | 'scheduled' | 'completed';
}

export const SurveyList = ({ status }: SurveyListProps) => {
  const { data: surveys = [], isLoading } = useQuery({
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

  if (isLoading) {
    return <div className="text-muted-foreground">Loading surveys...</div>;
  }

  if (surveys.length === 0) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500';
      case 'draft': return 'bg-gray-500/10 text-gray-500';
      case 'scheduled': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
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
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>View Analytics</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(survey.status || 'draft')}>
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
  );
};
