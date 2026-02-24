'use client'

import { useState } from 'react'
import { Star, CheckCircle2, AlertCircle } from 'lucide-react'
import PageLayout from '@/components/page-layout'

type Status = 'idle' | 'loading' | 'success' | 'error'

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hovered || value)
                ? 'fill-primary text-primary'
                : 'fill-none text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
        </span>
      )}
    </div>
  )
}

export default function LeaveReviewPage() {
  const [form, setForm] = useState({ name: '', role: '', quote: '', rating: 0 })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.rating === 0) {
      setErrorMsg('Please select a star rating.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating: form.rating }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">Community</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Leave a review</h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Did Owtra help with your job search? We'd love to hear about it. Your review helps other
            job seekers decide if Owtra is right for them.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-16 px-8 rounded-2xl border border-border bg-card">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Thank you!</h2>
            <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
              Your review has been submitted and will appear on the site after a quick check from
              our team — usually within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Overall rating <span className="text-primary">*</span>
              </label>
              <StarRating
                value={form.rating}
                onChange={(v) => {
                  setForm((prev) => ({ ...prev, rating: v }))
                  if (status === 'error' && errorMsg.includes('rating')) {
                    setStatus('idle')
                    setErrorMsg('')
                  }
                }}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Your name <span className="text-primary">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah M."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                  Your role{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="quote" className="block text-sm font-medium text-foreground mb-2">
                Your review <span className="text-primary">*</span>
              </label>
              <textarea
                id="quote"
                name="quote"
                required
                rows={5}
                value={form.quote}
                onChange={handleChange}
                placeholder="Tell us how Owtra helped your job search…"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Minimum 20 characters</p>
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Submitting…' : 'Submit review'}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Reviews are moderated and usually approved within 24 hours.
            </p>
          </form>
        )}
      </div>
    </PageLayout>
  )
}