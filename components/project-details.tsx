'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LeadsTable from '@/components/leads-table'
import { Project, SearchTerm, Lead, ProjectStatus } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface ProjectDetailsProps {
  project: Project
  initialSearchTerms: SearchTerm[]
  initialLeads: Lead[]
}

export default function ProjectDetails({
  project: initialProject,
  initialSearchTerms,
  initialLeads,
}: ProjectDetailsProps) {
  const [project, setProject] = useState<Project>(initialProject)
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>(initialSearchTerms)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Poll for status updates every 10 seconds when scraping
  useEffect(() => {
    if (project.status === 'scraping') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/projects/${project.id}/status`)
          if (response.ok) {
            const status: ProjectStatus = await response.json()
            setProject((prev) => ({
              ...prev,
              status: status.status,
              total_leads: status.total_leads,
              duplicates_removed: status.duplicates_removed,
            }))
            setSearchTerms(status.search_terms)

            // If completed or failed, fetch leads and stop polling
            if (status.status === 'completed' || status.status === 'failed') {
              router.refresh()
            }
          }
        } catch (error) {
          console.error('Error polling status:', error)
        }
      }, 10000) // Poll every 10 seconds

      return () => clearInterval(interval)
    }
  }, [project.status, project.id, router])

  const handleStartScraping = async () => {
    setIsStarting(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/scrape`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start scraping')
      }

      // Update project status locally
      setProject((prev) => ({ ...prev, status: 'scraping' }))
      
      // Update search terms to show they're pending
      setSearchTerms((prev) =>
        prev.map((term) => ({ ...term, status: 'scraping' as const }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsStarting(false)
    }
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'scraping':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Project['status']) => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'scraping':
        return 'Scraping...'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
    }
  }

  const getSearchTermStatusColor = (status: SearchTerm['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'scraping':
        return 'bg-blue-100 text-blue-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/projects')}
            >
              ← Back
            </Button>
            <h2 className="text-3xl font-bold text-slate-900">{project.name}</h2>
            <Badge className={getStatusColor(project.status)}>
              {getStatusText(project.status)}
            </Badge>
          </div>
          <p className="mt-2 text-slate-600">
            Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
          </p>
        </div>
        {project.status === 'draft' && (
          <Button
            onClick={handleStartScraping}
            disabled={isStarting}
            size="lg"
          >
            {isStarting ? 'Starting...' : 'Start Scraping'}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {project.total_leads}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Duplicates Removed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {project.duplicates_removed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Search Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {searchTerms.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Search Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {searchTerms.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-900">{term.term}</span>
                    <Badge className={getSearchTermStatusColor(term.status)}>
                      {term.status}
                    </Badge>
                  </div>
                  {term.progress_message && (
                    <p className="mt-1 text-sm text-slate-600">{term.progress_message}</p>
                  )}
                </div>
                {term.status === 'completed' && (
                  <div className="text-sm font-medium text-slate-900">
                    {term.leads_count} leads
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      {project.status !== 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>Collected Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsTable leads={leads} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

