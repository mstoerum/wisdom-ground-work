
# Interactive Elements for the Spradley Chat Experience

## Research Findings

### Current State
Right now, the Focused Interview flow is: **Mood Selector (clickable) -> Transition -> Repeating loop of [AI question text -> User types text answer]**. After the initial mood selection, every interaction is identical: read question, type answer, repeat. This creates a monotonous rhythm that can lead to "survey fatigue" -- shorter answers, disengagement, or early exit.

### What the Best Do

**Typeform** pioneered the "one question at a time" conversational format but breaks monotony with alternating input types: text fields, opinion scales, picture choices, yes/no buttons, and rating stars -- all inline, not as separate pages.

**Landbot** (conversational chatbot builder) uses inline "quick reply" chips, sliders, image carousels, and emoji reactions embedded directly in the chat flow. Their key insight: **the AI decides which input type to present based on the question type**, not the user.

**Intercom / Fin** uses "rich message" patterns: inline buttons, cards with actions, and satisfaction ratings that appear as part of the conversation thread rather than as separate UI.

**SurveySparrow** alternates between conversational text and structured inputs (NPS scales, star ratings, matrix grids) to create rhythm variation.

**Culture Amp / Peakon** use Likert scales and open-text in alternation for employee engagement specifically, finding that **structured inputs before open text** prime employees to elaborate more.

### The Core Principle
The research converges on one idea: **vary the input modality every 2-3 exchanges**. Text is the richest data source, but interspersing lightweight, clickable moments creates "breathing room" that actually leads to *better* text responses when text is asked for.

---

## Proposed Interactive Elements

Six interactive element types, each designed to appear **inline** between AI questions, replacing the text input temporarily. The AI backend would signal which element to show via a new `inputType` field in the response.

### 1. Agreement Spectrum (Inline Slider)
A horizontal slider with labeled endpoints that the user drags to express how much they agree/disagree.

