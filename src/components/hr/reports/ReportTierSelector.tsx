import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { REPORT_TIERS, type ReportTier } from "@/lib/reportDesignSystem";
import { Zap, BookOpen, LayoutDashboard, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportTierSelectorProps {
  selectedTier: ReportTier['id'] | null;
  onSelect: (tier: ReportTier['id']) => void;
  disabled?: boolean;
}

const tierIcons = {
  Zap,
  BookOpen,
  LayoutDashboard,
};

export function ReportTierSelector({ selectedTier, onSelect, disabled }: ReportTierSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Choose Report Format</h3>
        <p className="text-sm text-muted-foreground">
          Select the right format for your audience and purpose
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REPORT_TIERS.map((tier) => {
          const Icon = tierIcons[tier.icon as keyof typeof tierIcons] || BookOpen;
          const isSelected = selectedTier === tier.id;

          return (
            <Card 
              key={tier.id}
              className={cn(
                "relative cursor-pointer transition-all hover:shadow-lg border-2",
                isSelected ? "border-primary shadow-md" : "border-transparent hover:border-primary/30",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && onSelect(tier.id)}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isSelected ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{tier.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {tier.pageCount}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {tier.description}
                </CardDescription>

                {/* Audience */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>Best for:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tier.audience.map((aud) => (
                      <Badge key={aud} variant="outline" className="text-xs">
                        {aud}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1.5">
                  {tier.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {tier.features.length > 4 && (
                    <div className="text-xs text-muted-foreground pl-5">
                      +{tier.features.length - 4} more features
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
