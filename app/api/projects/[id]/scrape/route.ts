import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { searchPlaces } from '@/lib/google-places'

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
  // Use admin client for background job (bypasses RLS and doesn't need user session)
  const supabase = createAdminClient()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!
  
  console.log(`[Scraper] Starting FAST scraping job for project ${projectId} - saving to temp table only`)

  let totalTempLeads = 0

  // Set a timeout to mark project as failed if it takes too long
  // With temp storage, this should be much faster (~3-4 seconds for 10 leads)
  const timeoutId = setTimeout(async () => {
    console.error(`[Scraper] Timeout reached for project ${projectId} - marking as failed`)
    try {
      await supabase
        .from('projects')
        .update({ 
          status: 'failed',
          temp_leads_count: totalTempLeads,
        })
        .eq('id', projectId)
      
      // Also mark search terms as failed
      await supabase
        .from('search_terms')
        .update({
          status: 'failed',
          progress_message: 'Timeout: Scraping took too long. Try again or contact support.',
        })
        .eq('project_id', projectId)
        .eq('status', 'scraping')
    } catch (err) {
      console.error('[Scraper] Error updating timeout status:', err)
    }
  }, 8000) // 8 seconds - leaves 2 seconds buffer before Vercel's 10s hard limit

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
        // Search Google Places (FAST - no duplicate checking!)
        console.log(`[Scraper] Starting search for term: ${searchTerm.term}`)
        const places = await searchPlaces(searchTerm.term, apiKey)

        console.log(`[Scraper] Found ${places.length} places for term: ${searchTerm.term}`)

        let termLeadsCount = 0

        // Save to temp table (FAST - just insert, no checking!)
        for (const place of places) {
          const { error: insertError } = await supabase.from('temp_scraped_leads').insert({
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
            processed: false,
          })

          if (!insertError) {
            totalTempLeads++
            termLeadsCount++
          }
        }

        console.log(`[Scraper] Saved ${termLeadsCount} leads to temp storage for term "${searchTerm.term}"`)

        // Update search term as completed
        await supabase
          .from('search_terms')
          .update({
            status: 'completed',
            leads_count: termLeadsCount,
            progress_message: `Scraped ${termLeadsCount} leads - Click "Add as Leads" to process`,
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
    clearTimeout(timeoutId) // Cancel the timeout since we completed successfully
    console.log(`[Scraper] Completed project ${projectId}: ${totalTempLeads} leads saved to temp storage`)
    
    await supabase
      .from('projects')
      .update({
        status: 'completed',
        temp_leads_count: totalTempLeads,
        leads_processed: false,
      })
      .eq('id', projectId)
  } catch (error) {
    clearTimeout(timeoutId) // Cancel the timeout since we're handling the error
    console.error('[Scraper] Error in scraping process:', error)
    
    await supabase
      .from('projects')
      .update({ 
        status: 'failed',
        temp_leads_count: totalTempLeads,
      })
      .eq('id', projectId)
  }
}

