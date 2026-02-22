'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import PageLayout from '@/components/page-layout'

const SUBJECTS = [
  'General Question',
  'Billing & Subscription',
  'Technical Issue',
  'Feature Request',
  'Account & Data',
  'Partnership',
  'Other',
]

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong.')
        setStatus('error')
        return
      }

      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-2xl mb-14 sm:mb-20">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">Support</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">Get in touch</h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Have a question, found a bug, or want to share feedback? We read every message
            and aim to respond within 1–2 business days.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Left — Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              <InfoCard
                icon={<Mail className="w-5 h-5" />}
                title="Email us"
                description="hello@owtra.com"
                note="We monitor this daily"
              />
              <InfoCard
                icon={<MessageSquare className="w-5 h-5" />}
                title="Use this form"
                description="Fill in the form and submit"
                note="Easiest way for most questions"
              />
              <InfoCard
                icon={<Clock className="w-5 h-5" />}
                title="Response time"
                description="1–2 business days"
                note="Usually much faster"
              />
            </div>

            {/* Divider */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3 font-medium">Common topics</p>
              <div className="flex flex-wrap gap-2">
                {['Billing', 'Bug report', 'Feature request', 'Data export', 'Account'].map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center text-center py-16 px-8 rounded-2xl border border-border bg-card h-full min-h-[400px]">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Message sent!</h2>
                <p className="text-muted-foreground text-base max-w-sm leading-relaxed mb-6">
                  Thanks for reaching out. We've sent you a confirmation email and will be in touch shortly.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="text-sm font-medium text-primary hover:underline underline-offset-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 sm:p-8 space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email <span className="text-primary">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject <span className="text-primary">*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a topic…</option>
                    {SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind…"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none"
                  />
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
                  {status === 'loading' ? 'Sending…' : 'Send message'}
                </button>

                <p className="text-xs text-center text-muted-foreground">
                  We'll send a confirmation email to the address you provide.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

function InfoCard({
  icon,
  title,
  description,
  note,
}: {
  icon: React.ReactNode
  title: string
  description: string
  note: string
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-0.5">{title}</p>
        <p className="text-sm text-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
      </div>
    </div>
  )
}