import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProjectDetails from '@/components/project-details'
import { Project, SearchTerm, Lead } from '@/types/database'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    redirect('/dashboard/projects')
  }

  // Fetch search terms
  const { data: searchTerms } = await supabase
    .from('search_terms')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  // Fetch leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Parker and Co Staging
              </h1>
              <nav className="flex gap-6">
                <a 
                  href="/dashboard" 
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Dashboard
                </a>
                <a 
                  href="/dashboard/projects" 
                  className="text-slate-900 font-medium border-b-2 border-slate-900"
                >
                  Lead Scraper
                </a>
                <a 
                  href="/dashboard/leads" 
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  All Leads
                </a>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProjectDetails
          project={project as Project}
          initialSearchTerms={(searchTerms as SearchTerm[]) || []}
          initialLeads={(leads as Lead[]) || []}
        />
      </main>
    </div>
  )
}

