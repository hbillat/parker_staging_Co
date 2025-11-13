# Unique Leads System Documentation

## 📋 Overview

The Unique Leads System is a centralized lead management solution that prevents duplicate leads across ALL projects. Instead of storing leads separately for each project, we now maintain a single source of truth for all business leads.

## 🎯 Key Benefits

1. **No Cross-Project Duplicates**: A business that appears in multiple projects is stored only once
2. **Lead Intelligence**: Track how many times a lead has appeared across all projects (`times_found`)
3. **Better Data Quality**: Single record means consistent, up-to-date information
4. **Future-Ready**: Enables features like lead scoring, enrichment, and CRM integration
5. **Efficient Storage**: Eliminates redundant data

---

## 🏗️ Database Architecture

### New Tables

#### 1. `unique_leads` - Central Lead Repository
Stores one record per unique business, indexed on:
- Business name + address (primary uniqueness check)
- First name + last name (for person-based leads)
- Phone number
- Email address

**Fields:**
```sql
- id (UUID, primary key)
- business_name (required)
- first_name, last_name (for individual contacts)
- email, phone
- address, city, state, zip_code, country
- website, google_url
- rating, review_count
- first_seen_at (when first discovered)
- last_updated_at (auto-updated)
- times_found (how many projects found this lead)
- created_at
```

#### 2. `project_leads` - Junction Table
Links projects to unique leads (many-to-many relationship).

**Fields:**
```sql
- id (UUID, primary key)
- project_id (FK to projects)
- unique_lead_id (FK to unique_leads)
- search_term_id (which search term found this lead)
- found_at (when added to this project)
- UNIQUE constraint on (project_id, unique_lead_id)
```

#### 3. `leads` Table Update
Existing `leads` table updated with:
- `unique_lead_id` (FK to unique_leads)

---

## 🔄 How It Works

### Scraping Flow (New System)

1. **Google Places API** returns business data
2. **Check `unique_leads` table**:
   - Match on: business_name + address
   - If exists: Get the unique_lead_id
   - If new: Create new unique_lead record
