# Vercel Deployment Instructions

## Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create a Vercel account at https://vercel.com

## Deployment Steps

### 1. Initialize Vercel Project
```bash
vercel login
vercel
```

### 2. Set Environment Variables
In your Vercel dashboard or via CLI, add these environment variables:

```bash
vercel env add GROQ_API_KEY
# Paste your Groq API key from .env.local

vercel env add VITE_SUPABASE_URL
# Paste your Supabase URL from .env.local

vercel env add VITE_SUPABASE_ANON_KEY
# Paste your Supabase anon key from .env.local

vercel env add VITE_GEMINI_API_KEY
# Paste your Gemini API key from .env.local
```

### 3. Deploy
```bash
vercel --prod
```

## Local Development with Vercel Functions

To test Vercel serverless functions locally:

```bash
vercel dev
```

This will start:
- Vite dev server on port 3000
- Serverless functions available at /api/*

## Production vs Development

### Development (Local)
- Run `npm run dev` for frontend (port 5173)
- Run `npm run dev:server` for backend (port 3001)
- OR run `vercel dev` to simulate Vercel environment

### Production (Vercel)
- Frontend: Static files served from `dist/`
- Backend: Serverless functions in `api/` folder
- Both accessible from same domain

## Environment Variables Needed

### Required for Production:
- `GROQ_API_KEY` - Your Groq API key (backend)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_GEMINI_API_KEY` - Google Gemini API key

## File Structure

```
project/
├── api/
│   └── groq.js          # Vercel serverless function
├── src/                 # React frontend source
├── dist/                # Build output (auto-generated)
├── vercel.json          # Vercel configuration
├── .vercelignore        # Files to exclude from deployment
└── package.json
```

## Troubleshooting

### Issue: API routes return 404
- Check that `api/` folder is in the root directory
- Verify `vercel.json` is present

### Issue: Environment variables not working
- Make sure variables are added in Vercel dashboard
- Redeploy after adding environment variables
- For VITE_ prefixed vars, they must be set at build time

### Issue: Build fails
- Run `npm run build` locally first to test
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json

## Notes

- The `server.js` file is only for local development
- In production, `api/groq.js` handles all API requests
- Vercel automatically handles CORS and routing
- API endpoint in production: `https://yourdomain.vercel.app/api/groq`
