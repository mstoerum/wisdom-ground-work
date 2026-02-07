

# Fix Quote Truncation + Add Question Context

## Two Issues to Solve

### 1. Quotes are cut short (truncated to 80 characters)
The `truncateText()` function in `useAnalytics.ts` chops every quote to 80 characters before it reaches the detail view. In the grid overview this makes sense (limited space), but in the detail view you need the full text.

### 2. Quotes lack the question that prompted them
The database already stores the AI's question (`ai_response` column) alongside each employee answer (`content`), but the analytics hook never fetches it. Without seeing "What aspects of your daily work energize you?", a quote like "The flexibility is great but sometimes I feel disconnected" loses half its meaning.

---

## The Fix

### Quote Truncation
- In `useAnalytics.ts`, store **full-length quotes** alongside truncated ones for the `keySignals` data. The truncated versions stay for the grid cards; the full versions are used in the detail view.
- Update the `ThemeInsight` type to include full quotes with their associated question.

### Question Context Display
Your hover idea is spot-on -- a small context icon next to each quote that reveals the question on hover. This keeps the layout clean (quotes remain the focus) while giving context on demand.

The implementation uses a Tooltip (already in the project) with a small "Q" badge or a `HelpCircle` icon:

```
"I love my team, but I spend 4-5 hours in meetings..." [?]
                                                         |
                                          +--------------+----------+
                                          | Question asked:         |
                                          | "How does your typical  |
                                          |  workday flow?"         |
                                          +-------------------------+
```

This pattern is clean, non-intrusive, and follows progressive disclosure -- the quote speaks for itself, and the question is there when you need context.

---

## Technical Changes

### 1. `src/hooks/useAnalytics.ts`
- Update the `ThemeInsight` type: change `keySignals.positives` and `keySignals.concerns` from `string[]` to `{ text: string; fullText: string; question?: string }[]`
- Modify `calculateThemeInsights()` to store both truncated text (for cards) and full text + `ai_response` (for detail view)
- Update the Supabase query to include `ai_response` in the selected fields

### 2. `src/components/hr/analytics/ThemeDetailView.tsx`
- Update the `allQuotes` mapping to use `fullText` instead of truncated `text`
- Add a question context tooltip next to each quote using the existing `Tooltip` component
- Show a small `HelpCircle` icon (from lucide) that on hover displays "Question asked: ..."
- Only show the icon when a question is available (some quotes may not have one)

### 3. `src/components/hr/analytics/ThemeCard.tsx`
- No changes needed -- it already only shows the theme name and score (no quotes on the front face anymore)

### 4. Any other components referencing `keySignals`
- Check all consumers of `ThemeInsight.keySignals` and update them to handle the new shape. The truncated `text` field stays for backward compatibility, so most consumers won't break.

---

## No Database Changes

The `ai_response` column already exists in the `responses` table. We just need to fetch it in the analytics query.

