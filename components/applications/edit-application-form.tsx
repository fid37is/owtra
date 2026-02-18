'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, Building2, MapPin, Briefcase, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Application } from '@/lib/supabase/dodo-types'
import Link from 'next/link'

interface EditApplicationFormProps {
  application: Application
}

export default function EditApplicationForm({ application }: EditApplicationFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)

  const [jobUrl, setJobUrl] = useState(application.job_url)
  const [jobTitle, setJobTitle] = useState(application.job_title)
  const [companyName, setCompanyName] = useState(application.company_name)
  const [location, setLocation] = useState(application.location || '')
  const [jobDescription, setJobDescription] = useState(application.job_description || '')
  const [status, setStatus] = useState(application.status || 'not_applied')
  const [appliedDate, setAppliedDate] = useState(application.applied_date || '')
  const [notes, setNotes] = useState(application.notes || '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobTitle || !companyName) {
      toast.error('Job title and company name are required', { style: { color: '#dc2626' } })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          job_url: jobUrl,
          job_title: jobTitle,
          company_name: companyName,
          location: location || null,
          job_description: jobDescription || null,
          status: status,
          applied_date: status === 'applied' && appliedDate ? appliedDate : null,
          notes: notes || null,
        })
        .eq('id', application.id)

      if (error) throw error

      toast.success('Application updated successfully!', { style: { color: '#16a34a' } })
      
      router.push(`/dashboard/applications/${application.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update application', {
        style: { color: '#dc2626' }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6">
      <Link href={`/dashboard/applications/${application.id}`} className="block mb-4 sm:mb-6">
        <Button 
          variant="ghost" 
          className="mb-0 -ml-2 sm:-ml-3 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 sm:mr-2" />
          <span className="hidden xs:inline">Back</span>
        </Button>
      </Link>

      <div className="bg-card rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 border border-border">
        <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
          {/* Job URL */}
          <div>
            <Label htmlFor="jobUrl" className="text-foreground font-medium text-sm sm:text-base">
              Job URL
            </Label>
            <div className="relative mt-2">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <Input
                id="jobUrl"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://example.com/jobs/software-engineer"
                className="h-10 sm:h-12 pl-9 sm:pl-10 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl bg-background text-foreground text-sm"
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <Label htmlFor="jobTitle" className="text-foreground font-medium text-sm sm:text-base">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <div className="relative mt-2">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <Input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Senior Software Engineer"
                className="h-10 sm:h-12 pl-9 sm:pl-10 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl bg-background text-foreground text-sm"
                required
              />
            </div>
          </div>

          {/* Company Name */}
          <div>
            <Label htmlFor="companyName" className="text-foreground font-medium text-sm sm:text-base">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative mt-2">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corporation"
                className="h-10 sm:h-12 pl-9 sm:pl-10 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl bg-background text-foreground text-sm"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-foreground font-medium text-sm sm:text-base">
              Location
            </Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground" />
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA (Remote)"
                className="h-10 sm:h-12 pl-9 sm:pl-10 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl bg-background text-foreground text-sm"
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <Label htmlFor="jobDescription" className="text-foreground font-medium text-sm sm:text-base">
              Job Description
            </Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={5}
              className="mt-2 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl resize-none bg-background text-foreground text-sm"
            />
          </div>

          {/* Application Status */}
          <div>
            <Label className="text-foreground font-medium mb-2 sm:mb-3 block text-sm sm:text-base">
              Application Status
            </Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 sm:h-12 px-3 sm:px-4 border border-border rounded-lg sm:rounded-xl focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none bg-background text-foreground text-sm"
            >
              <option value="not_applied">Not Applied</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          {/* Applied Date */}
          {(status === 'applied' || status === 'interviewing' || status === 'offer') && (
            <div>
              <Label htmlFor="appliedDate" className="text-foreground font-medium text-sm sm:text-base">
                Application Date
              </Label>
              <Input
                id="appliedDate"
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="h-10 sm:h-12 mt-2 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl bg-background text-foreground text-sm"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-foreground font-medium text-sm sm:text-base">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes or thoughts about this opportunity..."
              rows={4}
              className="mt-2 border-border focus:border-transparent focus:ring-2 focus:ring-ring rounded-lg sm:rounded-xl resize-none bg-background text-foreground text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 border-t border-border">
            <Link href={`/dashboard/applications/${application.id}`} className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 sm:h-12 border-border rounded-lg sm:rounded-xl text-sm sm:text-base"
                disabled={loading}
              >
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Save...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}