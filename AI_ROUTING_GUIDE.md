# AI Routing System

## How It Works

### 📝 Text Chat Flow
When a user sends a text message:

1. **Primary: Groq API** (llama-3.1-8b-instant)
   - ✅ Fast streaming responses
   - ✅ Real-time token-by-token display
   - ✅ Free tier available
   - ❌ If fails (rate limit, error, etc.) → Try OpenRouter

2. **Fallback 1: OpenRouter** (MythoMax-L2-13B Free)
   - Activates if Groq fails (ANY error including rate limits)
   - Non-streaming response
   - Free model
   - ❌ If fails → Try Gemini

3. **Fallback 2: Gemini** (2.0 Flash Lite)
   - Activates if both Groq and OpenRouter fail (ANY error including rate limits)
   - Non-streaming response
   - Free tier available
   - ❌ If all 3 fail → Show error message

### 📸 Image Upload Flow
When a user uploads an image:

- **Always uses: Gemini Vision** (2.0 Flash Lite)
  - Analyzes homework images
  - Provides step-by-step solutions
  - Costs 1 upload credit (5 per day for free users)
  - ⚠️ **Note:** Currently no fallback for image uploads (only Gemini Vision supported)

## Debug Console Messages

When you send a message, watch the browser console (F12) for:

```
🤖 Starting AI request routing...
📡 Attempting Groq API...
✅ Groq succeeded!
```

Or if Groq fails:
```
🤖 Starting AI request routing...
📡 Attempting Groq API...
❌ Groq failed: [error message]
📡 Attempting OpenRouter API (fallback 1)...
✅ OpenRouter succeeded!
```

## Testing the Fallback System

### Test Groq (should work):
1. Sign in to the app
2. Type: "Explain photosynthesis"
3. Check console - should show "✅ Groq succeeded!"

### Test Fallback (simulate Groq failure):
1. Temporarily set wrong Groq API key in `.env.local`
2. Send a message
3. Should automatically try OpenRouter, then Gemini

## API Endpoints

- **Groq**: `https://api.groq.com/openai/v1/chat/completions`
- **OpenRouter**: `https://openrouter.ai/api/v1/chat/completions`
- **Gemini Text**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent`
- **Gemini Vision**: Same endpoint, with image data

## Current Configuration

All three API keys are configured in `.env.local`:
- ✅ VITE_GROQ_API_KEY
- ✅ VITE_OPENROUTER_API_KEY
- ✅ VITE_GEMINI_API_KEY

## Troubleshooting

### "All AI services are currently unavailable"
- All three providers failed (including rate limits)
- Check internet connection
- Verify API keys are valid
- Check console for specific error messages
- Wait a few minutes if rate limited

### Rate Limit Errors
**Gemini exceeds quota:**
- ✅ Text chat will fallback to Groq → OpenRouter
- ❌ Image uploads will fail (Gemini Vision only)

**Groq exceeds quota:**
- ✅ Will automatically fallback to OpenRouter → Gemini

**OpenRouter exceeds quota:**
- ✅ Will fallback to Gemini (text only)

### Streaming not working
- Groq is the only provider that supports streaming
- OpenRouter and Gemini fallbacks show complete response at once
- This is normal behavior

### Image upload fails
- Check if uploads_left > 0
- Verify GEMINI_API_KEY is valid
- Ensure image is valid JPEG/PNG format
- ⚠️ If Gemini is rate limited, image uploads will fail (no fallback)
