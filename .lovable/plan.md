

# Fix: Repetitive Follow-ups and Unnatural Questioning

## Problem

The current system prompt tells the AI "1-2 follow-ups per theme, then move on" but gives it **no data about how many exchanges have already happened on the current theme**. The `buildConversationContext` in `index.ts` only provides totals and averages — not per-theme counts. So the AI keeps asking within the same theme because it can't tell it's already done 3-4 exchanges there.

Additionally, the simplified prompt in `context-prompts.ts` lost several quality-control instructions from the old prompt (still present but unused at line 306 of `index.ts`):
- De-escalation rules for heated responses
- "Match the vibe" calibration
- Explicit "never repeat or paraphrase what they said"
- Structured option offering ("Was it workload, timeline, or something else?")
- The detailed few-shot examples showing bad vs good responses

## Solution

### 1. `supabase/functions/chat/index.ts` — Add per-theme exchange counts to context

Update `buildConversationContext` (line 237) to include:
- Which theme was most recently discussed and how many exchanges it has had
- A hard instruction: if the current theme already has 2+ exchanges, the AI **must** transition

Add to the context output (around line 287):
```
- Per-theme depth: Theme A (2 exchanges), Theme B (1 exchange)
- Current theme: "Management" has 3 exchanges — MUST transition now
```

And add to ADAPTIVE INSTRUCTIONS:
```
- If any theme already has 2+ exchanges, you MUST move to an undiscussed theme.
  Do NOT ask another follow-up on a theme you've already explored twice.
```

### 2. `supabase/functions/chat/context-prompts.ts` — Restore quality instructions

Bring back key instructions from the old prompt (line 306-408 in `index.ts`) into the shared constants:

**Add to `CORE_APPROACH`:**
```
- Never repeat or paraphrase what they said
- One question only — never ask two questions
- Maximum 15 words per question, prefer under 12
```

**Add a new `QUESTION_QUALITY` constant** with the old prompt's best rules:
```
QUESTION QUALITY:
- Offer 2-3 structured options to narrow: "Was it workload, timeline, or something else?"
- For negative feedback, always redirect: "What would make this better?"
- Never ask the same angle twice — if you asked about causes, ask about solutions next
- Never paraphrase their answer back as a question
```

**Add to `EMPATHY_RULES`** the de-escalation and vibe-matching from old prompt:
```
DE-ESCALATION (heated responses): Stay calm, shorter empathy (3-5 words), redirect quickly.
MATCH THE VIBE: Positive → warm curious. Neutral → brief appreciative. Negative → acknowledge + redirect.
```

### 3. Keep old `getSystemPrompt` function

It's used in the preview flow (line 802). Don't delete it.

## Files changed

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add per-theme exchange counts and "must transition" instruction to `buildConversationContext` |
| `supabase/functions/chat/context-prompts.ts` | Restore question quality rules, de-escalation, and vibe-matching from the old prompt into shared constants |

