
## Plan: Disable Voice Mode Features

### Overview
Temporarily disable all voice mode functionality across the interview interfaces to prevent user confusion since the feature is not fully active. This includes removing the mic icon in the text input, hiding voice mode promotion banners, and disabling voice mode toggles.

---

### Current State

Voice mode elements are scattered across multiple components:

| Component | Element | Status |
|-----------|---------|--------|
| `AnswerInput.tsx` | Mic button in text area | Shows when `onTranscribe` prop provided |
| `FocusedInterviewInterface.tsx` | Passes `handleTranscribe` | Enables mic in AnswerInput |
| `ChatInterface.tsx` | Voice promotion banner | Shows conditionally |
| `ChatInterface.tsx` | "Voice Mode" toggle button | Shows when voice supported |
| `ChatInterface.tsx` | Large recording button | Shows in chat input area |
| `ChatInterface.tsx` | VoiceInterface rendering | When `isVoiceMode=true` |
| `SurveyModeSelector.tsx` | Mode selection screen | Not integrated, no action needed |

---

### Part 1: Remove Mic from FocusedInterviewInterface

**File: `src/components/employee/FocusedInterviewInterface.tsx`**

Remove the `onTranscribe` prop from AnswerInput to hide the mic button:

```typescript
// Line 463 - Before:
onTranscribe={handleTranscribe}

// After: Remove this line entirely
// (Don't pass onTranscribe, mic won't render)
```

**Also remove unused code:**
- Remove `isTranscribing` state (line 75)
- Remove `handleTranscribe` function (lines 316-359)

---

### Part 2: Disable Voice Mode in ChatInterface

**File: `src/components/employee/ChatInterface.tsx`**

**2a. Remove Voice Mode Promotion Banner (lines 420-439)**

Remove or comment out the entire Alert component that promotes voice mode.

**2b. Remove Voice Mode Toggle Button (lines 461-472)**

Remove the "Voice Mode" button from the header that shows when `voiceSupported`.

**2c. Remove Large Recording Button (lines 617-639)**

Remove the large mic button in the chat input area.

**2d. Simplify voice-related state (lines 111-112)**

Remove or keep as unused:
- `isVoiceMode` state
- `voiceSupported` state

**2e. Remove VoiceInterface conditional (lines 390-399)**

Remove the block that renders `VoiceInterface` when `isVoiceMode` is true.

---

### Part 3: Clean Up Imports

**File: `src/components/employee/FocusedInterviewInterface.tsx`**
- No voice-related imports to remove (Mic not directly used)

**File: `src/components/employee/ChatInterface.tsx`**
- Remove `VoiceInterface` import
- Keep `Mic` import if used elsewhere, otherwise remove

---

### Summary of Changes

| File | Change |
|------|--------|
| `FocusedInterviewInterface.tsx` | Remove `onTranscribe` prop, `isTranscribing` state, `handleTranscribe` function |
| `ChatInterface.tsx` | Remove voice promotion banner, voice toggle button, recording button, VoiceInterface rendering |

---

### What's Preserved (for future re-enablement)

The following will remain in the codebase but unused:
- `VoiceInterface.tsx` component
- `useVoiceChat.ts` hook
- `useRealtimeVoice.ts` hook
- `SurveyModeSelector.tsx` component
- Voice-related edge functions

This allows easy re-enablement when voice mode is ready.

---

### Testing Checklist

- [ ] FocusedInterviewInterface: No mic icon in answer input
- [ ] ChatInterface: No voice promotion banner appears
- [ ] ChatInterface: No "Voice Mode" button in header
- [ ] ChatInterface: No large recording button in input area
- [ ] Text-based interview flow works normally
- [ ] No console errors from removed components
