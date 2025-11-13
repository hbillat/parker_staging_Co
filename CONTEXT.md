# Project Context - Parker and Co Staging Marketing App

## Project Overview
Internal marketing web application for Parker and Co Staging, built as an MVP with secure authentication as the foundation for future marketing campaign management features.

## Current Status: ✅ MVP COMPLETE & LEAD SCRAPER FEATURE LIVE

### What's Been Built
- **Authentication System**: Fully functional login/signup with Supabase
- **Email Restriction**: Only `parkercostaging@gmail.com` can access the application
- **Dashboard**: Protected welcome page with navigation to features
- **Lead Scraper Feature**: Generate business leads from Google searches
  - Create and manage multiple lead scraper projects
  - Add multiple search terms per project
  - Scrape up to 10 pages of Google business listings per search term
  - Extract business data (name, address, phone, website, rating, reviews)
  - Automatic duplicate detection
  - Real-time status updates every 10 seconds
  - View and export collected leads per project
- **All Leads Page** (NEW): Centralized view of all unique leads
  - Sortable table with all lead data fields
  - Search/filter functionality across all fields
  - Source tracking (which project lead was first found in)
  - Date tracking (when lead was first discovered)
  - Times found counter (how many times lead appeared)
  - Clickable contact information (phone, email, website)
- **Unique Leads System**: Global lead deduplication
  - `unique_leads` table stores one record per business
  - `project_leads` junction table links leads to projects
  - Prevents duplicate leads across all projects
  - Tracks first seen date and total times found
  - Enables future features (lead scoring, history tracking, CRM integration)
- **Modern UI**: Slack-inspired design with shadcn/ui components and Tailwind CSS

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Card, Button, Input, Label, Tabs, Dialog, Badge)
- **Authentication**: Supabase Auth (email + password)
- **Database**: Supabase PostgreSQL
- **APIs**: Google Places API (New) for lead generation
- **State Management**: React hooks (useState, useRouter, useEffect)
- **Date Formatting**: date-fns

## Architecture

### Project Structure
```
Parker_staging_Co/
├── app/
│   ├── api/
│   │   └── projects/
│   │       ├── create/route.ts   # Create new project API
│   │       └── [id]/
│   │           ├── scrape/route.ts   # Start scraping API
│   │           └── status/route.ts   # Get project status API
│   ├── auth/
│   │   └── page.tsx              # Login/Signup page (client component)
│   ├── dashboard/
│   │   ├── page.tsx              # Protected dashboard (server component)
│   │   ├── leads/
│   │   │   └── page.tsx          # All leads page (NEW)
│   │   └── projects/
│   │       ├── page.tsx          # Projects list page
│   │       └── [id]/page.tsx     # Project details page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root redirect logic
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── tabs.tsx
│   │   ├── dialog.tsx
│   │   └── badge.tsx
│   ├── logout-button.tsx         # Logout functionality
│   ├── projects-list.tsx         # Projects list display
│   ├── create-project-dialog.tsx # Create project modal
│   ├── project-details.tsx       # Project details with live updates
│   ├── leads-table.tsx           # Leads table display (per project)
│   └── all-leads-table.tsx       # All leads table (NEW, sortable)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Middleware Supabase client
│   ├── google-places.ts          # Google Places API integration
│   └── utils.ts                  # Utility functions (cn helper)
├── types/
│   └── database.ts               # TypeScript types for DB models
├── middleware.ts                 # Route protection & auth refresh
├── supabase_migration.sql        # Database schema
├── .env.local                    # Environment variables (gitignored)
├── components.json               # shadcn/ui configuration
└── [Documentation files]
```

### Key Files & Their Purpose

#### Authentication Flow
1. **`app/page.tsx`**: Root page that checks auth status and redirects to `/auth` or `/dashboard`
2. **`app/auth/page.tsx`**: Client-side auth page with login/signup toggle
   - Email restriction logic (`parkercostaging@gmail.com` only)
   - Form handling and error messages
   - Redirects to dashboard on success
3. **`middleware.ts`**: Protects routes, refreshes auth sessions
4. **`lib/supabase/`**: Three different Supabase client configurations
   - `client.ts`: For client components (browser)
   - `server.ts`: For server components
   - `middleware.ts`: For middleware (edge runtime)

