'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import CreateProjectDialog from '@/components/create-project-dialog'
import { Project } from '@/types/database'
import { formatDistanceToNow } from 'date-fns'

interface ProjectsListProps {
  initialProjects: Project[]
}

export default function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const router = useRouter()

  const handleProjectCreated = (newProject: Project) => {
    setProjects([newProject, ...projects])
    setIsCreateDialogOpen(false)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          size="lg"
        >
          + Create New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="text-6xl">🔍</div>
              <h3 className="text-xl font-semibold text-slate-900">No projects yet</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                Create your first Lead Scraper project to start collecting business leads from Google search results.
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
              >
                Create Your First Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Leads:</span>
                    <span className="font-semibold text-slate-900">{project.total_leads}</span>
                  </div>
                  {project.duplicates_removed > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Duplicates Removed:</span>
                      <span className="font-semibold text-slate-900">{project.duplicates_removed}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

