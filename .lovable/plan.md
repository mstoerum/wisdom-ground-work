

# How Theme Insights and Story Report Currently Work — and How They Could Be Better

## Current Architecture: Theme Insights

### Data Flow
```text
Employee response → chat/index.ts (per-response)
  ├─ analyzeSentiment() → sentiment label + score (25/50/75 buckets*)
  ├─ detectTheme() → assigns to survey_theme
  └─ detectUrgency() → urgency flag (broken*)

responses table → analyze-theme edge function (batch, per-theme)
  ├─ Groups responses by theme_id
  ├─ Calculates: THI, intensity, direction, polarization (all numeric/deterministic)
  └─ Calls Gemini Flash with ALL response texts → structured tool call:
       ├─ frictions[] (text, agreement_pct, voice_count, evidence_ids)
       ├─ strengths[] (text, agreement_pct, voice_count, evidence_ids)
       ├─ patterns[] (same shape)
       └─ root_causes[] (cause, impact_level, affected_count, recommendation)

Results stored → theme_analytics table
Displayed → ThemeCard (health score + status) → ThemeDetailView (root causes, strengths, frictions, quotes)
```

### What It Gets Right
- The AI prompt gives the LLM all response texts with sentiment scores and asks for pattern extraction — this is fundamentally sound
- Root causes with recommendations are genuinely useful (e.g., "Lack of structured task assignment for ad-hoc work" with specific recommendation)
- Evidence IDs link insights back to actual responses
- THI calculation is mathematically sound (net sentiment + polarization penalty)

### What's Weak

**1. The AI prompt lacks conversational context**
The `analyze-theme` function only sends `response.content` (employee answers). It does NOT include `response.ai_response` (the question that was asked). Without the question, the LLM is interpreting answers without context. Example: "Depends from case to case, mostly by talking to colleagues" — what was this answering? Stress management? Problem-solving? The AI has to guess.

**2. No cross-session patterns**
Each theme is analyzed in isolation. The function never sees: "3 out of 5 people mentioned colleague support when asked about stress" — it just sees the texts grouped by theme. Cross-theme correlations (e.g., people positive about Contribution also positive about Working Experience) are invisible.

**3. Agreement percentages are fabricated**
The LLM is asked to estimate "what % would agree" but it's extrapolating from 5 conversations to a hypothetical population. With n=5, saying "36% agreement" is meaningless — it's 1.8 people. The model should be constrained to report actual voice counts and fractions.

**4. Signal-to-noise: `[SELECTED:]` responses counted**
Responses like `[SELECTED: I'm all good]` are included in the analysis. These are UI completion signals, not substantive feedback. They inflate response counts and dilute theme insights.

**5. No temporal/session-level grouping**
The analysis treats all responses as a flat list. It doesn't know which responses came from the same person's conversation, so it can't identify per-person trajectories or weight a single person's repeated mentions vs. a pattern across people.

---

## Current Architecture: Story Report

### Data Flow
```text
generate-narrative-report edge function:
  ├─ Fetches: survey_analytics (deep-analytics output), responses (first 50),
  │           session_insights, completed sessions, survey metadata
  └─ Sends ALL of this as a single massive prompt to Gemini Pro
       ├─ Asks for 5 chapters: Voices, Landscape, Frictions, Root Causes, Path Forward
       └─ Each chapter has: narrative text + insights[] with agreement_%, sample_size, evidence_ids

Stored → narrative_reports table
Displayed → NarrativeReportViewer → StoryChapter → InsightCard (with EvidenceTrail drill-down)
```

### What It Gets Right
- The 5-chapter structure tells a coherent story
- InsightCards with agreement percentages and evidence drill-down are well-designed
- Bookmarking system for flagging insights → action commitments is a strong workflow
- The narrative prose in the Soundboks pilot is actually good and specific ("employees describe the workspace as 'tidy yet cool'")

### What's Weak

