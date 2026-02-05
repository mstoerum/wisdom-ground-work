

# Re-Enable Voice Mode with ElevenLabs Integration

## Overview

This plan integrates the existing `SurveyModeSelector` and `VoiceInterface` components into the survey flow, giving users a clear choice between text and voice conversation modes.

## Current Problem

Voice mode is completely inaccessible because:
- `SurveyModeSelector` exists but isn't used anywhere
- `VoiceInterface` exists (with new ElevenLabs integration) but is disconnected
- No entry point in the user flow to choose voice

## Proposed Solution

### Architecture Change

```
BEFORE:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WelcomeScreen  │ --> │ FocusedInterview│ --> │    Complete     │
│  (mood dial)    │     │   (text only)   │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘

AFTER:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WelcomeScreen  │ --> │  ModeSelector   │ --> │  Mood Dial      │
│  (consent only) │     │ (text/voice)    │     │  (quick check)  │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    │                                         │
                              ┌─────▼─────┐                            ┌──────▼──────┐
                              │   Text    │ <-- switch -->             │   Voice     │
                              │ Interview │                            │  Interface  │
                              └───────────┘                            └─────────────┘
```

### File Changes

| File | Change |
|------|--------|
| `EmployeeSurveyFlow.tsx` | Add `mode-select` and `voice` steps |
| `WelcomeScreen.tsx` | Remove mood dial (move to separate step) |
| `VoiceInterface.tsx` | Add `onComplete` handler alignment |

### New Flow Steps

1. **Welcome** - Privacy info + consent only
2. **Mode Selection** - `SurveyModeSelector` (text vs voice choice)
3. **Mood** - Quick 1-5 mood check
4. **Chat/Voice** - Route based on selection
5. **Complete** - Summary + evaluation

### Implementation Details

**1. Update EmployeeSurveyFlow.tsx**

Add new conversation steps:
```typescript
type ConversationStep = "welcome" | "mode-select" | "mood" | "chat" | "voice" | "evaluation" | "complete";
```

Add state for selected mode:
```typescript
const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | null>(null);
```

Add mode selection handler:
```typescript
const handleModeSelect = (mode: 'text' | 'voice') => {
  setSelectedMode(mode);
  setStep("mood");
};
```

Update mood handler to route correctly:
```typescript
const handleMoodSelect = async (mood: number) => {
  const sessionId = await startConversation(surveyId, mood, publicLinkId);
  if (sessionId) {
    setStep(selectedMode === 'voice' ? "voice" : "chat");
  }
};
```

Render mode selector and voice interface:
```typescript
{step === "mode-select" && (
  <SurveyModeSelector
    onSelectMode={handleModeSelect}
    surveyTitle={surveyDetails?.title || "Feedback Survey"}
    firstMessage={surveyDetails?.first_message}
  />
)}

{step === "voice" && conversationId && (
  <VoiceInterface
    conversationId={conversationId}
    onSwitchToText={() => setStep("chat")}
    onComplete={handleChatComplete}
  />
)}
```

**2. Update WelcomeScreen.tsx**

Simplify to consent/privacy focus only (mood moves to separate step).

**3. Add MoodDial Component Usage**

Create a dedicated mood selection step that's shown after mode selection:
```typescript
{step === "mood" && (
  <MoodDial onMoodSelect={handleMoodSelect} />
)}
```

### UX Improvements for Voice Mode Design

Based on best practices, consider these enhancements:

1. **Orb Animation** - Improve the VoiceOrb pulse animation to feel more "alive"
2. **Transcript Styling** - Better visual hierarchy for user vs AI messages  
3. **Loading States** - Clearer "thinking" indicator with estimated time
4. **Privacy Reminder** - Persistent but unobtrusive badge showing "Audio not stored"
5. **Quick Exit** - Easy switch to text if voice feels uncomfortable

### Demo Mode Handling

For demo mode (`skipIntro=true`), show mode selector immediately:
```typescript
const [step, setStep] = useState<ConversationStep>(
  skipIntro ? "mode-select" : "welcome"
);
```

### Fallback Strategy

If ElevenLabs connection fails:
1. Show friendly error message
2. Offer "Switch to text" button prominently
3. Auto-fallback after 10 seconds of no connection

### Files to Modify

1. **`src/components/employee/EmployeeSurveyFlow.tsx`**
   - Import `SurveyModeSelector` and `VoiceInterface`
   - Add new steps to type
   - Add mode state and handlers
   - Render mode selector and voice interface

2. **`src/components/employee/MoodDial.tsx`** (or create new)
   - Standalone mood selection component

3. **`src/pages/demo/DemoEmployee.tsx`**
   - Update to show mode selector in demo

### Estimated Effort

- Mode selector integration: 2-3 credits
- Voice interface connection: 1-2 credits  
- UI polish and testing: 1-2 credits
- **Total: 4-7 credits**

### Success Criteria

- Users see clear text vs voice choice
- Voice mode uses ElevenLabs "Lily" voice
- Smooth switching between modes mid-conversation
- Demo mode showcases voice prominently
- Fallback to text works reliably

