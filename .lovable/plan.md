
# ElevenLabs Conversational AI Integration Plan

## Executive Summary

Migrate Spradley's voice mode from OpenAI Realtime API to ElevenLabs Conversational AI for superior voice quality, simpler architecture, and better user experience.

## Current State Analysis

### Existing Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CURRENT: OpenAI Realtime API                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PREVIEW MODE (WebRTC)              PRODUCTION MODE (WebSocket Proxy)       │
│  ┌──────────────────────┐           ┌──────────────────────────────────┐   │
│  │ useRealtimeVoice.ts  │           │ useVoiceChat.ts                  │   │
│  │        ↓             │           │        ↓                         │   │
│  │ RealtimeAudio.ts     │           │ WebSocket to Edge Function       │   │
│  │        ↓             │           │        ↓                         │   │
│  │ realtime-session     │           │ voice-chat/index.ts              │   │
│  │ (ephemeral token)    │           │ (proxies to OpenAI WebSocket)    │   │
│  │        ↓             │           │        ↓                         │   │
│  │ OpenAI WebRTC        │           │ OpenAI WebSocket API             │   │
│  └──────────────────────┘           └──────────────────────────────────┘   │
│                                                                             │
│  Voice: "alloy" (OpenAI)            Cost: ~$0.30/min                        │
│  Latency: 300-600ms                 Complexity: HIGH (dual implementation)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Pain Points

| Issue | Impact |
|-------|--------|
| Dual implementation (WebRTC + WebSocket) | High maintenance burden |
| OpenAI voice quality | Robotic, less empathetic |
| Cost ($0.30/min) | Expensive for scale |
| Complex error handling | Fragile user experience |
| No fallback strategy | Complete failure if API issues |

## Proposed Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEW: ElevenLabs Conversational AI                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Browser (React)                                │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  useElevenLabsVoice.ts (new unified hook)                       │ │   │
│  │  │        ↓                                                        │ │   │
│  │  │  @elevenlabs/react → useConversation()                          │ │   │
│  │  │        ↓                                                        │ │   │
│  │  │  WebRTC connection to ElevenLabs                                │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                              ↕                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Edge Functions                                    │   │
│  │  ┌────────────────────────┐  ┌────────────────────────────────────┐  │   │
│  │  │ elevenlabs-token       │  │ save-voice-response (client tool)  │  │   │
│  │  │ - Generate conv token  │  │ - Save transcript to Supabase      │  │   │
│  │  │ - Inject system prompt │  │ - Detect theme & sentiment         │  │   │
│  │  │ - Configure voice      │  │ - Track conversation progress      │  │   │
│  │  └────────────────────────┘  └────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Voice: "Lily" (warm, empathetic)   Cost: ~$0.07/min                        │
│  Latency: <500ms                    Complexity: LOW (single SDK)            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Voice Selection: "Lily" for Spradley

Based on the Spradley personality requirements (warm, empathetic, genuine), the **Lily** voice is the ideal choice:

| Voice | ID | Characteristics | Fit for Spradley |
|-------|-----|-----------------|------------------|
| **Lily** (recommended) | `pFZP5JQG7iQjIQuC4Bku` | Warm, caring, empathetic | Perfect - matches Atlas personality |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Professional, clear | Good alternative |
| Alice | `Xb7hH8MSUJpSbSDYk0k2` | Friendly, approachable | Also suitable |

## Implementation Phases

### Phase 1: Setup ElevenLabs Connector

**Prerequisites:**
- Enable ElevenLabs connector via Lovable
- Creates `ELEVENLABS_API_KEY` secret automatically

**Files:**
- No code changes - just connector setup

### Phase 2: Create Token Generation Edge Function

**New file:** `supabase/functions/elevenlabs-conversation-token/index.ts`

This edge function will:
1. Authenticate the user
2. Load conversation context from Supabase
3. Build the Spradley system prompt with theme awareness
4. Generate a WebRTC conversation token from ElevenLabs
5. Return token to client for connection

**Key implementation details:**
- Uses same system prompt logic as current voice-chat function
- Injects conversation history for context continuity
- Configures "Lily" voice with appropriate settings

### Phase 3: Create New Voice Hook

**New file:** `src/hooks/useElevenLabsVoice.ts`

Unified hook that:
- Manages ElevenLabs `useConversation` from `@elevenlabs/react`
- Handles token fetching from edge function
- Provides same interface as current hooks (voiceState, messages, etc.)
- Implements client tools for response saving

**Interface (backwards compatible):**
```typescript
interface UseElevenLabsVoiceOptions {
  conversationId: string;
  isPreviewMode?: boolean;
  surveyData?: { first_message?: string; themes?: Array<{ name: string; description: string }> };
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onError?: (error: string) => void;
}

// Returns same shape as current hooks
{
  voiceState: VoiceState;
  messages: Message[];
  userTranscript: string;
  aiTranscript: string;
  isSupported: boolean;
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => void;
}
```

