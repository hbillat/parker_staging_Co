# ⚡ Quick Start Guide

## 3-Minute Setup

### 1️⃣ Add Supabase Credentials (REQUIRED)

Create a file named `.env.local` in this folder with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get these from:** [Supabase Dashboard](https://app.supabase.com) → Your Project → Settings → API

### 2️⃣ Disable Email Verification

In Supabase: **Authentication** → **Providers** → **Email** → Turn OFF "Confirm email"

### 3️⃣ Run the App

```bash
npm install
npm run dev
```

### 4️⃣ Test It

1. Go to [http://localhost:3000](http://localhost:3000)
2. Sign up with: `parkercostaging@gmail.com`
3. Enter a password (6+ characters)
4. You're in! 🎉

---

**Need detailed help?** → See [GETTING_STARTED.md](./GETTING_STARTED.md)

**Environment setup help?** → See [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

