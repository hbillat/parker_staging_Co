# Setup Instructions - Parker and Co Staging Marketing App

## Prerequisites
- Node.js 18+ installed
- A Supabase account and project

## Step 1: Supabase Configuration

### 1.1 Configure Email Verification (IMPORTANT for MVP)
1. Go to your Supabase dashboard: https://app.supabase.com
2. Navigate to **Authentication** → **Providers** → **Email**
3. **Disable** "Confirm email" option (since we're skipping email verification for MVP)
4. Save the changes

### 1.2 Get Your Supabase Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

### 1.3 Add Credentials to Your App
1. Open `.env.local` in the project root
2. Replace the placeholder values with your actual Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```
3. Save the file

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Run the Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

## Step 4: Test the Application

### Create Your Account
1. Visit http://localhost:3000 (it will redirect to /auth)
2. Click on the **"Sign Up"** tab
3. Enter:
   - Email: `parkercostaging@gmail.com`
   - Password: (at least 6 characters)
4. Click **"Create Account"**
5. You should be redirected to the dashboard

### Test Login
1. Logout from the dashboard
2. Return to the login page
3. Use the same credentials to sign in

### Test Email Restriction
1. Try signing up or logging in with a different email (e.g., `test@example.com`)
2. You should see: "Access restricted. Please contact the administrator."

## Troubleshooting

### Issue: "Invalid API Key" or Authentication Errors
- Double-check your `.env.local` file has the correct Supabase URL and Anon Key
- Make sure there are no extra spaces or quotes around the values
- Restart the development server after changing `.env.local`

### Issue: Email Verification Required
- Make sure you disabled "Confirm email" in Supabase Authentication settings
- Check **Authentication** → **Providers** → **Email** in your Supabase dashboard

### Issue: Can't Sign Up
- Verify your Supabase project is active
- Check the browser console for error messages
- Ensure you're using the allowed email: `parkercostaging@gmail.com`

## Security Notes
- Never commit `.env.local` to version control (it's already in .gitignore)
- The anon key is safe to use in the client-side code (it's designed for that)
- Access is restricted to `parkercostaging@gmail.com` only

## Next Steps
- This MVP provides the authentication foundation
- Future features (campaigns, analytics, insights) can be built on top of this dashboard
- When deploying to production, update environment variables in your hosting platform

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL

## Project Structure
```
├── app/
│   ├── auth/           # Authentication page (login/signup)
│   ├── dashboard/      # Protected dashboard page
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page (redirects to auth or dashboard)
├── components/
│   ├── ui/             # shadcn/ui components
│   └── logout-button.tsx
├── lib/
│   ├── supabase/       # Supabase client configurations
│   └── utils.ts
├── middleware.ts       # Protected route middleware
└── .env.local          # Environment variables (NOT in git)
```

