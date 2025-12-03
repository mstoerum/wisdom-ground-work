import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showcaseCompany, showcaseParticipation } from "@/utils/showcaseData";

interface DemoStoryBannerProps {
  onBackToMenu: () => void;
}

export function DemoStoryBanner({ onBackToMenu }: DemoStoryBannerProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Company Context */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-12 w-12 rounded-lg bg-primary/10 items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">{showcaseCompany.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  Demo Data
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {showcaseCompany.surveyName}
                </span>
                <span className="hidden sm:flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {showcaseParticipation.completed} responses
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBackToMenu}>
              Back to Demo
            </Button>
            <Button 
              size="sm" 
              onClick={() => navigate('/auth')}
              className="gap-1"
            >
              Try with Your Data
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Story Context */}
        <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">The Story:</span>{" "}
            {showcaseCompany.name}, a 250-person tech company, ran their Q1 2025 employee survey. 
            The results reveal a critical Work-Life Balance crisis in Engineering, but also celebrate 
            the success of their new mentorship program. Explore the analytics to see how Spradley 
            transforms feedback into actionable insights.
          </p>
        </div>
      </div>
    </div>
  );
}
