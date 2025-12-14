import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Users, Quote, TrendingUp } from "lucide-react";
import { EMOTION_SPECTRUM } from "@/lib/reportDesignSystem";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface VoiceQuote {
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  agreementPercentage?: number;
  theme?: string;
}

interface VoicesFirstSectionProps {
  totalVoices: number;
  participationRate: number;
  quotes: VoiceQuote[];
  participationTrend?: number;
}

export function VoicesFirstSection({
  totalVoices,
  participationRate,
  quotes,
  participationTrend,
}: VoicesFirstSectionProps) {
  // Sort quotes by agreement percentage to show most significant first
  const sortedQuotes = [...quotes].sort((a, b) => 
    (b.agreementPercentage || 0) - (a.agreementPercentage || 0)
  );

  const getSentimentColor = (sentiment: VoiceQuote['sentiment']) => {
    switch (sentiment) {
      case 'positive': return EMOTION_SPECTRUM.thriving;
      case 'negative': return EMOTION_SPECTRUM.challenged;
      default: return EMOTION_SPECTRUM.emerging;
    }
  };

  // Variable typography based on agreement
  const getQuoteSize = (agreementPercentage?: number) => {
    if (!agreementPercentage) return 'text-sm';
    if (agreementPercentage >= 70) return 'text-lg font-semibold';
    if (agreementPercentage >= 40) return 'text-base font-medium';
    return 'text-sm';
  };

  return (
    <div className="space-y-6">
      {/* Chapter header */}
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: EMOTION_SPECTRUM.growing.background }}
        >
          <MessageCircle 
            className="h-6 w-6" 
            style={{ color: EMOTION_SPECTRUM.growing.primary }}
          />
        </div>
        <div>
          <Badge variant="secondary" className="mb-2">Chapter 1</Badge>
          <h2 className="text-2xl font-bold">The Voices</h2>
          <p className="text-muted-foreground">Who spoke, and what they shared</p>
        </div>
      </div>

      {/* Participation stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4" style={{ borderLeftColor: EMOTION_SPECTRUM.growing.primary }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Voices</p>
                <p className="text-3xl font-bold">{totalVoices}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: EMOTION_SPECTRUM.thriving.primary }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participation</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{participationRate}%</p>
                  {participationTrend !== undefined && participationTrend !== 0 && (
                    <span className={cn(
                      "text-sm font-medium",
                      participationTrend > 0 ? "text-emerald-600" : "text-rose-600"
                    )}>
                      {participationTrend > 0 ? '+' : ''}{participationTrend}%
                    </span>
                  )}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4" style={{ borderLeftColor: EMOTION_SPECTRUM.emerging.primary }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shared Thoughts</p>
                <p className="text-3xl font-bold">{quotes.length}</p>
              </div>
              <Quote className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured quotes with variable typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Quote className="h-5 w-5 text-primary" />
            What Your People Said
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedQuotes.slice(0, 5).map((quote, index) => {
            const colors = getSentimentColor(quote.sentiment);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-4 py-3 rounded-r-lg"
                style={{ backgroundColor: colors.background }}
              >
                {/* Accent bar */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                  style={{ backgroundColor: colors.primary }}
                />
                
                {/* Quote content */}
                <blockquote className={cn(
                  getQuoteSize(quote.agreementPercentage),
                  "italic"
                )}>
                  "{quote.text}"
                </blockquote>
                
                {/* Metadata */}
                <div className="flex items-center gap-3 mt-2">
                  {quote.agreementPercentage && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: colors.background,
                        color: colors.text
                      }}
                    >
                      {quote.agreementPercentage}% resonate
                    </Badge>
                  )}
                  {quote.theme && (
                    <span className="text-xs text-muted-foreground">
                      {quote.theme}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
