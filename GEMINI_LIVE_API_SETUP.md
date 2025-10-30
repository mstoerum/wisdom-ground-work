# Gemini Live API Setup Guide

## Prerequisites & Setup

### Step 1: Get Gemini API Access

You need access to **Gemini 2.0 Flash experimental** models. Here's how:

#### Option A: Using Google AI Studio (Recommended for Testing)

1. **Go to Google AI Studio**: https://aistudio.google.com/
2. **Sign in** with your Google account
3. **Get API Key**:
   - Click "Get API Key" in the top right
   - Create a new API key or use existing one
   - Copy the key (starts with `AIza...`)

4. **Verify Access**:
   - In AI Studio, try selecting "Gemini 2.0 Flash" model
   - If you see it, you have access!
   - If not, you may need to join the waitlist

#### Option B: Using Google Cloud (For Production)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**
3. **Enable APIs**:
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Generative Language API"
   - Click "Enable"

4. **Create API Key**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the key

5. **Enable Gemini 2.0 Models**:
   - Models may be in preview/experimental
   - Check Google AI documentation for latest availability

### Step 2: Check Current API Key

First, let's see what API key you're currently using:

```bash
# Check your current Supabase environment
supabase secrets list
```

Look for:
- `GEMINI_API_KEY` (preferred for Gemini Live)
- `LOVABLE_API_KEY` (currently used for text chat)

### Step 3: Set Up Gemini API Key

Add your Gemini API key to Supabase:

```bash
# Set the Gemini API key
supabase secrets set GEMINI_API_KEY=your_api_key_here

# Optional: Specify a different model if experimental isn't available
# supabase secrets set GEMINI_VOICE_MODEL=models/gemini-1.5-flash

# Verify it's set
supabase secrets list
```

**Important**: 
- The edge function will use `GEMINI_API_KEY` first, then fall back to `LOVABLE_API_KEY`
- Default model is `models/gemini-2.0-flash-exp` (experimental with audio support)
- If not available, you can override with `GEMINI_VOICE_MODEL` environment variable

### Step 4: Test API Access

You can test if your key has access to Gemini 2.0 Flash:

```bash
# Test with curl (replace YOUR_API_KEY)
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, test message"}]
    }]
  }'
```

If you get a valid response, your key works! If you get a 403 or 404, you may need to:
- Request access to experimental models
- Wait for approval
- Use a different API key

### Step 5: Deploy Edge Function

Once your API key is configured:

```bash
# Deploy the voice-chat function
supabase functions deploy voice-chat

# Verify deployment
supabase functions list
```

### Step 6: Test Voice Mode

1. Start your application: `npm run dev`
2. Log in as an employee
3. Start a survey
4. Click "Switch to Voice"
5. Grant microphone permission
6. Start speaking!

**Expected behavior**:
- Connection takes 2-3 seconds
- You speak → AI responds in ~1-2 seconds
- Natural voice quality

**If it doesn't work**, check:
- Browser console for errors
- Supabase logs: `supabase functions logs voice-chat`
- Network tab for WebSocket connection

---

## Troubleshooting

### Issue: "API key not configured"

**Solution**: Make sure you've set `GEMINI_API_KEY`:
```bash
supabase secrets set GEMINI_API_KEY=your_key_here
```

### Issue: "403 Forbidden" or "Model not found"

**Possible causes**:
1. API key doesn't have access to Gemini 2.0 Flash experimental
2. Model name is incorrect
3. Quota exceeded

**Solutions**:
1. **Check model availability**: Visit https://ai.google.dev/models/gemini
2. **Request access**: Some models require preview access
3. **Try alternative model**: Edit `/supabase/functions/voice-chat/index.ts` line 119:
   ```typescript
   model: "models/gemini-2.0-flash-exp"  // Try: "models/gemini-1.5-flash" if exp not available
   ```

### Issue: "WebSocket connection failed"

**Solution**: 
1. Ensure edge function is deployed
2. Check CORS settings in edge function
3. Verify Supabase URL is correct

### Issue: High latency or poor quality

**Causes**:
- Network connection
- Server location
- API rate limits

**Solutions**:
1. Test on faster internet
2. Check Gemini API status page
3. Monitor with: `supabase functions logs voice-chat --tail`

---

## Alternative: Fallback to Hybrid Mode

If you can't get Gemini Live API access immediately, you can:

1. **Keep using the current hybrid approach** (slower but works)
2. **Use Lovable AI Gateway** with your existing `LOVABLE_API_KEY`
3. **Wait for Gemini 2.0 availability** in your region

The hybrid mode (browser STT/TTS) will still work, just with higher latency.

---

## Cost Management

### Monitor Usage

Track your Gemini API usage:
1. Go to Google AI Studio → Usage
2. Or Google Cloud Console → Billing

### Set Quotas

To prevent unexpected costs:

```bash
# In Google Cloud Console
# APIs & Services → Quotas
# Set daily request limits
```

### Expected Costs

For 100 employees with 15-minute surveys per month:
- **Audio processing**: ~$0.05/minute
- **Total**: 100 × 15 × $0.05 = **$75/month**

---

## Summary Checklist

- [ ] Get Gemini API key from AI Studio or Cloud Console
- [ ] Verify access to Gemini 2.0 Flash experimental
- [ ] Set `GEMINI_API_KEY` in Supabase secrets
- [ ] Deploy voice-chat edge function
- [ ] Test voice mode in browser
- [ ] Monitor logs for any errors
- [ ] Set up billing alerts (optional)

**Need help?** Check the Supabase logs:
```bash
supabase functions logs voice-chat --tail
```

Good luck! 🚀
