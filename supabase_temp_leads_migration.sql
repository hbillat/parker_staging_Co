-- Migration: Add temporary leads storage table
-- This allows fast scraping without duplicate checking or database insertions
-- Run this in your Supabase SQL Editor

-- Create temp_scraped_leads table
CREATE TABLE IF NOT EXISTS temp_scraped_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  search_term_id UUID NOT NULL REFERENCES search_terms(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  google_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_temp_leads_project_id ON temp_scraped_leads(project_id);
CREATE INDEX IF NOT EXISTS idx_temp_leads_processed ON temp_scraped_leads(processed);
CREATE INDEX IF NOT EXISTS idx_temp_leads_search_term ON temp_scraped_leads(search_term_id);

-- RLS Policies
ALTER TABLE temp_scraped_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own temp leads" ON temp_scraped_leads;
DROP POLICY IF EXISTS "Users can insert own temp leads" ON temp_scraped_leads;
DROP POLICY IF EXISTS "Users can update own temp leads" ON temp_scraped_leads;
DROP POLICY IF EXISTS "Users can delete own temp leads" ON temp_scraped_leads;

-- Users can only see temp leads from their own projects
CREATE POLICY "Users can view own temp leads" ON temp_scraped_leads
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can insert temp leads for their own projects
CREATE POLICY "Users can insert own temp leads" ON temp_scraped_leads
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can update temp leads from their own projects
CREATE POLICY "Users can update own temp leads" ON temp_scraped_leads
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can delete temp leads from their own projects
CREATE POLICY "Users can delete own temp leads" ON temp_scraped_leads
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Add new fields to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS temp_leads_count INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS leads_processed BOOLEAN DEFAULT FALSE;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_temp_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS temp_scraped_leads_updated_at ON temp_scraped_leads;
CREATE TRIGGER temp_scraped_leads_updated_at
  BEFORE UPDATE ON temp_scraped_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_temp_leads_updated_at();

