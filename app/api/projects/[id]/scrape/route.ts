import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchPlaces, checkDuplicate } from '@/lib/google-places'

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

    // Update project status to scraping
    await supabase
      .from('projects')
      .update({ status: 'scraping' })
      .eq('id', projectId)

    // Get search terms
    const { data: searchTerms, error: searchTermsError } = await supabase
      .from('search_terms')
      .select('*')
      .eq('project_id', projectId)

    if (searchTermsError || !searchTerms || searchTerms.length === 0) {
      return NextResponse.json(
        { error: 'No search terms found' },
        { status: 400 }
      )
    }

    // Start scraping in background (don't await)
    performScraping(projectId, searchTerms, user.id).catch(console.error)

    return NextResponse.json({
      message: 'Scraping started',
      projectId,
    })
  } catch (error) {
    console.error('Error starting scrape:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function performScraping(
  projectId: string,
  searchTerms: any[],
  userId: string
) {
  const supabase = await createClient()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!

  let totalLeads = 0
  let duplicatesRemoved = 0

  try {
    for (const searchTerm of searchTerms) {
      // Update search term status
      await supabase
        .from('search_terms')
        .update({
          status: 'scraping',
          progress_message: `Searching for: ${searchTerm.term}`,
        })
        .eq('id', searchTerm.id)

      try {
        // Search Google Places
        const places = await searchPlaces(searchTerm.term, apiKey)

        let termLeadsCount = 0
        let termDuplicatesCount = 0

        // Process each place
        for (const place of places) {
          // Check for duplicate
          const duplicateCheck = await checkDuplicate(
            supabase,
            projectId,
            place.business_name,
            place.address
          )

          if (duplicateCheck.isDuplicate) {
            duplicatesRemoved++
            termDuplicatesCount++
            continue
          }

          // Insert lead
          const { error: insertError } = await supabase.from('leads').insert({
            project_id: projectId,
            search_term_id: searchTerm.id,
            business_name: place.business_name,
            google_url: place.google_url,
            website: place.website,
            phone: place.phone,
            email: place.email,
            address: place.address,
            rating: place.rating,
            review_count: place.review_count,
          })

          if (!insertError) {
            totalLeads++
            termLeadsCount++
          }
        }

        // Update search term as completed
        await supabase
          .from('search_terms')
          .update({
            status: 'completed',
            leads_count: termLeadsCount,
            progress_message: `Found ${termLeadsCount} leads (${termDuplicatesCount} duplicates removed)`,
          })
          .eq('id', searchTerm.id)
      } catch (error) {
        console.error(`Error scraping search term ${searchTerm.term}:`, error)
        await supabase
          .from('search_terms')
          .update({
            status: 'failed',
            progress_message: 'Failed to scrape this search term',
          })
          .eq('id', searchTerm.id)
      }
    }

    // Update project as completed
    await supabase
      .from('projects')
      .update({
        status: 'completed',
        total_leads: totalLeads,
        duplicates_removed: duplicatesRemoved,
      })
      .eq('id', projectId)
  } catch (error) {
    console.error('Error in scraping process:', error)
    await supabase
      .from('projects')
      .update({ status: 'failed' })
      .eq('id', projectId)
  }
}

