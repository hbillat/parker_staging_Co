import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { name, searchTerms } = await request.json()

    if (!name || !searchTerms || searchTerms.length === 0) {
      return NextResponse.json(
        { error: 'Project name and at least one search term are required' },
        { status: 400 }
      )
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        user_id: user.id,
        status: 'draft',
        total_leads: 0,
        duplicates_removed: 0,
      })
      .select()
      .single()

    if (projectError) {
      console.error('Error creating project:', projectError)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // Create search terms
    const searchTermsData = searchTerms.map((term: string) => ({
      project_id: project.id,
      term,
      status: 'pending',
      leads_count: 0,
    }))

    const { error: searchTermsError } = await supabase
      .from('search_terms')
      .insert(searchTermsData)

    if (searchTermsError) {
      console.error('Error creating search terms:', searchTermsError)
      // Clean up project if search terms failed
      await supabase.from('projects').delete().eq('id', project.id)
      return NextResponse.json(
        { error: 'Failed to create search terms' },
        { status: 500 }
      )
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error in create project API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

