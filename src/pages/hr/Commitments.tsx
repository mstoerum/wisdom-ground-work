import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, FileText } from "lucide-react";
import { useCommitments } from "@/hooks/useCommitments";
import { CommitmentForm } from "@/components/hr/CommitmentForm";
import { CommitmentList } from "@/components/hr/CommitmentList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Commitment } from "@/hooks/useCommitments";

const Commitments = () => {
  const [selectedSurvey, setSelectedSurvey] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | undefined>();

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys-for-commitments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surveys')
        .select('id, title')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const {
    commitments,
    isLoading,
    createCommitment,
    updateCommitment,
    deleteCommitment,
  } = useCommitments(selectedSurvey === "all" ? undefined : selectedSurvey);

  const handleSubmit = (data: any) => {
    if (editingCommitment) {
      updateCommitment.mutate({ id: editingCommitment.id, ...data });
    } else {
      createCommitment.mutate(data);
    }
    setIsFormOpen(false);
    setEditingCommitment(undefined);
  };

  const handleEdit = (commitment: Commitment) => {
    setEditingCommitment(commitment);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCommitment.mutate(id);
  };

  const handleToggleVisibility = (id: string, visible: boolean) => {
    updateCommitment.mutate({ id, visible_to_employees: visible });
  };

  const handleNewCommitment = () => {
    setEditingCommitment(undefined);
    setIsFormOpen(true);
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Action Commitments</h1>
            <p className="text-muted-foreground mt-1">Track and manage follow-up actions</p>
          </div>
          <Button onClick={handleNewCommitment} disabled={selectedSurvey === "all"}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Commitment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filter by Survey</CardTitle>
              <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                <SelectTrigger className="w-64">
                  <SelectValue />
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
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : commitments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No commitments yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Create action commitments to track follow-up on survey insights and show employees you're listening.
            </p>
            {selectedSurvey !== "all" && (
              <Button onClick={handleNewCommitment}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Commitment
              </Button>
            )}
          </Card>
        ) : (
          <CommitmentList
            commitments={commitments}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleVisibility={handleToggleVisibility}
          />
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCommitment ? "Edit" : "Create"} Action Commitment
              </DialogTitle>
            </DialogHeader>
            <CommitmentForm
              surveyId={selectedSurvey}
              commitment={editingCommitment}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCommitment(undefined);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </HRLayout>
  );
};

export default Commitments;
