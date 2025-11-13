-- Unique Leads System Migration v2
-- This creates a centralized unique leads table and links it to projects
-- Safe to run - checks for existence before creating
-- Run this in your Supabase SQL Editor

-- ============================================
-- Table: unique_leads
-- Central repository for all unique business leads
-- ============================================
CREATE TABLE IF NOT EXISTS unique_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Information
  business_name TEXT NOT NULL,
  
  -- Contact Information (extracted from scraped data)
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  
  -- Online Presence
  website TEXT,
  google_url TEXT,
  
  -- Business Metrics
  rating DECIMAL(2,1),
  review_count INTEGER,
  
  -- Metadata
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  times_found INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for performance and uniqueness checking
-- ============================================

CREATE INDEX IF NOT EXISTS idx_unique_leads_business_address 
  ON unique_leads(business_name, address);

CREATE INDEX IF NOT EXISTS idx_unique_leads_person_name 
  ON unique_leads(first_name, last_name) 
  WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unique_leads_business_name 
  ON unique_leads(business_name);

CREATE INDEX IF NOT EXISTS idx_unique_leads_phone 
  ON unique_leads(phone) 
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unique_leads_email 
  ON unique_leads(email) 
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unique_leads_times_found 
  ON unique_leads(times_found DESC);

-- ============================================
-- Table: project_leads (Junction Table)
-- Links projects to unique leads (many-to-many relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS project_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unique_lead_id UUID NOT NULL REFERENCES unique_leads(id) ON DELETE CASCADE,
  search_term_id UUID REFERENCES search_terms(id) ON DELETE SET NULL,
  found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, unique_lead_id)
);

CREATE INDEX IF NOT EXISTS idx_project_leads_project_id 
  ON project_leads(project_id);

CREATE INDEX IF NOT EXISTS idx_project_leads_unique_lead_id 
  ON project_leads(unique_lead_id);

CREATE INDEX IF NOT EXISTS idx_project_leads_search_term_id 
  ON project_leads(search_term_id);

-- ============================================
-- Update existing leads table
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'unique_lead_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN unique_lead_id UUID REFERENCES unique_leads(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_unique_lead_id 
  ON leads(unique_lead_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

ALTER TABLE unique_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DO $$ 
BEGIN
  -- unique_leads policies
  DROP POLICY IF EXISTS "Users can view unique leads from their projects" ON unique_leads;
  CREATE POLICY "Users can view unique leads from their projects"
    ON unique_leads FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM project_leads pl
        JOIN projects p ON p.id = pl.project_id
        WHERE pl.unique_lead_id = unique_leads.id
        AND p.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Users can insert unique leads" ON unique_leads;
  CREATE POLICY "Users can insert unique leads"
    ON unique_leads FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Users can update unique leads from their projects" ON unique_leads;
  CREATE POLICY "Users can update unique leads from their projects"
    ON unique_leads FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM project_leads pl
        JOIN projects p ON p.id = pl.project_id
        WHERE pl.unique_lead_id = unique_leads.id
        AND p.user_id = auth.uid()
      )
    );

  -- project_leads policies
  DROP POLICY IF EXISTS "Users can view project_leads for own projects" ON project_leads;
  CREATE POLICY "Users can view project_leads for own projects"
    ON project_leads FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_leads.project_id
        AND projects.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Users can insert project_leads for own projects" ON project_leads;
  CREATE POLICY "Users can insert project_leads for own projects"
    ON project_leads FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_leads.project_id
        AND projects.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Users can delete project_leads for own projects" ON project_leads;
  CREATE POLICY "Users can delete project_leads for own projects"
    ON project_leads FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_leads.project_id
        AND projects.user_id = auth.uid()
      )
    );
END $$;

-- ============================================
-- Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION update_unique_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_unique_lead_timestamp ON unique_leads;
CREATE TRIGGER trigger_update_unique_lead_timestamp
  BEFORE UPDATE ON unique_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_unique_lead_timestamp();

CREATE OR REPLACE FUNCTION increment_times_found()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE unique_leads
  SET times_found = times_found + 1
  WHERE id = NEW.unique_lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_times_found ON project_leads;
CREATE TRIGGER trigger_increment_times_found
  AFTER INSERT ON project_leads
  FOR EACH ROW
  EXECUTE FUNCTION increment_times_found();

-- ============================================
-- View: project_leads_detailed
-- ============================================
CREATE OR REPLACE VIEW project_leads_detailed AS
SELECT 
  pl.id as project_lead_id,
  pl.project_id,
  p.name as project_name,
  pl.unique_lead_id,
  ul.business_name,
  ul.first_name,
  ul.last_name,
  ul.email,
  ul.phone,
  ul.address,
  ul.city,
  ul.state,
  ul.website,
  ul.google_url,
  ul.rating,
  ul.review_count,
  ul.times_found,
  ul.first_seen_at,
  ul.last_updated_at,
  pl.found_at,
  pl.search_term_id
FROM project_leads pl
JOIN unique_leads ul ON ul.id = pl.unique_lead_id
JOIN projects p ON p.id = pl.project_id;

-- Grant access to the view
DO $$
BEGIN
  GRANT SELECT ON project_leads_detailed TO authenticated;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Unique Leads System migration completed successfully!';
  RAISE NOTICE 'Tables created: unique_leads, project_leads';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'RLS policies enabled for security';
  RAISE NOTICE 'Helper functions and triggers created';
  RAISE NOTICE 'View project_leads_detailed created';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy updated code to Vercel (already pushed to GitHub)';
  RAISE NOTICE '2. Test by creating a new project and scraping';
  RAISE NOTICE '3. Check unique_leads table for results';
END $$;

