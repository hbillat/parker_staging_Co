// Database types for Lead Scraper feature

export interface Project {
  id: string
  name: string
  user_id: string
  status: 'draft' | 'scraping' | 'completed' | 'failed'
  total_leads: number
  duplicates_removed: number
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
  created_at: string
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

