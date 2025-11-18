// Database types for Lead Scraper feature

export interface Project {
  id: string
  name: string
  user_id: string
  status: 'draft' | 'scraping' | 'completed' | 'failed'
  total_leads: number
  duplicates_removed: number
  temp_leads_count: number
  leads_processed: boolean
  created_at: string
  updated_at: string
}

export interface SearchTerm {
  id: string
  project_id: string
  term: string
  status: 'pending' | 'scraping' | 'completed' | 'failed'
  leads_count: number
  progress_message: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  project_id: string
  search_term_id: string | null
  business_name: string
  google_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  address: string | null
  rating: number | null
  review_count: number | null
  unique_lead_id: string | null
  created_at: string
}

// New: Unique Leads System
export interface UniqueLead {
  id: string
  business_name: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  website: string | null
  google_url: string | null
  rating: number | null
  review_count: number | null
  first_seen_at: string
  last_updated_at: string
  times_found: number
  created_at: string
}

export interface TempScrapedLead {
  id: string
  project_id: string
  search_term_id: string
  business_name: string
  google_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  address: string | null
  rating: number | null
  review_count: number | null
  scraped_at: string
  processed: boolean
  created_at: string
}

export interface ProjectLead {
  id: string
  project_id: string
  unique_lead_id: string
  search_term_id: string | null
  found_at: string
}

export interface ProjectLeadDetailed extends ProjectLead {
  business_name: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  website: string | null
  google_url: string | null
  rating: number | null
  review_count: number | null
  times_found: number
  first_seen_at: string
  last_updated_at: string
}

export interface ProjectWithSearchTerms extends Project {
  search_terms: SearchTerm[]
}

export interface ProjectStatus {
  project_id: string
  status: Project['status']
  total_leads: number
  duplicates_removed: number
  search_terms: SearchTerm[]
  current_message?: string
}

