

## Plan: Make Evaluation Questions Dynamic and Context-Aware

### Overview
Transform the evaluation from static hardcoded questions to a dynamic, context-aware flow that mirrors the main interview's intelligence. The evaluation should feel like a natural continuation of the conversation, not a separate survey.

---

### Current Problem

```text
MAIN INTERVIEW:                          CURRENT EVALUATION:
┌────────────────────────────┐          ┌────────────────────────────┐
│ • LLM-generated questions  │          │ • 4 static hardcoded Qs    │
│ • Context-aware            │          │ • No conversation context  │
│ • Empathy acknowledgments  │          │ • No empathy layer         │
│ • Adapts to responses      │          │ • Fixed progression        │
│ • Theme-aware              │          │ • Generic questions        │
└────────────────────────────┘          └────────────────────────────┘
        ↓ Feels natural                       ↓ Feels robotic
```

---

### Solution: Hybrid Dynamic Evaluation

Create a system where:
1. **Core dimensions are fixed** (for analytics consistency)
2. **Question wording is dynamic** (personalized to their experience)
3. **Follow-ups are adaptive** (based on their rating/response)
4. **Context is injected** (from their actual interview)

---

### Part 1: Pass Interview Context to Evaluation

**File: `src/components/employee/EmployeeSurveyFlow.tsx`**

Pass interview context when transitioning to evaluation:

```typescript
// Collect context from the interview
interface InterviewContext {
  themesDiscussed: string[];
  overallSentiment: 'positive' | 'neutral' | 'negative';
  exchangeCount: number;
  duration: number;
  initialMood: number;
  keyTopicsMentioned: string[]; // e.g., "workload", "manager", "team"
}

// Pass to FocusedEvaluation
<FocusedEvaluation
  surveyId={surveyId}
  conversationSessionId={conversationId}
  interviewContext={interviewContext}
  onComplete={handleEvaluationComplete}
  onSkip={handleEvaluationSkip}
/>
```

---

### Part 2: Dynamic Question Generation Strategy

**New approach**: Define **question templates** with context placeholders:

```typescript
const EVALUATION_DIMENSIONS = [
  {
    id: "overall",
    dimension: "Overall Experience",
    // Template varies based on context
    templates: {
      positive: "You seemed to have a good experience sharing about {theme}. What made it feel natural?",
      negative: "I noticed you had some frustrations to share. Did the conversation let you express them fully?",
      neutral: "Overall, how did this conversation compare to traditional surveys you've taken?"
    },
    followUp: {
      // If rating is low, ask why
      lowRating: "What specifically felt off?",
      highRating: "What worked particularly well?",
    }
  },
  {
    id: "understanding",
    dimension: "Understanding Quality",
    templates: {
      default: "Did I understand your responses well, or did you need to rephrase things?",
      withContext: "When you talked about {topic}, did my follow-up questions feel relevant?"
    }
  },
  // ... more dimensions
];
```

---

### Part 3: Add Empathy Layer

Match the interview's empathy pattern for evaluation responses:

```typescript
// After user answers evaluation question
const generateEmpathyResponse = (answer: string, dimension: string) => {
  // Simple client-side logic (no API call needed)
  const sentiment = detectSimpleSentiment(answer);
  
  const empathyPhrases = {
    positive: ["Great to hear.", "That's helpful feedback.", "Good to know."],
    negative: ["Thanks for being honest.", "I appreciate that perspective.", "That's valuable feedback."],
    neutral: ["Thanks for sharing.", "Got it.", "Understood."]
  };
  
  return empathyPhrases[sentiment][Math.floor(Math.random() * 3)];
};
```

---

### Part 4: Adaptive Follow-Up Logic

If quick rating is low (1-2), adjust the first question:

```typescript
const getAdaptiveFirstQuestion = (rating: number | null, context: InterviewContext) => {
  if (rating === null) {
    // No rating given, use neutral question
    return "How did this conversation compare to traditional surveys?";
  }
  
  if (rating <= 2) {
    // Poor rating - probe what went wrong
    return "I'd love to understand what didn't work well. Was it the questions, the flow, or something else?";
  }
  
  if (rating >= 4) {
    // Good rating - ask what worked
    return "Glad you had a good experience! What specifically felt different from traditional surveys?";
  }
  
  // Middle rating - balanced question
  return "What were the best and worst parts of this conversation?";
};
```

---

### Part 5: Simplified Implementation

