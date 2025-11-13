import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AllLeadsTable from '@/components/all-leads-table'

export default async function AllLeadsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch all unique leads for this user with source information
  const { data: leads, error } = await supabase
    .from('unique_leads')
    .select(`
      *,
      project_leads!inner (
        project_id,
        found_at,
        projects!inner (
          name,
          user_id
        )
      )
    `)
    .eq('project_leads.projects.user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  }

  // Process leads to add source information
  const processedLeads = leads?.map(lead => {
    // Get the first project this lead was found in (earliest found_at)
    const sortedProjectLeads = lead.project_leads.sort((a: any, b: any) => 
      new Date(a.found_at).getTime() - new Date(b.found_at).getTime()
    )
    const firstSource = sortedProjectLeads[0]

    return {
      ...lead,
      source_project: firstSource?.projects?.name || 'Unknown',
      first_found_date: firstSource?.found_at || lead.created_at,
      total_projects: lead.project_leads.length,
    }
  }) || []

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
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Lead Scraper
                </a>
                <a 
                  href="/dashboard/leads" 
                  className="text-slate-900 font-medium border-b-2 border-slate-900"
                >
                  All Leads
                </a>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">All Unique Leads</h2>
            <p className="mt-2 text-slate-600">
              View and manage all unique business leads across all your projects
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="text-sm text-slate-600">
                Total Leads: <span className="font-semibold text-slate-900">{processedLeads.length}</span>
              </div>
            </div>
            
            <AllLeadsTable leads={processedLeads} />
          </div>
        </div>
      </main>
    </div>
  )
}

