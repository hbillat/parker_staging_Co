# Vercel Hobby Plan Limitations & Solutions

## 🔴 Current Issue: Projects Getting Stuck in "Scraping"

### Root Cause
Vercel's **Hobby (Free) plan has a 10-second hard limit** for serverless functions. If scraping takes longer, Vercel kills the function WITHOUT letting it update the database, leaving projects stuck in "scraping" status forever.

---

## ✅ Solutions Implemented

### 1. Reduced Pages: 10 → 3 → **1 Page**
- **Before**: 10 pages = ~200 leads, took 25-30 seconds → TIMEOUT
- **Then**: 3 pages = ~60 leads, took 10-15 seconds → STILL TIMEOUT
- **Now**: **1 page = ~20 leads, takes 3-5 seconds** → ✅ WORKS!

### 2. Fixed Timeout Handler
- **Before**: 55-second timeout (useless on Hobby plan)
- **Now**: **8-second timeout** with 2-second buffer
- Properly marks project and search terms as "failed" if timeout occurs
- Shows helpful error message: "Timeout: Scraping took too long (Vercel 10s limit)"

### 3. Better Error Messages
- Users now see clear messages when timeout occurs
- Suggests upgrading to Pro for more leads

---

## 📊 Current Performance (Hobby Plan)

### Per Search Term:
- **Leads**: ~15-20 businesses
- **Time**: 3-5 seconds
- **Success Rate**: ✅ Should be 100% now

### Per Project:
- **1 search term** → ~20 leads
- **3 search terms** → ~60 leads
- **5 search terms** → ~100 leads

### Strategy for More Leads:
Instead of scraping 10 pages for "Salt Lake County Real Estate Agents", create ONE project with multiple specific searches:

**Example Project: "SLC Real Estate Leads"**
- Term 1: "Salt Lake City real estate agents"
- Term 2: "Sandy Utah realtors"
- Term 3: "Murray Utah real estate"
- Term 4: "Cottonwood Heights realtors"
- Term 5: "Park City real estate agents"

**Result**: ~100 unique leads (with automatic duplicate detection)

---

## 💰 Upgrade Options

### Vercel Pro ($20/month)
**Benefits:**
- ✅ **60-second function timeout** (vs 10s on Hobby)
- ✅ **10 pages per search** = ~200 leads per term
- ✅ Faster builds (2x CPUs)
- ✅ Unlimited cron jobs (for hourly email finding)
- ✅ Better for production use

**When to Upgrade:**
- Need more than 20 leads per search term
- Want automatic hourly email finding
- Running a business/production app

### Stay on Hobby Plan
**Best for:**
- ✅ Testing and MVP
- ✅ Collecting 50-100 leads total
- ✅ Manual email finding (button click)

**Workarounds:**
- ✅ Use multiple specific search terms per project
- ✅ Create multiple projects for different areas
- ✅ Use manual "Find Emails" button instead of cron

---

## 🎯 Recommended Workflow (Hobby Plan)

### Good Strategy:
```
Project: "SLC Area Real Estate"
Terms:
  1. "Salt Lake City realtors downtown"
  2. "Sandy Utah real estate agents"
  3. "Murray Utah property agents"
  4. "Millcreek realtors"
  5. "Holladay real estate agents"

Result: ~100 unique leads, completes in ~20 seconds
```

### Avoid:
```
❌ Project: "All Utah Real Estate"
   Term: "Utah real estate agents"
   
   Problem: Too broad, gets duplicates, still only 20 results
```

---

## 📝 Testing Your Stuck Project

1. **Reset** your stuck project using "Reset & Retry" button
2. **Wait** for new deployment (commit `279f801`)
3. **Try again** with same search term
4. Should complete in **5-10 seconds** with ~15-20 leads

---

## 🔍 Debug Tools

### Check If Everything Works:
Visit: `https://your-app.vercel.app/api/debug/scraping-test`

Should show:
```json
{
  "status": "ALL_OK",
  "checks": {
    "env": { "all": true },
    "adminClient": "OK",
    "database": "OK",
    "googlePlaces": "OK"
  }
}
```

---

## 📚 Related Files

- `lib/google-places.ts` - Line 26: `const maxPages = 1`
- `app/api/projects/[id]/scrape/route.ts` - Line 86: 8-second timeout
- `VERCEL_TIMEOUT_INFO.md` - Full timeout documentation
- `vercel.json` - Cron job configuration (currently disabled)

---

## Last Updated
November 17, 2024 - Fixed timeout issues for Hobby plan

