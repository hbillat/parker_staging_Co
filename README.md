# Parker and Co Staging - Internal Marketing Web App

A secure, internal marketing application with authentication and lead generation capabilities. Features include Supabase-powered authentication and a Google Places API-based lead scraper for collecting business information from search results.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project

### Setup Steps

1. **Configure Supabase**
   - Go to your Supabase dashboard: https://app.supabase.com
   - Navigate to **Authentication** → **Providers** → **Email**
   - **Disable** "Confirm email" option (for MVP)
   - Save changes

2. **Set up Google Places API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a project and enable "Places API (New)"
   - Create an API key
   - See [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for details

3. **Add Environment Variables**
   - Create a `.env.local` file in the project root
   - Add your credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key
     ```
   - Find Supabase values in: **Settings** → **API**

4. **Run Database Migrations**
   - Open Supabase SQL Editor
   - First run the SQL from `supabase_migration.sql`
   - Then run the SQL from `supabase_unique_leads_migration_v2.sql`
   - This creates tables for projects, search terms, leads, unique leads, and project links

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Run Development Server**
   ```bash
   npm run dev
   ```

7. **Open the App**
   - Visit [http://localhost:3000](http://localhost:3000)
   - Sign up with: `parkercostaging@gmail.com`
   - Any other email will be rejected

## 📋 Features

### Authentication
- ✅ Secure authentication with Supabase
- ✅ Email-restricted access (parkercostaging@gmail.com only)
- ✅ Protected routes with middleware
- ✅ Login/Sign-up toggle on one page

### Lead Scraper
- ✅ Create and manage lead generation projects
- ✅ Add multiple Google search terms per project
- ✅ Scrape up to 3 pages of Google business listings (~60 leads per term)
- ✅ Extract business data (name, address, phone, website, rating, reviews)
- ✅ Two-phase process: fast scraping + separate lead processing
- ✅ Automatic duplicate detection (global across all projects)
- ✅ Real-time status updates every 10 seconds
- ✅ View collected leads in sortable table
- ✅ **Optimized for local development** (no timeout constraints)

### All Leads
- ✅ View all unique leads across all projects in one place
- ✅ Sortable table (business name, times found, rating, reviews, location, source, date)
- ✅ Search and filter by any field (name, address, phone, email, website)
- ✅ Source tracking (shows which project lead was first found in)
- ✅ Times found counter (how many times business appeared)
- ✅ Clickable contact information

### Email Finder (NEW)
- ✅ Automatic email discovery from business websites
- ✅ Web scraping with smart email scoring
- ✅ Manual button to process 10 leads at a time
- ✅ Automatic hourly cron job (processes 20 leads/hour)
- ✅ Optional Hunter.io API integration for better accuracy
- ✅ Real-time stats dashboard
- ✅ Confidence levels (high/medium/low)

### UI/UX
- ✅ Modern UI with shadcn/ui components
- ✅ Clean dashboard with company branding
- ✅ Responsive design for desktop and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **APIs**: Google Places API, Hunter.io API (optional)
- **Cron Jobs**: Vercel Cron for automated email finding
- **Utilities**: date-fns, @googlemaps/google-maps-services-js

## 📁 Project Structure

```
├── app/
│   ├── api/projects/   # Lead scraper API routes
│   ├── auth/           # Authentication page
│   ├── dashboard/
│   │   ├── page.tsx    # Dashboard home
│   │   ├── leads/      # All leads page (NEW)
│   │   └── projects/   # Lead scraper projects
│   └── page.tsx        # Root redirect
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── projects-list.tsx
│   ├── project-details.tsx
│   ├── leads-table.tsx
│   ├── all-leads-table.tsx  # NEW: All leads with sort/filter
│   └── logout-button.tsx
├── lib/
│   ├── supabase/       # Supabase clients
│   └── google-places.ts # Google Places integration
├── types/
│   └── database.ts     # TypeScript types
└── middleware.ts       # Route protection
```

## 📖 Detailed Setup

For detailed setup instructions and troubleshooting, see [SETUP.md](./SETUP.md)

## 🔒 Security

- Authentication managed through Supabase Auth
- Passwords hashed by default
- Environment variables stored securely in `.env.local`
- Access restricted to authorized email only

## 🎯 Future Enhancements

### Lead Scraper
- ✅ Sortable table (COMPLETED)
- ✅ All Leads page (COMPLETED)
- ✅ Global unique leads system (COMPLETED)
- Export leads to CSV/Excel
- Edit/update individual leads
- Bulk operations (tag, delete, export)
- Lead notes and custom fields
- Email finding service integration
- Scheduled automatic re-scraping
- Lead scoring and prioritization

### New Features
- Marketing campaign management
- Analytics dashboard
- Campaign insights and reports
- User role management
- CRM integration

## 📚 Documentation

- **[CONTEXT.md](./CONTEXT.md)** - Complete project context and architecture
- **[SETUP.md](./SETUP.md)** - Detailed technical setup
- **[ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)** - Environment variables guide
- **[QUICKSTART.md](./QUICKSTART.md)** - 3-minute quick start
- **[Marketing_Web_App_PRD.md](./Marketing_Web_App_PRD.md)** - Auth MVP PRD
- **[Lead_Scraper_PRD_Updated.md](./Lead_Scraper_PRD_Updated.md)** - Lead scraper PRD
- **[UNIQUE_LEADS_SYSTEM.md](./UNIQUE_LEADS_SYSTEM.md)** - Unique leads architecture
- **[EMAIL_FINDER_SETUP.md](./EMAIL_FINDER_SETUP.md)** - Email finder setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Vercel deployment guide

## 💰 Costs

- **Vercel**: Free Hobby tier (local development recommended)
- **Supabase**: Free tier (sufficient for MVP)
- **Google Places API**: $200/month free credit
  - ~$0.005 per search
  - ~$0.015 per search term (3 pages)
  - ~60 leads per search term
  - Monitor usage in Google Cloud Console

## 🌐 Deployment

**Status**: ✅ Optimized for Local Development

- **Platform**: Local development (recommended)
- **Repository**: [https://github.com/hbillat/parker_staging_Co](https://github.com/hbillat/parker_staging_Co)
- **Environment Variables**: Configure in `.env.local` for local development
- **Vercel Limitation**: Hobby plan has 10-second function timeout - not suitable for full scraping

### Why Local Development?
- **No timeouts**: Run scraping jobs for as long as needed
- **Full results**: Get up to 60 leads per search term (3 pages)
- **Cost-effective**: No need for Vercel Pro plan ($20/month)
- **Easy setup**: Just `npm run dev` and you're ready to go

### Deployment Process
For deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md). Note that Vercel deployment requires either Pro plan or reducing scraping scope to 1 page (5 leads).
