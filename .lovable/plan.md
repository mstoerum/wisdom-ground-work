

## Fix: "Failed to create summary" — 3 bugs

The edge function logs confirm three distinct failures. Here is the fix plan:

### Bug 1: `callAI` returns `null` → crash on `.split()` (line 1033)

The logs show `TypeError: Cannot read properties of null (reading 'split')`. `callAI` at line 553 returns `data.choices[0].message.content` which can be `null`. The `finishEarly`/completion path at line 1033 calls `summaryMessage.split(...)` on it.

**Fix in `supabase/functions/chat/index.ts`:**
- Line 553: change `return data.choices[0].message.content;` → `return data.choices[0].message.content || "";`
- Line 1033: add null guard: `const sentences = (summaryMessage || "").split(/[.!?]+/).filter(s => s.trim());`

### Bug 2: Gemini rejects `additionalProperties: false` in tool schema (line 1838)

The logs show `GenerateContentRequest.tools[0].function_declarations[0].parameters.required[0]: property is not defined` — Gemini doesn't support `additionalProperties: false` with `required` in function tool schemas.

**Fix in `supabase/functions/chat/index.ts`:**
- Line 1838: remove `additionalProperties: false` from the `analyze_response` tool parameters object.

### Bug 3: `escalation_type: 'ai_detected'` violates check constraint (line 1892)

The logs show `violates check constraint "escalation_log_escalation_type_check"`. The table only allows `('harassment', 'safety', 'legal', 'other')` but the code inserts `'ai_detected'`.

**Fix — two options (use both):**
- **Database migration**: `ALTER TABLE public.escalation_log DROP CONSTRAINT escalation_log_escalation_type_check; ALTER TABLE public.escalation_log ADD CONSTRAINT escalation_log_escalation_type_check CHECK (escalation_type IN ('harassment', 'safety', 'legal', 'other', 'ai_detected'));`
- This is a non-blocking background error (escalation logging fails silently), but it should be fixed for data integrity.

### Summary

Three one-line fixes in `index.ts` + one database migration. The primary user-facing crash is Bug 1 (null content from LLM). Bugs 2 and 3 are background task failures that don't block the conversation but lose analytics/escalation data.

