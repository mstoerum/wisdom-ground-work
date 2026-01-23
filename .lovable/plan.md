

## Plan: Redesign Spradley Evaluation as Typeform-Style Focused Flow

### Overview
Replace the current chat-based `SpradleyEvaluation` component with a focused, one-question-per-screen interface that matches the `FocusedInterviewInterface` design pattern. This creates a consistent UX where the evaluation feels like a natural extension of the interview rather than a separate module.

---

### Current vs. New Architecture

```text
CURRENT (Chat-Based):
┌─────────────────────────────────────────────────────────────────┐
│  SpradleyEvaluation.tsx                                          │
│  ├─ ScrollArea with ConversationBubble messages                  │
│  ├─ Countdown timer (creates anxiety)                            │
│  ├─ Progress bar based on message count                          │
│  └─ Textarea + Send button (chat input)                          │
└─────────────────────────────────────────────────────────────────┘

NEW (Focused Flow):
┌─────────────────────────────────────────────────────────────────┐
│  FocusedEvaluation.tsx                                           │
│  ├─ AIResponseDisplay (single question centered)                 │
│  ├─ AnswerInput (familiar input from interview)                  │
│  ├─ Subtle step indicator (1/4)                                  │
│  └─ Skip button (always available)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Design Principles

1. **Consistent UX**: Match the interview's Typeform-style flow
2. **No Time Pressure**: Remove visible countdown (auto-complete silently)
3. **Clear Progress**: Show "Question 1 of 4" instead of time remaining
4. **Smooth Transition**: Use transition animation between SummaryReceipt and evaluation
5. **Focused Questions**: One question at a time, centered display
6. **Quick Exit**: Skip button always visible, respected

---

### Part 1: Create New FocusedEvaluation Component

**File: `src/components/employee/FocusedEvaluation.tsx`**

Structure matching FocusedInterviewInterface:

```typescript
interface FocusedEvaluationProps {
  surveyId: string;
  conversationSessionId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

const EVALUATION_QUESTIONS = [
  {
    id: "overall",
    question: "Overall, how did you find this conversation compared to traditional surveys?",
    placeholder: "Share your impression..."
  },
  {
    id: "ease",
    question: "Was it easier to express yourself in conversation versus filling out a form?",
    placeholder: "What felt different..."
  },
  {
    id: "understanding", 
    question: "Did I understand your responses well, or did you need to rephrase things?",
    placeholder: "How was our back-and-forth..."
  },
  {
    id: "value",
    question: "What would make you want to use Spradley again?",
    placeholder: "Any suggestions..."
  }
];
```

**Key Features**:
- Uses `AIResponseDisplay` for question display (centered, animated)
- Uses `AnswerInput` for response input (consistent with interview)
- Step indicator: "Question 1 of 4" (no countdown)
- Smooth transitions between questions using `AnimatePresence`
- Auto-saves responses after each answer
- Optional NPS-style rating before first question

---

### Part 2: Update Component Layout

**New visual structure**:

```text
┌─────────────────────────────────────────────────────────────────┐
│                                               [Skip Evaluation] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│            📝 Help Us Improve Spradley                           │
│            Question 1 of 4                                       │
│                                                                  │
│     ┌─────────────────────────────────────────────────────┐     │
│     │                                                      │     │
│     │   "Overall, how did you find this conversation       │     │
│     │    compared to traditional surveys?"                 │     │
│     │                                                      │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
│     ┌─────────────────────────────────────────────────────┐     │
│     │ Share your impression...                             │     │
│     │                                                      │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                  │
│                                            [Continue →]          │
│                                                                  │
│            Your feedback helps improve the experience            │
├─────────────────────────────────────────────────────────────────┤
│                        ●○○○                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

### Part 3: Implement State Machine

**File: `src/components/employee/FocusedEvaluation.tsx`**

```typescript
type EvaluationStep = "intro" | "question" | "complete";

// State management
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [responses, setResponses] = useState<Record<string, string>>({});
const [currentAnswer, setCurrentAnswer] = useState("");
const [isLoading, setIsLoading] = useState(false);
const [isTransitioning, setIsTransitioning] = useState(false);

// Handle answer submission
const handleSubmit = async () => {
  if (!currentAnswer.trim()) return;
  
  const questionId = EVALUATION_QUESTIONS[currentQuestionIndex].id;
  setResponses(prev => ({ ...prev, [questionId]: currentAnswer }));
  
  setIsTransitioning(true);
  
  // Animate out current question
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (currentQuestionIndex < EVALUATION_QUESTIONS.length - 1) {
    // Move to next question
    setCurrentQuestionIndex(prev => prev + 1);
    setCurrentAnswer("");
  } else {
    // All questions answered - save and complete
    await saveEvaluation();
  }
  
  setIsTransitioning(false);
};
```

---

### Part 4: Optional Quick Rating

Before the first question, show an optional NPS-style quick rating:

```text
┌─────────────────────────────────────────────────────────────────┐
│                                               [Skip Evaluation] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│        How would you rate your experience with Spradley?         │
│                                                                  │
│          😟   😐   🙂   😊   🤩                                   │
│           1    2    3    4    5                                   │
│                                                                  │
│            (Click to rate, or skip to comments)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

This provides:
- Quick quantitative data for HR analytics
- Low-friction entry point
- Optional - user can skip to text questions

---

### Part 5: Reuse Existing Components

**Components to reuse (no changes needed)**:
- `AIResponseDisplay` - Question display with animations
- `AnswerInput` - Text input with submit button
- `motion` from framer-motion - Transitions

**Shared patterns from FocusedInterviewInterface**:
- Same layout structure (centered content, footer hint)
- Same animation patterns (fade in/out between questions)
- Same input behavior (Enter to submit)

---

### Part 6: Simplify Edge Function

**File: `supabase/functions/evaluate-spradley/index.ts`**

Since we're using predefined questions, simplify the edge function to:
1. **Remove real-time question generation** (questions are now static)
2. **Keep sentiment analysis** (analyze all responses at end)
3. **Add batch save endpoint** (save all responses at once)

New simplified endpoint behavior:
```typescript
// POST request body
{
  surveyId: string,
  conversationSessionId: string,
  responses: {
    overall: string,
    ease: string,
    understanding: string,
    value: string
  },
  quickRating?: number // 1-5 NPS-style rating
}

// Response
{
  success: boolean,
  sentiment: "positive" | "neutral" | "negative",
  sentimentScore: number
}
```

---

### Part 7: Update EmployeeSurveyFlow

**File: `src/components/employee/EmployeeSurveyFlow.tsx`**

Replace `SpradleyEvaluation` import with `FocusedEvaluation`:

```typescript
import { FocusedEvaluation } from "@/components/employee/FocusedEvaluation";

// In render:
{step === "evaluation" && conversationId && (
  <FocusedEvaluation
    surveyId={surveyId}
    conversationSessionId={conversationId}
    onComplete={handleEvaluationComplete}
    onSkip={handleEvaluationSkip}
  />
)}
```

---

### Part 8: Add Smooth Transition

Add a brief "One more thing..." transition between SummaryReceipt completion and evaluation:

```typescript
// New TransitionToEvaluation component
const TransitionToEvaluation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh] gap-6"
    >
      <p className="text-2xl font-medium text-center">
        One more thing...
      </p>
      <p className="text-muted-foreground">
        Help us improve Spradley with 4 quick questions
      </p>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </motion.div>
  );
};
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/employee/FocusedEvaluation.tsx` | NEW - Typeform-style evaluation component |
| `src/components/employee/SpradleyEvaluation.tsx` | Keep for reference, no longer used in main flow |
| `src/components/employee/EmployeeSurveyFlow.tsx` | Import FocusedEvaluation instead of SpradleyEvaluation |
| `supabase/functions/evaluate-spradley/index.ts` | Simplify to batch save endpoint |

---

### Implementation Order

1. **Create FocusedEvaluation.tsx** with static questions and reused components
2. **Add optional QuickRating sub-component** for NPS-style rating
3. **Add TransitionToEvaluation** for smooth entry
4. **Update EmployeeSurveyFlow** to use new component
5. **Simplify edge function** to handle batch save
6. **Test complete flow** from interview → receipt → evaluation → complete

---

### Technical Benefits

- **Code Reuse**: Leverages existing `AIResponseDisplay` and `AnswerInput`
- **Consistent Animation**: Uses same framer-motion patterns
- **Simpler State**: Predictable question flow vs. dynamic AI responses
- **Better Analytics**: Structured responses by question ID
- **Reduced API Calls**: Single batch save vs. multiple chat calls
- **No Time Anxiety**: Hidden auto-complete, visible step progress

---

### Testing Checklist

- [ ] Quick rating displays before first question (optional click)
- [ ] Transition animation from SummaryReceipt to evaluation
- [ ] Questions display one at a time with centered layout
- [ ] AnswerInput works same as in interview (Enter to submit)
- [ ] Progress indicator shows "Question 1 of 4"
- [ ] Skip button works at any point
- [ ] All responses saved correctly to database
- [ ] Smooth transition between questions
- [ ] Complete flow works for anonymous users
- [ ] Mobile responsive layout