#### Protected Routes
- **`app/dashboard/page.tsx`**: Server component that checks auth, shows welcome message
- **`components/logout-button.tsx`**: Client component for logout functionality

### Authentication Implementation Details

#### Email Restriction
- Hardcoded in `app/auth/page.tsx` as `ALLOWED_EMAIL = 'parkercostaging@gmail.com'`
- Checked on both signup and signin before making Supabase call
- Returns error message: "Access restricted. Please contact the administrator."

#### Supabase Configuration
- Email verification is **DISABLED** in Supabase dashboard
- Path: Authentication → Sign In / Providers → Email → "Confirm email" toggle OFF
- This allows immediate login after signup without email verification

#### Session Management
- Middleware refreshes user session on every route change
- Automatic redirect to `/auth` if not authenticated
- Cookies managed by Supabase SSR library

### Lead Scraper Feature Implementation

#### Database Schema
Five main tables in Supabase:

1. **projects**
   - `id` (UUID, primary key)
   - `name` (text): Project name
   - `user_id` (UUID): Owner's user ID
   - `status` (enum): 'draft', 'scraping', 'completed', 'failed'
   - `total_leads` (integer): Count of collected leads
   - `duplicates_removed` (integer): Count of duplicates found
   - `created_at`, `updated_at` (timestamps)

2. **search_terms**
   - `id` (UUID, primary key)
   - `project_id` (UUID, foreign key to projects)
   - `term` (text): Google search query
   - `status` (enum): 'pending', 'scraping', 'completed', 'failed'
   - `leads_count` (integer): Leads found for this term
   - `progress_message` (text): Current status message
   - `created_at`, `updated_at` (timestamps)

3. **unique_leads** (NEW - Global Lead Storage)
   - `id` (UUID, primary key)
   - `business_name` (text): Business name
   - `first_name`, `last_name` (text): Individual contact names (if applicable)
   - `email` (text): Email (rarely available from Google)
   - `phone` (text): Phone number
   - `address` (text): Full address
   - `city`, `state`, `zip_code`, `country` (text): Location details
   - `website` (text): Business website
   - `google_url` (text): Link to Google business listing
   - `rating` (decimal): Star rating (1-5)
   - `review_count` (integer): Number of reviews
   - `times_found` (integer): How many times this lead appeared across all projects
   - `first_seen_at` (timestamp): When first discovered
   - `last_updated_at` (timestamp): Last time data was updated
   - `created_at` (timestamp)
   - Unique constraint on `business_name` + `address`

4. **project_leads** (NEW - Junction Table)
   - `id` (UUID, primary key)
   - `project_id` (UUID, foreign key to projects)
   - `unique_lead_id` (UUID, foreign key to unique_leads)
   - `search_term_id` (UUID, foreign key to search_terms)
   - `found_at` (timestamp): When this lead was found in this project
   - Unique constraint on `project_id` + `unique_lead_id`

5. **leads** (Legacy - For Backwards Compatibility)
   - `id` (UUID, primary key)
   - `project_id` (UUID, foreign key to projects)
   - `search_term_id` (UUID, foreign key to search_terms)
   - `unique_lead_id` (UUID, foreign key to unique_leads)
   - `business_name` (text): Business name
   - `google_url` (text): Link to Google business listing
   - `website` (text): Business website
   - `phone` (text): Phone number
   - `email` (text): Email (rarely available from Google)
   - `address` (text): Full address
   - `rating` (decimal): Star rating (1-5)
   - `review_count` (integer): Number of reviews
   - `created_at` (timestamp)

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own projects and related data
- Policies check `user_id` matches `auth.uid()`

#### Google Places API Integration
- Uses `@googlemaps/google-maps-services-js` library
- Searches using Text Search API
- Fetches Place Details for each result
- Scrapes up to 10 pages per search term
- Rate limited with delays to avoid API throttling
- Extracts: name, address, phone, website, rating, review count, Google URL

#### Duplicate Detection
**Global Level (Unique Leads Table)**:
- Checks `business_name` + `address` combination across ALL projects
- If business already exists in `unique_leads`:
  - Returns existing unique lead ID
  - Increments `times_found` counter
  - Updates `last_updated_at` timestamp
