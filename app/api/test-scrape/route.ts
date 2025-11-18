import { NextResponse } from 'next/server'
import { searchPlaces } from '@/lib/google-places'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Quick test endpoint to debug scraping
 * Visit: /api/test-scrape
 */
export async function GET() {
  const startTime = Date.now()
  const log: string[] = []
  
  try {
    log.push(`[${Date.now() - startTime}ms] Starting test`)
    
    // Test 1: Google Places API
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!
    log.push(`[${Date.now() - startTime}ms] Calling Google Places API...`)
    
    const places = await searchPlaces('Salt Lake City realtors', apiKey)
    log.push(`[${Date.now() - startTime}ms] Google API returned ${places.length} results`)
    
    // Test 2: Supabase connection
    log.push(`[${Date.now() - startTime}ms] Creating admin client...`)
    const supabase = createAdminClient()
    log.push(`[${Date.now() - startTime}ms] Admin client created`)
    
    // Test 3: Check if temp table exists
    log.push(`[${Date.now() - startTime}ms] Checking temp table...`)
    const { data: tempCheck, error: tempError } = await supabase
      .from('temp_scraped_leads')
      .select('count')
      .limit(1)
    
    if (tempError) {
      log.push(`[${Date.now() - startTime}ms] Temp table error: ${tempError.message}`)
    } else {
      log.push(`[${Date.now() - startTime}ms] Temp table exists!`)
    }
    
    const totalTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      totalTime: `${totalTime}ms`,
      placesFound: places.length,
      log,
      samplePlace: places[0] || null
    })
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    log.push(`[${totalTime}ms] ERROR: ${error instanceof Error ? error.message : 'Unknown'}`)
    
    return NextResponse.json({
      success: false,
      totalTime: `${totalTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      log
    }, { status: 500 })
  }
}

