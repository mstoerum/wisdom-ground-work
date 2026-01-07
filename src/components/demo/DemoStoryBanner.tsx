import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Calendar, Users, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showcaseCourse, showcaseParticipation } from "@/utils/uxCourseShowcaseData";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DemoStoryBannerProps {
  onBackToMenu: () => void;
}

export function DemoStoryBanner({ onBackToMenu }: DemoStoryBannerProps) {
  const navigate = useNavigate();
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Top Row: Course Info + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Course Context */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex h-10 sm:h-12 w-10 sm:w-12 rounded-lg bg-primary/10 items-center justify-center flex-shrink-0">
                <GraduationCap className="h-5 sm:h-6 w-5 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-semibold truncate">{showcaseCourse.name} – {showcaseCourse.courseName}</h2>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    Demo Data
                  </Badge>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 flex-shrink-0" />
                    <span className="truncate">{showcaseCourse.semester} Evaluation</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 sm:h-3.5 w-3 sm:w-3.5 flex-shrink-0" />
                    {showcaseParticipation.completed} responses
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={onBackToMenu} className="text-xs sm:text-sm">
                Back to Demo
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate('/auth')}
                className="gap-1 text-xs sm:text-sm"
              >
                <span className="hidden xs:inline">Try with</span> Your Data
                <ArrowRight className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              </Button>
            </div>
          </div>

          {/* Story Context - Collapsible on mobile */}
          <div className="sm:hidden">
            <Collapsible open={isStoryOpen} onOpenChange={setIsStoryOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="font-medium">View Story Context</span>
                  {isStoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">The Story:</span>{" "}
                    {showcaseCourse.name}'s {showcaseCourse.courseName} course ran their {showcaseCourse.semester} evaluation. 
                    Students praised the fast iteration approach and practical application, while highlighting 
                    opportunities to improve assessment clarity and update course materials.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Story Context - Always visible on desktop */}
          <div className="hidden sm:block p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">The Story:</span>{" "}
              {showcaseCourse.name}'s {showcaseCourse.courseName} course ({showcaseCourse.studentCount} students) ran their {showcaseCourse.semester} evaluation. 
              Students overwhelmingly praised the fast iteration approach and real-world applicability, while identifying 
              opportunities to improve assessment transparency. Explore the analytics to see how Spradley 
              transforms course feedback into actionable insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
