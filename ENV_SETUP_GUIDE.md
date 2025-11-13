# Environment Variables Setup Guide

## ⚠️ IMPORTANT: You Must Add Your Supabase Credentials

The application **will not work** until you add your Supabase credentials to a `.env.local` file.

## Step-by-Step Instructions

### 1. Create the `.env.local` File

In the root of your project (same folder as `package.json`), create a new file named `.env.local`

### 2. Get Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one if you haven't)
3. Click on the **Settings** icon (gear icon) in the left sidebar
4. Click on **API** under Project Settings
5. You'll see two important values:

   - **Project URL** - Copy this (looks like `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key - Copy this (a long string starting with `eyJ...`)

### 3. Add the Values to `.env.local`

Open your newly created `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Replace** the placeholder values with your actual Supabase credentials.

### 4. Disable Email Verification (MVP Only)

Since this is an MVP and we want to skip email verification:

1. In your Supabase dashboard, go to **Authentication** (lock icon in sidebar)
2. Click on **Providers**
3. Click on **Email** provider
4. Find the "Confirm email" toggle and **turn it OFF**
5. Click **Save**

### 5. Example `.env.local` File

Here's what your file should look like (with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjI5MjgwMCwiZXhwIjoxOTI3ODY4ODAwfQ.example-signature-here
```

### 6. Restart Your Development Server

After creating/updating `.env.local`:

```bash
# Stop the server if it's running (Ctrl+C)
# Then start it again:
npm run dev
```

## ✅ Verify It's Working

1. Visit [http://localhost:3000](http://localhost:3000)
2. You should see the login/signup page
3. Try signing up with `parkercostaging@gmail.com`
4. If you get errors about "Invalid API key" or "supabase_url is required", double-check your `.env.local` file

## 🔒 Security Notes

- ✅ `.env.local` is already in `.gitignore` - it won't be committed to git
- ✅ The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to use client-side (it's designed for that)
- ✅ Never share your `.env.local` file or commit it to version control
- ✅ Only `parkercostaging@gmail.com` can access the application

## 🆘 Troubleshooting

**Problem**: "supabase_url is required" error
- Make sure variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure there are no spaces around the `=` sign
- Make sure you restarted the dev server after creating the file

**Problem**: Can't find `.env.local` file
- Make sure it's in the project root (same folder as `package.json` and `README.md`)
- On Mac/Linux, files starting with `.` are hidden by default
  - In Finder: Press `Cmd + Shift + .` to show hidden files
  - In VS Code/Cursor: Hidden files should show by default

**Problem**: Email verification required
- Go back to Supabase dashboard → Authentication → Providers → Email
- Make sure "Confirm email" is disabled

