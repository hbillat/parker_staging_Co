'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Project } from '@/types/database'

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated: (project: Project) => void
}

export default function CreateProjectDialog({ 
  open, 
  onOpenChange, 
  onProjectCreated 
}: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState('')
  const [searchTerms, setSearchTerms] = useState<string[]>([''])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAddSearchTerm = () => {
    setSearchTerms([...searchTerms, ''])
  }

  const handleRemoveSearchTerm = (index: number) => {
    if (searchTerms.length > 1) {
      setSearchTerms(searchTerms.filter((_, i) => i !== index))
    }
  }

  const handleSearchTermChange = (index: number, value: string) => {
    const newSearchTerms = [...searchTerms]
    newSearchTerms[index] = value
    setSearchTerms(newSearchTerms)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    // Validate
    if (!projectName.trim()) {
      setError('Project name is required')
      setIsCreating(false)
      return
    }

    const validSearchTerms = searchTerms.filter(term => term.trim() !== '')
    if (validSearchTerms.length === 0) {
      setError('At least one search term is required')
      setIsCreating(false)
      return
    }

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.trim(),
          searchTerms: validSearchTerms,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create project')
      }

      const { project } = await response.json()
      
      // Reset form
      setProjectName('')
      setSearchTerms([''])
      
      // Notify parent and close
      onProjectCreated(project)
      
      // Navigate to the new project
      router.push(`/dashboard/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setProjectName('')
      setSearchTerms([''])
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Lead Scraper Project</DialogTitle>
            <DialogDescription>
              Enter a project name and the Google search terms you want to scrape for business leads.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Home Staging Leads - San Francisco"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isCreating}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Search Terms</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSearchTerm}
                  disabled={isCreating}
                >
                  + Add Term
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {searchTerms.map((term, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="e.g., home staging services san francisco"
                      value={term}
                      onChange={(e) => handleSearchTermChange(index, e.target.value)}
                      disabled={isCreating}
                    />
                    {searchTerms.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveSearchTerm(index)}
                        disabled={isCreating}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600">
                Each search term will scrape the first 10 pages of Google business listings.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

