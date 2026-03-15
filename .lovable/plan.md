

## Expert Review: Diverse Probing Patterns

### Research Foundation

The proposed patterns were cross-referenced against three established frameworks:

1. **Robinson's DICE Framework (2023)** — the most current academic probing taxonomy:
   - **D**escriptive Detail probes (elicit scene-setting)
   - **I**diographic Memory probes (anchor to specific episodes)
   - **C**larifying probes (resolve ambiguity)
   - **E**xplanatory probes (understand reasoning)

2. **Spradley's Ethnographic Questions** — descriptive, structural, and contrast questions

3. **Gorden's Probe Types** — silent probes, encouragement probes, elaboration probes

### Assessment of Proposed Patterns

| Proposed Pattern | DICE Category | Verdict | Notes |
|---|---|---|---|
| **Recency anchor**: "When was the last time that happened?" | Idiographic Memory | **Keep** | Strong. Anchors to episodic memory, easy to answer. |
| **Scenario replay**: "Walk me through how that usually goes." | Descriptive Detail | **Keep** | Classic Spradley "grand tour" question. Natural and effective. |
| **Contrast**: "Has it always been like that, or is this recent?" | Clarifying | **Keep** | Maps to Spradley's contrast questions. Surfaces change over time. |
| **Impact**: "How does that affect your day?" | Explanatory | **Keep** | Good for surfacing consequences. Conversational. |
| **Frequency softener**: "Is that most days or just sometimes?" | Clarifying | **Keep but revise** | Good intent, but slightly leading (binary frame). Better: "How often does that come up?" |
| **Hypothetical redirect**: "What would make that better?" | Explanatory | **Keep** | Already in the prompts for negative feedback. Good for solution-orientation. |
| **Third-party**: "Would your teammates say the same?" | Clarifying | **Drop** | Risky for anonymous surveys — implies the respondent should speak for others. Violates non-directive stance. |
| **Emotion follow-up**: "How did that land for you?" | Descriptive Detail | **Keep but revise** | "Land" is therapy-speak. Better: "How did that feel?" or "What was that like?" |

### Recommended Additions (from research)

| New Pattern | DICE Category | Example | Rationale |
|---|---|---|---|
| **Silent encouragement** | Encouragement | "Tell me more." | Simplest probe. 3 words. Highly effective per Gorden. |
| **Structural** | Structural (Spradley) | "What are the different types of [X] you deal with?" | Surfaces taxonomic knowledge. Good after initial disclosure. |
| **Consequential** | Explanatory | "What happens when that comes up?" | Alternative to "impact" — more concrete, action-oriented. |

### Patterns to Drop from Current Prompts

The current `PALPABLE_EVIDENCE` section has 4 example probes — 3 of which start with "What specifically" or "Can you describe a specific." This is the root cause of the repetitive behavior. These should be replaced entirely.

### Final Recommended Probe Library (10 patterns)

```text
PROBING TOOLKIT (vary your approach — never use the same pattern twice in a row):

1. Recency anchor     → "When was the last time that happened?"
2. Scenario replay    → "Walk me through how that usually goes."
3. Contrast           → "Has it always been like that, or is this recent?"
4. Impact             → "How does that affect your day?"
5. Frequency check    → "How often does that come up?"
6. Solution redirect  → "What would make that better?"
7. Encouragement      → "Tell me more about that."
8. Consequential      → "What happens when that comes up?"
9. Feeling check      → "What was that like for you?"
10. Example request   → "Can you give me an example?"
```

### Implementation Plan

**File: `supabase/functions/chat/context-prompts.ts`**

1. **Replace `PALPABLE_EVIDENCE`** (lines 52-56) with the 10-pattern probe toolkit above, plus the anti-repetition rule: "Never start two consecutive questions with the same word or pattern."

2. **Update `QUESTION_QUALITY`** (lines 58-65) — remove the repeated "probe for a concrete example" line (it's now covered by the toolkit). Add: "Rotate between probing styles. If your last question asked for an example, try a contrast or impact probe next."

3. **Replace few-shot examples** in `getCourseEvaluationPrompt` (lines 119-123) and `getEmployeeSatisfactionPrompt` (lines 173-177) to demonstrate varied probe styles:
   - Example 1: Uses recency anchor
   - Example 2: Uses scenario replay
   - Example 3: Uses impact probe

**File: `supabase/functions/chat/index.ts`**

4. **Update fallback few-shot examples** (lines 380-390) — replace "What specifically makes the collaboration work well?" with a varied probe like "Tell me more — what does that look like day to day?"

### What Stays Unchanged
- Door-opener questions in `first-questions.ts`
- Conversation flow, theme transitions, empathy rules
- Response format and input types
- The 15-word max and "one question only" constraints

