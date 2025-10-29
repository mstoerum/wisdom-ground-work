import React, { useState } from 'react';
import { ChatInterface } from '@/components/employee/ChatInterface';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrustAnalytics, clearTrustAnalytics } from '@/lib/trustAnalytics';

const TestTrustFlow = () => {
  const [showChat, setShowChat] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const handleStartTest = () => {
    setShowChat(true);
  };

  const handleComplete = () => {
    setShowChat(false);
    setAnalytics(getTrustAnalytics());
  };

  const handleSaveAndExit = () => {
    setShowChat(false);
  };

  const handleClearAnalytics = () => {
    clearTrustAnalytics();
    setAnalytics(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sprint 1: Trust Revolution - Test Page</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This page allows you to test the new trust-building components implemented in Sprint 1.
            </p>
            <div className="space-x-4">
              <Button onClick={handleStartTest} disabled={showChat}>
                Start Trust Flow Test
              </Button>
              <Button onClick={handleClearAnalytics} variant="outline">
                Clear Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {showChat && (
          <Card>
            <CardHeader>
              <CardTitle>Trust Flow Test</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInterface
                conversationId="test-conversation-123"
                onComplete={handleComplete}
                onSaveAndExit={handleSaveAndExit}
                showTrustFlow={true}
              />
            </CardContent>
          </Card>
        )}

        {analytics && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Trust Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Ritual Completion Rate</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics.ritualCompletionRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Anonymization Confidence</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.anonymizationConfidence}%
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cultural Adaptation</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.culturalAdaptationEffectiveness}%
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User Engagement</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {analytics.userEngagement}%
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Trust Indicators Viewed</h3>
                  <p className="text-2xl font-bold text-indigo-600">
                    {analytics.trustIndicatorsViewed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestTrustFlow;