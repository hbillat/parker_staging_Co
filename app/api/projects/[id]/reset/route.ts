import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Reset a stuck project back to draft status
 * This is useful when a project gets stuck in "scraping" mode
 */
export async function POST(
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

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Reset project to draft status
    const { error: updateError } = await supabase
      .from('projects')
      .update({ status: 'draft' })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error resetting project:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset project' },
        { status: 500 }
      )
    }

    // Reset all search terms to pending
    await supabase
      .from('search_terms')
      .update({ 
        status: 'pending',
        progress_message: null,
      })
      .eq('project_id', projectId)

    return NextResponse.json({ 
      message: 'Project reset successfully',
      project: { ...project, status: 'draft' }
    })
  } catch (error) {
    console.error('Error resetting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

