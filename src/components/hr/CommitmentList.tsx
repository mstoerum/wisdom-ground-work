import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import type { Commitment } from "@/hooks/useCommitments";
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

interface CommitmentListProps {
  commitments: Commitment[];
  onEdit: (commitment: Commitment) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
};

export const CommitmentList = ({ commitments, onEdit, onDelete, onToggleVisibility }: CommitmentListProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (commitments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No action commitments yet. Create one to track follow-up actions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {commitments.map((commitment) => (
          <Card key={commitment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[commitment.status as keyof typeof statusColors]}>
                      {commitment.status}
                    </Badge>
                    {commitment.visible_to_employees ? (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" /> Visible
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="h-3 w-3" /> Hidden
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base">{commitment.action_description}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleVisibility(commitment.id, !commitment.visible_to_employees)}
                  >
                    {commitment.visible_to_employees ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(commitment)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(commitment.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {commitment.due_date && (
                  <span>Due: {format(new Date(commitment.due_date), "PPP")}</span>
                )}
                <span>Created: {format(new Date(commitment.created_at), "PPP")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commitment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this commitment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
