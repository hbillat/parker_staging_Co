import { Client } from '@googlemaps/google-maps-services-js'

const client = new Client({})

export interface PlaceResult {
  business_name: string
  google_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  address: string | null
  rating: number | null
  review_count: number | null
}

export async function searchPlaces(
  searchQuery: string,
  apiKey: string
): Promise<PlaceResult[]> {
  const results: PlaceResult[] = []
  let nextPageToken: string | undefined = undefined
  let pagesScraped = 0
  // Reduced to 1 page to stay well under Vercel's 10-second timeout limit on Hobby plan
  // This gives ~20 leads per search term, but completes reliably
  // For more leads: add multiple search terms OR upgrade to Vercel Pro ($20/month)
  const maxPages = 1

  console.log(`[Google Places] Starting search for: "${searchQuery}"`)

  try {
    // Fetch 1 page of results (~20 leads) - fast and reliable on Hobby plan
    while (pagesScraped < maxPages) {
      console.log(`[Google Places] Fetching page ${pagesScraped + 1}/${maxPages}`)
      
      const response = await client.textSearch({
        params: {
          query: searchQuery,
          key: apiKey,
          ...(nextPageToken && { pagetoken: nextPageToken }),
        },
      })

      console.log(`[Google Places] API Response Status: ${response.data.status}`)

      // Check for API errors
      if (response.data.status === 'REQUEST_DENIED') {
        console.error('[Google Places] REQUEST_DENIED - API key may be invalid or restricted')
        throw new Error(`Google Places API error: ${response.data.error_message || 'REQUEST_DENIED - Check API key configuration'}`)
      }

      if (response.data.status === 'OVER_QUERY_LIMIT') {
        console.error('[Google Places] OVER_QUERY_LIMIT - API quota exceeded')
        throw new Error('Google Places API quota exceeded. Please try again later.')
      }

      if (response.data.status === 'INVALID_REQUEST') {
        console.error('[Google Places] INVALID_REQUEST - Check search query')
        throw new Error(`Invalid search query: "${searchQuery}"`)
      }

      if (response.data.results && response.data.results.length > 0) {
        console.log(`[Google Places] Found ${response.data.results.length} results on page ${pagesScraped + 1}`)
        
        // Limit to 5 results to stay well under 8s timeout (Hobby plan hard limit)
        // Google API alone takes 5+ seconds, so we need to minimize processing
        const limitedResults = response.data.results.slice(0, 5)
        console.log(`[Google Places] Processing ${limitedResults.length} results (Hobby plan limitation)`)
        
        // Process each place
        for (const place of limitedResults) {
          try {
            // Get place details for more information
            const detailsResponse = await client.placeDetails({
              params: {
                place_id: place.place_id!,
                key: apiKey,
                fields: [
                  'name',
                  'formatted_address',
                  'formatted_phone_number',
                  'website',
                  'rating',
                  'user_ratings_total',
                  'url',
                ],
              },
            })

            const details = detailsResponse.data.result

            results.push({
              business_name: details.name || place.name || 'Unknown',
              google_url: details.url || null,
              website: details.website || null,
              phone: details.formatted_phone_number || null,
              email: null, // Google Places API doesn't provide email
              address: details.formatted_address || place.formatted_address || null,
              rating: details.rating || null,
              review_count: details.user_ratings_total || null,
            })

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (detailsError) {
            console.error(`[Google Places] Error fetching details for place ${place.place_id}:`, detailsError)
            // Continue with other places even if one fails
          }
        }

        pagesScraped++

        // Check if there's a next page
        nextPageToken = response.data.next_page_token

        if (!nextPageToken) {
          console.log(`[Google Places] No more pages available after page ${pagesScraped}`)
          break // No more pages
        }

        // Google requires a short delay before using next_page_token
        console.log('[Google Places] Waiting 2s before fetching next page...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        console.log(`[Google Places] No results found on page ${pagesScraped + 1}`)
        break // No results
      }
    }

    console.log(`[Google Places] Search completed. Total results: ${results.length}`)
    return results
  } catch (error) {
    console.error('[Google Places] Error searching places:', error)
    if (error instanceof Error) {
      throw new Error(`Google Places API error: ${error.message}`)
    }
    throw error
  }
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingLeadId?: string
}

export async function checkDuplicate(
  supabase: any,
  projectId: string,
  businessName: string,
  address: string | null
): Promise<DuplicateCheckResult> {
  try {
    const { data, error} = await supabase
      .from('leads')
      .select('id')
      .eq('project_id', projectId)
      .eq('business_name', businessName)
      .eq('address', address)
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which means no duplicate
      console.error('Error checking duplicate:', error)
      return { isDuplicate: false }
    }

    if (data) {
      return { isDuplicate: true, existingLeadId: data.id }
    }

    return { isDuplicate: false }
  } catch (error) {
    console.error('Error in duplicate check:', error)
    return { isDuplicate: false }
  }
}

// New: Find or create a unique lead
export async function findOrCreateUniqueLead(
  supabase: any,
  placeData: PlaceResult
): Promise<string | null> {
  try {
    // First, check if this unique lead already exists
    const { data: existingLead, error: searchError } = await supabase
      .from('unique_leads')
      .select('id, times_found')
      .eq('business_name', placeData.business_name)
      .eq('address', placeData.address)
      .limit(1)
      .single()

    if (existingLead) {
      // Lead already exists, return its ID
      return existingLead.id
    }

    // Lead doesn't exist, create it
    const { data: newLead, error: insertError } = await supabase
      .from('unique_leads')
      .insert({
        business_name: placeData.business_name,
        email: placeData.email,
        phone: placeData.phone,
        address: placeData.address,
        website: placeData.website,
        google_url: placeData.google_url,
        rating: placeData.rating,
        review_count: placeData.review_count,
        times_found: 1,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating unique lead:', insertError)
      return null
    }

    return newLead.id
  } catch (error) {
    console.error('Error in findOrCreateUniqueLead:', error)
    return null
  }
}

// Check if a unique lead is already linked to this project
export async function isLeadInProject(
  supabase: any,
  projectId: string,
  uniqueLeadId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('project_leads')
      .select('id')
      .eq('project_id', projectId)
      .eq('unique_lead_id', uniqueLeadId)
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking project lead:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in isLeadInProject:', error)
    return false
  }
}

