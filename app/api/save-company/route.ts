// app/api/save-company/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { company } = await request.json()

    if (!company?.name || !company?.slug) {
      return NextResponse.json({ error: 'Invalid company data' }, { status: 400 })
    }

    const companyData = {
      name: company.name,
      slug: company.slug,
      website: company.website || null,
      description: company.description || null,
      industry: company.industry || null,
      company_size: company.company_size || null,
      headquarters: company.headquarters || null,
      founded_year: company.founded_year || null,
      culture_summary: company.culture_summary || null,
      pros: company.pros || [],
      cons: company.cons || [],
      overall_rating: company.overall_rating || null,
      linkedin_url: company.linkedin_url || null,
      glassdoor_url: company.glassdoor_url || null,
      last_researched_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('companies')
      .upsert(companyData, { onConflict: 'slug' })
      .select()
      .single()

    if (error) {
      console.error('Save company error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, company: data })
  } catch (error: any) {
    console.error('Save company route error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save company' }, { status: 500 })
  }
}