3. **Check `project_leads` table**:
   - Is this unique_lead already in THIS project?
   - If yes: Mark as duplicate (don't add again)
   - If no: Proceed to step 4
4. **Create relationships**:
   - Insert into `project_leads` (links project to unique lead)
   - Insert into `leads` (for backwards compatibility)
   - Auto-increment `times_found` in `unique_leads`

### Example Scenario

**Project A**: Searches "home staging san francisco"
- Finds "ABC Staging Company" → Creates unique_lead #1
- Finds "XYZ Interiors" → Creates unique_lead #2

**Project B**: Searches "interior design san francisco"  
- Finds "ABC Staging Company" → Recognizes unique_lead #1 (already exists!)
  - If NOT in Project B yet: Links to Project B (times_found = 2)
  - If already in Project B: Skips as duplicate
- Finds "New Design Co" → Creates unique_lead #3

**Result**: 
- `unique_leads`: 3 records total
- `project_leads`: 3 links (A→#1, A→#2, B→#1, B→#3)
- Lead #1 `times_found` = 2 (appeared in 2 projects)

---

## 🔍 Querying Data

### Get All Unique Leads for a Project

```sql
SELECT ul.*
FROM unique_leads ul
JOIN project_leads pl ON pl.unique_lead_id = ul.id
WHERE pl.project_id = 'YOUR_PROJECT_ID';
```

### Get All Projects for a Lead

```sql
SELECT p.*
FROM projects p
JOIN project_leads pl ON pl.project_id = p.id
WHERE pl.unique_lead_id = 'YOUR_LEAD_ID';
```

### Get Most Popular Leads (Across All Projects)

```sql
SELECT * 
FROM unique_leads
ORDER BY times_found DESC
LIMIT 10;
```

### Use the Pre-Built View

```sql
SELECT *
FROM project_leads_detailed
WHERE project_id = 'YOUR_PROJECT_ID';
```

---

## 📊 Database Indexes

Optimized for:
- ✅ Fast duplicate detection (business_name + address)
- ✅ Person name lookups (first_name + last_name)
- ✅ Contact searches (phone, email)
- ✅ Popularity sorting (times_found)
- ✅ Project-lead relationship queries

---

## 🔐 Security (RLS Policies)

### `unique_leads` Table
- **SELECT**: Users can view leads from their own projects
- **INSERT**: Anyone can insert (but only see their own)
- **UPDATE**: Users can update leads from their projects

### `project_leads` Table
- **SELECT**: Users can view links for their own projects
- **INSERT**: Users can create links for their own projects
- **DELETE**: Users can remove links from their own projects

**Privacy**: Users can only see leads that belong to their projects. Shared leads are visible to all users who found them, but users can't see which other projects a lead appears in.

---

## 🔄 Auto-Triggers

### 1. Auto-Update `last_updated_at`
Whenever a unique_lead is updated, `last_updated_at` is automatically set to NOW().

### 2. Auto-Increment `times_found`
When a unique_lead is linked to a new project (via `project_leads`), `times_found` automatically increments.

---

## 🚀 Migration Instructions

### Step 1: Run the Migration SQL

```sql
-- Run this in Supabase SQL Editor
-- File: supabase_unique_leads_migration.sql
```

This creates:
- `unique_leads` table
- `project_leads` table  
- Indexes
- RLS policies
- Helper functions
- View

### Step 2: Deploy Updated Code

The application code has been updated to use the new system automatically. Just push to Vercel:

```bash
git add .
git commit -m "Add unique leads system"
git push origin main
```

Vercel will auto-deploy.

### Step 3: (Optional) Migrate Existing Leads

If you have existing leads data, uncomment the migration section in the SQL file and run it. This will:
- Copy existing leads to `unique_leads`
- Create `project_leads` relationships
- Update old `leads` records with `unique_lead_id`

---

## 📈 Future Enhancements

This system enables:

1. **Lead Enrichment**
   - Add more data to leads over time
   - Integrate with data enrichment services
   - Store lead scores

2. **Lead Management**
   - Mark leads as contacted/converted
   - Add notes and tags
   - Assign leads to team members

3. **Analytics**
   - Most popular businesses across all projects
   - Lead overlap analysis
   - Geographic distribution

4. **CRM Integration**
   - Export to Salesforce, HubSpot, etc.
   - Two-way sync
   - Status tracking

5. **De-duplication**
   - Merge similar leads
   - Fuzzy matching for variations
   - Manual merge interface

---

## 🧪 Testing Checklist

- [ ] Run migration SQL in Supabase
- [ ] Create a test project
- [ ] Add search terms and scrape
- [ ] Verify leads appear in `unique_leads` table
- [ ] Verify links in `project_leads` table
- [ ] Create second project with overlapping search terms
- [ ] Verify duplicates are detected
- [ ] Check `times_found` increments correctly
- [ ] Test queries and view
- [ ] Verify RLS policies work (users see only their leads)

---

## 📝 API Changes

### New Functions (in `lib/google-places.ts`)

```typescript
// Find or create a unique lead (returns unique_lead_id)
findOrCreateUniqueLead(supabase, placeData): Promise<string | null>

// Check if unique lead is already in this project
isLeadInProject(supabase, projectId, uniqueLeadId): Promise<boolean>
```

### Updated Flow

Old:
```
Place → Check leads table → Insert into leads
```

New:
```
Place → Find/Create unique_lead → Check project_leads → Insert into project_leads + leads
```

---

## 🎓 Best Practices

1. **Always use unique_leads as source of truth**
   - Query unique_leads for clean, deduplicated data
   - Use leads table only for project-specific views

2. **Index Strategy**
   - Business name + address is primary uniqueness key
   - Person names are secondary (when available)
   - Phone/email for contact lookup

3. **Data Quality**
   - Keep unique_leads records updated
   - Merge duplicates when found
   - Validate data before insertion

4. **Performance**
   - Use the `project_leads_detailed` view for joins
   - Add indexes if new query patterns emerge
   - Monitor `times_found` for popular leads

---

## 📞 Support

For questions or issues with the Unique Leads System:
1. Check this documentation
2. Review the migration SQL
3. Check Supabase table browser
4. Review RLS policies in Supabase

---

**Last Updated**: November 12, 2024  
**Status**: ✅ Implemented and Ready to Deploy  
**Migration Required**: Yes (run `supabase_unique_leads_migration.sql`)

