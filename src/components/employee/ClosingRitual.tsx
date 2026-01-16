import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface ClosingRitualProps {
  conversationId: string;
  onComplete: () => void;
  surveyType?: 'employee_satisfaction' | 'course_evaluation';
}

export const ClosingRitual = ({ conversationId, onComplete, surveyType = 'employee_satisfaction' }: ClosingRitualProps) => {
  const isCourseEvaluation = surveyType === 'course_evaluation';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <CardTitle className="text-2xl">Thank You!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground font-medium">
            Your feedback has been securely recorded 🙏
          </p>

          {/* What happens next */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Heart className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium mb-2">What happens next?</p>
              {isCourseEvaluation ? (
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• Your feedback is analyzed with other responses</li>
                  <li>• Instructors review insights to improve the course</li>
                  <li>• Common themes shape future improvements</li>
                </ul>
              ) : (
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• Your feedback is analyzed with others to find trends</li>
                  <li>• Leadership reviews aggregated insights</li>
                  <li>• Action plans are developed based on common themes</li>
                </ul>
              )}
            </div>
          </div>

          <Button onClick={onComplete} className="w-full" size="lg">
            Complete Session
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
