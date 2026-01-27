

# Implementation Plan: Research-Based Meta-Framework for Employee Interviews

## Overview

This plan adds the research framework (Expertise, Autonomy, Justice, Social Connection, Social Status) to employee satisfaction interviews and creates a new **"Drivers"** tab in analytics. The course evaluation flow remains completely unchanged.

---

## What Gets Built

### 1. AI Interviewer Enhancement (Employee Surveys Only)
The AI will use the 5 research dimensions as a "meta-lens" when probing employee responses, asking questions that uncover root causes behind surface-level feedback.

### 2. New "Drivers" Analytics Tab
A fourth tab alongside Overview, Story Report, and Compare that shows:
- **Dimension Health Radar**: 5-axis visualization of the research dimensions
- **Aggregated Semantic Signals**: Natural language patterns like *"Spradley senses friction around daily task autonomy"*
- **Cross-Dimension Patterns**: Correlations between dimensions

### 3. Zero Latency Impact
Signal extraction runs in the background after the AI response is sent, using `EdgeRuntime.waitUntil()`.

### 4. Preserved Existing Functionality
- Overview Tab (Pulse Summary + Theme Grid) unchanged
- Course evaluation surveys completely unchanged
- Story Report and Compare tabs unchanged

---

## Research Framework Reference

| Dimension | Definition | Example Signals |
|-----------|------------|-----------------|
| **Expertise** | Can I apply my knowledge usefully? | "skills underutilized", "not learning" |
| **Autonomy** | Can I work in my own way? | "micromanaged", "no control over methods" |
| **Justice** | Do I benefit fairly? | "unequal treatment", "favoritism" |
| **Social Connection** | Am I connected to colleagues? | "isolated", "disconnected from team" |
| **Social Status** | Am I appreciated? | "unrecognized", "invisible contributions" |

---

## Architecture

