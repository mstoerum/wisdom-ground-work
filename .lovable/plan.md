

# Story Report Enhancements: 5 Features

## Feature 1: Keyboard Arrow Navigation
Add left/right arrow key support for chapter navigation in `NarrativeReportViewer.tsx`.

**Technical approach:**
- Add a `useEffect` with a `keydown` event listener for `ArrowLeft` and `ArrowRight`
- Call `goToPrevChapter` / `goToNextChapter` respectively
- Clean up listener on unmount
- Only respond when no input/textarea is focused (to avoid conflicts)

**File:** `src/components/hr/analytics/NarrativeReportViewer.tsx`

---

## Feature 2: Remove "Chapter X of Y" Badge
The `StoryChapter` component still renders a `<Badge>` showing "Chapter 1 of 6" (line 103-108). This duplicates the journey nav.

**Technical approach:**
- Remove the `<Badge>` element from `StoryChapter.tsx` (lines 103-108)
- Remove `totalChapters` from the props interface since it's no longer needed
- Update the caller in `NarrativeReportViewer.tsx` to stop passing `totalChapters`

**Files:** `src/components/hr/analytics/StoryChapter.tsx`, `src/components/hr/analytics/NarrativeReportViewer.tsx`

---

## Feature 3: Footer Buttons Show Destination Chapter Name
Instead of generic "Previous" / "Next", show the actual chapter title the user will navigate to.

**Technical approach:**
- In the footer of `NarrativeReportViewer.tsx`, replace `<span>Previous</span>` with the title of `report.chapters[activeChapter - 1]` using the `CHAPTER_LABELS` map
- Replace `<span>Next</span>` with the title of `report.chapters[activeChapter + 1]`
- Truncate long titles on mobile (keep icons only on small screens, show title on `sm:` and up)

**File:** `src/components/hr/analytics/NarrativeReportViewer.tsx`

---

## Feature 4: Insight Bookmarking (Star/Pin Insights)
Let HR users star specific insights they want to act on. Starred insights persist per survey and can later feed into the Commitments page.

**Technical approach:**
- Create a new database table `bookmarked_insights` with columns: `id`, `survey_id`, `insight_text`, `insight_category`, `agreement_percentage`, `chapter_key`, `bookmarked_by` (user id), `created_at`
- Add a small star/bookmark icon button to `InsightCard.tsx` (top-right corner)
- Create a `useBookmarkedInsights(surveyId)` hook for CRUD operations
- When starred, the insight text, category, agreement %, and chapter key are saved
- Starred insights show a filled star icon; clicking again removes the bookmark
- Add RLS policies so users can only manage their own bookmarks

**Files:**
- New migration for `bookmarked_insights` table
- New hook: `src/hooks/useBookmarkedInsights.ts`
- Edit: `src/components/hr/analytics/InsightCard.tsx` (add star button + bookmark state)
- Edit: `src/components/hr/analytics/NarrativeReportViewer.tsx` (pass surveyId down to StoryChapter -> InsightCard)

---

## Feature 5: CommitmentSection in Commitment Chapter

Wire the existing `CommitmentSection` component into the "Commitment" chapter of the Story Report. This creates the natural overlap with bookmarking: when viewing the Commitment chapter, HR sees both the AI narrative AND their existing action commitments + starred insights, making the report a living action document.

**Research findings on best practices:**
- Tools like Culture Amp and Qualtrics surface "action plans" directly alongside survey results rather than on a separate page. The pattern is: insight --> bookmark --> action item --> tracked commitment.
- The best approach is a **layered display**: the AI-generated narrative stays at the top (read-only), followed by a "Your Bookmarked Insights" summary (from Feature 4), then the interactive CommitmentSection where HR can pledge actions.
- This avoids a separate "Commitments" page visit -- the report itself becomes the action space.

**Overlap with bookmarking (Feature 4):**
- Starred insights from any chapter automatically surface in the Commitment chapter as a "Flagged for Action" list
- Each starred insight gets a "Create Commitment" button that pre-fills the commitment form with the insight text
- This creates a natural flow: Read chapter --> Star important insight --> Reach Commitment chapter --> See all starred insights --> Create commitments from them

**Technical approach:**
- Detect when the current chapter key is `commitment` in `StoryChapter.tsx`
- Below the narrative + insights, render:
  1. **Bookmarked Insights Summary** -- a compact list of all starred insights from the report with a "Create Commitment" button per item
  2. **CommitmentSection** -- the existing component, adapted to use the `useCommitments` hook with the current survey ID
- The `CommitmentSection` already handles the form, pledges, and signature UI
- Pass `surveyId` through `NarrativeReportViewer` --> `StoryChapter` to enable the data hooks
- The commitments are saved to the existing `action_commitments` table (already has RLS)

**Files:**
- Edit: `src/components/hr/analytics/StoryChapter.tsx` (add commitment chapter detection + render CommitmentSection + bookmarked insights)
- Edit: `src/components/hr/analytics/NarrativeReportViewer.tsx` (pass surveyId to StoryChapter)
- New component: `src/components/hr/analytics/BookmarkedInsightsSummary.tsx` (compact list of starred insights with "Create Commitment" action)

---

## Implementation Order
1. Feature 1 (keyboard nav) -- standalone, no dependencies
2. Feature 2 (remove badge) -- standalone, quick
3. Feature 3 (destination names) -- standalone, quick
4. Feature 4 (bookmarking) -- needs DB migration first, then hook + UI
5. Feature 5 (commitments) -- depends on Feature 4 for the bookmarked insights summary

