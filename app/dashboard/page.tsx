import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LogoutButton from '@/components/logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Get project count
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

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
                  className="text-slate-900 font-medium border-b-2 border-slate-900"
                >
                  Dashboard
                </a>
                <a 
                  href="/dashboard/projects" 
                  className="text-slate-600 hover:text-slate-900 font-medium"
                >
                  Lead Scraper
                </a>
              </nav>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome back!</h2>
            <p className="mt-2 text-slate-600">
              You&apos;re logged in as <span className="font-medium">{user.email}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/projects">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔍 Lead Scraper
                  </CardTitle>
                  <CardDescription>
                    Generate business leads from Google searches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">
                      {projectCount || 0} {projectCount === 1 ? 'project' : 'projects'}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      View Projects →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card>
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
                <CardDescription>
                  View and manage your marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Coming soon...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Track your campaign performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  Coming soon...
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900">🎉 New Feature: Lead Scraper</CardTitle>
              <CardDescription className="text-green-700">
                Start generating business leads from Google searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800">
                Create projects with multiple search terms, and automatically collect business information 
                including contact details, ratings, and reviews from Google business listings.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

