

# Fix: Transcript Q&A Display Order

## Problem

Each `responses` row stores:
- `content` — the user's message (what they said)
- `ai_response` — the AI's reply to that message (the follow-up question)

The current transcript renders `ai_response` before `content` in each row, making it appear as if the AI asked a question and the user answered it in the same row. In reality, the `ai_response` is what came **after** the user's `content`.

This is especially visible with the mood check: the user's mood answer appears below the AI's first question, but chronologically the mood answer came first (in response to a welcome prompt not stored in this row).

## Fix

### Modify `src/components/hr/analytics/SessionDetailPanel.tsx`

Reverse the render order within each transcript row: show **User content first**, then **AI response second**.

For the first row, the AI's initial welcome/mood prompt isn't stored in the responses table — it was the survey's `first_message`. To provide full context, prepend the survey's `first_message` as the opening Bot message before the first user response.

Changes:
1. Fetch the survey's `first_message` field alongside the existing queries
2. Render an opening Bot bubble with the `first_message` before the first transcript row
3. In each transcript row, flip the order: render `content` (User) first, then `ai_response` (Bot) second
4. This makes the flow read naturally: welcome → mood answer → AI question → user answer → AI question → ...

| Action | File |
|--------|------|
| Modify | `src/components/hr/analytics/SessionDetailPanel.tsx` — flip Q&A order, add first_message opener |

