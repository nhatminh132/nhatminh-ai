# 📚 AI Study Assistant

A Vite + React web app that helps students with homework through AI-powered chat and image analysis.

## ✨ Features

- 🔐 **Magic Link Authentication** - Passwordless login via Supabase
- 💬 **AI Chat** - Ask questions and get instant explanations
- 📸 **Image Upload** - Upload homework photos for step-by-step solutions
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📝 **Chat History** - All conversations saved to Supabase
- 🎯 **Smart AI Routing** - Automatic fallback between Groq, OpenRouter, and Gemini

## 🛠️ Tech Stack

- **Frontend**: Vite + React
- **Styling**: TailwindCSS
- **Backend**: Supabase (Auth + Database + Storage)
- **AI Models**: 
  - Groq (llama-3.1-8b-instant) - Primary, streaming
  - OpenRouter (free models) - Fallback 1
  - Gemini 2.0 Flash Lite - Fallback 2 + Vision

## 📦 Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys in `.env.local`:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `VITE_GROQ_API_KEY` - Groq API key
   - `VITE_OPENROUTER_API_KEY` - OpenRouter API key
   - `VITE_GEMINI_API_KEY` - Google Gemini API key

3. **Set up Supabase database**
   
   Run the SQL in `SUPABASE_SCHEMA.sql` in your Supabase SQL editor:
   - Creates `profiles` table with `uploads_left` counter
   - Creates `chat_history` table
   - Sets up Row Level Security policies
   - Creates trigger to auto-create profile on signup

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   App will be available at `http://localhost:3000`

## 🚀 Deployment

Build for production:
```bash
npm run build
```

The static files will be in the `dist/` folder. Deploy to:
- Vercel
- Netlify
- Cloudflare Pages
- Any static hosting service

## 📁 Project Structure

```
src/
├── components/
│   ├── ChatHeader.jsx      # Header with dark mode toggle
│   ├── ChatInput.jsx       # Input field with image upload
│   └── ChatMessage.jsx     # Message bubble with markdown
├── pages/
│   ├── Login.jsx           # Magic link login page
│   └── Chat.jsx            # Main chat interface
├── lib/
│   ├── supabaseClient.js   # Supabase configuration
│   ├── aiRouter.js         # AI provider routing logic
│   └── streamGroq.js       # Groq streaming implementation
├── App.jsx                 # Root component with auth
├── main.jsx                # Entry point
└── index.css               # Tailwind imports
```

## 🔄 AI Flow

### Text Chat:
1. Try **Groq** (streaming, real-time responses)
2. If fails → **OpenRouter** (free model)
3. If fails → **Gemini 2.0 Flash Lite**

### Image Upload:
1. Check `uploads_left > 0`
2. Send to **Gemini Vision**
3. Extract homework and return solution
4. Decrement `uploads_left`
5. Save to chat history

## 🗄️ Database Schema

### `profiles`
- `id` (uuid) - References auth.users
- `uploads_left` (int) - Default 5
- `created_at` (timestamp)

### `chat_history`
- `id` (uuid)
- `user_id` (uuid)
- `question` (text)
- `answer` (text)
- `model_used` (text)
- `created_at` (timestamp)

## 🎨 Features

- ✅ Markdown rendering with code blocks
- ✅ Streaming responses (Groq)
- ✅ Dark mode with localStorage persistence
- ✅ Image upload with upload counter
- ✅ Chat history persistence
- ✅ Auto-scroll to latest message
- ✅ Model badge per message
- ✅ Responsive design

## 📝 Environment Variables

All environment variables use the `VITE_` prefix for Vite to expose them to the client:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_GEMINI_API_KEY=your-gemini-key
```

## 🔒 Security Notes

- API keys are client-side (fine for free tiers)
- For production, implement server-side API proxy
- Row Level Security enabled on all Supabase tables
- Users can only access their own data

## 📄 License

MIT

---

Built with ❤️ for students who need homework help
