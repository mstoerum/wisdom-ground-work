import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Handshake, 
  Plus, 
  Signature, 
  Calendar,
  CheckCircle2,
  User 
} from "lucide-react";
import { EMOTION_SPECTRUM, type CommitmentSignature } from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface CommitmentSectionProps {
  commitments: CommitmentSignature[];
  onAddCommitment?: (commitment: CommitmentSignature) => void;
  readOnly?: boolean;
  surveyTitle?: string;
}

const DEFAULT_PLEDGES = [
  "I commit to reviewing this report within 48 hours",
  "I will discuss key findings with my team this week",
  "I will follow up on urgent items within 7 days",
  "I will track progress on committed actions",
];

export function CommitmentSection({
  commitments,
  onAddCommitment,
  readOnly = false,
  surveyTitle = "This Survey",
}: CommitmentSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [selectedPledges, setSelectedPledges] = useState<string[]>([]);
  const [customPledge, setCustomPledge] = useState("");

  const handleSubmit = () => {
    if (!name || !role || selectedPledges.length === 0) return;

    const allPledges = customPledge 
      ? [...selectedPledges, customPledge]
      : selectedPledges;

    onAddCommitment?.({
      name,
      role,
      date: new Date(),
      pledges: allPledges,
    });

    // Reset form
    setName("");
    setRole("");
    setSelectedPledges([]);
    setCustomPledge("");
    setIsAdding(false);
  };

  const togglePledge = (pledge: string) => {
    setSelectedPledges(prev => 
      prev.includes(pledge)
        ? prev.filter(p => p !== pledge)
        : [...prev, pledge]
    );
  };

  return (
    <div className="space-y-6">
      {/* Chapter header */}
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: EMOTION_SPECTRUM.thriving.background }}
        >
          <Handshake 
            className="h-6 w-6" 
            style={{ color: EMOTION_SPECTRUM.thriving.primary }}
          />
        </div>
        <div>
          <Badge variant="secondary" className="mb-2">Chapter 6</Badge>
          <h2 className="text-2xl font-bold">Our Commitment</h2>
          <p className="text-muted-foreground">
            What we pledge to do in response to {surveyTitle}
          </p>
        </div>
      </div>

      {/* Existing commitments */}
      <div className="space-y-4">
        <AnimatePresence>
          {commitments.map((commitment, index) => (
            <motion.div
              key={`${commitment.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-l-4" style={{ borderLeftColor: EMOTION_SPECTRUM.thriving.primary }}>
                <CardContent className="p-5">
                  <div className="space-y-4">
                    {/* Signer info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold">{commitment.name}</p>
                          <p className="text-sm text-muted-foreground">{commitment.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(commitment.date), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Pledges */}
                    <div className="space-y-2">
                      {commitment.pledges.map((pledge, pledgeIndex) => (
                        <div 
                          key={pledgeIndex}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle2 
                            className="h-4 w-4 mt-0.5 flex-shrink-0" 
                            style={{ color: EMOTION_SPECTRUM.thriving.primary }}
                          />
                          <span>{pledge}</span>
                        </div>
                      ))}
                    </div>

                    {/* Signature visual */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Signature className="h-4 w-4 text-muted-foreground" />
                      <span className="font-signature text-lg italic text-muted-foreground">
                        {commitment.name}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {commitments.length === 0 && !isAdding && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Commitments Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to pledge your commitment to acting on this feedback
              </p>
              {!readOnly && (
                <Button onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your Commitment
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add commitment form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Add Your Commitment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name</label>
                    <Input 
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Role</label>
                    <Input 
                      placeholder="e.g., HR Director"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">I Pledge To:</label>
                  {DEFAULT_PLEDGES.map((pledge) => (
                    <div 
                      key={pledge}
                      className="flex items-center gap-3"
                    >
                      <Checkbox
                        checked={selectedPledges.includes(pledge)}
                        onCheckedChange={() => togglePledge(pledge)}
                      />
                      <span className="text-sm">{pledge}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Commitment (Optional)</label>
                  <Textarea
                    placeholder="Add a specific commitment..."
                    value={customPledge}
                    onChange={(e) => setCustomPledge(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={!name || !role || selectedPledges.length === 0}
                  >
                    <Signature className="h-4 w-4 mr-2" />
                    Sign Commitment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button when there are existing commitments */}
      {!readOnly && commitments.length > 0 && !isAdding && (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Your Commitment
        </Button>
      )}
    </div>
  );
}