- If new business:
  - Creates new record in `unique_leads`
  - Sets `times_found` to 1

**Project Level (Project Leads Junction Table)**:
- Checks if unique lead is already linked to current project
- Prevents same business appearing multiple times in one project
- Tracks `found_at` timestamp for when lead was discovered in this project
- Allows same lead to appear in multiple projects (tracked separately)

#### Real-Time Status Updates
- Frontend polls `/api/projects/[id]/status` every 10 seconds
- Only polls when project status is 'scraping'
- Updates project stats and search term progress
- Stops polling when status changes to 'completed' or 'failed'

#### Scraping Flow
1. User creates project with name and search terms
2. Project saved as 'draft' in database
3. User clicks "Start Scraping"
4. API route `/api/projects/[id]/scrape` triggered
5. Project status updated to 'scraping'
6. Background process starts:
   - For each search term:
     - Update term status to 'scraping'
     - Call Google Places API for up to 10 pages
     - For each result:
       - **Step 1**: Check/create unique lead in `unique_leads` table
         - If exists: Get unique lead ID, increment `times_found`
         - If new: Create record, set `times_found` to 1
       - **Step 2**: Check if unique lead already in this project (`project_leads`)
         - If already in project: Skip (count as duplicate)
         - If not in project: Link to project via `project_leads`
       - **Step 3**: Also insert to `leads` table (backwards compatibility)
     - Update term as 'completed' with lead count
7. After all terms processed:
   - Update project status to 'completed'
   - Set total lead count and duplicates removed
8. Frontend polls and displays real-time progress

#### API Routes
- **POST /api/projects/create**: Create new project with search terms
- **POST /api/projects/[id]/scrape**: Start scraping process (background job)
- **GET /api/projects/[id]/status**: Get current project status and search term progress

#### UI Components
- **ProjectsList**: Displays all user's projects with status badges
- **CreateProjectDialog**: Modal for creating new project with search terms
- **ProjectDetails**: Shows project stats, search terms, and leads table with live updates
- **LeadsTable**: Table display of leads for a specific project
- **AllLeadsTable** (NEW): Comprehensive table of all unique leads
  - Sortable columns: business name, times found, rating, reviews, address, source, date
  - Search/filter across all fields
  - Default sort: Times Found (descending)
  - Shows source project and first found date
  - Displays total projects where lead appears
  - Clickable contact information

## Environment Variables

