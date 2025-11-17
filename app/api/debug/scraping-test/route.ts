import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { searchPlaces } from '@/lib/google-places'

/**
 * Debug endpoint to test if scraping components work
 * Visit: /api/debug/scraping-test
 */
export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: []
  }

  try {
    // Check 1: Environment variables
    results.checks.env = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
    }

    // Check 2: Can we create admin client?
    try {
      const supabase = createAdminClient()
      results.checks.adminClient = 'OK'
      
      // Check 3: Can we query database?
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .limit(5)
      
      if (error) {
        results.checks.database = `ERROR: ${error.message}`
        results.errors.push(`Database query failed: ${error.message}`)
      } else {
        results.checks.database = 'OK'
        results.checks.projectsFound = data?.length || 0
      }
    } catch (error) {
      results.checks.adminClient = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
      results.errors.push(`Admin client creation failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Check 4: Can we call Google Places API?
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!
      const places = await searchPlaces('test coffee shop', apiKey)
      results.checks.googlePlaces = 'OK'
      results.checks.placesFound = places.length
    } catch (error) {
      results.checks.googlePlaces = `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
      results.errors.push(`Google Places API failed: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // Overall status
    results.status = results.errors.length === 0 ? 'ALL_OK' : 'HAS_ERRORS'

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'CRITICAL_ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

