

# Assessment: Proposed Analytics Pipeline v2

## Verdict: Beneficial, correct direction, implementable — with caveats

The diagnosis is accurate and the architecture is well-designed. Here is my assessment across the three dimensions you asked about.

---

## 1. Is It Possible?

**Yes, with two infrastructure constraints to work around:**

| Component | Feasibility | Constraint |
|-----------|------------|------------|
| Opinion Units extraction (Stage 2) | Straightforward | None — replaces existing `analyzeSentiment` + `detectTheme` + `detectUrgency` with one call |
| Session Synthesis (Stage 3) | Straightforward | None — similar to current `analyze-session` |
| Inductive Clustering (Stage 4) | Feasible at current scale | LLM-based grouping works for 50-500 opinion units. Embedding + HDBSCAN path requires Python runtime (not available in Deno edge functions) — so the LLM approach is the right call for now |
| Interpretive Analysis (Stage 5) | Straightforward | None |
| DB Triggers via `pg_net` | **Not available** in Lovable Cloud | Must use `EdgeRuntime.waitUntil()` in chat function + client-side triggers. Claude's code assumes `pg_net` and `net.http_post` which we already know don't work here |
| `pgvector` extension | **Needs verification** | The migration enables `vector` extension — may or may not be available in Lovable Cloud |
| FK references to `themes` table | **Table doesn't exist** | The code references `themes(id)` but our schema uses `survey_themes`. All FKs and queries referencing `themes` need to be changed to `survey_themes` |
| `session_id` column on `responses` | **Doesn't exist** | Our schema uses `conversation_session_id`, not `session_id`. The edge functions reference the wrong column name |
| Gemini API direct calls | Works but unnecessary | The code calls `generativelanguage.googleapis.com` directly using `GEMINI_API_KEY`. We should use `ai.gateway.lovable.dev` with `LOVABLE_API_KEY` instead — it's already configured and supports all the same models |

**Bottom line:** The architecture is sound but the implementation has 4-5 schema mismatches with our actual database that need fixing before deployment.

---

## 2. Is It Beneficial?

**Strongly yes.** The three biggest wins:

### a) 5 LLM calls → 1 per response
The current `chat/index.ts` fires `analyzeSentiment` (1 call using flash-lite), `detectTheme` (1 call using flash-lite), and `detectUrgency` (1 call using flash-lite) in parallel via `EdgeRuntime.waitUntil()`. The new pipeline replaces all three with a single `extract-signals` call using `gemini-2.5-flash` that produces richer output (opinion units with aspect-level sentiment). This is both cheaper and better.

### b) Opinion Units solve the mono-classification problem
The diagnosis is correct: forcing one theme and one sentiment per message loses signal. The Soundboks pilot data confirms this — responses like "I really enjoy working with the team but the workload is sometimes overwhelming" get classified as either positive OR negative, losing the nuance. Opinion units fix this.

### c) Linear data flow eliminates the diamond dependency
Currently Stage 4 (`deep-analytics`) ignores Stage 3 (`analyze-theme`) output and re-analyzes raw data. The new pipeline has each stage consume the previous stage's output. This means insights build coherently rather than potentially contradicting each other.

### Additional benefits
- Three-level escalation (`none`/`flag`/`urgent`) replaces the broken binary urgency detection that produced 49 false positives in the Soundboks pilot
- `pipeline_runs` table gives HR visibility into analysis progress
- Backward-compatible writes to `survey_analytics` and `theme_analytics` mean existing UI keeps working during migration

---

## 3. Is It the Right Move?

**Yes, but I recommend a phased approach rather than big-bang replacement.**

### What to implement now (high impact, low risk)
1. **Stage 2 (extract-signals)** — Replace the 3 background calls in `chat/index.ts` with one. This is the single highest-impact change. Create the `opinion_units` table. Keep existing `responses` metadata updates for backward compatibility.
2. **Stage 3 (synthesize-session)** — Replace current `analyze-session`. Trigger via `EdgeRuntime.waitUntil()` from the chat function when session completes, not via DB trigger.
3. **Fix the trigger chain** — Wire Stage 2 → Stage 3 → Stage 4 via edge function cascade calls, not `pg_net`.

### What to defer
1. **Embedding + HDBSCAN clustering** — The LLM-based clustering in Stage 4 is fine for current scale. Adding ONNX runtime or Python cloud functions is premature.
2. **`pgvector` and embedding columns** — Not needed if using LLM clustering. Add the columns later when scale demands it.
3. **Cross-survey longitudinal analysis** — Great differentiator but not needed for the pilot.
4. **`survey_interpretations` as a separate table** — Can be deferred; writing to existing `survey_analytics` is sufficient initially.

### What needs adaptation for our environment
- Replace all `generativelanguage.googleapis.com` direct calls with `ai.gateway.lovable.dev` using `LOVABLE_API_KEY`
- Replace all `themes` references with `survey_themes`
- Replace `session_id` with `conversation_session_id` on responses queries
- Replace DB triggers with `EdgeRuntime.waitUntil()` cascade in edge functions
- Remove `pg_net` dependency from migration
- Remove `vector(384)` columns if `pgvector` isn't available (test first)
- Add RLS policies to all new tables

---

## Recommended Implementation Sequence

**Phase 1 (can do now):** Create `opinion_units` and `pipeline_runs` tables. Deploy `extract-signals` edge function (adapted for our schema + Lovable AI gateway). Wire it into `chat/index.ts` replacing the 3 background calls.

**Phase 2:** Deploy `synthesize-session` (replacing `analyze-session`). Create `session_syntheses` table. Wire session completion trigger.

**Phase 3:** Deploy `discover-themes` (Stage 4, LLM-based clustering). Create `discovered_clusters` table. Wire auto-cascade from Stage 3.

**Phase 4:** Deploy `interpret-survey` (Stage 5). Wire auto-cascade from Stage 4. Update dashboard to show pipeline status and cluster drill-downs.

Each phase is independently deployable and the existing UI keeps working throughout because of backward-compatible writes.

---

## Summary

| Dimension | Assessment |
|-----------|-----------|
| Possible? | Yes — with schema fixes and Lovable Cloud adaptations |
| Beneficial? | Strongly yes — fixes every diagnosed problem in the current pipeline |
| Right move? | Yes — phased rollout recommended, starting with Stage 2 (opinion units) |
| Risk | Low if phased — backward compatibility maintained throughout |
| Effort | Phase 1: ~1 session. Full pipeline: ~3-4 sessions |

