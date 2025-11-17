import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchPlaces, findOrCreateUniqueLead, isLeadInProject } from '@/lib/google-places'

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
        console.log(`[Scraper] Starting search for term: ${searchTerm.term}`)
        const places = await searchPlaces(searchTerm.term, apiKey)

        console.log(`[Scraper] Found ${places.length} places for term: ${searchTerm.term}`)

        let termLeadsCount = 0
        let termDuplicatesCount = 0

        // Process each place
        for (const place of places) {
          // Find or create unique lead
          const uniqueLeadId = await findOrCreateUniqueLead(supabase, place)

          if (!uniqueLeadId) {
            console.error('Failed to create/find unique lead for:', place.business_name)
            continue
          }

          // Check if this unique lead is already in this project
          const alreadyInProject = await isLeadInProject(
            supabase,
            projectId,
            uniqueLeadId
          )

          if (alreadyInProject) {
            duplicatesRemoved++
            termDuplicatesCount++
            continue
          }

          // Link unique lead to this project
          const { error: projectLeadError } = await supabase
            .from('project_leads')
            .insert({
              project_id: projectId,
              unique_lead_id: uniqueLeadId,
              search_term_id: searchTerm.id,
            })

          if (projectLeadError) {
            console.error('Error linking lead to project:', projectLeadError)
            continue
          }

          // Also insert into leads table for backwards compatibility
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
            unique_lead_id: uniqueLeadId,
          })

          if (!insertError) {
            totalLeads++
            termLeadsCount++
          }
        }

        console.log(`[Scraper] Completed term "${searchTerm.term}": ${termLeadsCount} new leads, ${termDuplicatesCount} duplicates`)

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
        console.error(`[Scraper] Error scraping search term ${searchTerm.term}:`, error)
        
        // Get detailed error message
        let errorMessage = 'Failed to scrape this search term'
        if (error instanceof Error) {
          errorMessage = error.message
          // Truncate if too long
          if (errorMessage.length > 200) {
            errorMessage = errorMessage.substring(0, 200) + '...'
          }
        }
        
        await supabase
          .from('search_terms')
          .update({
            status: 'failed',
            progress_message: `Error: ${errorMessage}`,
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

