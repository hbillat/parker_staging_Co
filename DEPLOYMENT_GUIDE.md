# Deployment Guide - Vercel

## 📋 Pre-Deployment Checklist

Before deploying to Vercel, ensure:

- [x] Application works locally
- [x] Database tables created in Supabase
- [x] Google Places API enabled and working
- [x] All environment variables documented
- [ ] Git repository initialized (if not already)
- [ ] Code committed to repository

---

## 🚀 Deployment Steps

### Step 1: Prepare Git Repository

If you haven't already initialized git:

```bash
cd /Users/haileyhawton/Desktop/Parker_staging_Co
git init
git add .
git commit -m "Initial commit - Auth + Lead Scraper feature"
```

If you have uncommitted changes:

```bash
git add .
git commit -m "Add Lead Scraper feature"
```

### Step 2: Push to GitHub (or GitLab/Bitbucket)

**Option A: Create new repo on GitHub**
1. Go to https://github.com/new
2. Name it: `parker-staging-marketing-app` (or your preferred name)
3. Don't initialize with README (we already have files)
4. Click "Create repository"

**Then push your code:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/parker-staging-marketing-app.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

**Option A: Via Vercel Website**
1. Go to https://vercel.com
2. Sign up/Login (use GitHub account for easier integration)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings

**Option B: Via Vercel CLI** (if you prefer terminal)
```bash
npm install -g vercel
vercel login
vercel
```

### Step 4: Configure Environment Variables in Vercel

**CRITICAL**: Add these environment variables in Vercel dashboard:

1. In Vercel project, go to **Settings** → **Environment Variables**
2. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://lsgwiofhjcnjkdgsubxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZ3dpb2ZoamNuamtkZ3N1YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTM0MzksImV4cCI6MjA3ODQ2OTQzOX0.YMI5gVh_d3UO3N4mqjV9lTQLpOnmT-N1Cq0N9WTs_2o
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyCmcmZy8gMRbTo4jWcsHTAfIsYYoPT8-qE
```

**Important**: 
- Add these to **Production**, **Preview**, and **Development** environments
- Make sure there are no extra spaces or quotes

### Step 5: Redeploy (After Adding Environment Variables)

After adding environment variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click the three dots menu → **Redeploy**
4. Check "Use existing Build Cache" (optional)
5. Click **Redeploy**

---

## 🔧 Vercel Configuration

Vercel should auto-detect these settings, but verify:

### Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `next dev`

### Root Directory
- Leave as `.` (root)

---

## 🌐 Post-Deployment Steps

### 1. Update Supabase Site URL (IMPORTANT)

After deployment, you'll get a Vercel URL (e.g., `https://your-app.vercel.app`)

Update Supabase redirect URLs:
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: Add `https://your-app.vercel.app/**`

### 2. Update Google Cloud Authorized Domains

1. Go to Google Cloud Console → **APIs & Services** → **Credentials**
2. Click on your API key
3. Under "Application restrictions" → "HTTP referrers"
4. Add: `https://your-app.vercel.app/*`

### 3. Test Your Deployed App

1. Visit your Vercel URL
2. Log in with `parkercostaging@gmail.com`
3. Create a test project
4. Start scraping
5. Verify everything works

---

## 🐛 Common Deployment Issues & Solutions

### Issue 1: "Missing environment variables"
**Solution**: 
- Double-check all env vars are added in Vercel
- Redeploy after adding them
- Check for typos in variable names

### Issue 2: Build fails with TypeScript errors
**Solution**:
```bash
# Run locally first
npm run build
# Fix any errors
# Then commit and push
```

### Issue 3: "Internal Server Error" on deployed app
**Solution**:
- Check Vercel Function Logs (in Vercel dashboard)
- Verify environment variables are correct
- Check Supabase connection works

### Issue 4: Google Places API not working
**Solution**:
- Verify API key is correct in Vercel
- Check Google Cloud Console for API restrictions
- Make sure billing is enabled in Google Cloud

### Issue 5: Supabase authentication fails
**Solution**:
- Update Site URL in Supabase settings
- Add Vercel domain to redirect URLs
- Check RLS policies are enabled

---

## 📊 Monitoring & Logs

### Vercel Dashboard
- **Functions**: Monitor API route performance
- **Analytics**: Track page views and performance
- **Logs**: Real-time function logs

### Supabase Dashboard
- **Logs**: Check database queries and errors
- **Usage**: Monitor database size and API calls

### Google Cloud Console
- **APIs & Services** → **Dashboard**: Monitor API usage
- Set up budget alerts to avoid unexpected charges

---

## 🔐 Security Considerations for Production

1. **Keep `.env.local` in `.gitignore`** ✅ (already done)
2. **Never commit API keys to git** ✅ (using environment variables)
3. **Use environment variables in Vercel** ✅ (covered above)
4. **Enable HTTPS** ✅ (Vercel does this automatically)
5. **Monitor API usage** to avoid unexpected costs

---

## 💰 Production Costs

### Vercel
- **Hobby Plan**: Free (sufficient for MVP)
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Serverless functions included
- **Pro Plan**: $20/month (if you need more)

### Supabase
- **Free Tier**: Currently using
  - 500 MB database
  - 50,000 monthly active users
  - Sufficient for testing
- **Pro Plan**: $25/month (when you scale)

### Google Places API
- **Free Credit**: $200/month
- **After free credit**: Pay per use
- Set budget alerts in Google Cloud Console

---

## 🔄 Future Deployments

After initial setup, deploying updates is easy:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your app
3. Deploy to production
4. Keep previous deployments for rollback

---

## 📱 Custom Domain (Optional)

To use your own domain (e.g., `marketing.parkerstaging.com`):

1. In Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update Supabase Site URL to custom domain
5. Update Google Cloud authorized domains

---

## ✅ Deployment Checklist

Before going live:
- [ ] All features tested locally
- [ ] Environment variables added to Vercel
- [ ] App deployed successfully
- [ ] Supabase Site URL updated
- [ ] Google Cloud authorized domains updated
- [ ] Test authentication on deployed app
- [ ] Test Lead Scraper on deployed app
- [ ] Check Vercel function logs for errors
- [ ] Monitor Google API usage

---

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase logs
3. Check Google Cloud Console errors
4. Review environment variables
5. Test locally first to isolate deployment issues

**Vercel Support**: https://vercel.com/support
**Supabase Support**: https://supabase.com/support

---

**Last Updated**: November 12, 2024
**Status**: Ready to Deploy

