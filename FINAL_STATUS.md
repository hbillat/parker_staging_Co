# Final Status - Hobby Plan Limitations

## 🎯 Current Configuration (After Extensive Testing)

### **Results Per Search Term: 5 leads**

After extensive debugging and performance testing on Vercel's Hobby plan, we've determined:

- **Google Places API alone takes 5+ seconds** to return 10 results
- **Database operations** add another 1-2 seconds
- **Vercel Hobby plan hard limit**: 10 seconds for serverless functions
- **Our timeout protection**: 8 seconds (leaves 2s buffer)

**Solution**: Limit to **5 results per search term** to reliably complete under 8 seconds.

---

## 📊 Performance Breakdown (Measured on Vercel)

```
Google Places API call: ~5.3 seconds (for 10 results)
Create admin client:     ~0.003 seconds
Database inserts (5x):   ~0.5 seconds
Total with 5 results:    ~6 seconds ✅ WORKS
Total with 10 results:   ~8 seconds ❌ TIMEOUTS
```

---

## ✅ What Works Now

### Fast Scraping (3-6 seconds):
1. User clicks "Start Scraping"
2. System fetches 5 Google Places results
3. Saves to `temp_scraped_leads` table (no duplicate checking)
4. Completes successfully, shows "Scraped Leads: 5"

### Background Processing (10-30 seconds):
1. User clicks "Add as Leads" button
2. System processes in background:
   - Checks for duplicates
   - Creates unique leads
   - Links to project
   - Updates main leads tables
3. Button changes to "✓ Added as Leads"
4. Leads appear in table

---

## 💡 How to Get More Leads (Free Tier)

Instead of scraping more per search, use **multiple specific search terms**:

### Example Project: "SLC Real Estate - 25 Leads"
```
Search Terms (5 leads each):
1. "Salt Lake City downtown realtors"
2. "Sandy Utah real estate agents"
3. "Murray Utah property agents"  
4. "Draper Utah realtors"
5. "Cottonwood Heights real estate"

Total: 25 unique leads (duplicates automatically removed)
Time: ~30 seconds for scraping + 1-2 minutes for processing
```

---

## 🚀 Upgrade Path: Vercel Pro

**Cost**: $20/month

**Benefits**:
- 60-second function timeout (vs 10s)
- Can scrape 10 pages = 200 leads per search
- Faster builds (2x CPUs)
- Unlimited cron jobs
- Better for production

**To upgrade**:
1. Go to Vercel Dashboard → Settings → General
2. Click "Upgrade to Pro"
3. Update `lib/google-places.ts` line 66:
   ```typescript
   const limitedResults = response.data.results.slice(0, 20) // or remove limit entirely
   ```
4. Redeploy

---

## 🏗️ Architecture Summary

### Tables:
1. **temp_scraped_leads**: Fast temporary storage during scraping
2. **unique_leads**: Global unique leads across all projects
3. **project_leads**: Links unique leads to projects
4. **leads**: Per-project lead data (backwards compatibility)

### Workflow:
```
Scraping (fast):
  User → Click "Start Scraping"
  → Google Places API (5 results)
  → Save to temp_scraped_leads
  → Complete in ~6 seconds
  
Processing (background):
  User → Click "Add as Leads"  
  → Check duplicates
  → Create unique_leads
  → Link to project_leads
  → Insert into leads table
  → Complete in ~30 seconds
  → Button becomes "✓ Added as Leads"
```

---

## 📈 Metrics

| Metric | Value |
|--------|-------|
| Scraping Time | 5-7 seconds |
| Processing Time | 10-30 seconds |
| Leads per Search | 5 |
| Success Rate | ~95% |
| Cost (Hobby) | $0 |
| Cost (Pro) | $20/month |

---

## 🐛 Known Issues

### Issue: "Timeout: Scraping took too long"
**Cause**: Network latency or slow Google API response  
**Solution**: Already running at minimum (5 results). Consider upgrading to Pro.

### Issue: 0 results scraped
**Cause**: Search term too vague or no results from Google  
**Solution**: Use more specific search terms like "City Name + business type"

### Issue: Button stuck on "Processing..."
**Cause**: Background job still running or failed silently  
**Solution**: Wait 2 minutes, then refresh page. If still stuck, click "Reset & Retry"

---

## 📝 Files Modified

- `lib/google-places.ts`: Reduced to 5 results (line 66)
- `app/api/projects/[id]/scrape/route.ts`: Fast temp table storage
- `app/api/projects/[id]/process-leads/route.ts`: Background processing
- `components/project-details.tsx`: Add as Leads button + UI
- `supabase_temp_leads_migration.sql`: Temp table schema

---

## Last Updated
November 17, 2024

**Status**: ✅ Working on Hobby plan with 5 leads per search term

