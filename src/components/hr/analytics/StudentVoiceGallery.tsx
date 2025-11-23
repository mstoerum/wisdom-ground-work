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
import { toast } from "sonner";

interface StudentVoiceGalleryProps {
  responses: any[];
}

export function StudentVoiceGallery({ responses }: StudentVoiceGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>("all");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");

  // Extract unique themes
  const themes = useMemo(() => {
    const themeSet = new Set<string>();
    responses.forEach(r => {
      const themeName = r.survey_themes?.name;
      if (themeName) themeSet.add(themeName);
    });
    return Array.from(themeSet).sort();
  }, [responses]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    return responses.filter(response => {
      if (searchQuery && !response.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (selectedTheme !== "all" && response.survey_themes?.name !== selectedTheme) {
        return false;
      }

      if (selectedSentiment !== "all") {
        if (selectedSentiment === "positive" && response.sentiment !== "positive") return false;
        if (selectedSentiment === "negative" && response.sentiment !== "negative") return false;
        if (selectedSentiment === "neutral" && response.sentiment !== "neutral") return false;
      }

      return true;
    });
  }, [responses, searchQuery, selectedTheme, selectedSentiment]);

  // Group by sentiment
  const responsesBySentiment = useMemo(() => {
    return {
      positive: filteredResponses.filter(r => r.sentiment === "positive"),
      neutral: filteredResponses.filter(r => r.sentiment === "neutral"),
      negative: filteredResponses.filter(r => r.sentiment === "negative"),
    };
  }, [filteredResponses]);

  const handleExport = () => {
    const csvContent = [
      ['Feedback', 'Sentiment', 'Score', 'Dimension', 'Date'],
      ...filteredResponses.map(r => [
        `"${r.content.replace(/"/g, '""')}"`,
        r.sentiment || 'N/A',
        r.sentiment_score?.toFixed(1) || 'N/A',
        r.survey_themes?.name || 'N/A',
        new Date(r.created_at).toLocaleDateString(),
      ]),
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-feedback-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Student feedback exported successfully");
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

  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Student Feedback Yet</h3>
          <p className="text-muted-foreground">
            Student feedback will appear here as course evaluations are completed.
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
                Student Voice Gallery
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredResponses.length} of {responses.length} student responses
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
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search student feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedTheme} onValueChange={setSelectedTheme}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All dimensions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dimensions</SelectItem>
                {themes.map(theme => (
                  <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
          </div>
        </CardContent>
      </Card>

      {/* Feedback Display */}
      <div className="space-y-8">
        {responsesBySentiment.positive.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Positive Feedback ({responsesBySentiment.positive.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {responsesBySentiment.positive.map(response => (
                <Card key={response.id} className={`${getSentimentColor(response.sentiment)} border-l-4`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(response.sentiment)}
                        {response.survey_themes?.name && (
                          <Badge variant="outline" className="text-xs">
                            {response.survey_themes.name}
                          </Badge>
                        )}
                      </div>
                      {response.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          {response.sentiment_score.toFixed(0)}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm italic mb-2">"{response.content}"</p>
                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(response.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {responsesBySentiment.neutral.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Minus className="h-5 w-5 text-gray-600" />
              Neutral Observations ({responsesBySentiment.neutral.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {responsesBySentiment.neutral.map(response => (
                <Card key={response.id} className={`${getSentimentColor(response.sentiment)} border-l-4`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(response.sentiment)}
                        {response.survey_themes?.name && (
                          <Badge variant="outline" className="text-xs">
                            {response.survey_themes.name}
                          </Badge>
                        )}
                      </div>
                      {response.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          {response.sentiment_score.toFixed(0)}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm italic mb-2">"{response.content}"</p>
                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(response.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {responsesBySentiment.negative.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Concerns & Feedback ({responsesBySentiment.negative.length})
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {responsesBySentiment.negative.map(response => (
                <Card key={response.id} className={`${getSentimentColor(response.sentiment)} border-l-4`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(response.sentiment)}
                        {response.survey_themes?.name && (
                          <Badge variant="outline" className="text-xs">
                            {response.survey_themes.name}
                          </Badge>
                        )}
                      </div>
                      {response.sentiment_score && (
                        <span className="text-xs text-muted-foreground">
                          {response.sentiment_score.toFixed(0)}/100
                        </span>
                      )}
                    </div>
                    <p className="text-sm italic mb-2">"{response.content}"</p>
                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(response.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredResponses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Feedback Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more student feedback.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
