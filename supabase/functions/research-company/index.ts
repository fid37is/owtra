// supabase/functions/research-company/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const scraperUrl = Deno.env.get('SCRAPER_URL') || 'https://owtra-scraper.vercel.app'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { companyName, website, applicationId, saveToDb = true } = await req.json()

    if (!companyName && !website) {
      return new Response(
        JSON.stringify({ error: 'Provide at least a company name or website URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Edge Function] Researching company: ${companyName} | saveToDb: ${saveToDb}`)

    // Derive slug from name if available, otherwise from website hostname
    const slugSource = companyName || (website ? new URL(website).hostname.replace(/^www\./, '') : 'unknown')
    const slug = slugSource
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Check cache — only relevant when saving to DB
    if (saveToDb) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (existingCompany?.last_researched_at) {
        const lastResearched = new Date(existingCompany.last_researched_at)
        const daysSince = (Date.now() - lastResearched.getTime()) / (1000 * 60 * 60 * 24)

        if (daysSince < 30) {
          console.log(`[Edge Function] Using cached data for: ${companyName}`)

          if (applicationId && existingCompany.id) {
            await supabase
              .from('applications')
              .update({ company_id: existingCompany.id })
              .eq('id', applicationId)
          }

          return new Response(
            JSON.stringify({ success: true, source: 'cache', company: existingCompany }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Build scraper URL — pass website if provided so scraper skips unreliable discovery
    const scraperParams = new URLSearchParams()
    if (companyName) scraperParams.set('company', companyName)
    if (website) scraperParams.set('website', website)
    const scraperEndpoint = `${scraperUrl}/api/research?${scraperParams.toString()}`
    console.log(`[Edge Function] Calling scraper: ${scraperEndpoint}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('[Edge Function] Scraper timeout after 25s — aborting')
      controller.abort()
    }, 25000)

    let scraperData: any

    try {
      const scraperResponse = await fetch(scraperEndpoint, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Owtra/1.0)' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!scraperResponse.ok) {
        const errorText = await scraperResponse.text()
        console.error('[Edge Function] Scraper HTTP error:', scraperResponse.status, errorText)
        return new Response(
          JSON.stringify({ success: false, error: `Scraper error: ${scraperResponse.status}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      scraperData = await scraperResponse.json()
    } catch (fetchErr: any) {
      clearTimeout(timeoutId)
      if (fetchErr.name === 'AbortError') {
        console.error('[Edge Function] Scraper timed out')
        return new Response(
          JSON.stringify({ success: false, error: 'Scraper timed out after 25s' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw fetchErr
    }

    if (!scraperData?.success || !scraperData?.data) {
      console.error('[Edge Function] Scraper returned no usable data:', JSON.stringify(scraperData))
      return new Response(
        JSON.stringify({ success: false, error: 'Scraper returned no data' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const scrapedData = scraperData.data

    const companyData = {
      name: scrapedData.companyName || companyName,
      slug,
      website: scrapedData.website || website || null,
      description: scrapedData.description || 'No description available',
      industry: scrapedData.industry || 'Unknown',
      company_size: scrapedData.companySize || scrapedData.company_size || 'Unknown',
      headquarters: scrapedData.headquarters || 'Unknown',
      founded_year: scrapedData.foundedYear || scrapedData.founded_year || null,
      culture_summary: scrapedData.cultureSummary || scrapedData.culture_summary || 'Information not available',
      pros: scrapedData.pros || [],
      cons: scrapedData.cons || [],
      overall_rating: scrapedData.overallRating || scrapedData.overall_rating || 3.0,
      linkedin_url: scrapedData.linkedinUrl || scrapedData.linkedin_url || null,
      glassdoor_url: scrapedData.glassdoorUrl || scrapedData.glassdoor_url || null,
      last_researched_at: new Date().toISOString(),
    }

    // ── saveToDb: false ── return data in memory only, no DB write
    if (!saveToDb) {
      console.log(`[Edge Function] Returning research without saving: ${companyData.name}`)
      return new Response(
        JSON.stringify({ success: true, source: 'scraped', company: companyData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── saveToDb: true ── persist to DB (add-application flow)
    console.log('[Edge Function] Saving company:', companyData.name)

    const { data: company, error: upsertError } = await supabase
      .from('companies')
      .upsert(companyData, { onConflict: 'slug' })
      .select()
      .single()

    if (upsertError) {
      throw new Error(`Failed to save company: ${upsertError.message}`)
    }

    console.log(`[Edge Function] Saved company: ${company.name}`)

    if (applicationId && company.id) {
      const { error: linkError } = await supabase
        .from('applications')
        .update({ company_id: company.id })
        .eq('id', applicationId)

      if (linkError) {
        console.error('[Edge Function] Failed to link company to application:', linkError.message)
      } else {
        console.log(`[Edge Function] Linked company ${company.id} to application ${applicationId}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, source: 'scraped', company }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Edge Function] Fatal error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})