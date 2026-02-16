# Supabase OAuth Configuration for Production

Your production URL: **https://nhatminhai.vercel.app/**

## Step 1: Update Supabase URL Configuration

1. Go to: https://supabase.com/dashboard/project/pimnoojbtmrxuhxckinc
2. Click **Authentication** → **URL Configuration**
3. Update the following:

### Site URL
```
https://nhatminhai.vercel.app
```

### Redirect URLs (Add all of these)
```
http://localhost:5173
http://localhost:5173/**
https://nhatminhai.vercel.app
https://nhatminhai.vercel.app/**
```

4. Click **Save**

## Step 2: Update Google OAuth

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, make sure you have:
```
https://pimnoojbtmrxuhxckinc.supabase.co/auth/v1/callback
```
4. Under **Authorized JavaScript origins**, add:
```
https://nhatminhai.vercel.app
```
5. Click **Save**

## Step 3: Update GitHub OAuth (if using)

1. Go to: https://github.com/settings/developers
2. Click on your OAuth App
3. Update:
   - **Homepage URL**: `https://nhatminhai.vercel.app`
   - **Authorization callback URL**: `https://pimnoojbtmrxuhxckinc.supabase.co/auth/v1/callback`
4. Click **Update application**

## Step 4: Test

1. Go to https://nhatminhai.vercel.app
2. Click "Sign in with Google"
3. Should redirect properly after authentication ✅

---

## Troubleshooting

If redirect still goes to localhost:
1. Clear browser cookies/cache
2. Make sure you updated all redirect URLs in Supabase
3. Wait 1-2 minutes for Supabase to propagate changes
4. Try incognito/private browsing mode
