# Voice Chat Initialization Fix - Manual Update Required

## Issue
Voice chat doesn't initialize with the greeting message like text chat does. It should load the `first_message` from the survey and display it when starting.

## Files to Update

### 1. `/workspace/src/hooks/useVoiceChat.ts`

**Line 291-297**: Update the `case 'ready':` block to:

```typescript
case 'ready':
  setVoiceState('listening');
  // Initialize with greeting if we have it
  if (surveyFirstMessage && messages.length === 0) {
    const greeting: Message = {
      role: 'assistant',
      content: surveyFirstMessage,
      timestamp: new Date(),
    };
    setMessages([greeting]);
    setAiTranscript(surveyFirstMessage);
  }
  toast({
    title: 'Voice activated',
    description: surveyFirstMessage || 'Start speaking naturally. I\'m listening...',
  });
  break;
```

The survey data loading code has already been added (lines 42-71), so this should work once the ready case is updated.

## Status
✅ Survey data loading code added
✅ Preview mode initialization fixed (`useRealtimeVoice.ts`)
✅ RealtimeChat triggers initial greeting
⏳ Production mode ready case needs manual update (quote escaping issue)

## Next Steps
1. Manually update the `case 'ready':` block in `useVoiceChat.ts` (line 291-297)
2. Test that voice chat shows greeting message on start
3. Continue with Step 2 improvements
