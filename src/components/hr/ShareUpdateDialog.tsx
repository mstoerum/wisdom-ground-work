import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface ShareUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: string;
  commitments: any[];
}

export const ShareUpdateDialog = ({ open, onOpenChange, surveyId, commitments }: ShareUpdateDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCommitments, setSelectedCommitments] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing fields",
        description: "Please provide both a title and message content.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Build full message with selected commitments
      let fullContent = content;
      
      if (selectedCommitments.length > 0) {
        fullContent += "\n\n**Action Commitments:**\n";
        selectedCommitments.forEach(commitmentId => {
          const commitment = commitments.find(c => c.id === commitmentId);
          if (commitment) {
            fullContent += `\n• ${commitment.action_description} (Due: ${new Date(commitment.due_date).toLocaleDateString()})`;
          }
        });
      }

      const { error } = await supabase
        .from("survey_updates")
        .insert({
          survey_id: surveyId,
          title,
          content: fullContent,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Update published",
        description: "Employees who participated in this survey will see your update.",
      });

      // Reset form
      setTitle("");
      setContent("");
      setSelectedCommitments([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error publishing update:", error);
      toast({
        title: "Failed to publish",
        description: "There was an error publishing the update.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Share Survey Update</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Update Title</Label>
              <Input
                id="title"
                placeholder="e.g., Q1 Feedback Results & Action Plan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                placeholder="Summarize key findings and next steps..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
              <p className="text-sm text-muted-foreground mt-1">
                This message will be visible to all employees who participated in this survey.
              </p>
            </div>

            {commitments.length > 0 && (
              <div>
                <Label>Include Commitments (Optional)</Label>
                <div className="border rounded-lg p-4 space-y-3 mt-2">
                  {commitments.map((commitment) => (
                    <div key={commitment.id} className="flex items-start gap-3">
                      <Checkbox
                        id={commitment.id}
                        checked={selectedCommitments.includes(commitment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCommitments([...selectedCommitments, commitment.id]);
                          } else {
                            setSelectedCommitments(selectedCommitments.filter(id => id !== commitment.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <label htmlFor={commitment.id} className="text-sm cursor-pointer">
                          {commitment.action_description}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(commitment.due_date).toLocaleDateString()} • {commitment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing}>
            <Send className="h-4 w-4 mr-2" />
            {isPublishing ? "Publishing..." : "Publish Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};