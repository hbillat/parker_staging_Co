import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get project status
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get search terms with their status
    const { data: searchTerms, error: searchTermsError } = await supabase
      .from('search_terms')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (searchTermsError) {
      return NextResponse.json(
        { error: 'Failed to fetch search terms' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      project_id: project.id,
      status: project.status,
      total_leads: project.total_leads,
      duplicates_removed: project.duplicates_removed,
      search_terms: searchTerms || [],
    })
  } catch (error) {
    console.error('Error fetching project status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

