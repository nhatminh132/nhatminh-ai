# Supabase OAuth Provider Setup Guide

## Enable OAuth Providers in Supabase

To enable Google, GitHub, Spotify, and Discord authentication, follow these steps:

### 1. Go to Supabase Dashboard
Visit: https://pimnoojbtmrxuhxckinc.supabase.co

### 2. Navigate to Authentication → Providers

---

## 🔵 Google OAuth Setup

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable **Google+ API**
4. Go to **Credentials** → Create OAuth 2.0 Client ID
5. Set **Authorized redirect URIs** to:
   ```
   https://pimnoojbtmrxuhxckinc.supabase.co/auth/v1/callback
   ```
6. Copy **Client ID** and **Client Secret**
7. In Supabase: Enable Google provider and paste credentials

---

## ⚫ GitHub OAuth Setup

1. Go to: https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - Application name: `AI Study Assistant`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL:
     ```
     https://pimnoojbtmrxuhxckinc.supabase.co/auth/v1/callback
     ```
4. Copy **Client ID** and **Client Secret**
5. In Supabase: Enable GitHub provider and paste credentials

---

## 🟢 Spotify OAuth Setup

1. Go to: https://developer.spotify.com/dashboard
2. Create an app
3. Fill in:
   - Redirect URIs:
     ```
     https://pimnoojbtmrxuhxckinc.supabase.co/auth/v1/callback
     ```
4. Copy **Client ID** and **Client Secret**
5. In Supabase: Enable Spotify provider and paste credentials

---

## 🟣 Discord OAuth Setup

1. Go to: https://discord.com/developers/applications
2. Create **New Application**
3. Go to **OAuth2** section
4. Add redirect:
   ```
   https://pimnoojbtmrxuhxckinc.supabase.co/auth/v1/callback
   ```
5. Copy **Client ID** and **Client Secret**
6. In Supabase: Enable Discord provider and paste credentials

---

## ✅ Enable Email/Password Authentication

1. In Supabase Dashboard: **Authentication → Providers**
2. Find **Email** provider
3. Toggle **Enable email provider** to ON
4. (Optional) Disable **Confirm email** for testing
5. (Optional) Enable **Secure email change**

---

## 🧪 Test Authentication

Once configured, users can:
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Sign in with Google
- ✅ Sign in with GitHub
- ✅ Sign in with Spotify
- ✅ Sign in with Discord
- 😂 Get trolled with "Pornhub" button

---

## Important Notes

⚠️ **For Production Deployment:**
- Update redirect URIs to include your production domain
- Example: `https://yourdomain.com` + Supabase callback URL

⚠️ **Security:**
- Never share Client Secrets publicly
- Keep them in Supabase dashboard only
- Don't commit them to git

---

## Quick Links

- Google Console: https://console.cloud.google.com/
- GitHub OAuth Apps: https://github.com/settings/developers
- Spotify Dashboard: https://developer.spotify.com/dashboard
- Discord Applications: https://discord.com/developers/applications
- Supabase Dashboard: https://pimnoojbtmrxuhxckinc.supabase.co
