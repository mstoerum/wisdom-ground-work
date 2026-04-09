

# Analysis: Why "Monta test" Ended Too Early

## What Happened

The survey had **3 themes**: Changes & Recommendations, Recognition & Appreciation, and Optimism. The session lasted only **8 exchanges** before ending.

Looking at the transcript:
- **Turns 1-4**: All tagged to "Changes & Recommendations" — but the conversation was about meetings/workload/stress. The theme *name* "Changes & Recommendations" was never actually explored (no questions about what the employee would *change* or *recommend*).
- **Turn 5**: Tagged to "Recognition & Appreciation" (1 exchange)
- **Turn 6**: Tagged to "Optimism" (1 exchange)
- **Turn 7**: Tagged to "Recognition & Appreciation" — AI then offered "Is there anything else on your mind?" with an expansion word cloud
- **Turn 8**: User selected "I'm all good" → session completed

**The AI raced through themes 2 and 3 with just 1 exchange each**, then jumped to closing because the context told it "All themes covered." The "Changes & Recommendations" theme was never truly explored for its intended purpose.

## Root Causes

### 1. Theme detection misattribution
The first 3-4 responses about meetings/workload were tagged to "Changes & Recommendations" by the lightweight sentiment matcher, even though the employee was venting about workload — not providing constructive change suggestions. This made the system think the theme was deeply explored (3 exchanges) when it wasn't.

### 2. Minimum depth too low
The `shouldCompleteBasedOnThemes` function requires only **avg ≥ 1 exchange per theme** before allowing completion. With 3 themes at counts of [3, 2, 1], the average was ~2, which passed easily.

### 3. No minimum per-theme depth enforcement
There's no check that *each individual theme* has at least 2 exchanges. Theme "Optimism" had just 1, and "Changes & Recommendations" had 0 true exchanges despite being tagged.

### 4. Context prompt allows closing too eagerly
Once all themes are "touched" (even with 1 exchange), the context injects: `"All themes have been covered. You may now begin closing..."` — this signals the AI to jump to the word cloud immediately.

## Fix Plan

### Step 1: Raise minimum per-theme depth in `shouldCompleteBasedOnThemes`
**File**: `supabase/functions/chat/index.ts`

- Require **every theme** to have at least **2 exchanges** (not just average ≥ 1)
- Raise hard minimum from `themes.length + 4` to `themes.length * 3 + 2` (for 3 themes: 11 minimum exchanges)
- Raise hard cap from `themes.length * 4` to `themes.length * 6` (for 3 themes: 18 max)

### Step 2: Gate the "all covered" context signal on depth
**File**: `supabase/functions/chat/context-prompts.ts`

Change the adaptive instruction from triggering when `uncoveredThemes.length === 0` to also checking that each theme has at least 2 exchanges. If themes are touched but shallow, inject: `"Some themes have only been briefly touched. Explore [theme names] more deeply before closing."`

### Step 3: Strengthen the "must cover deeply" instruction
In the context builder, when a theme has only 1 exchange, flag it explicitly: `"[Theme X] has only 1 exchange — explore it further before moving on."`

## Expected Outcome
With 3 themes, the minimum exchanges would be 11 (up from 7), each theme would need at least 2 exchanges, and the AI would receive clear instructions not to close until depth is sufficient. This ensures the "Changes & Recommendations" theme gets genuine exploration.

