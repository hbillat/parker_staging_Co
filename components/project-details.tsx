'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [isResetting, setIsResetting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
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

  const handleResetProject = async () => {
    if (!confirm('Reset this project? This will allow you to restart scraping.')) {
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/reset`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reset project')
      }

      // Update project status locally
      setProject((prev) => ({ ...prev, status: 'draft' }))
      
      // Update search terms to show they're pending
      setSearchTerms((prev) =>
        prev.map((term) => ({ ...term, status: 'pending' as const, progress_message: null }))
      )

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsResetting(false)
    }
  }

  const handleDeleteProject = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete project')
      }

      // Redirect to projects list
      router.push('/dashboard/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleProcessLeads = async () => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/process-leads`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start processing')
      }

      setSuccess('Processing leads in background... This may take a minute.')
      
      // Poll for completion
      const checkInterval = setInterval(async () => {
        router.refresh()
        const statusResponse = await fetch(`/api/projects/${project.id}/status`)
        if (statusResponse.ok) {
          const status = await statusResponse.json()
          if (status.project && status.project.leads_processed) {
            clearInterval(checkInterval)
            setSuccess('Leads processed successfully!')
            setIsProcessing(false)
            router.refresh()
          }
        }
      }, 3000) // Check every 3 seconds

      // Stop checking after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval)
        if (isProcessing) {
          setSuccess('Processing is taking longer than expected. Refresh the page to check status.')
          setIsProcessing(false)
        }
      }, 120000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsProcessing(false)
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
        <div className="flex gap-2">
          {project.status === 'draft' && (
            <Button
              onClick={handleStartScraping}
              disabled={isStarting}
              size="lg"
            >
              {isStarting ? 'Starting...' : 'Start Scraping'}
            </Button>
          )}
          {project.status === 'completed' && !project.leads_processed && project.temp_leads_count > 0 && (
            <Button
              onClick={handleProcessLeads}
              disabled={isProcessing}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Add as Leads'}
            </Button>
          )}
          {project.status === 'completed' && project.leads_processed && (
            <Button
              disabled
              size="lg"
              className="bg-gray-400 cursor-not-allowed"
            >
              ✓ Added as Leads
            </Button>
          )}
          {(project.status === 'scraping' || project.status === 'failed') && (
            <Button
              onClick={handleResetProject}
              disabled={isResetting}
              variant="outline"
              size="lg"
            >
              {isResetting ? 'Resetting...' : 'Reset & Retry'}
            </Button>
          )}
          <Button
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            variant="destructive"
            size="lg"
          >
            Delete Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          {success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Scraped Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {project.temp_leads_count || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Ready to process</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-600">
              Added Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {project.total_leads}
            </div>
            <p className="text-xs text-slate-500 mt-1">Unique & processed</p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;?
              <br />
              <br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The project</li>
                <li>All search terms ({searchTerms.length})</li>
                <li>All collected leads ({project.total_leads})</li>
              </ul>
              <br />
              <strong className="text-red-600">This action cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

