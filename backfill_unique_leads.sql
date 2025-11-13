-- Backfill Script: Migrate existing leads to unique_leads system
-- This script takes all existing leads from the 'leads' table and:
-- 1. Creates unique lead records in 'unique_leads' table
-- 2. Links them to projects via 'project_leads' table
-- 3. Updates the 'leads' table with unique_lead_id references
--
-- Run this in your Supabase SQL Editor

-- ============================================
-- Step 1: Insert unique leads from existing leads
-- ============================================
INSERT INTO unique_leads (
  business_name,
  email,
  phone,
  address,
  website,
  google_url,
  rating,
  review_count,
  first_seen_at,
  last_updated_at,
  times_found,
  created_at
)
SELECT DISTINCT ON (business_name, address)
  business_name,
  email,
  phone,
  address,
  website,
  google_url,
  rating,
  review_count,
  MIN(created_at) as first_seen_at,
  MAX(created_at) as last_updated_at,
  COUNT(*) as times_found,
  MIN(created_at) as created_at
FROM leads
WHERE business_name IS NOT NULL 
  AND address IS NOT NULL
GROUP BY business_name, address, email, phone, website, google_url, rating, review_count
ON CONFLICT (business_name, address) DO NOTHING;

-- ============================================
-- Step 2: Create project_leads links for all existing leads
-- ============================================
INSERT INTO project_leads (
  project_id,
  unique_lead_id,
  search_term_id,
  found_at
)
SELECT DISTINCT
  l.project_id,
  ul.id as unique_lead_id,
  l.search_term_id,
  l.created_at as found_at
FROM leads l
INNER JOIN unique_leads ul 
  ON ul.business_name = l.business_name 
  AND ul.address = l.address
WHERE l.business_name IS NOT NULL 
  AND l.address IS NOT NULL
ON CONFLICT (project_id, unique_lead_id) DO NOTHING;

-- ============================================
-- Step 3: Update leads table with unique_lead_id references
-- ============================================
UPDATE leads l
SET unique_lead_id = ul.id
FROM unique_leads ul
WHERE l.business_name = ul.business_name
  AND l.address = ul.address
  AND l.unique_lead_id IS NULL;

-- ============================================
-- Step 4: Fix times_found counter (in case trigger didn't run)
-- ============================================
UPDATE unique_leads ul
SET times_found = (
  SELECT COUNT(*)
  FROM project_leads pl
  WHERE pl.unique_lead_id = ul.id
)
WHERE times_found = 0 OR times_found IS NULL;

-- ============================================
-- Verification queries
-- ============================================
DO $$
DECLARE
  unique_count INTEGER;
  project_link_count INTEGER;
  leads_with_unique_id INTEGER;
  total_leads INTEGER;
BEGIN
  -- Count unique leads
  SELECT COUNT(*) INTO unique_count FROM unique_leads;
  
  -- Count project links
  SELECT COUNT(*) INTO project_link_count FROM project_leads;
  
  -- Count leads with unique_lead_id
  SELECT COUNT(*) INTO leads_with_unique_id FROM leads WHERE unique_lead_id IS NOT NULL;
  
  -- Count total leads
  SELECT COUNT(*) INTO total_leads FROM leads;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Backfill completed successfully!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Unique leads created: %', unique_count;
  RAISE NOTICE 'Project links created: %', project_link_count;
  RAISE NOTICE 'Leads updated with unique_lead_id: %', leads_with_unique_id;
  RAISE NOTICE 'Total leads in database: %', total_leads;
  RAISE NOTICE '';
  
  IF leads_with_unique_id < total_leads THEN
    RAISE NOTICE '⚠️  Warning: % leads do not have unique_lead_id', (total_leads - leads_with_unique_id);
    RAISE NOTICE 'This is normal for leads with NULL business_name or address';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Refresh the All Leads page in your app!';
END $$;

