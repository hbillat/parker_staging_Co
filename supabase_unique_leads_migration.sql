-- Unique Leads System Migration
-- This creates a centralized unique leads table and links it to projects
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
  times_found INTEGER DEFAULT 1, -- How many times this lead appeared across all projects
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for performance and uniqueness checking
-- ============================================

-- Composite index for duplicate detection (business name + address)
CREATE INDEX IF NOT EXISTS idx_unique_leads_business_address 
  ON unique_leads(business_name, address);

-- Index for searching by person name
CREATE INDEX IF NOT EXISTS idx_unique_leads_person_name 
  ON unique_leads(first_name, last_name) 
  WHERE first_name IS NOT NULL AND last_name IS NOT NULL;

-- Index for business name search
CREATE INDEX IF NOT EXISTS idx_unique_leads_business_name 
  ON unique_leads(business_name);

-- Index for phone number lookup
CREATE INDEX IF NOT EXISTS idx_unique_leads_phone 
  ON unique_leads(phone) 
  WHERE phone IS NOT NULL;

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_unique_leads_email 
  ON unique_leads(email) 
  WHERE email IS NOT NULL;

-- Index for sorting by times found (most popular leads)
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
  
  -- When this lead was found for this specific project
  found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries for same project + lead
  UNIQUE(project_id, unique_lead_id)
);

-- Add indexes for junction table
CREATE INDEX IF NOT EXISTS idx_project_leads_project_id 
  ON project_leads(project_id);

CREATE INDEX IF NOT EXISTS idx_project_leads_unique_lead_id 
  ON project_leads(unique_lead_id);

CREATE INDEX IF NOT EXISTS idx_project_leads_search_term_id 
  ON project_leads(search_term_id);

-- ============================================
-- Update existing leads table
-- Add reference to unique_leads
-- ============================================
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS unique_lead_id UUID REFERENCES unique_leads(id);

CREATE INDEX IF NOT EXISTS idx_leads_unique_lead_id 
  ON leads(unique_lead_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE unique_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_leads ENABLE ROW LEVEL SECURITY;

-- unique_leads: Users can view leads from their projects
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

-- unique_leads: Users can insert new unique leads
CREATE POLICY "Users can insert unique leads"
  ON unique_leads FOR INSERT
  WITH CHECK (true); -- Anyone can insert, but they can only see their own via SELECT policy

-- unique_leads: Users can update leads they have access to
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

-- project_leads: Users can view project_leads for their projects
CREATE POLICY "Users can view project_leads for own projects"
  ON project_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- project_leads: Users can insert project_leads for their projects
CREATE POLICY "Users can insert project_leads for own projects"
  ON project_leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- project_leads: Users can delete project_leads for their projects
CREATE POLICY "Users can delete project_leads for own projects"
  ON project_leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- Helper Functions
-- ============================================

-- Function to automatically update last_updated_at
CREATE OR REPLACE FUNCTION update_unique_lead_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_update_unique_lead_timestamp ON unique_leads;
CREATE TRIGGER trigger_update_unique_lead_timestamp
  BEFORE UPDATE ON unique_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_unique_lead_timestamp();

-- Function to increment times_found when lead appears in another project
CREATE OR REPLACE FUNCTION increment_times_found()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE unique_leads
  SET times_found = times_found + 1
  WHERE id = NEW.unique_lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment times_found when added to project_leads
DROP TRIGGER IF EXISTS trigger_increment_times_found ON project_leads;
CREATE TRIGGER trigger_increment_times_found
  AFTER INSERT ON project_leads
  FOR EACH ROW
  EXECUTE FUNCTION increment_times_found();

-- ============================================
-- View: project_leads_detailed
-- Convenient view to see projects with their unique leads data
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
GRANT SELECT ON project_leads_detailed TO authenticated;

-- ============================================
-- Migration: Copy existing leads to unique_leads
-- This is a one-time data migration for existing data
-- ============================================

-- Note: Run this section ONLY if you have existing leads data
-- Comment out if starting fresh

/*
DO $$
DECLARE
  lead_record RECORD;
  new_unique_lead_id UUID;
BEGIN
  FOR lead_record IN 
    SELECT DISTINCT ON (business_name, address)
      id, project_id, search_term_id, business_name, website, phone, 
      email, address, rating, review_count, google_url, created_at
    FROM leads
    ORDER BY business_name, address, created_at
  LOOP
    -- Insert into unique_leads
    INSERT INTO unique_leads (
      business_name, email, phone, address, website, google_url,
      rating, review_count, first_seen_at, created_at
    ) VALUES (
      lead_record.business_name,
      lead_record.email,
      lead_record.phone,
      lead_record.address,
      lead_record.website,
      lead_record.google_url,
      lead_record.rating,
      lead_record.review_count,
      lead_record.created_at,
      lead_record.created_at
    )
    RETURNING id INTO new_unique_lead_id;
    
    -- Link to project_leads
    INSERT INTO project_leads (
      project_id, unique_lead_id, search_term_id, found_at
    ) VALUES (
      lead_record.project_id,
      new_unique_lead_id,
      lead_record.search_term_id,
      lead_record.created_at
    );
    
    -- Update old leads table reference
    UPDATE leads 
    SET unique_lead_id = new_unique_lead_id
    WHERE id = lead_record.id;
    
  END LOOP;
END $$;
*/

-- ============================================
-- Success Message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Unique Leads System migration completed successfully!';
  RAISE NOTICE 'Tables created: unique_leads, project_leads';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'RLS policies enabled for security';
  RAISE NOTICE 'Helper functions and triggers created';
END $$;