### Phase 4: Create Response Saving Edge Function

**New file:** `supabase/functions/save-voice-response/index.ts`

Called by ElevenLabs client tools to:
1. Save user transcript and AI response to `responses` table
2. Detect theme using Lovable AI
3. Analyze sentiment
4. Track conversation progress
5. Trigger completion logic when appropriate

### Phase 5: Update VoiceInterface Component

**Modified file:** `src/components/employee/VoiceInterface.tsx`

Changes:
- Import new `useElevenLabsVoice` hook
- Replace dual-mode logic with single implementation
- Update VoiceOrb to respond to ElevenLabs states
- Remove deprecated audio processing code
- Simplify error handling

### Phase 6: Cleanup Legacy Code

**Files to archive/remove:**
- `src/hooks/useVoiceChat.ts` → Archive
- `src/hooks/useRealtimeVoice.ts` → Archive
- `src/utils/RealtimeAudio.ts` → Archive
- `supabase/functions/voice-chat/index.ts` → Archive
- `supabase/functions/realtime-session/index.ts` → Archive

## Technical Details

### ElevenLabs Agent Configuration

The agent will be configured dynamically via prompt overrides (no hardcoded agent in ElevenLabs dashboard):

```typescript
const conversation = useConversation({
  overrides: {
    agent: {
      prompt: { prompt: spradleySystemPrompt },
      firstMessage: surveyFirstMessage,
      language: "en",
    },
    tts: {
      voiceId: "pFZP5JQG7iQjIQuC4Bku", // Lily
    },
  },
  clientTools: {
    saveResponse: async (params: { userText: string; aiText: string }) => {
      // Save to Supabase via edge function
      return "Response saved";
    },
  },
  onMessage: handleMessage,
  onError: handleError,
});
```

### Client Tools for Data Persistence

ElevenLabs client tools allow the agent to trigger client-side actions. We'll use this for:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `saveResponse` | Save transcript exchange | `{ userText, aiText, themeId? }` |
| `endConversation` | Signal completion | `{ summary }` |
| `flagConcern` | Flag urgent sentiment | `{ concern, severity }` |

### Fallback Strategy

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Graceful Degradation Chain                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMARY: ElevenLabs Conversational AI                          │
│     ↓ (if connection fails)                                     │
│  FALLBACK 1: Browser Speech API (Web Speech + TTS)              │
│     ↓ (if browser unsupported)                                  │
│  FALLBACK 2: Text Chat Mode (existing chat interface)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | CREATE | Generate WebRTC tokens with dynamic prompts |
| `supabase/functions/save-voice-response/index.ts` | CREATE | Client tool for response persistence |
| `src/hooks/useElevenLabsVoice.ts` | CREATE | Unified voice hook using ElevenLabs SDK |
| `src/components/employee/VoiceInterface.tsx` | MODIFY | Use new hook, simplify architecture |
| `src/components/employee/VoiceOrb.tsx` | MODIFY | Adapt to ElevenLabs state events |
| `supabase/config.toml` | MODIFY | Register new edge functions |
| `package.json` | MODIFY | Add `@elevenlabs/react` dependency |

## Cost Comparison

| Metric | Current (OpenAI) | New (ElevenLabs) | Savings |
|--------|------------------|------------------|---------|
| Cost per minute | ~$0.30 | ~$0.07 | **77%** |
| 100 employees × 15min | $450/month | $105/month | $345/month |
| Voice quality | Good | Excellent | ⬆️ |
| Latency | 300-600ms | <500ms | Similar |
| Code complexity | High (dual mode) | Low (single SDK) | ⬇️ |

## Implementation Sequence

1. **Enable ElevenLabs connector** (0 credits)
2. **Create token edge function** (2-3 credits)
3. **Create save-response edge function** (1-2 credits)
4. **Create useElevenLabsVoice hook** (3-4 credits)
5. **Update VoiceInterface** (2-3 credits)
6. **Test end-to-end** (1 credit)
7. **Cleanup legacy code** (1 credit)

**Total estimated: 10-14 credits across 2-3 sessions**

## Testing Plan

1. **Unit tests**: Hook state management, token fetching
2. **Integration tests**: Full conversation flow in preview mode
3. **Voice quality**: Manual testing of Lily voice for empathy/warmth
4. **Error scenarios**: Network failures, token expiration, interruptions
5. **Performance**: Measure latency, compare to baseline

## Success Criteria

- Voice conversations feel more natural and empathetic
- Latency under 500ms for first audio response
- Zero regression in transcript accuracy
- All existing features preserved (theme tracking, sentiment analysis)
- Cost reduction of 70%+ per conversation minute
- Single codebase instead of dual implementation
