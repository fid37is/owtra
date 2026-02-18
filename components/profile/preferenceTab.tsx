'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, Upload, X, FileText, Briefcase, Award, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/lib/supabase/dodo-types'
import type { User } from '@supabase/supabase-js'

interface PreferencesTabProps {
  profile: Profile | null
  user: User
}

const VALUES = [
  { id: 'mission-driven', label: 'Mission-Driven Work', description: 'Work that makes a difference' },
  { id: 'work-life-balance', label: 'Work-Life Balance', description: 'Time for life outside work' },
  { id: 'high-compensation', label: 'High Compensation', description: 'Competitive salary and benefits' },
  { id: 'career-growth', label: 'Career Growth', description: 'Clear advancement opportunities' },
  { id: 'innovation', label: 'Innovation', description: 'Cutting-edge technology and ideas' },
  { id: 'dei-commitment', label: 'DEI Commitment', description: 'Diversity, equity, and inclusion' },
  { id: 'remote-work', label: 'Remote Work', description: 'Location flexibility' },
  { id: 'team-culture', label: 'Team Culture', description: 'Collaborative and supportive team' },
  { id: 'learning-opportunities', label: 'Learning & Development', description: 'Continuous learning culture' },
  { id: 'impact', label: 'Direct Impact', description: 'See results of your work quickly' },
  { id: 'job-security', label: 'Job Security', description: 'Stable and established company' },
  { id: 'autonomy', label: 'Autonomy', description: 'Freedom to work your way' },
]

const DEAL_BREAKERS = [
  { id: 'no-remote', label: 'No Remote Options', description: 'Must work in office full-time' },
  { id: 'long-hours', label: 'Long Hours', description: 'Consistent overtime expected' },
  { id: 'poor-dei', label: 'Poor DEI Record', description: 'Lack of diversity and inclusion' },
  { id: 'unclear-mission', label: 'Unclear Mission', description: 'No clear purpose or values' },
  { id: 'low-growth', label: 'Limited Growth', description: 'Few advancement opportunities' },
  { id: 'micromanagement', label: 'Micromanagement', description: 'Overly controlling management' },
  { id: 'poor-reviews', label: 'Poor Employee Reviews', description: 'Consistently negative feedback' },
  { id: 'unstable-funding', label: 'Unstable Funding', description: 'Financial uncertainty' },
  { id: 'toxic-culture', label: 'Toxic Culture', description: 'Unhealthy work environment' },
  { id: 'no-benefits', label: 'Limited Benefits', description: 'Poor health/retirement benefits' },
]

const WORK_LOCATIONS = [
  { id: 'remote', label: 'Fully Remote', description: 'Work from anywhere' },
  { id: 'hybrid', label: 'Hybrid', description: 'Mix of office and remote' },
  { id: 'office', label: 'In Office', description: 'On-site work' },
  { id: 'flexible', label: 'Flexible', description: 'Open to any arrangement' },
]

const COMPANY_SIZES = [
  { id: 'startup', label: 'Startup', description: '1-50 employees' },
  { id: 'scale-up', label: 'Scale-up', description: '51-500 employees' },
  { id: 'mid-size', label: 'Mid-size', description: '501-5000 employees' },
  { id: 'enterprise', label: 'Enterprise', description: '5000+ employees' },
]

const INDUSTRIES = [
  { id: 'technology', label: 'Technology' },
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'retail', label: 'Retail' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'nonprofit', label: 'Non-Profit' },
]

const MANAGEMENT_STYLES = [
  { id: 'hands-off', label: 'Hands-off', description: 'Autonomous decision making' },
  { id: 'collaborative', label: 'Collaborative', description: 'Team-based approach' },
  { id: 'mentorship', label: 'Mentorship', description: 'Guidance and development' },
  { id: 'results-oriented', label: 'Results-Oriented', description: 'Focus on outcomes' },
]

const EXPERIENCE_LEVELS = [
  { id: '0-2', label: '0-2 years', description: 'Entry Level' },
  { id: '3-5', label: '3-5 years', description: 'Mid Level' },
  { id: '6-10', label: '6-10 years', description: 'Senior Level' },
  { id: '10+', label: '10+ years', description: 'Expert Level' },
]