- **When**: After the AI makes a specific observation. Example: AI says "It sounds like communication could be better" -> slider appears: "Not at all" <---> "Exactly right"
- **UX**: A single horizontal track with a draggable thumb. Minimal labels at each end. The selected position auto-sends after a brief pause (like Apple's haptic feedback moment).
- **Data value**: Captures a 0-100 numeric score alongside the qualitative text conversation.
- **Why it works**: Lets users validate or push back on AI interpretations without needing to articulate disagreement in words. Quick, low-effort, high-signal.

### 2. Word Cloud Selector (Tap-to-Select Tags)
A set of 4-6 word/phrase chips that the user taps to select (multi-select allowed), with an optional "Something else..." chip that reveals the text input.

- **When**: When the AI wants to narrow a broad topic. Example: AI says "What aspects of your role matter most?" -> chips: "Growth", "Autonomy", "Team", "Recognition", "Balance", "Something else..."
- **UX**: Horizontally wrapping chips with a gentle spring animation on tap. Selected chips get a filled state. A "Continue" button appears after selection.
- **Data value**: Captures the selected tags as structured data + steers the conversation toward what matters to the user.
- **Why it works**: Typeform and Landbot both show this reduces cognitive load. Users who struggle with open-ended "what matters to you?" questions engage 40% more when given starting points. The "Something else..." escape hatch preserves openness.

### 3. Sentiment Pulse (Quick Emoji Reaction)
A row of 3-5 emoji/icon options for quick sentiment capture, similar to the initial Mood Selector but contextual and lighter.

- **When**: Mid-conversation as a "temperature check." Example: After 3-4 text exchanges, the AI asks "How does that make you feel?" -> emoji row appears (no text needed).
- **UX**: Horizontal row of expressive icons (not generic emojis -- abstract mood illustrations or simple face expressions matching Spradley's design language). Single tap sends immediately with a subtle ripple animation.
- **Data value**: Numeric sentiment score anchored to a specific moment in the conversation. Richer than inferring sentiment from text alone.
- **Why it works**: Peakon uses this pattern. It gives the employee a "voice" moment that requires zero typing effort, creating a pleasant pause in the typing rhythm.

### 4. Priority Ranking (Drag-to-Rank or Tap-to-Order)
A short list of 3-4 items that the user ranks by importance, either by dragging or by tapping in order (1st, 2nd, 3rd).

- **When**: When the conversation has surfaced multiple themes and the AI wants to understand relative importance. Example: "You mentioned workload, team dynamics, and career growth. Which matters most right now?"
- **UX**: Three cards/pills stacked vertically. On mobile: tap to assign rank (1, 2, 3). On desktop: drag to reorder. Spring animations on reorder. A "Done" button confirms.
- **Data value**: Produces an ordered priority list -- extremely valuable for HR analytics (weighted importance scoring).
- **Why it works**: Forces explicit prioritization that text responses rarely provide. Lattice and Culture Amp both use priority ranking in their engagement surveys for this reason.

### 5. Confidence Check (Binary or Ternary Inline Buttons)
Simple 2-3 button choices for yes/no/maybe type questions, appearing inline.

- **When**: When the AI wants a direct answer before elaborating. Example: "Would you recommend your team to a friend?" -> [Yes] [Maybe] [No]. After selection, the AI follows up with "Tell me more about why."
- **UX**: 2-3 large, tappable buttons side by side. Tap triggers immediate selection with the selected button filling and others fading. The AI immediately follows up with a text prompt based on the selection.
- **Data value**: Clean binary/ternary data points (eNPS-style) that complement the qualitative text.
- **Why it works**: This is the "quick reply" pattern from Intercom/Drift -- the most proven engagement pattern in conversational UI. It creates a rapid back-and-forth rhythm that feels more like a real conversation than a survey.

### 6. Reflection Moment (Pause and Breathe)
Not an input at all -- a brief, intentional pause with a calming visual and a prompt to reflect before continuing. A "thinking space."

- **When**: After a particularly heavy or emotional exchange. The AI detects strong sentiment and inserts a moment of space. Example: After the user shares something difficult, instead of immediately asking the next question, a gentle animation appears with text: "Thank you for sharing that. Take a moment."
- **UX**: The question area dims slightly. A soft breathing animation or gentle wave plays for 3-5 seconds. A "I'm ready to continue" button appears. No data is captured -- this is purely for psychological safety.
- **Why it works**: This is unique to Spradley. No survey tool does this. It signals that the AI "heard" something meaningful and is not just rushing through questions. It builds trust and primes the user to share more deeply on the next question.

---

## Conversation Rhythm Blueprint

Here is how the elements would interleave in a typical 8-10 exchange session:

```text
Exchange 1:  [Mood Selector]         -- clickable (existing)
Exchange 2:  [Text answer]           -- open text
Exchange 3:  [Text answer]           -- open text (deeper follow-up)
Exchange 4:  [Sentiment Pulse]       -- quick emoji tap (breathing room)
Exchange 5:  [Text answer]           -- open text (re-energized)
Exchange 6:  [Word Cloud Selector]   -- tap tags to steer next topic
Exchange 7:  [Text answer]           -- open text on chosen topic
Exchange 8:  [Agreement Spectrum]    -- slider to validate AI summary
Exchange 9:  [Confidence Check]      -- quick yes/maybe/no
Exchange 10: [Text answer]           -- final elaboration
             [Reflection Moment]     -- if heavy content detected anytime
```

Text still dominates (5-6 of 10 exchanges) to preserve qualitative depth. Interactive elements appear every 2-3 exchanges to break the rhythm.

---

## How It Would Work Technically

### Backend Signal
The chat edge function already returns `{ message, empathy, themeProgress }`. We add a new field:

```json
{
  "message": "What aspects of your role matter most?",
  "empathy": "That's a great point.",
  "inputType": "word_cloud",
  "inputConfig": {
    "options": ["Growth", "Autonomy", "Team", "Recognition", "Balance"],
    "allowOther": true,
    "maxSelections": 3
  }
}
```

When `inputType` is absent or `"text"`, the current AnswerInput renders as normal. When present, the FocusedInterviewInterface swaps in the appropriate interactive component.

### Frontend Components (new files)
| Component | File |
|-----------|------|
| Agreement Spectrum | `src/components/employee/inputs/AgreementSpectrum.tsx` |
| Word Cloud Selector | `src/components/employee/inputs/WordCloudSelector.tsx` |
| Sentiment Pulse | `src/components/employee/inputs/SentimentPulse.tsx` |
| Priority Ranking | `src/components/employee/inputs/PriorityRanking.tsx` |
| Confidence Check | `src/components/employee/inputs/ConfidenceCheck.tsx` |
| Reflection Moment | `src/components/employee/inputs/ReflectionMoment.tsx` |
| Input Router | `src/components/employee/inputs/InteractiveInputRouter.tsx` |

### Modified Files
| File | Change |
|------|--------|
| `FocusedInterviewInterface.tsx` | Replace static `<AnswerInput>` with `<InteractiveInputRouter>` that conditionally renders the right input type |
| `supabase/functions/chat/index.ts` | Add logic to the system prompt and response parsing to include `inputType` + `inputConfig` at appropriate conversation moments |
| `supabase/functions/chat/context-prompts.ts` | Update prompts to instruct the AI when to use each input type |

### Data Flow
All interactive responses get serialized back as text messages in the conversation history (e.g., "[SLIDER: 72/100]" or "[SELECTED: Growth, Balance]") so the AI can reference them naturally. The raw structured data also gets stored as metadata on the conversation response for analytics.

---

## Companies Referenced

- **Typeform**: Alternating input types (scales, choices, text) in conversational flow
- **Landbot**: Rich inline elements (sliders, chips, carousels) in chatbot UI
- **Intercom / Fin**: Quick reply buttons and card-based interactions
- **SurveySparrow**: Conversational forms with mixed input types
- **Culture Amp**: Likert scales + open text alternation for engagement surveys
- **Peakon (Workday)**: Sentiment pulse checks mid-survey
- **Lattice**: Priority ranking in pulse surveys
- **Google Chat / Slack**: Rich message patterns with inline interactive widgets

---

## Recommended Build Order

1. **Confidence Check** (simplest -- 2-3 buttons, highest engagement lift)
2. **Word Cloud Selector** (chips with multi-select, steers conversation)
3. **Sentiment Pulse** (emoji row, quick win)
4. **Agreement Spectrum** (slider, satisfying interaction)
5. **Reflection Moment** (no data capture, pure UX)
6. **Priority Ranking** (most complex, drag/tap ordering)

Each can be built and deployed independently. The InteractiveInputRouter acts as the switching layer, and the backend prompt updates determine when each type appears.