**1. Depends on `survey_analytics` and `session_insights` — both currently empty**
The report function fetches `survey_analytics` (from `deep-analytics`) and `session_insights` (from `analyze-session` trigger). For the Soundboks pilot, BOTH are empty because sessions never reached "completed" status. So the report was generated from raw responses alone, without the synthesized analytics layer. The report quality would improve significantly if these upstream dependencies worked.

**2. Only sends first 50 responses**
`responses?.slice(0, 50)` — with 54 responses this barely matters, but for larger surveys this is an arbitrary truncation that could miss important signals.

**3. No theme_analytics data fed into report**
The `generate-narrative-report` function does NOT fetch `theme_analytics` (the enriched per-theme analysis with root causes, frictions, strengths). This is the richest analyzed data in the system and it's completely ignored by the report generator. The report re-analyzes raw responses from scratch instead of building on the already-computed theme insights.

**4. agreement_percentage in report is LLM-hallucinated**
Same issue as theme insights — the model generates "65% agreement" for an insight backed by 5 responses. There's no statistical basis. With small samples, voice counts ("3 of 5 voices") would be more honest.

**5. "The Voices" chapter is generic**
The first chapter says "54 employees" but there were only 5 session participants giving 54 responses. It also counts `[SELECTED: I'm all good]` responses as meaningful engagement.

**6. No 6th chapter (Commitment)**
The prompt asks for 5 chapters but the UI supports 6 (including "Commitment" with bookmarked insights + pledges). The generated data stops at chapter 5.

---

## Concrete Improvement Opportunities

### For Theme Insights (analyze-theme)

| Area | Current | Proposed |
|------|---------|----------|
| Context | Only employee response text | Include AI question + response as Q&A pairs |
| Filtering | All responses including `[SELECTED:]` | Filter out completion signals before analysis |
| Agreement metric | LLM-estimated percentage | Actual voice fraction: "3 of 5 voices" |
| Cross-theme | Each theme isolated | Add a final cross-theme pass that identifies correlations |
| Session awareness | Flat response list | Group by session so LLM knows "same person said X and Y" |
| Prompt specificity | Generic "organizational psychologist" | Include survey context: title, type, theme descriptions, # of sessions |

### For Story Report (generate-narrative-report)

| Area | Current | Proposed |
|------|---------|----------|
| Data sources | Raw responses + empty analytics | Feed theme_analytics (root causes, frictions, strengths) into prompt |
| Sample accuracy | "54 employees" | Correct to "5 conversations, 54 response exchanges" |
| Filtering | All responses | Exclude `[SELECTED:]` completion signals |
| Small-sample mode | Percentages (65%) | Voice counts when n<10 ("3 of 5 voices") |
| Response limit | First 50 | All responses (or intelligent sampling across themes) |
| Chapter 6 | Not generated | Generate "Commitment" chapter with action framework |

### For the Dashboard Display

| Area | Current | Proposed |
|------|---------|----------|
| PulseSummary "Engaged" | Shows 0% when sessions stuck at active | Show completed/total count; label as "Completed" for public surveys |
| ThemeDetailView quotes | Question hidden behind tiny "Q" button | Show Q&A pairs by default |
| Headlines | No top-level summary on Overview | Surface top 2-3 root causes from theme_analytics above the grid |
| InsightCard percentages | "65% agree" with n=5 | Switch to "3 of 5 voices" when sample_size < 10 |

---

## Summary

The analytics engine has good bones — the THI calculation, the structured LLM tool calls, the evidence trail system, and the narrative chapter structure are all well-designed. The main gaps are:

1. **Data quality**: Completion signals counted, urgency false positives, sessions never completing
2. **Context loss**: AI questions stripped before analysis, theme_analytics not fed into reports
3. **Small-sample honesty**: Percentages misleading with n=5; voice counts are more credible
4. **Missing integration**: theme_analytics (richest data) not used by story report generator

These are all fixable without architectural changes — mostly prompt improvements, data filtering, and connecting existing data flows that are currently disconnected.

