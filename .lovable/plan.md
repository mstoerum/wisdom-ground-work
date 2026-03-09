

## Upgrade System Prompt: Adapted Jaravel & Geiecke Principles for 5-Minute Surveys

### Context Constraint

Jaravel & Geiecke designed for **30-minute open-ended interviews** (~30-40 exchanges). Spradley runs **5-minute structured surveys** (~8-12 exchanges across 3-4 themes). This means we have roughly **2-3 exchanges per theme**, so every question must count. We cannot afford exploratory tangents or slow warm-ups.

### Principle-by-Principle Evaluation

| Jaravel Principle | Fit for Spradley? | Rationale |
|---|---|---|
| **Palpable evidence** (concrete examples) | **YES — high priority** | Even in 2-3 exchanges, asking for a specific situation yields far richer data than abstract opinions. This is the single highest-value upgrade. |
| **Cognitive empathy** (understand worldview) | **PARTIAL — adapt** | Full worldview investigation takes too long. But we can adopt the *stance*: "understand how they see it" rather than just acknowledging sentiment. Merge into existing empathy rules. |
| **Non-directive / never suggest answers** | **YES — remove structured options** | Our current "offer 2-3 options" instruction directly contradicts this and is genuinely leading. Remove it. Interactive inputs (word_cloud etc.) are fine at end-of-interview, not for probing. |
| **Prefer how/what over why** | **YES — low cost, high value** | Single-line instruction, no time cost, avoids defensive responses. |
| **Assertive phrasing** ("Tell me more" not "Can we discuss") | **YES — low cost** | Makes questions more direct, saves words. Fits our ≤15 word limit. |
| **Re-ask from different angle** | **NO — too expensive** | With only 2-3 exchanges per theme, spending one to re-ask burns half the budget. Instead, if vague, probe for concrete example (palpable evidence) — one shot. |
| **Adaptive depth (up to 15 per section)** | **NO — wrong format** | We need to cover 3-4 themes in 8-12 total exchanges. Keeping 2-3 per theme is correct. |
| **No paraphrasing** | **ALREADY HAVE** | Current prompt says "Never repeat or paraphrase what they said." Keep. |
| **Forward momentum / no returning** | **ALREADY HAVE** | Current theme tracking enforces this. Keep. |

### Changes: 2 Files

**1. `supabase/functions/chat/context-prompts.ts`**

Update three constants and add one:

- **`CORE_APPROACH`** — Add three lines:
  - "Prefer 'how' and 'what' questions — avoid 'why' (sounds judgmental)"
  - "Use assertive phrasing: 'Tell me more about...' not 'Could we discuss...'"
  - "Seek to understand how the respondent sees their situation, not just what happened"

- **`QUESTION_QUALITY`** — Two changes:
  - **Remove** "Offer 2-3 structured options to narrow broad answers" (leading)
  - **Add** "If the answer is vague or abstract, ask for one concrete example or situation before moving on"
  - **Add** "Never suggest possible answers — not even broad themes"

- **Add `PALPABLE_EVIDENCE`** constant:
  - "When probing, elicit concrete details: specific events, situations, people involved, or practices observed"
  - "Move respondents from generalizations ('things are bad') to specifics ('what happened specifically?')"
  - Include in both survey type prompts

- **Update examples** in both `getCourseEvaluationPrompt` and `getEmployeeSatisfactionPrompt`:
  - Replace examples that show structured options with non-directive probes
  - Add an example showing palpable evidence probing (vague → concrete)

- **Update CONVERSATION FLOW** in both prompts:
  - Change "1-2 follow-ups" to "2-3 follow-ups" (slight increase — the existing `mustTransition` at 2 in `index.ts` will be bumped to 3)

**2. `supabase/functions/chat/index.ts`**

- **`buildConversationContext`** (line 303): Change `mustTransition` threshold from `currentThemeCount >= 2` to `currentThemeCount >= 3` — allows one more follow-up per theme for depth
- **`shouldCompleteBasedOnThemes`** (line 135): Change hard minimum from `themes.length + 2` to `themes.length + 4` — accommodates the extra exchange per theme
- **Depth calculation** (line 217): Adjust from `25 + (n-1) * 20` to `20 + (n-1) * 25` to reflect 3-exchange depth target

### What Does NOT Change

- JSON response format (empathy + question + inputType)
- Interactive input types — still available, just not for content probing
- Hard max cap (themes * 4)
- First question logic
- Word cloud end-of-interview exploration
- The empathy length scaling (3-12 words)
- Skip handling

### Summary of Impact

The key shifts are:
1. **Palpable evidence** — the AI will push for concrete examples instead of accepting abstractions
2. **Non-directive stance** — removes the instruction to suggest options, making questions truly open
3. **How/what over why** — subtle but research-backed improvement in question quality
4. **One extra exchange per theme** (2→3 before forced transition) — small time cost, significant depth gain