export default function PreferencesTab({ profile, user }: PreferencesTabProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)

  // Professional Profile
  const [currentJobTitle, setCurrentJobTitle] = useState(profile?.current_job_title || '')
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || '')
  const [skills, setSkills] = useState<string[]>(profile?.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [resumes, setResumes] = useState<Array<{url: string, fileName: string, isPrimary: boolean}>>(
    profile?.resumes || []
  )

  // Existing preferences
  const [selectedValues, setSelectedValues] = useState<string[]>(
    (profile?.top_values as string[]) || []
  )
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>(
    (profile?.deal_breakers as string[]) || []
  )
  const [workLocation, setWorkLocation] = useState(profile?.work_location_preference || '')
  const [companySize, setCompanySize] = useState<string[]>(
    profile?.preferred_company_size || []
  )
  const [industries, setIndustries] = useState<string[]>(
    profile?.preferred_industries || []
  )
  const [managementStyle, setManagementStyle] = useState(profile?.management_style_preference || '')
  const [shortTermGoal, setShortTermGoal] = useState(profile?.short_term_goal || '')
  const [longTermGoal, setLongTermGoal] = useState(profile?.long_term_goal || '')
  const [careerGoals, setCareerGoals] = useState(profile?.career_goals || '')

  const addSkill = () => {
    const trimmedSkill = newSkill.trim()
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploadingResume(true)

    try {
      // Upload new resume
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)

      const newResume = {
        url: data.publicUrl,
        fileName: file.name,
        isPrimary: resumes.length === 0 // First resume is primary by default
      }

      setResumes([...resumes, newResume])
      toast.success('Resume uploaded successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload resume')
    } finally {
      setUploadingResume(false)
    }
  }

  const handleDeleteResume = async (indexToDelete: number) => {
    const resumeToDelete = resumes[indexToDelete]
    if (!resumeToDelete) return

    try {
      const path = resumeToDelete.url.split('/').pop()
      if (path) {
        await supabase.storage.from('resumes').remove([`${user.id}/${path}`])
      }
      
      const updatedResumes = resumes.filter((_, index) => index !== indexToDelete)
      
      // If we deleted the primary resume and there are others, make the first one primary
      if (resumeToDelete.isPrimary && updatedResumes.length > 0) {
        updatedResumes[0].isPrimary = true
      }
      
      setResumes(updatedResumes)
      toast.success('Resume deleted')
    } catch (err: any) {
      toast.error('Failed to delete resume')
    }
  }

  const handleSetPrimaryResume = (index: number) => {
    const updatedResumes = resumes.map((resume, i) => ({
      ...resume,
      isPrimary: i === index
    }))
    setResumes(updatedResumes)
  }

  const toggleValue = (valueId: string) => {
    if (selectedValues.includes(valueId)) {
      setSelectedValues(selectedValues.filter(id => id !== valueId))
    } else {
      if (selectedValues.length < 5) {
        setSelectedValues([...selectedValues, valueId])
      }
    }
  }

  const toggleDealBreaker = (id: string) => {
    if (selectedDealBreakers.includes(id)) {
      setSelectedDealBreakers(selectedDealBreakers.filter(item => item !== id))
    } else {
      setSelectedDealBreakers([...selectedDealBreakers, id])
    }
  }

  const toggleCompanySize = (id: string) => {
    if (companySize.includes(id)) {
      setCompanySize(companySize.filter(item => item !== id))
    } else {
      setCompanySize([...companySize, id])
    }
  }

  const toggleIndustry = (id: string) => {
    if (industries.includes(id)) {
      setIndustries(industries.filter(item => item !== id))
    } else {
      setIndustries([...industries, id])
    }
  }

  const handleSavePreferences = async () => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          // Professional Profile
          current_job_title: currentJobTitle,
          experience_level: experienceLevel,
          skills: skills,
          resumes: resumes,
          // Preferences
          top_values: selectedValues,
          deal_breakers: selectedDealBreakers,
          work_location_preference: workLocation,
          preferred_company_size: companySize,
          preferred_industries: industries,
          management_style_preference: managementStyle,
          short_term_goal: shortTermGoal,
          long_term_goal: longTermGoal,
          career_goals: careerGoals,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Professional Profile Section */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Professional Profile</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Help us understand your background for better job matching
        </p>

        <div className="space-y-5">
          {/* Current Job Title */}
          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-foreground mb-2">
              Current Job Title
            </label>
            <input
              id="job-title"
              type="text"
              value={currentJobTitle}
              onChange={(e) => setCurrentJobTitle(e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Experience Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setExperienceLevel(level.id)}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all duration-200
                    ${experienceLevel === level.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="font-medium text-sm text-foreground mb-0.5">{level.label}</div>
                  <div className="text-xs text-muted-foreground">{level.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Skills & Technologies
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (e.g., React, Python, Project Management)"
                className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <Button
                type="button"
                onClick={addSkill}
                variant="outline"
                className="px-4"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No skills added yet</p>
              )}
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Resume / CV Library
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Upload multiple resumes for different positions (PDF or Word, max 5MB each)
            </p>
            
            {/* Uploaded Resumes Grid */}
            {resumes.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                {resumes.map((resume, index) => (
                  <div key={index} className="relative group">
                    <div className="relative bg-gradient-to-br from-muted/30 to-muted/20 rounded-xl border-2 border-border hover:border-primary/40 transition-all overflow-hidden">
                      {/* Preview Section - Half Page Effect */}
                      <div className="relative h-64 overflow-hidden bg-white dark:bg-gray-900">
                        {resume.fileName?.toLowerCase().endsWith('.pdf') ? (
                          <div className="absolute inset-0">
                            <iframe
                              src={`${resume.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              className="absolute top-0 left-0 w-full h-[200%] border-0"
                              style={{
                                transform: 'scale(1)',
                                transformOrigin: 'top left'
                              }}
                              title={`Resume Preview ${index + 1}`}
                            />
                            {/* Bottom fade effect - simulates paper being pulled under */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-muted via-muted/80 to-transparent pointer-events-none" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex flex-col items-center justify-center">
                            <FileText className="w-16 h-16 text-blue-600 dark:text-blue-400 mb-2" />
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Word Document</p>
                          </div>
                        )}
                      </div>

                      {/* Info Section */}
                      <div className="p-4 bg-card border-t border-border">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate mb-1">
                              {resume.fileName}
                            </p>
                            {resume.isPrimary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Primary
                              </span>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleDeleteResume(index)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 h-8 w-8 p-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={resume.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Full
                          </a>
                          {!resume.isPrimary && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryResume(index)}
                                className="text-xs text-muted-foreground hover:text-foreground font-medium"
                              >
                                Set as Primary
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload New Resume */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/20">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploadingResume ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-foreground font-medium">
                      {resumes.length > 0 ? 'Add Another Resume' : 'Click to upload resume'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PDF or Word (max 5MB)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Career Goals Section */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Career Goals</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Define your professional aspirations and direction
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="short-term" className="block text-sm font-medium text-foreground mb-2">
              Short-term Goal (1-2 years)
            </label>
            <textarea
              id="short-term"
              value={shortTermGoal}
              onChange={(e) => setShortTermGoal(e.target.value)}
              placeholder="e.g., Master React and TypeScript, lead a project team"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="long-term" className="block text-sm font-medium text-foreground mb-2">
              Long-term Goal (3-5 years)
            </label>
            <textarea
              id="long-term"
              value={longTermGoal}
              onChange={(e) => setLongTermGoal(e.target.value)}
              placeholder="e.g., Become a Senior Engineering Manager, start own tech company"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="career-goals" className="block text-sm font-medium text-foreground mb-2">
              Overall Career Vision
            </label>
            <textarea
              id="career-goals"
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
              placeholder="e.g., Build impactful products that solve real problems while maintaining work-life balance"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Career Values */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Career Values</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Select up to 5 values ({selectedValues.length}/5 selected)
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {VALUES.map((value) => {
            const isSelected = selectedValues.includes(value.id)
            const isDisabled = !isSelected && selectedValues.length >= 5

            return (
              <button
                key={value.id}
                type="button"
                onClick={() => toggleValue(value.id)}
                disabled={isDisabled}
                className={`
                  group relative p-3 rounded-lg border-2 text-left transition-all duration-200
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : isDisabled
                    ? 'border-border/50 bg-muted/30 opacity-50 cursor-not-allowed'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground mb-0.5 leading-snug">
                      {value.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {value.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Deal Breakers */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Deal Breakers</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Select factors you want to avoid
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DEAL_BREAKERS.map((dealBreaker) => {
            const isSelected = selectedDealBreakers.includes(dealBreaker.id)

            return (
              <button
                key={dealBreaker.id}
                type="button"
                onClick={() => toggleDealBreaker(dealBreaker.id)}
                className={`
                  group relative p-3 rounded-lg border-2 text-left transition-all duration-200
                  ${isSelected
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border/50 hover:border-destructive/40 hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground mb-0.5 leading-snug">
                      {dealBreaker.label}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {dealBreaker.description}
                    </p>
                  </div>
                  {isSelected && (
                    <X className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Work Preferences Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Work Location */}
        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-1">Work Location</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Your preferred arrangement
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {WORK_LOCATIONS.map((location) => {
              const isSelected = workLocation === location.id

              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setWorkLocation(location.id)}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all duration-200
                    ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                    }
                  `}
                >
                  <h3 className="font-medium text-sm text-foreground mb-0.5">
                    {location.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {location.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Management Style */}
        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-1">Management Style</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Preferred leadership approach
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {MANAGEMENT_STYLES.map((style) => {
              const isSelected = managementStyle === style.id

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setManagementStyle(style.id)}
                  className={`
                    p-3 rounded-lg border-2 text-center transition-all duration-200
                    ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                    }
                  `}
                >
                  <h3 className="font-medium text-sm text-foreground mb-0.5">
                    {style.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {style.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Company Size */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Company Size</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Preferred organization sizes
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COMPANY_SIZES.map((size) => {
            const isSelected = companySize.includes(size.id)

            return (
              <button
                key={size.id}
                type="button"
                onClick={() => toggleCompanySize(size.id)}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                  }
                `}
              >
                <div className="font-medium text-sm text-foreground mb-0.5">
                  {size.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {size.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Industries */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-1">Industries of Interest</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Sectors you'd like to explore
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {INDUSTRIES.map((industry) => {
            const isSelected = industries.includes(industry.id)

            return (
              <button
                key={industry.id}
                type="button"
                onClick={() => toggleIndustry(industry.id)}
                className={`
                  px-3 py-2.5 rounded-lg border-2 text-center transition-all duration-200
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/50'
                  }
                `}
              >
                <div className="text-sm font-medium text-foreground">
                  {industry.label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSavePreferences}
          disabled={loading}
          className="h-11 px-8 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}