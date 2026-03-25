

# Session Explorer — Admin Deep-Dive View

## What This Adds

A new "Sessions" tab in the Analytics dashboard that lets HR admins browse individual conversation sessions, see full Q&A transcripts, session metadata (duration, mood shift, sentiment trajectory), and per-session AI insights — all in one place.

## Design

```text
Analytics Tabs:  [Overview]  [Sessions ←NEW]  [Story Report]  [Compare]

Sessions Tab Layout:
┌──────────────────────────────────────────────────────┐
│ Session List (left/top)                              │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🟢 Session #1 · Mar 25 · 12 responses · 8min    │ │
│ │    Mood: 3→4  ·  Trajectory: improving           │ │
│ │ 🟡 Session #2 · Mar 25 · 14 responses · 11min   │ │
│ │    Mood: 4→4  ·  Trajectory: stable              │ │
│ │ ...                                               │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ Session Detail (expands below / panel)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ METADATA BAR                                     │ │
│ │ Duration: 11m · Responses: 14 · Mood: 3→4       │ │
│ │ Themes touched: Working Experience, Contribution │ │
│ ├──────────────────────────────────────────────────┤ │
│ │ AI INSIGHTS (from session_insights)              │ │
│ │ Root Cause: ...                                  │ │
│ │ Key Quotes: ...                                  │ │
│ │ Recommended Actions: ...                         │ │
│ ├──────────────────────────────────────────────────┤ │
│ │ FULL TRANSCRIPT                                  │ │
│ │ Q: How would you describe your daily...          │ │
│ │ A: It's quite varied, we have a lot of...        │ │
│ │ Q: What aspects of that variety...               │ │
│ │ A: The collaboration mostly...                   │ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Implementation Plan

### 1. Create `SessionExplorer.tsx` component
- Fetches `conversation_sessions` for the selected survey (with status, moods, timestamps)
- Fetches `session_insights` joined to those sessions
- Displays a list of session cards with key metrics (duration, response count, mood shift, sentiment trajectory)
- Clicking a session expands/opens a detail panel

### 2. Create `SessionDetailPanel.tsx` component
- **Metadata bar**: duration, response count, mood shift, themes touched
- **AI Insights section**: root cause, key quotes, recommended actions (reuses the existing `SessionInsightsPanel` card styling)
- **Full transcript**: fetches all `responses` for that session ordered by `created_at`, displayed as Q&A pairs (ai_response = question, content = answer), filtering out `[SELECTED:]` signals

### 3. Add "Sessions" tab to Analytics page
- Insert a new tab between Overview and Story Report in `src/pages/hr/Analytics.tsx`
- Pass `filters.surveyId` to the SessionExplorer

### Technical Details

**Data queries:**
- Sessions: `conversation_sessions` filtered by `survey_id`, ordered by `started_at desc`
- Insights: `session_insights` joined via `session_id`
- Transcript: `responses` filtered by `conversation_session_id`, joined with `survey_themes(name)`, ordered by `created_at asc`
- Duration calculated from `started_at` / `ended_at`
- Themes touched: distinct `theme_id` from responses, resolved to theme names

**Files to create:**
- `src/components/hr/analytics/SessionExplorer.tsx` — list + detail orchestrator
- `src/components/hr/analytics/SessionDetailPanel.tsx` — expanded session view

**Files to modify:**
- `src/pages/hr/Analytics.tsx` — add Sessions tab

