# ⚡ Quick Start Guide

## 1. Install Dependencies (30 seconds)

```bash
npm install
```

## 2. Set Up Environment Variables (2 minutes)

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your keys:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GROQ_API_KEY=gsk_...
VITE_OPENROUTER_API_KEY=sk-or-...
VITE_GEMINI_API_KEY=AIza...
```

## 3. Set Up Supabase Database (1 minute)

1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy all content from `SUPABASE_SCHEMA.sql`
4. Paste and click **Run**

## 4. Enable Email Auth (30 seconds)

1. Supabase Dashboard → **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Disable "Confirm email" for faster testing

## 5. Run the App! (10 seconds)

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## First Time Usage

1. Enter your email on login page
2. Check email for magic link
3. Click link to sign in
4. Start chatting or upload homework images!

---

## Project Structure Overview

```
├── src/
│   ├── components/          # UI components
│   │   ├── ChatHeader.jsx   # Header with dark mode
│   │   ├── ChatInput.jsx    # Message input + image upload
│   │   └── ChatMessage.jsx  # Message bubble
│   ├── pages/
│   │   ├── Login.jsx        # Magic link login
│   │   └── Chat.jsx         # Main chat interface
│   ├── lib/
│   │   ├── supabaseClient.js   # Supabase setup
│   │   ├── aiRouter.js         # AI provider logic
│   │   └── streamGroq.js       # Groq streaming
│   ├── App.jsx              # Auth wrapper
│   └── main.jsx             # Entry point
├── SUPABASE_SCHEMA.sql      # Database setup
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Key Features

✅ Magic link authentication (no passwords!)
✅ AI chat with streaming responses
✅ Image upload for homework help
✅ Dark mode toggle
✅ Chat history saved to database
✅ 5 free image uploads per user
✅ Automatic AI provider fallback

## API Flow

**Text Chat:**
1. Try Groq (streaming) → Fast responses
2. Fallback to OpenRouter → If Groq fails
3. Fallback to Gemini → Last resort

**Image Upload:**
1. Check uploads_left > 0
2. Send to Gemini Vision API
3. Get step-by-step solution
4. Decrement uploads_left
5. Save to chat history

## Environment Variables Explained

| Variable | Purpose | Get it from |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Public API key | Supabase Settings → API |
| `VITE_GROQ_API_KEY` | Fast AI responses | console.groq.com |
| `VITE_OPENROUTER_API_KEY` | Fallback AI | openrouter.ai |
| `VITE_GEMINI_API_KEY` | Image analysis + fallback | ai.google.dev |

## Build for Production

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify  
- Cloudflare Pages
- Any static host

See `DEPLOYMENT_GUIDE.md` for details!

---

**Need help?** Check `README.md` or `DEPLOYMENT_GUIDE.md`