### Required Variables (in `.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=https://lsgwiofhjcnjkdgsubxp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzZ3dpb2ZoamNuamtkZ3N1YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTM0MzksImV4cCI6MjA3ODQ2OTQzOX0.YMI5gVh_d3UO3N4mqjV9lTQLpOnmT-N1Cq0N9WTs_2o
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIzaSyCmcmZy8gMRbTo4jWcsHTAfIsYYoPT8-qE
```

### Supabase Project Details
- **Organization**: hbillat's Org
- **Project Name**: staging_co
- **Environment**: Production
- **URL**: https://lsgwiofhjcnjkdgsubxp.supabase.co

## Design System

### Color Palette
- Background: Gradient from `slate-50` to `slate-100`
- Text: `slate-900` (headings), `slate-600` (body)
- Cards: White with `slate-200` borders
- Buttons: Primary color scheme from shadcn/ui default

### Typography
- Company name: `text-4xl font-bold` in header, `text-2xl font-bold` in nav
- Headings: `text-3xl font-bold` for dashboard welcome
- Body text: `text-sm` to `text-base`
- Fonts: Geist (default Next.js font)

### Layout
- Center-card layout for auth page
- Max width container for dashboard (`max-w-7xl`)
- Responsive spacing with Tailwind utilities

## Current Features

### ✅ Implemented
1. **Email + Password Authentication**
   - Sign up with validation (min 6 characters)
   - Sign in with error handling
   - Email format validation
   
2. **Access Control**
   - Email whitelist (parkercostaging@gmail.com only)
   - Custom error messages for unauthorized emails
   - Protected routes via middleware

3. **User Interface**
   - Login/Signup toggle on single page
   - Error and success messages
   - Loading states on buttons
   - Responsive design

4. **Dashboard**
   - Welcome message with user email
   - Company branding ("Parker and Co Staging")
   - Logout button in navigation
   - Navigation to Lead Scraper feature
   - Placeholder cards for future features:
     - Marketing Campaigns
     - Analytics

5. **Route Protection**
   - Middleware automatically redirects unauthenticated users to `/auth`
   - Authenticated users at `/auth` are redirected to `/dashboard`
   - Session refresh on route changes

6. **Lead Scraper Feature**
   - **Project Management**:
     - Create, view, and manage lead scraper projects
     - Each project can have multiple search terms
     - Projects list with status badges and stats
   - **Search Term Management**:
     - Add/remove multiple Google search terms per project
     - Track status of each search term individually
     - View progress messages for each term
   - **Google Places Integration**:
     - Scrapes first 10 pages of Google business listings
     - Extracts business data: name, address, phone, website, rating, reviews
     - Uses official Google Places API
   - **Duplicate Detection**:
     - Automatically detects and skips duplicate businesses
     - Based on business name + address combination
     - Tracks count of duplicates removed
     - Global deduplication across all projects
   - **Real-Time Progress**:
     - Status updates every 10 seconds during scraping
     - Live progress messages for each search term
     - Project stats update in real-time
   - **Leads Management**:
     - View all collected leads in sortable table
     - Click-through links to Google listings and websites
     - Contact information (phone, email when available)
     - Rating and review count display

7. **All Leads Page** (NEW)
   - **Centralized Lead View**:
     - View all unique leads across all projects in one place
     - Shows complete lead information with all fields
   - **Sortable Table**:
     - Click column headers to sort (ascending/descending)
     - Sort by: business name, times found, rating, reviews, location, source, date
     - Default sort: Times Found (highest first)
   - **Search & Filter**:
     - Real-time search across all lead fields
     - Filter by business name, address, phone, email, website
     - Shows result count (e.g., "Showing 25 of 100 leads")
   - **Source Tracking**:
     - Shows which project the lead was first discovered in
     - Displays when the lead was first found
     - Shows how many projects the lead appears in
   - **Lead Intelligence**:
     - Times Found counter (how many times business appeared)
     - Total projects counter (how many different projects)
     - First found date (relative time, e.g., "2 days ago")
   - **Contact Information**:
     - Clickable phone numbers (tel: links)
     - Clickable email addresses (mailto: links)
     - Website and Google Maps links
     - Rating and review count

## Known Issues & Limitations

### Current Limitations
1. **Single User**: Only one email address can access the system
2. **No Password Reset**: Password reset flow not implemented
3. **No User Profile**: No user profile page or settings
4. **No Email Verification**: Disabled for MVP simplicity
5. **No Export Feature**: Can't export leads to CSV/Excel (yet)
6. **No Email Extraction**: Google Places API doesn't provide email addresses
7. **API Rate Limits**: Google Places API has rate limits and costs after free tier
8. **No Lead Editing**: Can't manually edit/update lead information
9. **No Bulk Operations**: Can't delete or tag multiple leads at once

### Resolved Issues
- ✅ Email confirmation requirement (disabled in Supabase)
- ✅ Environment variable validation (added helpful error messages)
- ✅ Multiple Next.js instances (cleaned up during development)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Future Roadmap (Not Yet Implemented)

### Phase 2: Lead Scraper Enhancements
- ✅ Sortable leads table (COMPLETED)
- ✅ Global unique leads system (COMPLETED)
- ✅ All Leads page with search/filter (COMPLETED)
- Export leads to CSV/Excel
- Edit/update individual leads
- Bulk operations on leads (tag, delete, export)
- Lead notes and custom fields
- Email finding service integration
- Schedule automatic re-scraping
- Lead scoring and prioritization

### Phase 3: User Management
- Add more authorized users
- User roles and permissions
- User profile pages
- Password reset flow

### Phase 4: Marketing Campaigns
- Create, edit, delete campaigns
- Campaign status tracking
- Campaign templates
- Link leads to campaigns

### Phase 5: Analytics
- Real-time campaign metrics
- Performance charts and graphs
- Custom date ranges
- Lead conversion tracking

### Phase 6: Insights & Reports
- Detailed campaign reports
- Export functionality (CSV, PDF)
- Automated reporting
- CRM integration

## Important Notes for Future Development

### Email Whitelist
- Currently hardcoded in `app/auth/page.tsx`
- To add more users, consider:
  - Moving to environment variable (comma-separated list)
  - Storing in Supabase database with admin UI
  - Implementing role-based access control

### Supabase Settings
- Email confirmation MUST stay disabled or update signup flow
- If re-enabling email confirmation, update auth logic in `app/auth/page.tsx`

### Error Handling
- All Supabase calls wrapped in try-catch
- User-friendly error messages displayed
- Check browser console for detailed errors during development

### Performance Considerations
- Server components used where possible for better performance
- Client components only for interactive elements (auth forms, logout button, project management)
- Middleware runs on every route change (keep lightweight)
- Background scraping jobs to avoid blocking API responses
- Polling instead of WebSockets for simplicity

### Google Places API
- Uses Text Search for initial results
- Place Details for comprehensive business information
- Respects rate limits with delays between requests
- $200/month free credit typically covers ~4,000 searches
- Monitor usage in Google Cloud Console

## Troubleshooting Guide

### "Invalid credentials" on login
- Check if email confirmation is disabled in Supabase
- Verify user exists in Supabase → Authentication → Users
- If user is unconfirmed, delete and re-signup

### "Missing Supabase environment variables"
- Check `.env.local` exists in project root
- Verify variable names exactly match: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding/changing `.env.local`

### App won't load/blank page
- Check dev server is running: `npm run dev`
- Verify port 3000 is not blocked
- Check browser console for JavaScript errors
- Try different browser

### "Access restricted" message
- Verify you're using `parkercostaging@gmail.com`
- Check for typos in email address
- Review email restriction logic in `app/auth/page.tsx`

## Troubleshooting - Lead Scraper

### Scraping takes too long
- Each search term scrapes 10 pages which can take 2-3 minutes
- Google API has rate limits and requires delays between requests
- Consider reducing number of search terms or pages

### No leads found
- Check if search term is too specific
- Verify Google Places API is enabled in Google Cloud
- Check API key is correct in `.env.local`
- Look at browser/server console for errors

### Duplicate leads still appearing
- Duplicate check is based on exact business name + address match
- Slight variations in name or address will create separate entries
- This is intentional to avoid false positives

### API costs concern
- Google provides $200/month free credit
- Each search costs ~$0.005
- 10 pages per search term ≈ $0.05
- Monitor usage in Google Cloud Console
- Set up budget alerts

## Documentation Files

- **README.md**: Project overview and quick start
- **QUICKSTART.md**: 3-minute setup guide
- **GETTING_STARTED.md**: Comprehensive setup instructions
- **ENV_SETUP_GUIDE.md**: Detailed Supabase credential setup
- **SETUP.md**: Technical details and troubleshooting
- **Marketing_Web_App_PRD.md**: Original auth MVP requirements
- **Lead_Scraper_PRD_Updated.md**: Lead scraper feature requirements
- **supabase_migration.sql**: Database schema for lead scraper (initial)
- **supabase_unique_leads_migration_v2.sql**: Unique leads system schema
- **UNIQUE_LEADS_SYSTEM.md**: Documentation for unique leads architecture
- **CONTEXT.md**: This file - complete project context

## Last Updated
- Date: November 13, 2024
- Status: MVP Complete + Lead Scraper Feature Live + All Leads Page + DEPLOYED TO PRODUCTION
- Last Major Change: Added All Leads page with sortable table and unique leads system
- Features Complete:
  - Authentication system
  - Lead Scraper with real-time updates
  - Project management
  - Global duplicate detection (unique leads)
  - Google Places API integration
  - All Leads page with search/sort/filter
  - Source tracking and lead intelligence
- Deployment:
  - Production: Deployed on Vercel
  - GitHub Repository: https://github.com/hbillat/parker_staging_Co
  - Environment: Production with all environment variables configured
  - Status: ✅ Live and Working
- Database:
  - Unique leads system implemented
  - Migration: supabase_unique_leads_migration_v2.sql
  - Tables: projects, search_terms, leads, unique_leads, project_leads

