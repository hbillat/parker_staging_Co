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
  const maxPages = 10

  try {
    // Fetch up to 10 pages of results
    while (pagesScraped < maxPages) {
      const response = await client.textSearch({
        params: {
          query: searchQuery,
          key: apiKey,
          ...(nextPageToken && { pagetoken: nextPageToken }),
        },
      })

      if (response.data.results && response.data.results.length > 0) {
        // Process each place
        for (const place of response.data.results) {
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
        }

        pagesScraped++

        // Check if there's a next page
        nextPageToken = response.data.next_page_token

        if (!nextPageToken) {
          break // No more pages
        }

        // Google requires a short delay before using next_page_token
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else {
        break // No results
      }
    }

    return results
  } catch (error) {
    console.error('Error searching places:', error)
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

