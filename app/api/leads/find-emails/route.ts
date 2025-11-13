import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findEmail } from '@/lib/email-finder'

/**
 * API Route: Find emails for leads that don't have them
 * POST /api/leads/find-emails
 * 
 * This can be called manually or scheduled to run periodically
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get optional parameters
    const body = await request.json().catch(() => ({}))
    const limit = body.limit || 10 // Process 10 leads at a time by default
    
    // Get Hunter.io API key from environment (optional)
    const hunterApiKey = process.env.HUNTER_IO_API_KEY
    
    // Fetch unique leads without emails that have websites
    const { data: leads, error: fetchError } = await supabase
      .from('unique_leads')
      .select('id, business_name, website, email')
      .is('email', null)
      .not('website', 'is', null)
      .limit(limit)
    
    if (fetchError) {
      console.error('Error fetching leads:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }
    
    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads without emails found',
        processed: 0,
        found: 0,
      })
    }
    
    console.log(`Processing ${leads.length} leads for email finding...`)
    
    let processed = 0
    let found = 0
    const results = []
    
    // Process each lead
    for (const lead of leads) {
      try {
        console.log(`Finding email for: ${lead.business_name}`)
        
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
            results.push({
              business_name: lead.business_name,
              email: emailResult.email,
              confidence: emailResult.confidence,
              source: emailResult.source,
            })
            console.log(`✓ Found email for ${lead.business_name}: ${emailResult.email}`)
          }
        } else {
          console.log(`✗ No email found for ${lead.business_name}`)
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`Error processing lead ${lead.business_name}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      processed,
      found,
      results,
      message: `Processed ${processed} leads, found ${found} emails`,
    })
    
  } catch (error) {
    console.error('Error in find-emails route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leads/find-emails
 * Returns stats about email finding
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get counts
    const { count: totalLeads } = await supabase
      .from('unique_leads')
      .select('*', { count: 'exact', head: true })
    
    const { count: leadsWithEmail } = await supabase
      .from('unique_leads')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)
    
    const { count: leadsWithWebsite } = await supabase
      .from('unique_leads')
      .select('*', { count: 'exact', head: true })
      .not('website', 'is', null)
    
    const { count: leadsWithoutEmail } = await supabase
      .from('unique_leads')
      .select('*', { count: 'exact', head: true })
      .is('email', null)
      .not('website', 'is', null)
    
    return NextResponse.json({
      total_leads: totalLeads || 0,
      leads_with_email: leadsWithEmail || 0,
      leads_with_website: leadsWithWebsite || 0,
      leads_without_email: leadsWithoutEmail || 0,
      ready_to_process: leadsWithoutEmail || 0,
    })
    
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

