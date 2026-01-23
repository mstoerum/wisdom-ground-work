

## Plan: Simplify Interview Completion Flow & State Machine

### Overview
Refactor the interview completion logic to reduce complexity, eliminate duplication, and create a single source of truth. This will make the flow easier to maintain, debug, and extend.

---

### Part 1: Simplify State Machine (5 states → 3 states)

**Current states** (confusing):
```
"none" → "confirming" → "summarizing" → "final-question" → "completing"
```

**New states** (clear):
```
"active" → "reviewing" → "complete"
```

**File: `src/components/employee/ChatInterface.tsx`**

| Old State | New State | Meaning |
|-----------|-----------|---------|
| `none` | `active` | User is in conversation |
| `confirming` | (removed) | Merged into dialog open/close state |
| `summarizing` | `reviewing` | Showing summary receipt |
| `final-question` | `reviewing` | User can add more or complete |
| `completing` | `complete` | Interview finished |

Changes:
- Replace `finishEarlyStep` type with simplified version
- Use `isFinishDialogOpen` boolean for confirmation dialog
- Combine summary display and final question into single "reviewing" phase

---

### Part 2: Unified Completion Response Interface

**File: `src/types/interview.ts`** (new file)

Create shared types for completion flow:

```typescript
interface CompletionResponse {
  isComplete: boolean;
  structuredSummary?: {
    opening: string;      // Personalized acknowledgment
    keyPoints: string[];  // 2-4 bullet points
    sentiment: 'positive' | 'neutral' | 'mixed';
  };
  sessionStats?: {
    responseCount: number;
    themesExplored: number;
    totalThemes: number;
    duration?: number;
  };
}

interface ThemeProgress {
  themeId: string;
  themeName: string;
  depth: number;        // 0-100
  exchangeCount: number;
  status: 'not-started' | 'in-progress' | 'explored';
}
```

---

### Part 3: Backend as Single Source of Truth for Theme Progress

**Current problem**: Theme progress calculated in BOTH:
- Frontend: `calculateThemeCoverage()` in ChatInterface
- Backend: `buildThemeProgress()` in chat/index.ts

**Solution**: Remove frontend calculation, only consume backend response.

**File: `src/components/employee/ChatInterface.tsx`**

Remove:
- `calculateThemeCoverage()` function
- Manual theme fetching logic in `useEffect`

Replace with:
- Use `themeProgress` from API response directly
- Store in state when received from `sendMessage()` response

**File: `src/hooks/useChatAPI.ts`**

Ensure all API responses include `themeProgress`:
- Extract from response and return to caller
- Add to return type

---

### Part 4: Consolidate Completion Logic

**Current problem**: Multiple completion triggers scattered:
1. `shouldCompleteBasedOnThemes()` in backend
2. Exchange count checks in frontend
3. `isInCompletionPhase` state in FocusedInterviewInterface
4. `finishEarlyStep` state in ChatInterface

**Solution**: Single completion decision point.

**File: `supabase/functions/chat/index.ts`**

Keep `shouldCompleteBasedOnThemes()` as THE decision maker, but enhance:

```typescript
function shouldComplete(context: ConversationContext): CompletionDecision {
  const { exchanges, themeProgress, lastResponseLength, sentimentTrajectory } = context;
  
  // Hard limits
  if (exchanges < 4) return { complete: false, reason: 'minimum-not-met' };
  if (exchanges >= 20) return { complete: true, reason: 'maximum-reached' };
  
  // Theme coverage check
  const coverage = calculateCoverage(themeProgress);
  if (coverage >= 80) return { complete: true, reason: 'excellent-coverage' };
  if (coverage >= 60 && hasDepth(themeProgress)) return { complete: true, reason: 'good-coverage' };
  
  // Engagement signals (new)
  if (isDisengaging(lastResponseLength, sentimentTrajectory)) {
    return { complete: true, reason: 'user-disengaging' };
  }
  
  return { complete: false, reason: 'continue' };
}
```

**File: `src/components/employee/ChatInterface.tsx`**

Frontend only reacts to `shouldComplete` from backend:
- Remove duplicate completion checks
- Trust `response.shouldComplete` flag

---

### Part 5: Unify ChatInterface and FocusedInterviewInterface

**Current problem**: Two components with similar but different completion logic.

**File: `src/hooks/useInterviewCompletion.ts`** (new hook)

Extract shared completion logic:

```typescript
function useInterviewCompletion(conversationId: string) {
  const [phase, setPhase] = useState<'active' | 'reviewing' | 'complete'>('active');
  const [summary, setSummary] = useState<StructuredSummary | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  
  const handleFinishEarly = () => setDialogOpen(true);
  const handleConfirmFinish = async () => { /* API call */ };
  const handleAddMore = () => setPhase('active');
  const handleComplete = () => setPhase('complete');
  
  return {
    phase,
    summary,
    isDialogOpen,
    handleFinishEarly,
    handleConfirmFinish,
    handleAddMore,
    handleComplete
  };
}
```

Both interfaces can then use this hook for consistent behavior.

---

### Part 6: Update Response Flow Diagram

**New simplified flow:**

```text
┌─────────────────────────────────────────────────────────────┐
│                    INTERVIEW FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    User      ┌─────────┐    API     ┌───────┐ │
│  │ ACTIVE  │───answers───▶│ Backend │───────────▶│Check  │ │
│  │         │              │         │            │Complete│ │
│  └────┬────┘              └─────────┘            └───┬───┘ │
│       │                                               │     │
│       │◀──────────── {shouldComplete: false} ────────┘     │
│       │                                                     │
│       │               {shouldComplete: true}                │
│       │                        │                            │
│       ▼                        ▼                            │
│  ┌─────────┐           ┌────────────┐                      │
│  │ Finish  │──confirm──▶│ REVIEWING  │                      │
│  │ Early?  │           │ (Summary)  │                      │
│  └────┬────┘           └─────┬──────┘                      │
│       │                      │                              │
│       │ cancel          ┌────┴────┐                        │
│       │                 │         │                        │
│       ▼                 ▼         ▼                        │
│  ┌─────────┐      ┌─────────┐ ┌──────────┐                 │
│  │ ACTIVE  │      │Add More │ │ COMPLETE │                 │
│  │(continue)│      │(→ACTIVE)│ │ (done)   │                 │
│  └─────────┘      └─────────┘ └──────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/types/interview.ts` | NEW - Shared types for completion flow |
| `src/hooks/useInterviewCompletion.ts` | NEW - Shared completion hook |
| `src/components/employee/ChatInterface.tsx` | Simplify states, remove theme calculation, use new hook |
| `src/components/employee/FocusedInterviewInterface.tsx` | Use new shared hook |
| `src/hooks/useChatAPI.ts` | Ensure themeProgress returned in all responses |
| `supabase/functions/chat/index.ts` | Enhance shouldComplete with engagement signals |

---

### Testing Checklist

- [ ] Natural completion (hit theme coverage threshold)
- [ ] Finish early with low coverage - shows warning
- [ ] Finish early with good coverage - smooth transition
- [ ] "Add more" returns to active conversation
- [ ] Summary receipt shows correctly
- [ ] Theme progress updates come from backend only
- [ ] Works in both ChatInterface and FocusedInterviewInterface
- [ ] Voice mode unaffected (future enhancement)

---

### Benefits

1. **Easier debugging**: 3 states vs 5 states
2. **Single source of truth**: Backend decides completion
3. **Less code duplication**: Shared hook for both interfaces
4. **Better typing**: Clear interfaces for completion data
5. **Extensible**: Easy to add engagement signals later

