-- Lead Scraper Feature Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- Table: projects
-- Stores Lead Scraper projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scraping', 'completed', 'failed')),
  total_leads INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- ============================================
-- Table: search_terms
-- Stores search terms for each project
-- ============================================
CREATE TABLE IF NOT EXISTS search_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scraping', 'completed', 'failed')),
  leads_count INTEGER DEFAULT 0,
  progress_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_search_terms_project_id ON search_terms(project_id);

-- ============================================
-- Table: leads
-- Stores scraped business leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  search_term_id UUID REFERENCES search_terms(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  google_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries and duplicate detection
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_business_name ON leads(business_name);
CREATE INDEX IF NOT EXISTS idx_leads_address ON leads(address);
CREATE INDEX IF NOT EXISTS idx_leads_duplicate_check ON leads(project_id, business_name, address);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Search Terms: Users can access search terms for their projects
CREATE POLICY "Users can view search terms for own projects"
  ON search_terms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = search_terms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert search terms for own projects"
  ON search_terms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = search_terms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update search terms for own projects"
  ON search_terms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = search_terms.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete search terms for own projects"
  ON search_terms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = search_terms.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Leads: Users can access leads for their projects
CREATE POLICY "Users can view leads for own projects"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert leads for own projects"
  ON leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update leads for own projects"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete leads for own projects"
  ON leads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = leads.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- Functions for automatic timestamp updates
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_search_terms_updated_at
  BEFORE UPDATE ON search_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

