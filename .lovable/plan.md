

## Plan: End-to-End Test of Diverse Probing Patterns

### What to test

Deploy a test survey using the 4 new themes (Contribution, Mindfulness, Optimism, Working Experience), then have a multi-turn conversation to verify:

1. **Door-opener questions** rotate correctly per theme
2. **Follow-up questions** use varied probing styles (not repetitive "What specifically...")
3. **Anti-repetition rule** works — consecutive questions use different openers
4. **Theme transitions** happen after ~3 exchanges per theme

### Steps

1. **Create & deploy a test survey** via the HR dashboard with all 4 themes selected, published as a public link
2. **Open the public survey link** and start a conversation
3. **Give 3-4 vague/short answers per theme** (e.g., "it's fine", "pretty good", "not bad") to force the AI to probe — this is where repetition would surface
4. **Verify each follow-up** uses a different probe pattern (recency anchor, scenario replay, contrast, impact, etc.)
5. **Check theme transitions** — after ~3 exchanges the AI should move to the next theme with a natural bridge
6. **Review edge function logs** for any errors in the chat function

### Success criteria

- No two consecutive questions start with the same word/pattern
- At least 3 different probe styles used across a single theme's 3 exchanges
- Door-openers match the `first-questions.ts` pools for each theme

