import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { findOrCreateUniqueLead, isLeadInProject } from '@/lib/google-places'

/**
 * Process temp scraped leads and add them to the main leads tables
 * This does the slow duplicate checking and database insertions
 * Runs as a background job after scraping completes
 */
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

    // Check if already processed
    if (project.leads_processed) {
      return NextResponse.json({ error: 'Leads already processed for this project' }, { status: 400 })
    }

    // Start processing in background (don't await)
    processLeadsInBackground(projectId).catch(console.error)

    return NextResponse.json({
      message: 'Processing started',
      projectId,
    })
  } catch (error) {
    console.error('Error starting lead processing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processLeadsInBackground(projectId: string) {
  const supabase = createAdminClient()
  
  console.log(`[ProcessLeads] Starting background processing for project ${projectId}`)

  let totalLeads = 0
  let duplicatesRemoved = 0

  try {
    // Get all temp leads for this project
    const { data: tempLeads, error: fetchError } = await supabase
      .from('temp_scraped_leads')
      .select('*')
      .eq('project_id', projectId)
      .eq('processed', false)

    if (fetchError) {
      console.error('[ProcessLeads] Error fetching temp leads:', fetchError)
      throw fetchError
    }

    if (!tempLeads || tempLeads.length === 0) {
      console.log('[ProcessLeads] No temp leads to process')
      return
    }

    console.log(`[ProcessLeads] Processing ${tempLeads.length} temp leads`)

    // Process each temp lead
    for (const tempLead of tempLeads) {
      try {
        // Find or create unique lead
        const uniqueLeadId = await findOrCreateUniqueLead(supabase, {
          business_name: tempLead.business_name,
          google_url: tempLead.google_url,
          website: tempLead.website,
          phone: tempLead.phone,
          email: tempLead.email,
          address: tempLead.address,
          rating: tempLead.rating,
          review_count: tempLead.review_count,
        })

        if (!uniqueLeadId) {
          console.error('[ProcessLeads] Failed to create/find unique lead for:', tempLead.business_name)
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
          // Mark as processed
          await supabase
            .from('temp_scraped_leads')
            .update({ processed: true })
            .eq('id', tempLead.id)
          continue
        }

        // Link unique lead to this project
        const { error: projectLeadError } = await supabase
          .from('project_leads')
          .insert({
            project_id: projectId,
            unique_lead_id: uniqueLeadId,
            search_term_id: tempLead.search_term_id,
          })

        if (projectLeadError) {
          console.error('[ProcessLeads] Error linking lead to project:', projectLeadError)
          continue
        }

        // Also insert into leads table for backwards compatibility
        const { error: insertError } = await supabase.from('leads').insert({
          project_id: projectId,
          search_term_id: tempLead.search_term_id,
          business_name: tempLead.business_name,
          google_url: tempLead.google_url,
          website: tempLead.website,
          phone: tempLead.phone,
          email: tempLead.email,
          address: tempLead.address,
          rating: tempLead.rating,
          review_count: tempLead.review_count,
          unique_lead_id: uniqueLeadId,
        })

        if (!insertError) {
          totalLeads++
        }

        // Mark temp lead as processed
        await supabase
          .from('temp_scraped_leads')
          .update({ processed: true })
          .eq('id', tempLead.id)

      } catch (error) {
        console.error('[ProcessLeads] Error processing temp lead:', error)
        // Continue with next lead
      }
    }

    console.log(`[ProcessLeads] Completed: ${totalLeads} leads added, ${duplicatesRemoved} duplicates removed`)

    // Update project
    await supabase
      .from('projects')
      .update({
        total_leads: totalLeads,
        duplicates_removed: duplicatesRemoved,
        leads_processed: true,
      })
      .eq('id', projectId)

    console.log(`[ProcessLeads] Successfully processed project ${projectId}`)
  } catch (error) {
    console.error('[ProcessLeads] Error in processing:', error)
    // Project remains with leads_processed = false so user can retry
  }
}