```text
INTERVIEW FLOW (Employee Satisfaction Only)
┌─────────────────────────────────────────────────────────┐
│  Employee Response                                       │
│       ↓                                                  │
│  AI generates follow-up (existing flow)                 │
│       ↓                                                  │
│  Response sent to user immediately                      │
│       ↓                                                  │
│  BACKGROUND: Extract signal, dimension, facet, intensity│
│       ↓                                                  │
│  Store in response_signals table                        │
└─────────────────────────────────────────────────────────┘

ANALYTICS STRUCTURE
┌─────────────────────────────────────────────────────────┐
│  [Overview]  [Drivers]  [Story Report]  [Compare]       │
├─────────────────────────────────────────────────────────┤
│  OVERVIEW TAB (unchanged):                               │
│  - Pulse Summary (Voices, Engaged, Health, Themes)      │
│  - Theme Grid (flip cards)                              │
├─────────────────────────────────────────────────────────┤
│  DRIVERS TAB (new, employee surveys only):              │
│  - Dimension Health Radar (5-axis)                      │
│  - Aggregated Semantic Signals                          │
│  - Cross-Dimension Patterns                             │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema (1-2 credits)

Create two new tables with RLS policies:

**`response_signals` table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| response_id | uuid | FK to responses |
| survey_id | uuid | FK for faster queries |
| signal_text | text | Natural language signal |
| dimension | text | expertise, autonomy, justice, social_connection, social_status |
| facet | text | Specific aspect (e.g., method_control) |
| intensity | integer (1-10) | How strongly expressed |
| sentiment | text | positive/negative/neutral |
| confidence | numeric (0-1) | AI extraction confidence |
| created_at | timestamp | When extracted |

**`aggregated_signals` table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| survey_id | uuid | FK to surveys |
| signal_text | text | Aggregated signal description |
| dimension | text | Research dimension |
| facet | text | Specific facet |
| sentiment | text | Overall sentiment |
| voice_count | integer | Number of supporting responses |
| agreement_pct | integer | Agreement percentage (0-100) |
| avg_intensity | numeric | Average intensity |
| evidence_ids | uuid[] | Response IDs supporting this |
| analyzed_at | timestamp | When aggregated |

### Phase 2: AI Prompt Enhancement (1-2 credits)

Update `supabase/functions/chat/context-prompts.ts` to add the meta-framework lens to `getEmployeeSatisfactionPrompt()` only. The AI will use these dimensions to craft more insightful follow-up questions.

### Phase 3: Background Signal Extraction (2-3 credits)

Modify `supabase/functions/chat/index.ts` to:
1. Check if survey type is `employee_satisfaction`
2. After sending the response, use `EdgeRuntime.waitUntil()` to extract signals in the background
3. Store extracted signals in `response_signals` table

This ensures zero latency impact on the interview experience.

### Phase 4: Signal Aggregation Function (2-3 credits)

Create new edge function `supabase/functions/aggregate-signals/index.ts` that:
1. Triggers on session completion (via existing trigger)
2. Groups semantically similar signals
3. Calculates agreement percentages and voice counts
4. Stores patterns in `aggregated_signals` table

### Phase 5: Drivers Tab UI (3-4 credits)

Create new frontend components:

| Component | Purpose |
|-----------|---------|
| `DriversTab.tsx` | Container for the new tab |
| `DimensionRadar.tsx` | 5-axis radar chart visualization |
| `SignalCard.tsx` | Individual signal display with evidence |
| `CrossPatterns.tsx` | Dimension correlation insights |

Modify `src/pages/hr/Analytics.tsx` to add "Drivers" tab (only visible for employee satisfaction surveys).

### Phase 6: Data Hook & Integration (2-3 credits)

Create `src/hooks/useSemanticSignals.ts` to fetch and process signal data for the Drivers tab.

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| Database migration | CREATE | `response_signals` and `aggregated_signals` tables |
| `supabase/functions/chat/context-prompts.ts` | MODIFY | Add meta-framework to employee prompt only |
| `supabase/functions/chat/index.ts` | MODIFY | Add background signal extraction |
| `supabase/functions/aggregate-signals/index.ts` | CREATE | Aggregate signals across responses |
| `supabase/config.toml` | MODIFY | Register new edge function |
| `src/pages/hr/Analytics.tsx` | MODIFY | Add Drivers tab conditionally |
| `src/components/hr/analytics/DriversTab.tsx` | CREATE | New tab container |
| `src/components/hr/analytics/DimensionRadar.tsx` | CREATE | 5-axis visualization |
| `src/components/hr/analytics/SignalCard.tsx` | CREATE | Signal display component |
| `src/components/hr/analytics/CrossPatterns.tsx` | CREATE | Correlation insights |
| `src/hooks/useSemanticSignals.ts` | CREATE | Data fetching hook |

---

## Example Output

### During Interview

**Employee says:** "I feel like every little decision needs approval from my manager"

**AI extracts (in background):**
- Dimension: AUTONOMY
- Facet: method_control
- Signal: "Employees feel micromanaged in daily task decisions"
- Intensity: 7/10
- Sentiment: negative

### In Analytics (Drivers Tab)

```text
┌─────────────────────────────────────────────────────────┐
│  AUTONOMY                                                │
│  ●●●●●●○○○○ 6/10 Health                                 │
├─────────────────────────────────────────────────────────┤
│  ⚠️ "Employees feel micromanaged in daily decisions"    │
│     8 voices • 73% agreement • Negative                  │
├─────────────────────────────────────────────────────────┤
│  ✓ "People have freedom in project selection"           │
│     5 voices • 60% agreement • Positive                  │
└─────────────────────────────────────────────────────────┘
```

---

## What Stays Unchanged

- Course Evaluation surveys (prompts, extraction, analytics)
- Overview Tab (Pulse Summary + Theme Grid)
- Story Report Tab
- Compare Tab
- Interview latency (signal extraction runs in background)

---

## Estimated Credits

| Phase | Scope | Credits |
|-------|-------|---------|
| 1 | Database migration + RLS | 1-2 |
| 2 | Prompt enhancement | 1-2 |
| 3 | Background signal extraction | 2-3 |
| 4 | Aggregation edge function | 2-3 |
| 5 | DriversTab + DimensionRadar | 3-4 |
| 6 | SignalCard + hooks | 2-3 |
| **Total** | | **11-17** |

