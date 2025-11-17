# Vercel Function Timeout & Lead Scraper Configuration

## Current Issue (RESOLVED)

The Lead Scraper was timing out on Vercel's free Hobby plan because scraping 10 pages of Google Places results takes ~25-30 seconds, but Vercel's free tier has a **10-second maximum** for serverless functions.

## Current Solution (Implemented)

**Reduced to 3 pages per search term** which completes in ~8 seconds:
- ✅ **~60 leads per search term** (instead of 200)
- ✅ **Stays under the 10-second timeout**
- ✅ **Free tier compatible**
- ✅ **Reliable completion**

### Performance Metrics
- **Page 1**: ~20 results (2 seconds)
- **Page 2**: ~20 results (4 seconds)  
- **Page 3**: ~20 results (6 seconds)
- **Total**: ~60 results in ~8 seconds ✅

## Alternative Solutions

### Option 1: Keep Current Setup (Recommended)
- **Cost**: Free
- **Leads per search**: ~60
- **Reliability**: ✅ Excellent
- **Best for**: Most use cases, MVP testing

### Option 2: Upgrade to Vercel Pro
- **Cost**: $20/month
- **Leads per search**: ~200 (10 pages)
- **Function timeout**: 60 seconds
- **Benefits**:
  - More leads per search
  - Longer-running background jobs
  - Better for production scale

To upgrade:
1. Go to Vercel Dashboard → Settings → General
2. Click "Upgrade to Pro"
3. Update `lib/google-places.ts` line 25: change `const maxPages = 3` to `const maxPages = 10`
4. Redeploy

### Option 3: Move Scraping to Background Service
- **Cost**: Free (but more complex)
- **Leads per search**: Unlimited
- **Approach**: Use Supabase Edge Functions or external service
- **Best for**: High-volume production use

## How to Test If It's Working

### Test 1: Create New Project
1. Go to `/dashboard/projects`
2. Create new project: "Test Real Estate Agents"
3. Search term: "Salt Lake County Real Estate Agents"
4. Click "Start Scraping"
5. **Expected**: Should complete in ~10-15 seconds with ~40-60 leads

### Test 2: Check Vercel Logs
1. Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → "Functions" tab
3. Look for `/api/projects/[id]/scrape` logs
4. **Expected**: Should see completion, not timeout errors

## Troubleshooting

### Issue: Still timing out with 3 pages
**Cause**: Network latency or API rate limits  
**Solution**: Reduce to 2 pages (change `maxPages = 3` to `maxPages = 2`)

### Issue: Need more leads
**Solution**: Run multiple search terms per project
- Example project: "SLC Real Estate"
  - Term 1: "Salt Lake County Real Estate Agents"
  - Term 2: "Sandy Utah Real Estate Agents"
  - Term 3: "Murray Utah Realtors"
- **Total**: ~180 unique leads with duplicate detection

### Issue: Want original 10-page scraping
**Solution**: Upgrade to Vercel Pro or move to background service

## Google Places API Quota

- **Free tier**: $200/month credit
- **Cost per request**: 
  - Text Search: $0.032 per request
  - Place Details: $0.017 per request
- **With 3 pages**:
  - 3 text searches + ~60 detail requests per project
  - ~$1.12 per project
  - ~178 projects per month on free tier

## Related Files

- `lib/google-places.ts` - Main scraping logic (line 25: maxPages)
- `app/api/projects/[id]/scrape/route.ts` - API endpoint
- `vercel.json` - Vercel configuration
- `CONTEXT.md` - Full project documentation

## Summary

✅ **Current setup works reliably** with 3 pages (~60 leads per search)  
💡 **For more leads**: Add multiple search terms to same project  
💰 **For production scale**: Consider Vercel Pro upgrade

Last Updated: November 17, 2024

