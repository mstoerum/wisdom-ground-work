

# Fix Interactive Elements Triggering + Theme Transition Interactives

Two problems to solve: (1) the AI never triggers interactive elements because it lacks conversation context, and (2) interactive elements should serve as natural bridges when transitioning between themes.

---

## Problem 1: Why Interactive Elements Never Appear

In `supabase/functions/chat/index.ts` line 809, the conversation context is built with an empty array:

```
const conversationContext = buildConversationContextForType(surveyType, [], themes);
```

This means the AI never receives "Exchange count: 3" or any conversation state. And in `buildConversationContextForType` (line 227), an empty array causes it to return an empty string entirely. So the AI has zero awareness of where it is in the conversation and never knows it should switch to an interactive input.

**Fix**: Pass `mockResponses` (which already exists on line 770) instead of `[]`.

---

## Problem 2: Interactive Elements as Theme Transitions

Currently, theme transitions happen implicitly -- the AI just asks about a different topic. The idea is to use interactive elements as explicit, delightful transition moments:

- **Word Cloud** when moving to a new theme: "We've explored [Theme A]. Which of these would you like to discuss next?" with the remaining themes as selectable chips
- **Sentiment Pulse** as a bridge: quick temperature check before pivoting topics
- **Agreement Spectrum** to close out a theme: "Would you say [summary of theme] captures your experience?" before moving on

This requires updating the system prompt to explicitly instruct the AI to use interactive elements at theme boundaries.

---

## Changes

### 1. `supabase/functions/chat/index.ts` (line 809)

Replace empty array with `mockResponses`:

```
const conversationContext = buildConversationContextForType(surveyType, mockResponses, themes);
```

This one-line fix gives the AI the exchange count, discussed topics, and sentiment pattern it needs to make inputType decisions.

### 2. `supabase/functions/chat/context-prompts.ts`

Update both prompt functions (course evaluation and employee satisfaction) to add explicit theme-transition instructions:

**Add to the RHYTHM section:**
```
THEME TRANSITIONS - Use interactive elements to bridge between themes:
- When transitioning to a new theme after 2-3 exchanges on the current one, use "word_cloud" with the remaining undiscussed themes as options. This lets the participant choose what to explore next.
- Before transitioning, optionally use "agreement_spectrum" to validate your understanding of the current theme: "Does that capture your experience with [theme]?"
- Use "sentiment_pulse" as a mid-conversation temperature check between themes.
```

**Add a few-shot example for theme transitions:**
```
[After 2-3 exchanges on "Team Dynamics", transitioning to next theme]
{"empathy": "Thanks for that perspective.", "question": "Which of these would you like to explore next?", "inputType": "word_cloud", "inputConfig": {"options": ["Career Growth", "Work-Life Balance", "Leadership"], "allowOther": false, "maxSelections": 1}}
```

**Update `buildConversationContextForType`:**
- Add an explicit instruction when exchange count hits 3, 6, 9 (every ~3 exchanges) to remind the AI to use an interactive element
- Add theme transition hints: "You have been on the current theme for N exchanges. Consider using an interactive element to transition."

### 3. `supabase/functions/chat/context-prompts.ts` - `buildConversationContextForType`

Enhance the adaptive instructions section:

```
INTERACTIVE ELEMENT REMINDERS:
- Exchange count is ${previousResponses.length}. 
  ${previousResponses.length >= 2 && previousResponses.length <= 3 ? "You MUST use an interactive inputType (not text) for this response. Choose sentiment_pulse, confidence_check, or word_cloud." : ""}
  ${previousResponses.length >= 5 && previousResponses.length <= 6 ? "Time for another interactive element. Use word_cloud with remaining themes to let the participant choose what to discuss next." : ""}
  ${previousResponses.length >= 8 ? "Consider using agreement_spectrum to validate your understanding before wrapping up." : ""}
```

This adds strong nudges at specific exchange counts so the AI reliably switches modality.

---

## Files Summary

| File | Action | What Changes |
|------|--------|-------------|
| `supabase/functions/chat/index.ts` | Modify (1 line) | Pass `mockResponses` instead of `[]` to `buildConversationContextForType` |
| `supabase/functions/chat/context-prompts.ts` | Modify | Add theme-transition instructions to both prompts, enhance `buildConversationContextForType` with interactive element reminders at specific exchange counts, add few-shot theme transition examples |

---

## Expected Behavior After Fix

```text
Exchange 1:  [Mood Selector]            -- existing
Exchange 2:  [Text answer]              -- open text, first theme
Exchange 3:  [Text answer]              -- follow-up on first theme  
Exchange 4:  [Sentiment Pulse or Check]  -- AI triggers interactive (exchange count = 3)
Exchange 5:  [Text answer]              -- deeper follow-up
Exchange 6:  [Word Cloud: pick theme]   -- theme transition (exchange count ~5-6)
Exchange 7:  [Text answer]              -- new theme
Exchange 8:  [Text answer]              -- follow-up
Exchange 9:  [Agreement Spectrum]        -- validate understanding (exchange count ~8)
Exchange 10: [Text answer]              -- final thoughts
```

Interactive elements now serve dual purpose: breaking monotony AND creating intentional theme transitions.

