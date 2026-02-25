// app/dashboard/companies/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, Users, TrendingUp, ExternalLink, Briefcase, Grid, List, Search, SlidersHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
  slug: string
  website: string | null
  description: string | null
  industry: string | null
  company_size: string | null
  headquarters: string | null
  overall_rating: number | null
  pros: any
  cons: any
  applicationsCount: number
}

export default function CompaniesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'applications'>('name')

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [companies, searchQuery, industryFilter, sizeFilter, sortBy])

  async function fetchCompanies() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get companies that the user has applications for
      const { data: applications } = await supabase
        .from('applications')
        .select('company_id')
        .eq('user_id', user.id)
        .not('company_id', 'is', null)

      const companyIds = applications?.map(app => app.company_id).filter((id): id is string => id !== null) || []
      const uniqueCompanyIds = [...new Set(companyIds)]

      if (uniqueCompanyIds.length > 0) {
        const { data } = await supabase
          .from('companies')
          .select('*')
          .in('id', uniqueCompanyIds)

        if (data) {
          const companiesWithCounts = await Promise.all(
            data.map(async (company) => {
              const { count } = await supabase
                .from('applications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('company_id', company.id)

              return {
                ...company,
                applicationsCount: count || 0
              }
            })
          )
          setCompanies(companiesWithCounts)
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFiltersAndSort() {
    let filtered = [...companies]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.headquarters?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(company => company.industry === industryFilter)
    }

    // Size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter(company => company.company_size === sizeFilter)
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return (b.overall_rating || 0) - (a.overall_rating || 0)
        case 'applications':
          return b.applicationsCount - a.applicationsCount
        default:
          return 0
      }
    })

    setFilteredCompanies(filtered)
  }

  // Get unique industries and sizes for filters
  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)))
  const sizes = Array.from(new Set(companies.map(c => c.company_size).filter(Boolean)))

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading companies...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-2">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Companies</h1>
          <p className="text-muted-foreground">
            Companies you've applied to or researched
          </p>
        </div>
        <Link href="/dashboard/companies/research">
          <Button className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Research a Company
          </Button>
        </Link>
      </div>

      {companies.length > 0 ? (
        <>
          {/* Filters and Controls */}
          <div className="bg-card rounded-2xl shadow-sm p-4 border border-border mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-input"
                  />
                </div>
              </div>

              {/* Industry Filter */}
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full lg:w-[180px] border-input">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry!}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Size Filter */}
              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-full lg:w-[180px] border-input">
                  <SelectValue placeholder="Company Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {sizes.map(size => (
                    <SelectItem key={size} value={size!}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full lg:w-[180px] border-input">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="rating">Rating (High-Low)</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="border-input"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="border-input"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredCompanies.length} of {companies.length} companies
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => {
                const prosArray = Array.isArray(company.pros) ? company.pros as string[] : []
                const consArray = Array.isArray(company.cons) ? company.cons as string[] : []

                return (
                  <Link
                    key={company.id}
                    href={`/dashboard/companies/${company.slug}`}
                    className="group bg-card rounded-2xl shadow-sm p-6 border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    {/* Company Logo */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>

                    {/* Company Name */}
                    <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {company.name}
                    </h2>

                    {/* Company Info */}
                    <div className="space-y-2 mb-4">
                      {company.industry && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          <span>{company.industry}</span>
                        </div>
                      )}
                      {company.company_size && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{company.company_size}</span>
                        </div>
                      )}
                      {company.headquarters && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{company.headquarters}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    {company.overall_rating !== null && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= Math.round(company.overall_rating!)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                                }`}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground font-medium">
                          {company.overall_rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Description Preview */}
                    {company.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {company.description}
                      </p>
                    )}

                    {/* Pros/Cons Summary */}
                    {(prosArray.length > 0 || consArray.length > 0) && (
                      <div className="flex gap-3 mb-4 text-xs">
                        {prosArray.length > 0 && (
                          <span className="text-green-600 font-medium">
                            +{prosArray.length} pros
                          </span>
                        )}
                        {consArray.length > 0 && (
                          <span className="text-red-600 font-medium">
                            {consArray.length} cons
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        <span>{company.applicationsCount} {company.applicationsCount === 1 ? 'application' : 'applications'}</span>
                      </div>

                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredCompanies.map((company) => {
                const prosArray = Array.isArray(company.pros) ? company.pros as string[] : []
                const consArray = Array.isArray(company.cons) ? company.cons as string[] : []

                return (
                  <Link
                    key={company.id}
                    href={`/dashboard/companies/${company.slug}`}
                    className="group bg-card rounded-2xl shadow-sm p-6 border border-border hover:border-primary hover:shadow-md transition-all block"
                  >
                    <div className="flex items-start gap-6">
                      {/* Company Logo */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h2 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                              {company.name}
                            </h2>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              {company.industry && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>{company.industry}</span>
                                </div>
                              )}
                              {company.company_size && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{company.company_size}</span>
                                </div>
                              )}
                              {company.headquarters && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{company.headquarters}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rating */}
                          {company.overall_rating !== null && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${star <= Math.round(company.overall_rating!)
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-300'
                                      }`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground font-medium">
                                {company.overall_rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {company.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {company.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-4 h-4" />
                              <span>{company.applicationsCount} {company.applicationsCount === 1 ? 'application' : 'applications'}</span>
                            </div>

                            {/* Pros/Cons Summary */}
                            {(prosArray.length > 0 || consArray.length > 0) && (
                              <div className="flex gap-3 text-xs">
                                {prosArray.length > 0 && (
                                  <span className="text-green-600 font-medium">
                                    +{prosArray.length} pros
                                  </span>
                                )}
                                {consArray.length > 0 && (
                                  <span className="text-red-600 font-medium">
                                    {consArray.length} cons
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {company.website && (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* No Results */}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Companies Found
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setIndustryFilter('all')
                  setSizeFilter('all')
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No Companies Yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Companies will automatically appear here when you add job applications
          </p>
          <a href="/dashboard/applications/new">
            <button className="bg-primary text-primary-foreground hover:opacity-90 px-6 py-3 rounded-lg font-medium transition-opacity">
              Add Your First Application
            </button>
          </a>
        </div>
      )}
    </div>
  )
}