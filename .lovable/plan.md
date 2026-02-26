

# Fix: Give the AI Domain Knowledge About Each Theme

## Problem

The AI receives themes as a single line each:
```
- Work-Life Balance: Explore workload, flexibility, and boundaries between work and personal life
```

But the database already stores rich context per theme that is **never fetched**:
- `suggested_questions`: 3 example questions per theme (e.g., "How do you feel about your current workload?")
- `sentiment_keywords`: positive/negative keyword lists (e.g., positive: `flexible, balanced, manageable`; negative: `overwhelmed, burnout, stressed`)

The query on line 986 of `index.ts` only selects `id, name, description` — discarding all domain knowledge. The AI has no sub-topics, no probing angles, and no vocabulary to work with, so it falls back to generic follow-ups.

## Solution

### 1. `supabase/functions/chat/index.ts` — Fetch full theme data

**Line 986**: Change the select query from:
```sql
select("id, name, description")
```
To:
```sql
select("id, name, description, suggested_questions, sentiment_keywords")
```

Also update the preview-mode query on **line 804** the same way.

### 2. `supabase/functions/chat/context-prompts.ts` — Pass rich theme context to the prompt

Update the `themesText` construction in both `getEmployeeSatisfactionPrompt` and `getCourseEvaluationPrompt`.

From:
```typescript
const themesText = themes?.map(t => `- ${t.name}: ${t.description}`).join("\n")
```

To something like:
```typescript
const themesText = themes?.map(t => {
  let entry = `- ${t.name}: ${t.description}`;
  if (t.suggested_questions?.length) {
    entry += `\n  Example angles: ${t.suggested_questions.slice(0, 3).join("; ")}`;
  }
  if (t.sentiment_keywords) {
    const pos = t.sentiment_keywords.positive?.slice(0, 3).join(", ");
    const neg = t.sentiment_keywords.negative?.slice(0, 3).join(", ");
    if (pos) entry += `\n  Positive signals: ${pos}`;
    if (neg) entry += `\n  Concern signals: ${neg}`;
  }
  return entry;
}).join("\n")
```

This gives the AI output like:
```
- Work-Life Balance: Explore workload, flexibility, and boundaries
  Example angles: How do you feel about your current workload?; Do you have enough flexibility?; What helps you maintain healthy boundaries?
  Positive signals: flexible, balanced, manageable
  Concern signals: overwhelmed, burnout, stressed
```

### Token impact

Adds ~30-40 tokens per theme. For a 4-theme survey, that's ~120-160 extra tokens in the system prompt — negligible compared to the conversation history.

## Files changed

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add `suggested_questions, sentiment_keywords` to both theme SELECT queries (lines 804, 986) |
| `supabase/functions/chat/context-prompts.ts` | Expand `themesText` in both prompt functions to include example angles and sentiment keywords |

