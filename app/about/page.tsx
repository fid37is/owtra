import { Target, Shield, Users, Zap } from 'lucide-react'
import PageLayout from '@/components/page-layout'
import Link from 'next/link'

const values = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Privacy first',
    description:
      'Your job search is deeply personal. We never sell your data, never show ads, and give you full control to export or delete everything at any time.',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Clarity over noise',
    description:
      'The modern job search is overwhelming. We cut through the noise with focused tools that surface what matters - fit, timing, and preparation.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Built for real people',
    description:
      'Not for recruiters, not for employers. Owtra exists entirely to serve the job seeker - the person with the most to gain and often the least support.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Speed as respect',
    description:
      'Your time is valuable. Every feature is designed to be fast, frictionless, and genuinely useful - not padded out to seem impressive.',
  },
]

const team = [
  {
    name: 'Fidelis Agba',
    role: 'Co-founder & CEO',
    bio: 'Previously spent 2 years job hunting across 3 countries. Built Owtra after his 4th spreadsheet collapsed.',
    initials: 'FA',
  },
  {
    name: 'Priya Nair',
    role: 'Co-founder & CTO',
    bio: 'Former ML engineer. Obsessed with making AI outputs actually useful rather than just impressive.',
    initials: 'PN',
  },
  {
    name: 'Jayson Olu',
    role: 'Head of Design',
    bio: 'Believes that interfaces should feel calm. Was once rejected from 40 companies in a row - now helps others avoid the same chaos.',
    initials: 'JO',
  },
]

export default function AboutPage() {
  return (
    <PageLayout>
      {/* Hero */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-5">About Owtra</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            We're making job searching
            <br className="hidden sm:block" />
            less painful.
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Owtra started from a simple frustration: why is tracking job applications still done on
            spreadsheets? We thought job seekers deserved better - smarter, calmer, more human tools.
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Our story</h2>
            <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
              <p>
                In 2023, our co-founder Fidelis was managing his job search across three different cities.
                He had a spreadsheet with 80 rows, color-coded tabs, and a notes column that had
                collapsed under its own weight. He was missing follow-ups, blanking on company details
                in interviews, and had no idea which types of roles were actually responding.
              </p>
              <p>
                He reached out to Priya, an ML engineer he'd worked with before, and the two of
                them started sketching out what a genuinely useful job search tool would look like.
                Not a job board. Not a resume builder. Something for the part nobody had solved yet -
                the tracking, the research, the preparation, the strategy.
              </p>
              <p>
                Owtra launched in late 2025. Today, we help thousands of people across the world
                organize their search, understand their fit, and walk into interviews prepared.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card">
              <div className="text-4xl sm:text-5xl font-bold text-foreground mb-1">10K+</div>
              <div className="text-base text-muted-foreground">Active users worldwide</div>
            </div>
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card">
              <div className="text-4xl sm:text-5xl font-bold text-foreground mb-1">50K+</div>
              <div className="text-base text-muted-foreground">Job applications tracked</div>
            </div>
            <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card">
              <div className="text-4xl sm:text-5xl font-bold text-foreground mb-1">4.8★</div>
              <div className="text-base text-muted-foreground">Average user rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="border-t border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10">What we believe</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {values.map((value) => (
              <div key={value.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                  {value.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-10">The team</h2>
        <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
          {team.map((member) => (
            <div key={member.name} className="group">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <span className="text-base font-bold text-primary">{member.initials}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-0.5">{member.name}</h3>
              <p className="text-xs font-medium text-primary mb-3">{member.role}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Questions or ideas?</h2>
            <p className="text-base text-muted-foreground">We'd genuinely love to hear from you.</p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex-shrink-0"
          >
            Get in touch
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}