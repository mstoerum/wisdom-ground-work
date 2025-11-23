import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MessageSquare, 
  Download, 
  Filter,
  Quote,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { ConversationQuote } from "@/lib/conversationAnalytics";
import { toast } from "sonner";
import { getTerminology } from "@/lib/contextualTerminology";
import type { Database } from "@/integrations/supabase/types";

interface EmployeeVoiceGalleryProps {
  quotes: ConversationQuote[];
  isLoading?: boolean;
  surveyType?: Database['public']['Enums']['survey_type'];
}

export function EmployeeVoiceGallery({ quotes, isLoading, surveyType = 'employee_satisfaction' }: EmployeeVoiceGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  
  const terminology = getTerminology(surveyType);

  // Extract unique themes and departments
  const themes = useMemo(() => {
    const themeSet = new Set<string>();
    quotes.forEach(q => {
      if (q.theme_name) themeSet.add(q.theme_name);
    });
    return Array.from(themeSet).sort();
  }, [quotes]);

  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    quotes.forEach(q => {
      if (q.department) deptSet.add(q.department);
    });
    return Array.from(deptSet).sort();
  }, [quotes]);

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (searchQuery && !quote.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Theme filter
      if (selectedTheme !== "all" && quote.theme_name !== selectedTheme) {
        return false;
      }

      // Sentiment filter
      if (selectedSentiment !== "all") {
        if (selectedSentiment === "positive" && quote.sentiment !== "positive") return false;
        if (selectedSentiment === "negative" && quote.sentiment !== "negative") return false;
        if (selectedSentiment === "neutral" && quote.sentiment !== "neutral") return false;
      }

      // Department filter
      if (selectedDepartment !== "all" && quote.department !== selectedDepartment) {
        return false;
      }

      return true;
    });
  }, [quotes, searchQuery, selectedTheme, selectedSentiment, selectedDepartment]);

  // Group quotes by sentiment for better organization
  const quotesBySentiment = useMemo(() => {
    const groups = {
      positive: filteredQuotes.filter(q => q.sentiment === "positive"),
      neutral: filteredQuotes.filter(q => q.sentiment === "neutral"),
      negative: filteredQuotes.filter(q => q.sentiment === "negative"),
    };
    return groups;
  }, [filteredQuotes]);

  const handleExport = () => {
    const csvContent = [
      ['Quote', 'Sentiment', 'Sentiment Score', 'Theme', 'Department', 'Date'],
      ...filteredQuotes.map(q => [
        `"${q.text.replace(/"/g, '""')}"`,
        q.sentiment || 'N/A',
        q.sentiment_score?.toFixed(1) || 'N/A',
        q.theme_name || 'N/A',
        q.department || 'N/A',
        new Date(q.created_at).toLocaleDateString(),
      ]),
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${terminology.exportPrefix}-voice-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Quotes exported successfully");
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20';
      case 'negative':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading {terminology.voice.toLowerCase()}...</p>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Quotes Available</h3>
          <p className="text-muted-foreground">
            {terminology.feedback} will appear here as evaluations are completed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                {terminology.voiceGallery}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredQuotes.length} of {quotes.length} quotes
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Theme Filter */}
            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All themes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All themes</SelectItem>
                {themes.map(theme => (
                  <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sentiment Filter */}
            <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All sentiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            {departments.length > 0 && (
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotes Display */}
      <div className="space-y-8">
        {/* Positive Quotes */}
        {quotesBySentiment.positive.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Positive Feedback ({quotesBySentiment.positive.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {quotesBySentiment.positive.map(quote => (
                <Card key={quote.id} className={`${getSentimentColor(quote.sentiment)} border-l-4`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(quote.sentiment)}
                        {quote.theme_name && (
                          <Badge variant="outline" className="text-xs">
                            {quote.theme_name}
                          </Badge>
                        )}
                      </div>
                      {quote.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          {quote.sentiment_score.toFixed(0)}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm italic mb-2">"{quote.text}"</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {quote.department && (
                        <span>{quote.department}</span>
                      )}
                      <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Neutral Quotes */}
        {quotesBySentiment.neutral.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Minus className="h-5 w-5 text-gray-600" />
              Neutral Observations ({quotesBySentiment.neutral.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {quotesBySentiment.neutral.map(quote => (
                <Card key={quote.id} className={`${getSentimentColor(quote.sentiment)} border-l-4`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(quote.sentiment)}
                        {quote.theme_name && (
                          <Badge variant="outline" className="text-xs">
                            {quote.theme_name}
                          </Badge>
                        )}
                      </div>
                      {quote.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          {quote.sentiment_score.toFixed(0)}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm italic mb-2">"{quote.text}"</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {quote.department && (
                        <span>{quote.department}</span>
                      )}
                      <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Negative Quotes */}
        {quotesBySentiment.negative.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Concerns & Feedback ({quotesBySentiment.negative.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {quotesBySentiment.negative.map(quote => (
                <Card key={quote.id} className={`${getSentimentColor(quote.sentiment)} border-l-4`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(quote.sentiment)}
                        {quote.theme_name && (
                          <Badge variant="outline" className="text-xs">
                            {quote.theme_name}
                          </Badge>
                        )}
                      </div>
                      {quote.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          {quote.sentiment_score.toFixed(0)}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm italic mb-2">"{quote.text}"</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {quote.department && (
                        <span>{quote.department}</span>
                      )}
                      <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredQuotes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Quotes Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more quotes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
