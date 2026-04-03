

# Export Employee Satisfaction System Prompt

## What This Does
Export the complete employee satisfaction interviewer system prompt as a text document, ready to paste into Langfuse. This includes the full prompt template with all building blocks (response format, core approach, empathy rules, probing principles, reflecting, theme transitions, input types, skip handling, closing) plus the dynamic conversation context template.

## Steps

1. Assemble the full prompt by interpolating all constant blocks into `getEmployeeSatisfactionPrompt()` — replacing `${RESPONSE_FORMAT}`, `${CORE_APPROACH}`, etc. with their actual text
2. Append the `buildConversationContextForType()` template as a separate section showing the dynamic context structure (with placeholder variables)
3. Write to `/mnt/documents/employee_satisfaction_prompt.txt`

## Output
A single text file containing the complete prompt as Langfuse would receive it, with `${themesText}` and `${conversationContext}` documented as variable injection points.

