

# Solution 3: Trim the System Prompt

Solutions 1 and 2 are shipped — classification now runs in the background and redundant DB queries are eliminated. The next highest-impact optimization is **trimming the system prompt** to reduce inference time.

## Current State

Both prompts (course evaluation and employee satisfaction) are heavily duplicated and verbose:
- **~236 lines** of prompt code with two nearly identical prompt functions
- INPUT TYPE RULES section: 13 lines with full JSON examples repeated in both prompts
- EMPATHY GUIDELINES: 6 lines repeated verbatim in both
- RHYTHM + THEME TRANSITIONS: 5 lines repeated verbatim in both  
- FEW-SHOT EXAMPLES: 4 examples each, repeated in both
- RESEARCH FRAMEWORK (employee only): 20 lines of signs/probes detail
- Redundancies: "max 15 words" appears in RESPONSE FORMAT, QUESTION GUIDELINES, and implicitly in examples

The total prompt sent to the model is roughly **2,500+ tokens** per call. Cutting this means faster inference.

## What Changes

### 1. Deduplicate: Extract shared sections into reusable constants

The INPUT TYPE RULES, EMPATHY GUIDELINES, RHYTHM, and THEME TRANSITIONS sections are identical across both prompts. Extract them as shared string constants at the top of the file rather than repeating them inline.

### 2. Condense INPUT TYPE RULES into a compact reference table

**Before** (13 lines with verbose examples):
```
- "text" (default): Standard open text answer. Use for most exchanges.
- "confidence_check": Use for yes/no/maybe questions. Set inputConfig.options to 2-3 choices.
  Example: {"inputType": "confidence_check", "inputConfig": {"options": ["Yes", "Maybe", "No"]}}
... (7 more types with full JSON examples)
```

**After** (~7 lines, compact table):
```
INPUT TYPES (vary every 2-3 text exchanges):
| Type | When | inputConfig |
| text | default | {} |
| confidence_check | yes/no questions | {options:["Yes","Maybe","No"]} |
| word_cloud | narrow broad topic / theme transition | {options:[4-6 tags], allowOther:bool, maxSelections:N} |
| sentiment_pulse | temperature check | {} |
| agreement_spectrum | validate observation | {labelLeft:"...", labelRight:"..."} |
| priority_ranking | rank surfaced topics | {options:[3-4 items]} |
| reflection | after heavy exchanges | {message:"brief text"} |
```

### 3. Trim RESEARCH FRAMEWORK (employee prompt)

**Before** (20 lines with signs and probe examples for each of 5 dimensions):
```
1. EXPERTISE - Can I apply my knowledge usefully?
   Signs: "not learning", "skills unused", "bored"...
   Probe: "Do you get to use your skills?"
```

**After** (5 lines, one per dimension):
```
PROBING LENSES: Expertise (skills used?), Autonomy (control over work?), Justice (fair rewards?), Social Connection (team bonds?), Social Status (valued/recognized?). Identify which dimension drives their feedback and probe deeper.
```

### 4. Reduce few-shot examples from 4 to 2 per prompt

Keep one text example and one interactive example. The theme transition examples are already covered by the THEME TRANSITIONS instructions and the `buildConversationContextForType` nudges.

### 5. Remove redundant instructions

- "Maximum 15 words" appears in RESPONSE FORMAT and QUESTION GUIDELINES — keep only in format
- "Aim for 2-3 exchanges per theme" appears in GOALS, QUESTION GUIDELINES, THEME TRANSITIONS, and CONVERSATION FLOW — keep once
- "One question at a time" is implicit in the format — remove

## Expected Token Reduction

| Section | Before (tokens est.) | After |
|---------|---------------------|-------|
| Input type rules (×2) | ~400 | ~150 |
| Empathy guidelines (×2) | ~200 | ~100 (shared) |
| Few-shot examples (×2) | ~300 | ~120 |
| Research framework | ~250 | ~60 |
| Redundant instructions | ~150 | ~0 |
| **Total saved** | | **~870 tokens (~35%)** |

## Files Changed

| File | What |
|------|------|
| `supabase/functions/chat/context-prompts.ts` | Refactor both prompts: extract shared constants, condense input type rules, trim research framework, cut examples, remove duplication |

## Risk & Mitigation

The AI's behavior depends on prompt wording. To mitigate:
- Keep the JSON response format section untouched (most critical for parsing)
- Keep the core personality instructions ("neutral research interviewer", "professional curiosity")
- The interactive element nudges in `buildConversationContextForType` remain unchanged — they're the primary driver for input type switching now
- Test with a preview conversation after deploying

