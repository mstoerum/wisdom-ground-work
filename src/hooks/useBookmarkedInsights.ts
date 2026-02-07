import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BookmarkedInsight {
  id: string;
  survey_id: string;
  insight_text: string;
  insight_category: string | null;
  agreement_percentage: number | null;
  chapter_key: string | null;
  bookmarked_by: string;
  created_at: string;
}

export const useBookmarkedInsights = (surveyId: string | null) => {
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ['bookmarked-insights', surveyId],
    queryFn: async () => {
      if (!surveyId) return [];

      const { data, error } = await supabase
        .from('bookmarked_insights')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BookmarkedInsight[];
    },
    enabled: !!surveyId,
  });

  const addBookmark = useMutation({
    mutationFn: async (bookmark: {
      survey_id: string;
      insight_text: string;
      insight_category?: string | null;
      agreement_percentage?: number | null;
      chapter_key?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bookmarked_insights')
        .insert({
          ...bookmark,
          bookmarked_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarked-insights', surveyId] });
    },
    onError: (error) => {
      toast.error("Failed to bookmark insight: " + error.message);
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookmarked_insights')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarked-insights', surveyId] });
    },
    onError: (error) => {
      toast.error("Failed to remove bookmark: " + error.message);
    },
  });

  const isBookmarked = (insightText: string) =>
    bookmarks.some(b => b.insight_text === insightText);

  const getBookmarkId = (insightText: string) =>
    bookmarks.find(b => b.insight_text === insightText)?.id;

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmarkId,
  };
};
