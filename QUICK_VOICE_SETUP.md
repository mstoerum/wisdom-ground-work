# Quick Voice Mode Setup - TL;DR

## 1️⃣ Get API Key (2 minutes)

Visit: **https://aistudio.google.com/**
- Sign in
- Click "Get API Key"
- Copy the key

## 2️⃣ Configure Supabase (1 minute)

```bash
# Add your API key
supabase secrets set GEMINI_API_KEY=your_api_key_here

# Confirm it's set
supabase secrets list
```

## 3️⃣ Deploy (1 minute)

```bash
# Deploy the voice function
supabase functions deploy voice-chat

# Start your app
npm run dev
```

## 4️⃣ Test (30 seconds)

1. Open app → Login as employee
2. Start survey
3. Click "Switch to Voice"
4. Click microphone button
5. Start talking!

---

## ⚠️ If It Doesn't Work

### Check Logs
```bash
supabase functions logs voice-chat --tail
```

### Common Fixes

**Error: "Model not found"**
```bash
# Use stable model instead
supabase secrets set GEMINI_VOICE_MODEL=models/gemini-1.5-pro
supabase functions deploy voice-chat
```

**Error: "API key not configured"**
```bash
# Make sure key is set
supabase secrets list
# Should show GEMINI_API_KEY or LOVABLE_API_KEY
```

**Error: "WebSocket connection failed"**
```bash
# Redeploy function
supabase functions deploy voice-chat --no-verify-jwt
```

**High latency or no response**
- Check internet connection
- Try on Chrome/Edge (best support)
- Check browser console for errors

---

## 📋 Environment Variables Checklist

Required:
- ✅ `GEMINI_API_KEY` - Your Google AI key
- ✅ `VITE_SUPABASE_URL` - Your Supabase URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Server auth

Optional:
- ⭕ `GEMINI_VOICE_MODEL` - Override model (if experimental unavailable)

---

## 🎯 Expected Performance

- **Connection**: 2-3 seconds
- **Response latency**: 800-1500ms
- **Voice quality**: Natural (AI-generated)
- **Works on**: Chrome, Edge, Safari, Firefox

---

## 💰 Costs

- **~$0.05 per minute** of voice conversation
- **100 employees × 15 min/month = ~$75/month**

---

## 🆘 Need More Help?

See full guide: `GEMINI_LIVE_API_SETUP.md`

Or check Supabase logs:
```bash
supabase functions logs voice-chat --tail
```
