

# New Theme: "Changes & Recommendations" for Employee Interviews

## What This Does

Adds a new optional theme called **"Changes & Recommendations"** to the employee satisfaction theme catalog. When selected by HR, the AI will explore what employees would like to change in their workplace, gently steering them toward constructive, actionable suggestions. The theme is stored and collected like any other — no new UI needed yet.

## Design

The AI's probing style will be **open exploration**: let employees share freely what they'd change, with gentle steering toward constructive framing when responses are purely negative. The theme's sentiment keywords and suggested questions will guide the AI to eventually draw out specific, feasible ideas.

The theme will be positioned like any other in the catalog. To ensure it comes **near the end of the interview**, the system prompt's conversation flow already covers themes in order — HR can place it last, and the closing flow (expansion word cloud + gratitude) happens only after all themes including this one are covered.

## Steps

### 1. Add theme to database via migration

Insert a new row into `survey_themes` for `employee_satisfaction`:

| Field | Value |
|-------|-------|
| `name` | Changes & Recommendations |
| `description` | Explore what the employee would like to change in their workplace and collect constructive, actionable suggestions for improvement. |
| `survey_type` | employee_satisfaction |
| `suggested_questions` | ["If you could change one thing about how things work here, what would it be?", "What's a small change that would make a big difference for you?", "What recommendation would you give to leadership if they were listening right now?"] |
| `sentiment_keywords` | `{"positive": ["improve", "suggest", "idea", "opportunity", "better"], "negative": ["stuck", "blocked", "nothing changes", "ignored", "pointless"]}` |
| `is_active` | true |

### 2. No code changes needed

- The theme selector already pulls from `survey_themes` filtered by `survey_type` — it will appear automatically.
- The AI prompt system (`context-prompts.ts`) already injects theme descriptions, suggested questions, and sentiment keywords into the system prompt dynamically via `buildThemesText()`.
- The AI's open exploration style is already supported by the existing probing principles ("follow their lead, non-directive").
- The closing flow (expansion word cloud → gratitude) already triggers only after all selected themes are covered.

## What HR Sees

A new selectable theme "Changes & Recommendations" in the theme picker when creating an employee satisfaction survey. When selected, the AI will naturally explore it during the interview, collecting constructive suggestions that appear in analytics alongside other response data.

