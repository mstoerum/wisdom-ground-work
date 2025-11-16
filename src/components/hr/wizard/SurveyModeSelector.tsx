import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Mic, Clock, Zap, Edit3, Volume2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SurveyModeSelectorProps {
  onSelectMode: (mode: 'text' | 'voice') => void;
  surveyTitle: string;
  firstMessage?: string;
}

/**
 * SurveyModeSelector - Critical UX Fix #1
 * 
 * Addresses the discovery problem identified in UX testing where 67% of users
 * didn't notice the voice mode option.
 * 
 * Design Principles (Don Norman):
 * - Discoverability: Both options equally visible
 * - Affordance: Clear what each option does
 * - Feedback: Immediate response on selection
 * - Constraints: Can only pick one (good constraint)
 */
export const SurveyModeSelector = ({
  onSelectMode,
  surveyTitle,
  firstMessage,
}: SurveyModeSelectorProps) => {
  return (
    <div className="min-h-[600px] flex items-center justify-center p-8 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            {surveyTitle}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose how you'd like to share your feedback today
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Text Mode Card */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card 
              className="h-full hover:border-primary/50 transition-all cursor-pointer group relative"
              onClick={() => onSelectMode('text')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMode('text');
                }
              }}
              aria-label="Select text conversation mode"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    10-15 min
                  </Badge>
                </div>
                <CardTitle className="text-2xl mt-4">Text Conversation</CardTitle>
                <CardDescription className="text-base">
                  Type your responses at your own pace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Edit3 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Edit Before Sending</p>
                      <p className="text-xs text-muted-foreground">
                        Take your time to craft each response
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Work at Your Pace</p>
                      <p className="text-xs text-muted-foreground">
                        Pause anytime, think through your answers
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sample Preview */}
                <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Example:</p>
                  <div className="space-y-2">
                    <div className="text-sm bg-background p-2 rounded">
                      {firstMessage || "How are you feeling about your work today?"}
                    </div>
                    <div className="text-sm bg-primary/10 p-2 rounded ml-8">
                      [You type your response here...]
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={() => onSelectMode('text')}
                >
                  Start Text Conversation
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Voice Mode Card */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Card 
              className="h-full hover:border-primary/50 transition-all cursor-pointer group relative border-primary/30 shadow-lg"
              onClick={() => onSelectMode('voice')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMode('voice');
                }
              }}
              aria-label="Select voice conversation mode - recommended"
            >
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-1 shadow-md">
                  ⭐ Recommended
                </Badge>
              </div>

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors relative">
                    <Mic className="h-8 w-8 text-primary" />
                    {/* Subtle pulse animation */}
                    <div className="absolute inset-0 bg-primary/20 rounded-lg animate-ping" style={{ animationDuration: '2s' }} />
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1 border-primary/50">
                    <Clock className="h-3 w-3" />
                    5-10 min
                  </Badge>
                </div>
                <CardTitle className="text-2xl mt-4 flex items-center gap-2">
                  Voice Conversation
                  <Badge variant="secondary" className="text-xs">NEW</Badge>
                </CardTitle>
                <CardDescription className="text-base">
                  Speak naturally, no typing needed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Faster & More Natural</p>
                      <p className="text-xs text-muted-foreground">
                        Just talk like a regular conversation
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Volume2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No Typing Required</p>
                      <p className="text-xs text-muted-foreground">
                        Perfect for mobile or on-the-go
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Note */}
                <div className="mt-6 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs font-medium mb-1 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Privacy & Recording
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your voice is converted to text in real-time. Audio is not permanently stored—only text transcripts are saved (with your consent).
                  </p>
                </div>

                {/* CTA */}
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                  size="lg"
                  onClick={() => onSelectMode('voice')}
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Voice Conversation
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comparison Helper */}
        <div className="text-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Info className="mr-2 h-4 w-4" />
                What's the difference?
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Text vs Voice: Which Should I Choose?</DialogTitle>
                <DialogDescription>
                  Both modes lead to the same conversation. Choose what feels most comfortable.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Comparison Table */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-medium text-muted-foreground">Feature</div>
                  <div className="font-medium text-center">Text</div>
                  <div className="font-medium text-center">Voice</div>

                  <div className="text-muted-foreground">Speed</div>
                  <div className="text-center">⚡⚡</div>
                  <div className="text-center">⚡⚡⚡</div>

                  <div className="text-muted-foreground">Edit Responses</div>
                  <div className="text-center">✅ Yes</div>
                  <div className="text-center">❌ No</div>

                  <div className="text-muted-foreground">Multitasking</div>
                  <div className="text-center">❌ Need keyboard</div>
                  <div className="text-center">✅ Hands-free</div>

                  <div className="text-muted-foreground">Privacy Feel</div>
                  <div className="text-center">More private</div>
                  <div className="text-center">More natural</div>

                  <div className="text-muted-foreground">Mobile Friendly</div>
                  <div className="text-center">⚡⚡</div>
                  <div className="text-center">⚡⚡⚡</div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium text-sm mb-1">Choose Text if you:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Want to carefully edit your responses</li>
                      <li>Are in a noisy environment</li>
                      <li>Prefer typing over speaking</li>
                      <li>Feel more comfortable with written communication</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="font-medium text-sm mb-1">Choose Voice if you:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Want to finish faster (5-10 min vs 10-15 min)</li>
                      <li>Prefer talking over typing</li>
                      <li>Are using a mobile device</li>
                      <li>Want a more natural conversation feel</li>
                    </ul>
                  </div>
                </div>

                {/* Switch Note */}
                <div className="text-xs text-muted-foreground text-center italic">
                  Note: You can switch between modes during the conversation if you change your mind.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Additional Context */}
        <div className="text-center text-xs text-muted-foreground max-w-md mx-auto">
          <p>
            This conversation is completely confidential. Your responses help create a better workplace for everyone.
          </p>
        </div>
      </div>
    </div>
  );
};
