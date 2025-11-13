import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProjectsList from '@/components/projects-list'
import { Project } from '@/types/database'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch user's projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

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
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Lead Scraper Projects</h2>
              <p className="mt-2 text-slate-600">
                Create and manage your lead generation projects
              </p>
            </div>
          </div>

          <ProjectsList initialProjects={(projects as Project[]) || []} />
        </div>
      </main>
    </div>
  )
}

