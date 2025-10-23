import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Custom hook for managing HR action commitments
 * Provides CRUD operations for commitments with optimistic updates
 */

export interface Commitment {
  id: string;
  survey_id: string;
  action_description: string;
  status: string;
  due_date: string | null;
  committed_by: string;
  visible_to_employees: boolean;
  created_at: string;
  updated_at: string;
}

export const useCommitments = (surveyId?: string) => {
  const queryClient = useQueryClient();

  const { data: commitments = [], isLoading } = useQuery({
    queryKey: ['commitments', surveyId],
    queryFn: async () => {
      let query = supabase
        .from('action_commitments')
        .select('*')
        .order('created_at', { ascending: false });

      if (surveyId) {
        query = query.eq('survey_id', surveyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Commitment[];
    },
  });

  const createCommitment = useMutation({
    mutationFn: async (commitment: Omit<Commitment, 'id' | 'created_at' | 'updated_at' | 'committed_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('action_commitments')
        .insert({
          ...commitment,
          committed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      toast({
        title: "Commitment created",
        description: "Action commitment has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create commitment: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateCommitment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Commitment> & { id: string }) => {
      const { data, error } = await supabase
        .from('action_commitments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      toast({
        title: "Commitment updated",
        description: "Action commitment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update commitment: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCommitment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('action_commitments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments'] });
      toast({
        title: "Commitment deleted",
        description: "Action commitment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete commitment: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    commitments,
    isLoading,
    createCommitment,
    updateCommitment,
    deleteCommitment,
  };
};
