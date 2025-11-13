# Email Finder Setup Guide

The Email Finder feature automatically discovers email addresses from lead websites.

## How It Works

### Method 1: Web Scraping (Free, Built-in)
- Visits each lead's website
- Searches HTML for email addresses using regex
- Scores emails based on business patterns (info@, contact@, etc.)
- Filters out spam/generic emails (noreply@, etc.)

### Method 2: Hunter.io API (Optional, More Reliable)
- Uses Hunter.io's email finding API
- More accurate and includes confidence scores
- Free tier: 25 searches/month
- Paid plans start at $49/month for 500 searches

## Quick Start

### 1. Manual Email Finding (Available Now)

1. Visit `/dashboard/leads` in your app
2. Click the **"Find Emails (10 leads)"** button
3. The system will process 10 leads at a time
4. Found emails are automatically saved

### 2. Automatic Hourly Processing (Requires Setup)

The system can automatically find emails every hour using Vercel Cron Jobs.

#### Required Environment Variables

Add these to your `.env.local` (local) and Vercel (production):

```env
# Required for cron job authentication
CRON_SECRET=your-random-secret-key-here

# Required for cron job to access database
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Hunter.io API key for better results
HUNTER_IO_API_KEY=your-hunter-api-key
```

#### Getting the Keys

**CRON_SECRET:**
Generate a random secret:
```bash
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/

**SUPABASE_SERVICE_ROLE_KEY:**
1. Go to your Supabase project
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (keep this secret!)

**HUNTER_IO_API_KEY (Optional):**
1. Sign up at https://hunter.io
2. Go to **API** tab in dashboard
3. Copy your API key

#### Add to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all three variables for **Production**, **Preview**, and **Development**
4. Redeploy your app

#### Vercel Cron Configuration

The `vercel.json` file is already configured to run every hour:

```json
{
  "crons": [
    {
      "path": "/api/cron/find-emails",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Note:** Vercel Cron Jobs are only available on **Pro plans** and above. If you're on the Hobby (free) plan, you can:
- Use the manual button to find emails
- Use an external cron service (see below)

### 3. External Cron Service (For Hobby Plan)

If you don't have Vercel Pro, use a free external service:

**Option A: cron-job.org (Free)**
1. Sign up at https://cron-job.org
2. Create a new cron job
3. URL: `https://your-app.vercel.app/api/cron/find-emails`
4. Schedule: Every hour (`0 * * * *`)
5. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

**Option B: EasyCron (Free tier available)**
1. Sign up at https://www.easycron.com
2. Create cron job with your endpoint
3. Add Authorization header

## Usage

### Stats Dashboard

The Email Finder shows:
- **Total Leads**: All unique leads in database
- **With Email**: Leads that have email addresses
- **With Website**: Leads that have websites (needed to find emails)
- **Ready to Process**: Leads with websites but no emails

### Processing

- Processes 10 leads per manual click
- Processes 20 leads per hour (automatic)
- Safe to run multiple times (skips leads with emails)
- Shows confidence level (high/medium/low)
- Shows source (scraped/api)

## Email Quality

The system scores emails based on:

**High Priority (+30 points):**
- info@domain.com
- contact@domain.com

**Medium Priority (+20-25 points):**
- hello@domain.com
- sales@domain.com
- support@domain.com

**Filtered Out (-50 points):**
- noreply@
- no-reply@
- donotreply@
- unsubscribe@

## Limitations

1. **Google Places API doesn't provide emails** - Only works if lead has a website
2. **Some websites block scrapers** - May not find all emails
3. **Rate limiting** - Respects delays to avoid being blocked
4. **Hunter.io costs** - Free tier is limited

## Monitoring

Check logs in Vercel dashboard:
1. Go to **Deployments**
2. Click on latest deployment
3. View **Functions** logs
4. Search for `[CRON]` to see cron job runs

## Troubleshooting

### No emails found
- Ensure leads have valid websites
- Check website is accessible (not blocking scrapers)
- Consider adding Hunter.io API key for better results

### Cron job not running
- Verify CRON_SECRET is set in Vercel
- Check you're on Vercel Pro plan (or using external service)
- View function logs for errors

### Hunter.io errors
- Verify API key is correct
- Check you haven't exceeded free tier limit (25/month)
- Ensure domain format is correct

## Cost Estimate

**Free tier (scraping only):**
- $0/month
- ~30-50% success rate
- Unlimited searches

**With Hunter.io:**
- Free: 25 searches/month
- Starter: $49/month for 500 searches
- Growth: $99/month for 2,500 searches
- ~90% success rate

## Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Test manual email finding
3. ✅ Verify cron job runs (check logs after 1 hour)
4. ✅ Monitor success rate
5. ⚠️ Consider Hunter.io if success rate is low

