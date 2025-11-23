import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, MessageSquare, BookOpen } from "lucide-react";

interface CourseMetricCardsProps {
  responses: any[];
  courseEvaluations: any[];
}

export function CourseMetricCards({ responses, courseEvaluations }: CourseMetricCardsProps) {
  // Calculate metrics
  const totalStudents = new Set(responses.map(r => r.conversation_sessions?.id)).size;
  
  const avgResponseRate = courseEvaluations.length > 0
    ? Math.round(
        courseEvaluations.reduce((sum, survey) => {
          const surveyResponses = responses.filter(r => r.survey_id === survey.id);
          const uniqueSessions = new Set(surveyResponses.map(r => r.conversation_sessions?.id)).size;
          return sum + (uniqueSessions / Math.max(uniqueSessions, 1)) * 100;
        }, 0) / courseEvaluations.length
      )
    : 0;

  const avgSentiment = responses.length > 0
    ? Math.round(
        responses.reduce((sum, r) => sum + (r.sentiment_score || 50), 0) / responses.length
      )
    : 0;

  const themeCount = new Set(responses.map(r => r.survey_themes?.name).filter(Boolean)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Students Evaluated</p>
              <p className="text-3xl font-bold text-primary">{totalStudents}</p>
              <p className="text-xs text-muted-foreground mt-1">across all courses</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Rate</p>
              <p className="text-3xl font-bold text-green-600">{avgResponseRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">student participation</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Student Sentiment</p>
              <p className="text-3xl font-bold text-blue-600">{avgSentiment}/100</p>
              <p className="text-xs text-muted-foreground mt-1">overall satisfaction</p>
            </div>
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Dimensions Covered</p>
              <p className="text-3xl font-bold text-purple-600">{themeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">evaluation areas</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
