# ✅ Voice Mode Testing Guide

## Quick Status Check

Your OpenAI Realtime API integration is **ready to test**! Here's what's confirmed:

✅ **Code compilation**: No TypeScript errors  
✅ **Edge function**: Updated for OpenAI Realtime API  
✅ **Frontend hook**: Updated for WebSocket streaming  
✅ **API key**: You've added OPENAI_API_KEY  
✅ **No linter errors**: Clean code

## How to Test Right Now

### 1. Start the Development Server

```bash
npm run dev
```

The app should start at `http://localhost:5173` (or similar)

### 2. Navigate to Employee Survey

1. **Login** as an employee (or use demo mode if available)
2. **Start a survey** - Go through the consent and anonymization steps
3. **Look for "Voice Mode"** - You should see a button or banner to switch to voice

### 3. Test Voice Interaction

1. **Click "Switch to Voice Mode"** or the voice button
2. **Grant microphone permission** when your browser asks
3. **Click the microphone button** (large circular button)
4. **Start speaking**: Try saying something like:
   - *"Hi, I want to share some feedback about work"*
5. **Watch for**:
   - The orb should animate (showing "listening" state)
   - Your speech should appear as transcript below the orb
   - After a brief pause (~500ms), Atlas should respond
   - You should **hear** Atlas's voice (not just see text)
   - Response should be **fast** (under 1 second)

### 4. What to Verify

#### ✅ Speed Test
- **Expected**: Atlas responds in 300-600ms after you stop speaking
- **Old behavior**: Would take 1-2 seconds (Gemini)
- **If slow**: Check your internet connection or OpenAI API status

#### ✅ Voice Quality  
- **Expected**: Natural, human-like voice (not robotic)
- **Voice**: Should sound like "Alloy" (balanced, neutral)
- **If robotic**: Something's wrong - check browser console

#### ✅ Natural Flow
- **Expected**: Smooth conversation, can interrupt Atlas
- **Try**: Start speaking while Atlas is talking - it should handle it gracefully

#### ✅ Transcripts
- **Expected**: Both your words and Atlas's responses appear as text
- **Check**: After conversation, verify it's saved to database

## Troubleshooting

### No Audio Playback

**Symptoms**: You see transcripts but hear no voice

**Fixes**:
1. Check browser volume/mute settings
2. Try headphones to rule out speaker issues
3. Check browser console for errors
4. Make sure you're using Chrome/Edge (best support)

### "OpenAI API key not configured" Error

**Symptoms**: Error message when connecting

**Fixes**:
```bash
# Re-add the API key
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Deploy the function
npx supabase functions deploy voice-chat
```

### High Latency (>2 seconds)

**Symptoms**: Slow responses, long pauses

**Possible causes**:
1. Poor internet connection - Try wired connection
2. OpenAI API rate limits - Check your dashboard
3. Server issues - Check https://status.openai.com/

### Microphone Not Working

**Symptoms**: No speech detected, orb doesn't respond

**Fixes**:
1. Grant microphone permission in browser settings
2. Close other apps using microphone (Zoom, etc.)
3. Try a different browser
4. Check System Settings → Privacy → Microphone

### WebSocket Connection Fails

**Symptoms**: "Connection failed" or similar error

**Fixes**:
1. Check Supabase function logs: `npx supabase functions logs voice-chat`
2. Verify API key is correct on OpenAI dashboard
3. Check your Supabase project is active
4. Restart dev server

## Expected Browser Console Messages

When working correctly, you should see:

```
✅ Client WebSocket connected
🔌 Connecting to OpenAI Realtime API...
✅ Connected to OpenAI Realtime API
✅ Session configured
🎤 Audio capture started
📨 OpenAI event: input_audio_buffer.speech_started
📨 OpenAI event: input_audio_buffer.speech_stopped
📨 OpenAI event: conversation.item.input_audio_transcription.completed
📨 OpenAI event: response.audio.delta
📨 OpenAI event: response.audio_transcript.delta
📨 OpenAI event: response.done
```

## Performance Benchmarks

Test these scenarios and verify speeds:

| Test | Expected Latency | What to Say |
|------|-----------------|-------------|
| Simple question | 300-500ms | "How are you?" |
| Longer statement | 400-600ms | "I've been feeling really stressed at work lately because of tight deadlines" |
| Follow-up | 300-500ms | "Yes, exactly" |

## Database Verification

After a voice conversation, check that data is saved:

```sql
-- Check recent conversations
SELECT * FROM conversation_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- Check responses (transcripts)
SELECT content, ai_response, sentiment 
FROM responses 
WHERE conversation_session_id = 'your-conversation-id'
ORDER BY created_at;
```

## Next Steps After Testing

### If Everything Works ✅

1. Test with a few employees to gather feedback
2. Monitor OpenAI usage on your dashboard
3. Check sentiment analysis is working
4. Verify anonymization is maintained
5. Consider voice customization (change to "shimmer" or "echo")

### If Issues Found ❌

1. Check browser console for errors
2. Check Supabase function logs: `npx supabase functions logs voice-chat`
3. Verify OpenAI API key has sufficient quota
4. Test in different browsers
5. Check network latency: `ping api.openai.com`

## Production Deployment

Once testing looks good locally:

```bash
# 1. Ensure API key is set in production
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here --project-ref your-project-ref

# 2. Deploy to production
npx supabase functions deploy voice-chat --project-ref your-project-ref

# 3. Test in production environment

# 4. Monitor usage and costs
```

## Cost Monitoring

Track your OpenAI usage:

1. Go to [OpenAI Dashboard](https://platform.openai.com/usage)
2. Check "Realtime API" usage
3. Monitor costs per day/week
4. Set up billing alerts if needed

**Expected**: ~$0.30 per 15-minute conversation

## Success Criteria ✅

Your implementation is working if:

- ✅ Microphone captures audio successfully
- ✅ Atlas responds in under 1 second
- ✅ Voice sounds natural (not robotic)
- ✅ Transcripts appear in real-time
- ✅ Conversation saves to database
- ✅ Sentiment analysis works
- ✅ Can switch between text and voice modes
- ✅ No console errors

---

## Quick Start Command

```bash
# Run this now to test!
npm run dev
```

Then navigate to your employee survey and click the microphone! 🎤

**Expected result**: Fast, natural voice conversation with Atlas in 300-600ms latency! 🚀
