# 🚀 Deployment Guide

## Quick Start

### 1. Get API Keys

#### Supabase (Required)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

#### Groq (Recommended - Primary AI)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up and get API key
3. Copy to `VITE_GROQ_API_KEY`

#### OpenRouter (Optional - Fallback 1)
1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up and get API key
3. Copy to `VITE_OPENROUTER_API_KEY`

#### Google Gemini (Required - Image + Fallback)
1. Go to [ai.google.dev](https://ai.google.dev)
2. Get API key
3. Copy to `VITE_GEMINI_API_KEY`

### 2. Set Up Supabase Database

1. Open Supabase SQL Editor
2. Copy and paste content from `SUPABASE_SCHEMA.sql`
3. Run the SQL script
4. Verify tables were created in Table Editor

### 3. Configure Authentication

1. In Supabase Dashboard → Authentication → Providers
2. Enable **Email** provider
3. Disable "Confirm email" (optional - for faster testing)
4. Configure email templates if needed

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

Or use Vercel GUI:
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### 5. Deploy to Netlify

```bash
# Build
npm run build

# Deploy dist folder to Netlify
```

Or use Netlify GUI:
1. Drag & drop `dist` folder
2. Add environment variables in Site settings

## Environment Variables for Production

Add these in your hosting platform:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GROQ_API_KEY=gsk_...
VITE_OPENROUTER_API_KEY=sk-or-...
VITE_GEMINI_API_KEY=AIza...
```

## Testing Locally

```bash
# Install dependencies
npm install

# Create .env.local and add your keys
cp .env.example .env.local

# Run dev server
npm run dev
```

## Troubleshooting

### "Can't connect to Supabase"
- Check URL and anon key
- Verify database tables were created
- Check RLS policies are enabled

### "AI not responding"
- Check API keys are valid
- Try each provider individually
- Check browser console for errors

### "Image upload not working"
- Verify Gemini API key
- Check uploads_left > 0 in profiles table
- Ensure image is < 10MB

### "Magic link not sending"
- Check Supabase email settings
- Verify email provider is enabled
- Check spam folder

## Free Tier Limits

- **Groq**: 14,400 requests/day free
- **OpenRouter**: Free tier available
- **Gemini**: 1,500 requests/day free
- **Supabase**: 500MB database, 2GB storage free

## Next Steps

- [ ] Set up custom email templates in Supabase
- [ ] Add usage analytics
- [ ] Implement rate limiting
- [ ] Add more AI models
- [ ] Set up monitoring

---

Need help? Check the README.md or create an issue.
