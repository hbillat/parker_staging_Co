import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findEmail } from '@/lib/email-finder'

/**
 * Cron Job: Find emails for leads
 * 
 * This endpoint can be called by Vercel Cron Jobs or external schedulers
 * Configure in vercel.json to run every hour
 * 
 * Authentication: Uses a secret token to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Check cron secret (set this in your .env.local and Vercel env vars)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[CRON] Starting email finder job...')
    
    // Create a Supabase client with service role for cron jobs
    // This bypasses RLS since we're running as a background job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      console.error('[CRON] SUPABASE_SERVICE_ROLE_KEY not set')
      return NextResponse.json(
        { error: 'Service key not configured' },
        { status: 500 }
      )
    }
    
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey)
    
    // Get Hunter.io API key from environment (optional)
    const hunterApiKey = process.env.HUNTER_IO_API_KEY
    
    // Fetch unique leads without emails that have websites
    const { data: leads, error: fetchError } = await supabase
      .from('unique_leads')
      .select('id, business_name, website, email')
      .is('email', null)
      .not('website', 'is', null)
      .limit(20) // Process 20 per hour
    
    if (fetchError) {
      console.error('[CRON] Error fetching leads:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }
    
    if (!leads || leads.length === 0) {
      console.log('[CRON] No leads to process')
      return NextResponse.json({
        success: true,
        message: 'No leads without emails found',
        processed: 0,
        found: 0,
      })
    }
    
    console.log(`[CRON] Processing ${leads.length} leads...`)
    
    let processed = 0
    let found = 0
    
    // Process each lead
    for (const lead of leads) {
      try {
        const emailResult = await findEmail(
          lead.website,
          lead.business_name,
          hunterApiKey
        )
        
        processed++
        
        if (emailResult && emailResult.email) {
          // Update the lead with found email
          const { error: updateError } = await supabase
            .from('unique_leads')
            .update({
              email: emailResult.email,
              last_updated_at: new Date().toISOString(),
            })
            .eq('id', lead.id)
          
          if (!updateError) {
            found++
            console.log(`[CRON] ✓ Found email for ${lead.business_name}: ${emailResult.email}`)
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`[CRON] Error processing lead ${lead.business_name}:`, error)
      }
    }
    
    console.log(`[CRON] Complete: processed ${processed}, found ${found}`)
    
    return NextResponse.json({
      success: true,
      processed,
      found,
      message: `Processed ${processed} leads, found ${found} emails`,
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('[CRON] Error in cron job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