For MVP, keep it simpler than full LLM integration:

**Option A: Client-Side Dynamic Templates**
- No API calls needed
- Fast and reliable
- Uses interview context for personalization
- Predictable for analytics

```typescript
const getContextualQuestion = (
  dimension: EvaluationDimension,
  context: InterviewContext,
  previousAnswers: Record<string, string>,
  quickRating: number | null
): { question: string; empathy: string | null } => {
  
  // First question adapts to rating
  if (dimension.id === "overall" && quickRating !== null) {
    if (quickRating <= 2) {
      return {
        empathy: null,
        question: "I'd love to understand what didn't work. Was it the questions, the pace, or the conversation style?"
      };
    } else if (quickRating >= 4) {
      return {
        empathy: null,
        question: `You discussed ${context.themesDiscussed[0] || "your experience"} with me. What made it feel natural to open up?`
      };
    }
  }
  
  // Subsequent questions get empathy based on previous answer
  const prevAnswer = previousAnswers[Object.keys(previousAnswers).pop() || ""];
  const empathy = prevAnswer ? generateEmpathyResponse(prevAnswer) : null;
  
  // Inject context into question
  let question = dimension.templates.default;
  if (context.themesDiscussed.length > 0 && dimension.templates.withContext) {
    question = dimension.templates.withContext.replace(
      "{theme}", 
      context.themesDiscussed[0]
    );
  }
  
  return { question, empathy };
};
```

---

### Part 6: Updated Component Structure

**File: `src/components/employee/FocusedEvaluation.tsx`**

```typescript
interface FocusedEvaluationProps {
  surveyId: string;
  conversationSessionId: string;
  interviewContext?: InterviewContext; // NEW: context from interview
  onComplete: () => void;
  onSkip?: () => void;
}

// Define dimensions (not full questions)
const EVALUATION_DIMENSIONS = [
  { id: "overall", name: "Overall Experience" },
  { id: "ease", name: "Ease of Expression" },
  { id: "understanding", name: "Understanding Quality" },
  { id: "value", name: "Future Value" },
];

// Generate question dynamically
const getCurrentQuestion = useCallback(() => {
  const dimension = EVALUATION_DIMENSIONS[currentQuestionIndex];
  return getContextualQuestion(
    dimension,
    interviewContext,
    responses,
    quickRating
  );
}, [currentQuestionIndex, interviewContext, responses, quickRating]);
```

---

### Part 7: Preserve Analytics Consistency

While questions are dynamic, save structured data by dimension:

```typescript
// Save with dimension ID for analytics
const { error } = await supabase.from("spradley_evaluations").insert({
  // ... other fields
  evaluation_responses: Object.entries(allResponses).map(([dimensionId, answer]) => ({
    dimension_id: dimensionId, // "overall", "ease", etc.
    dimension_name: EVALUATION_DIMENSIONS.find(d => d.id === dimensionId)?.name,
    question_asked: questionsAsked[dimensionId], // Actual question shown
    answer,
  })),
  interview_context: interviewContext, // Store for analysis
});
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/employee/FocusedEvaluation.tsx` | Add dynamic question generation, empathy layer, context awareness |
| `src/components/employee/EmployeeSurveyFlow.tsx` | Build and pass `InterviewContext` to evaluation |
| `src/utils/evaluationQuestions.ts` | NEW: Question templates and generation logic |

---

### Implementation Phases

**Phase 1 (This Sprint):**
- Add `InterviewContext` interface and pass from flow
- Implement client-side adaptive questions based on quick rating
- Add empathy acknowledgments between questions
- Personalize first question with theme context

**Phase 2 (Future):**
- Add LLM-powered follow-up questions for deep insights
- Implement real-time sentiment analysis during evaluation
- A/B test different question approaches

---

### Expected Improvements

| Metric | Before | After |
|--------|--------|-------|
| **User Experience** | Robotic, disconnected | Feels like continuation of conversation |
| **Question Relevance** | Generic, same for all | Personalized to their experience |
| **Insight Quality** | Basic yes/no feedback | Contextual, actionable insights |
| **Completion Rate** | ~70% (estimate) | ~85%+ (with relevant questions) |
| **Analytics Value** | Unstructured text | Structured by dimension + context |

---

### Technical Notes

- No additional API calls needed (client-side logic)
- Falls back gracefully if context unavailable
- Maintains backward compatibility with existing data
- Dimension IDs remain stable for analytics

