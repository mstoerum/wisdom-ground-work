

# End-of-Conversation: Employee-Driven Topic Exploration

## Summary

When all HR-configured themes are covered, the AI will offer a `word_cloud` with **new topics the employee might care about** — things not in the survey but inferred from conversation hints. This gives employees agency to surface what matters to them. The existing mid-conversation `word_cloud` for narrowing sub-topics within a theme stays unchanged.

## Flow

```text
Main conversation (unchanged):
  Theme A → word_cloud to pick sub-topic → follow-up → bridge
  Theme B → follow-up → bridge
  Theme C → word_cloud to pick sub-topic → follow-up

End-of-conversation (new):
  AI: "We've covered the main topics. Anything else on your mind?"
  [Career Growth] [Compensation] [Team Culture] [Something else…] [I'm all good]

  Employee picks "Career Growth" →
  AI: 1-2 questions exploring career growth →
  AI: "Anything else?"
  [Compensation] [Team Culture] [Something else…] [I'm all good]

  Employee picks "I'm all good" → Summary Receipt → Complete
```

## Technical Changes

### 1. `supabase/functions/chat/context-prompts.ts`

**Update step 5** in both `getEmployeeSatisfactionPrompt` (line 135) and `getCourseEvaluationPrompt` (line 90):

From:
```
5. When all themes covered: ask "Anything else?" then thank briefly
```

To:
```
5. When all themes covered: offer a word_cloud with 3-4 NEW topics NOT in the survey themes.
   Infer relevant topics from conversation hints (e.g. mentions of workload → "Work-Life Balance",
   mentions of skills → "Career Growth", mentions of pay → "Compensation").
   Always include "I'm all good" as the last option. Set allowOther to true and maxSelections to 1.
   If they pick a topic, explore it with 1-2 questions, then offer another word_cloud
   (minus explored topics) with "I'm all good". If they pick "I'm all good", thank them briefly.
```

**Add example** to the EXAMPLES section in both prompts:
```json
{"empathy": "Thanks for sharing all of that.", "question": "We've covered the main topics. Is there anything else on your mind?", "inputType": "word_cloud", "inputConfig": {"options": ["Career Growth", "Team Culture", "Work-Life Balance", "I'm all good"], "maxSelections": 1, "allowOther": true}}
```

**Keep unchanged**: The `word_cloud` input type definition (line 23) and its use for narrowing sub-topics within a theme.

### 2. `supabase/functions/chat/index.ts`

**Update adaptive instructions** (lines 296-297) for the `isNearCompletion && uncoveredThemes.length === 0` case:

From:
```
All themes covered with good depth. Start moving toward a natural conclusion.
Ask if there's anything else important they'd like to share, then thank them warmly.
```

To:
```
All themes covered. Offer a word_cloud with 3-4 NEW topics NOT in the survey themes.
Infer from conversation hints (e.g. mentions of workload → "Work-Life Balance",
mentions of skills → "Career Growth"). Always include "I'm all good" as last option.
Set allowOther: true, maxSelections: 1.
If user selected "[SELECTED: I'm all good]", proceed to completion and generate structuredSummary.
If they selected a topic, explore with 1-2 questions then offer word_cloud again.
```

**Add detection** for `[SELECTED: I'm all good]` in the user message processing: when detected, set `shouldComplete: true` and generate the structured summary to trigger the existing summary receipt flow.

### 3. Delete `src/components/employee/ThemeSelector.tsx`

This component is unused — never imported in the interview flow. The `WordCloudSelector` component handles all chip-based selection. The HR wizard's `ThemeSelector` (`src/components/hr/wizard/ThemeSelector.tsx`) is a completely different component and stays.

## What stays unchanged

- `WordCloudSelector` component — handles chip UI for both mid-conversation sub-topics and the new end-of-conversation topics
- Mid-conversation `word_cloud` usage for sub-topic narrowing (e.g. "Was it workload or support?")
- `InteractiveInputRouter` routing for `word_cloud` type
- Theme-gated completion logic — all HR themes must be covered before deepening chips appear
- HR wizard `ThemeSelector` — completely separate component for survey configuration

## Files changed

| File | Change |
|------|--------|
| `supabase/functions/chat/context-prompts.ts` | Update step 5 in both prompts to offer new employee-driven topics via word_cloud; add example |
| `supabase/functions/chat/index.ts` | Update adaptive instructions for all-themes-covered; add "I'm all good" detection for completion |
| `src/components/employee/ThemeSelector.tsx` | Delete (unused) |

