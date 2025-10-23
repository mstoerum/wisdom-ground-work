import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

export const OnboardingTour = () => {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('spradley-tour-completed');
    if (!hasSeenTour) {
      // Delay tour start to ensure page is fully loaded
      const timer = setTimeout(() => setRunTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-lg font-bold mb-2">Welcome to Spradley! 👋</h2>
          <p>Let's take a quick tour to help you get started with AI-powered employee feedback.</p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '[data-tour="create-survey"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Create Your First Survey</h3>
          <p>Click here to start building a conversational AI survey. Our wizard will guide you through theme selection, scheduling, and privacy settings.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="analytics"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">View Insights & Analytics</h3>
          <p>Once employees complete surveys, you'll find sentiment trends, theme insights, and urgent flags here.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="commitments"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Track Action Commitments</h3>
          <p>Turn survey insights into actionable commitments that you can share with employees to show you're listening.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="settings"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Manage Team & Settings</h3>
          <p>Add HR team members, configure survey defaults, and manage system preferences here.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: 'body',
      content: (
        <div>
          <h2 className="text-lg font-bold mb-2">You're All Set! 🚀</h2>
          <p>Ready to gather authentic employee feedback? Create your first survey to begin.</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('spradley-tour-completed', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          arrowColor: 'hsl(var(--background))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          borderRadius: 6,
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};
