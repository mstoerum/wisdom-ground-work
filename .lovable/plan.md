

## Add "Villager Interview" Survey Type

A new survey type for student residence communities, with its own themes, terminology, tone, and opening message — without touching existing employee satisfaction or course evaluation flows.

### Summary of Changes

**1. Database Migration — Add enum value + seed themes**

Add `'villager_interview'` to the `survey_type` enum in Postgres, then insert 4 new themes into `survey_themes`:

- Shared Space Usage & Satisfaction
- Aspirations & Ideas
- Community Belonging & Connection
- Communication & Involvement

Each theme gets relevant `suggested_questions` and `sentiment_keywords`.

**2. Frontend Schema — `src/lib/surveySchema.ts`**

- Add `'villager_interview'` to the `survey_type` z.enum
- Add `'villager_interview'` case in `getDefaultSurveyValues` with a tailored consent message (e.g., "Your responses will be kept confidential and used to improve the village community...")

**3. Contextual Terminology — `src/lib/contextualTerminology.ts`**

- Add `'villager_interview'` to the `SurveyType` union
- Add a full `ContextualTerms` entry for `villager_interview` (participant: "villager", context: "village", feedback: "conversation", etc.)

**4. Survey Type Selector — `src/components/hr/wizard/SurveyTypeSelector.tsx`**

- Add a third card (icon: `Home` or `Users`) for "Villager Interview" with description and sample themes
- Switch layout to 3-column on larger screens

**5. Survey Details & Theme Selector**

- `SurveyDetails.tsx` — add villager-specific placeholder title, description hint, and first message preview
- `ThemeSelector.tsx` — widen the `surveyType` cast to include `'villager_interview'`; participant/conversation labels already flow from the terminology map

**6. AI Interview Prompt — `supabase/functions/chat/context-prompts.ts`**

- Add `'villager_interview'` to the `SurveyType` union
- Add `getVillagerInterviewPrompt()` — same structure as the other two but with:
  - Slightly less formal, more personal tone ("friendly community researcher")
  - Probing lenses: Belonging, Shared spaces, Communication, Aspirations
  - Villager-specific good/bad examples
- Update `getSystemPromptForSurveyType()` to route to the new prompt
- Update `buildConversationContextForType()` participant/context terms

**7. First Questions — `supabase/functions/chat/first-questions.ts`**

- Add villager-specific theme first questions (e.g., "How does it feel coming home to the village after a long day?")
- Add `DEFAULT_VILLAGER_QUESTIONS` fallback
- Add villager case in `selectFirstQuestion`, `getMoodAdaptiveResponse`, and `buildWarmIntroduction`
- Opening intro: *"Hey! Welcome — this is a short conversation to get a better understanding of your experience as a villager. We're curious to hear about what life is like here and any ideas you might have."*

**8. Other Components (minimal changes)**

- `ClosingRitual.tsx` — add `'villager_interview'` to the `surveyType` prop union and a villager-specific "what happens next" list
- `FocusedInterviewInterface.tsx`, `SummaryReceipt.tsx` — widen type unions (no logic changes needed since they delegate to terminology)
- `CreateSurvey.tsx` — update the preview button label ternary to handle villager type

### What stays untouched

All existing employee satisfaction and course evaluation logic, prompts, themes, and UI remain identical. The new type is additive only — new enum value, new themes, new prompt function, new terminology entry.

### Technical Details

- The DB enum alter is safe: `ALTER TYPE survey_type ADD VALUE 'villager_interview'`
- The `types.ts` file auto-regenerates after migration
- Edge functions (`chat`, `chat-v2`) route via `getSystemPromptForSurveyType()` which already dispatches by type — adding the new case is sufficient

