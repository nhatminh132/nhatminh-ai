# Groq Model Configuration

## Current Setup

The app now uses **OpenAI-compatible models on Groq** instead of Llama:

### Text Chat - Groq Fallback Chain:
1. **Primary:** `openai/gpt-oss-120b` (120B parameters)
2. **Fallback:** `openai/gpt-oss-20b` (20B parameters)

If gpt-oss-120b exceeds rate limit → automatically tries gpt-oss-20b

## Full AI Routing Chain

```
Text Message Sent
    ↓
📡 Try Groq gpt-oss-120b (streaming)
    ↓ (if fails)
📡 Try Groq gpt-oss-20b (streaming)
    ↓ (if fails)
📡 Try OpenRouter MythoMax (non-streaming)
    ↓ (if fails)
📡 Try Gemini 2.0 Flash Lite (non-streaming)
    ↓ (if all fail)
❌ Show error message
```

## Console Output Examples

### Success with 120b:
```
🤖 Starting AI request routing...
📡 Attempting Groq API...
📡 Trying Groq with gpt-oss-120b...
✅ Groq succeeded!
```

### Fallback to 20b:
```
🤖 Starting AI request routing...
📡 Attempting Groq API...
📡 Trying Groq with gpt-oss-120b...
❌ gpt-oss-120b failed: Rate limit exceeded
📡 Fallback to gpt-oss-20b...
✅ Groq succeeded!
```

### Both Groq models fail:
```
🤖 Starting AI request routing...
📡 Attempting Groq API...
📡 Trying Groq with gpt-oss-120b...
❌ gpt-oss-120b failed: Rate limit exceeded
📡 Fallback to gpt-oss-20b...
❌ gpt-oss-20b failed: Rate limit exceeded
❌ Groq failed (both models): [error]
📡 Attempting OpenRouter API (fallback 1)...
✅ OpenRouter succeeded!
```

## Model Details

### openai/gpt-oss-120b
- Size: 120 billion parameters
- Speed: Very fast on Groq
- Quality: High
- Free tier: Limited requests

### openai/gpt-oss-20b
- Size: 20 billion parameters  
- Speed: Very fast on Groq
- Quality: Good
- Free tier: More generous limits

## Why This Setup?

1. **Best quality first** (120b) for most users
2. **Automatic downgrade** (20b) when rate limited
3. **Multiple fallbacks** to other providers
4. **Streaming support** on both Groq models
