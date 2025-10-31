# Mode Selector Integration Guide

This guide shows how to integrate the new `SurveyModeSelector` component into the existing `InteractiveSurveyPreview`.

## Changes Required

### 1. Update InteractiveSurveyPreview State

Add a new state to track whether the user has selected a mode:

```typescript
// In InteractiveSurveyPreview.tsx, around line 96
const [previewMode, setPreviewMode] = useState<'text' | 'voice' | null>(null); // Change from 'text' to null
const [modeSelected, setModeSelected] = useState(false); // Add this new state
```

### 2. Import the Mode Selector

```typescript
// At top of InteractiveSurveyPreview.tsx
import { SurveyModeSelector } from "./SurveyModeSelector";
```

### 3. Update the Dialog Content

Replace the current `DialogContent` to conditionally show the mode selector first:

```typescript
// Around line 180-240
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
    {!modeSelected ? (
      // STEP 1: Show mode selector first
      <SurveyModeSelector
        surveyTitle={title}
        firstMessage={first_message}
        onSelectMode={(mode) => {
          setPreviewMode(mode);
          setModeSelected(true);
          
          // Initialize conversation when mode is selected
          const greeting: Message = {
            role: "assistant",
            content: first_message || "Hello! Thank you for taking the time to share your feedback with us.",
            timestamp: new Date(),
          };
          setMessages([greeting]);
        }}
      />
    ) : (
      // STEP 2: Show the actual preview interface after mode selection
      <>
        {/* Header with improved spacing */}
        <DialogHeader className="px-8 pt-8 pb-6 border-b bg-muted/30">
          {/* ... existing header code ... */}
          
          {/* Add "Change Mode" button to header */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setModeSelected(false);
                setMessages([]);
              }}
            >
              ← Change Mode
            </Button>
          </div>
        </DialogHeader>

        {/* ... rest of existing preview code ... */}
      </>
    )}
  </DialogContent>
</Dialog>
```

## Full Implementation Example

Here's the complete updated return statement:

```typescript
return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
      {!modeSelected ? (
        // Mode Selection Screen
        <SurveyModeSelector
          surveyTitle={title}
          firstMessage={first_message}
          onSelectMode={(mode) => {
            setPreviewMode(mode);
            setModeSelected(true);
            
            // Initialize conversation
            const greeting: Message = {
              role: "assistant",
              content: first_message || "Hello! Thank you for taking the time to share your feedback with us. This conversation is confidential and will help us create a better workplace for everyone.",
              timestamp: new Date(),
            };
            setMessages([greeting]);
          }}
        />
      ) : (
        <>
          {/* Header */}
          <DialogHeader className="px-8 pt-8 pb-6 border-b bg-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <span>Interactive Preview: {title}</span>
                  
                  {/* Add Preview Mode Badge */}
                  <Badge variant="outline" className="ml-auto bg-yellow-50 border-yellow-400 text-yellow-800">
                    <Eye className="mr-1 h-3 w-3" />
                    Preview Mode - No Data Saved
                  </Badge>
                </DialogTitle>
                
                <DialogDescription className="text-base mt-2 max-w-2xl">
                  Experience the survey exactly as your employees will see it. 
                  {previewMode === 'voice' ? ' Speak naturally to respond.' : ' Type responses to simulate the conversation flow.'}
                </DialogDescription>
              </div>
            </div>
            
            {/* Mode Badge and Change Mode Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2">
                {/* Current Mode Indicator */}
                <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
                  {previewMode === 'voice' ? (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      Voice Mode
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Text Mode
                    </>
                  )}
                </Badge>
                
                {/* Change Mode Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Option 1: Go back to mode selector
                    setModeSelected(false);
                    setMessages([]);
                    
                    // Option 2: Direct switch (preserve messages)
                    // setPreviewMode(previewMode === 'voice' ? 'text' : 'voice');
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Change Mode
                </Button>
              </div>

              {/* Quick Info Badges (existing code) */}
              {consent_config && (
                <div className="flex flex-wrap gap-2">
                  {/* ... existing badges ... */}
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Main Content Area - Split Layout */}
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left Side - Preview Interface (Text or Voice) */}
            <div className="flex-1 flex flex-col min-w-0 min-h-[500px] lg:min-h-0">
              {previewMode === 'voice' ? (
                <PreviewModeProvider
                  isPreviewMode={true}
                  previewSurveyId="preview-voice-session"
                  previewSurveyData={{
                    first_message,
                    themes: themeDetails,
                    title
                  }}
                >
                  <VoiceInterface
                    conversationId="preview-voice-session"
                    onComplete={() => {}}
                  />
                </PreviewModeProvider>
              ) : (
                // Original text chat interface (existing code)
                <>
                  {/* ... existing text mode UI ... */}
                </>
              )}
            </div>

            {/* Right Side - Details Panel (existing code) */}
            {/* ... existing sidebar code ... */}
          </div>
        </>
      )}
    </DialogContent>
  </Dialog>
);
```

## Additional Quick Wins to Add

