-- Backfill Script v2: Migrate existing leads to unique_leads system
-- This script takes all existing leads from the 'leads' table and:
-- 1. Creates unique lead records in 'unique_leads' table
-- 2. Links them to projects via 'project_leads' table
-- 3. Updates the 'leads' table with unique_lead_id references
--
-- Run this in your Supabase SQL Editor AFTER running supabase_unique_leads_migration_v2.sql

-- ============================================
-- Pre-check: Ensure tables exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unique_leads') THEN
    RAISE EXCEPTION 'Table unique_leads does not exist. Please run supabase_unique_leads_migration_v2.sql first!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_leads') THEN
    RAISE EXCEPTION 'Table project_leads does not exist. Please run supabase_unique_leads_migration_v2.sql first!';
  END IF;
  
  RAISE NOTICE 'Pre-check passed: All required tables exist';
END $$;

-- ============================================
-- Step 1: Insert unique leads from existing leads
-- Uses a temporary approach to handle duplicates
-- ============================================

-- First, create a temporary table with deduplicated leads
CREATE TEMP TABLE temp_unique_leads AS
SELECT DISTINCT ON (business_name, address)
  business_name,
  email,
  phone,
  address,
  website,
  google_url,
  rating,
  review_count,
  created_at
FROM leads
WHERE business_name IS NOT NULL 
  AND address IS NOT NULL
ORDER BY business_name, address, created_at;

-- Calculate stats for each unique business
CREATE TEMP TABLE temp_lead_stats AS
SELECT 
  business_name,
  address,
  MIN(created_at) as first_seen_at,
  MAX(created_at) as last_updated_at,
  COUNT(*) as times_found
FROM leads
WHERE business_name IS NOT NULL 
  AND address IS NOT NULL
GROUP BY business_name, address;

-- Insert into unique_leads (skip if already exists)
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
SELECT 
  tul.business_name,
  tul.email,
  tul.phone,
  tul.address,
  tul.website,
  tul.google_url,
  tul.rating,
  tul.review_count,
  tls.first_seen_at,
  tls.last_updated_at,
  tls.times_found,
  tul.created_at
FROM temp_unique_leads tul
JOIN temp_lead_stats tls 
  ON tul.business_name = tls.business_name 
  AND tul.address = tls.address
WHERE NOT EXISTS (
  SELECT 1 FROM unique_leads ul 
  WHERE ul.business_name = tul.business_name 
    AND ul.address = tul.address
);

-- ============================================
-- Step 2: Create project_leads links for all existing leads
-- ============================================
INSERT INTO project_leads (
  project_id,
  unique_lead_id,
  search_term_id,
  found_at
)
SELECT DISTINCT ON (l.project_id, ul.id)
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
  AND NOT EXISTS (
    SELECT 1 FROM project_leads pl 
    WHERE pl.project_id = l.project_id 
      AND pl.unique_lead_id = ul.id
  )
ORDER BY l.project_id, ul.id, l.created_at;

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
-- Step 4: Fix times_found counter
-- ============================================
UPDATE unique_leads ul
SET times_found = (
  SELECT COUNT(*)
  FROM project_leads pl
  WHERE pl.unique_lead_id = ul.id
)
WHERE EXISTS (
  SELECT 1 FROM project_leads pl WHERE pl.unique_lead_id = ul.id
);

-- ============================================
-- Verification and Results
-- ============================================
DO $$
DECLARE
  unique_count INTEGER;
  project_link_count INTEGER;
  leads_with_unique_id INTEGER;
  total_leads INTEGER;
  leads_without_unique INTEGER;
BEGIN
  -- Count unique leads
  SELECT COUNT(*) INTO unique_count FROM unique_leads;
  
  -- Count project links
  SELECT COUNT(*) INTO project_link_count FROM project_leads;
  
  -- Count leads with unique_lead_id
  SELECT COUNT(*) INTO leads_with_unique_id FROM leads WHERE unique_lead_id IS NOT NULL;
  
  -- Count total leads
  SELECT COUNT(*) INTO total_leads FROM leads;
  
  -- Count leads without unique_lead_id
  SELECT COUNT(*) INTO leads_without_unique FROM leads WHERE unique_lead_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Backfill completed successfully!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Unique leads in database: %', unique_count;
  RAISE NOTICE 'Project links created: %', project_link_count;
  RAISE NOTICE 'Leads updated with unique_lead_id: %', leads_with_unique_id;
  RAISE NOTICE 'Total leads in database: %', total_leads;
  
  IF leads_without_unique > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'ℹ️  Info: % leads do not have unique_lead_id', leads_without_unique;
    RAISE NOTICE 'This is normal for leads with NULL business_name or address';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Next step: Refresh the All Leads page in your app!';
  RAISE NOTICE 'Visit: http://localhost:3000/dashboard/leads';
END $$;

