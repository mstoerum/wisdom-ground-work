## Interview Intelligence Upgrade — IMPLEMENTED

All changes from the plan have been implemented and deployed:

1. ✅ **EMPATHY_RULES** rewritten — content-aware, anti-repetition, diverse examples by tone
2. ✅ **THEME_TRANSITIONS** rewritten — contextual bridges required, "Shifting gears" forbidden
3. ✅ **Few-shot examples** diversified in both prompts (no two start with "Thanks")
4. ✅ **RESPONSE_FORMAT** added to course evaluation prompt
5. ✅ **buildConversationContextForType** upgraded with last 3-4 paired Q&A exchanges, 150-char snippets, per-theme depth tracking, mustTransition logic
6. ✅ **Model** switched to `google/gemini-3-flash-preview`
7. ✅ **Temperature** lowered to `0.65` (3 call sites)
8. ✅ **Dead code removed** — `getSystemPrompt()` and `buildConversationContext()` deleted, all flows consolidated through shared `context-prompts.ts`