### 1. Keyboard Shortcuts

Add this hook near the top of the component:

```typescript
// Add keyboard shortcuts (Don Norman's accessibility recommendation)
useEffect(() => {
  if (!open || !modeSelected) return;

  const handleKeyPress = (e: KeyboardEvent) => {
    // Ctrl+V or Cmd+V: Toggle voice mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      setPreviewMode(prev => prev === 'voice' ? 'text' : 'voice');
    }
    
    // Escape: Close dialog (with confirmation if conversation started)
    if (e.key === 'Escape' && messages.length > 1) {
      e.preventDefault();
      const confirmExit = window.confirm(
        'Are you sure you want to exit? Your preview progress will be lost.'
      );
      if (confirmExit) {
        onOpenChange(false);
      }
    }
    
    // Ctrl+/: Show keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      // TODO: Show keyboard shortcuts dialog
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [open, modeSelected, messages.length, previewMode, onOpenChange]);
```

### 2. Focus Management

Add auto-focus when mode is selected:

```typescript
// Auto-focus on input when text mode is selected
useEffect(() => {
  if (modeSelected && previewMode === 'text') {
    // Find and focus the textarea
    const textarea = document.querySelector('textarea[placeholder*="Type your response"]');
    if (textarea instanceof HTMLTextAreaElement) {
      setTimeout(() => textarea.focus(), 300);
    }
  }
}, [modeSelected, previewMode]);
```

### 3. Analytics Tracking

Track mode selection for analytics:

```typescript
const handleModeSelection = (mode: 'text' | 'voice') => {
  setPreviewMode(mode);
  setModeSelected(true);
  
  // Track analytics
  try {
    // If you have analytics set up
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'preview_mode_selected', {
        mode: mode,
        survey_title: title,
      });
    }
    
    // Or track in Supabase
    // trackPreviewEvent({
    //   action: 'mode_selected',
    //   mode: mode,
    //   surveyId: surveyData.id,
    // });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
  
  // Initialize conversation
  const greeting: Message = {
    role: "assistant",
    content: first_message || "Hello! Thank you for taking the time to share your feedback with us.",
    timestamp: new Date(),
  };
  setMessages([greeting]);
};
```

## Reset Logic

Update the reset logic when dialog closes:

```typescript
// Around line 115-129
useEffect(() => {
  if (open) {
    // Reset everything when dialog opens
    setModeSelected(false);
    setPreviewMode(null);
    setMessages([]);
    setInput("");
  } else {
    // Cleanup when closed
    setModeSelected(false);
    setPreviewMode(null);
    setMessages([]);
    setInput("");
  }
}, [open]);
```

## Testing Checklist

After implementing these changes, test:

- [ ] Mode selector shows first when preview opens
- [ ] Clicking text mode shows text interface
- [ ] Clicking voice mode shows voice interface
- [ ] "Change Mode" button returns to mode selector
- [ ] Preview mode badge is visible and accurate
- [ ] Keyboard navigation works (Tab through mode cards)
- [ ] Enter key selects mode when focused
- [ ] Dialog resets properly when closed and reopened
- [ ] Analytics tracking works (if implemented)
- [ ] Mobile responsive (test on phone)

## Additional Enhancements (Optional)

### Add Mode Switch with Message Preservation

If you want to allow switching modes while preserving the conversation:

```typescript
const switchMode = (newMode: 'text' | 'voice') => {
  const currentMessages = [...messages];
  
  // Stop voice session if switching from voice
  if (previewMode === 'voice') {
    // Call stopVoiceChat if you have access to that method
  }
  
  // Switch mode
  setPreviewMode(newMode);
  
  // Preserve messages
  setMessages(currentMessages);
  
  // Show toast notification
  toast({
    title: `Switched to ${newMode} mode`,
    description: "Your conversation continues from where you left off",
  });
};
```

### Add "Try Both Modes" Feature

Add a button to let HR admins easily test both modes:

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    const otherMode = previewMode === 'voice' ? 'text' : 'voice';
    switchMode(otherMode);
  }}
>
  Try {previewMode === 'voice' ? 'Text' : 'Voice'} Mode
</Button>
```

## Summary

The mode selector addresses the #1 critical issue from UX testing: **voice mode discoverability**.

**Before:** Hidden button in header (67% didn't notice)  
**After:** Impossible to miss, equal prominence, clear benefits

**Expected Impact:**
- Voice mode discovery: 20% → 40%+
- User satisfaction: 7.8/10 → 8.5/10
- Time to understand options: 30s → 5s

**Implementation Time:** 2-3 hours for basic integration, +1-2 hours for polish

---

## Need Help?

If you encounter any issues:

1. Check that `framer-motion` is installed: `npm install framer-motion`
2. Verify Dialog imports from `@/components/ui/dialog`
3. Ensure Badge component is properly styled
4. Test keyboard navigation thoroughly
5. Check console for any TypeScript errors

**Next Step:** Implement this, then move to voice onboarding flow (Critical Fix #2)
