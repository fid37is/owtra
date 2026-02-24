import PageLayout from '@/components/page-layout'

const lastUpdated = 'January 15, 2025'

const sections = [
  {
    title: 'Information We Collect',
    content: [
      {
        subtitle: 'Account Information',
        text: 'When you create an account, we collect your name, email address, and password. If you sign up via a third-party provider (Google, GitHub), we receive the information that provider shares with us.',
      },
      {
        subtitle: 'Job Application Data',
        text: 'All job applications, notes, company research, and related content you add to Owtra is stored securely and is only accessible by you.',
      },
      {
        subtitle: 'Usage Data',
        text: 'We collect basic analytics about how you use Owtra — pages visited, features used, and session duration. This helps us improve the product. We do not sell this data.',
      },
      {
        subtitle: 'Payment Information',
        text: 'Payment details are processed by our payment provider (Dodo Payments). We store only a subscription reference ID — we never have access to your full card details.',
      },
    ],
  },
  {
    title: 'How We Use Your Information',
    content: [
      {
        subtitle: 'To provide the service',
        text: 'Your data powers the core Owtra experience: tracking applications, generating AI insights, and storing your research.',
      },
      {
        subtitle: 'To communicate with you',
        text: 'We send transactional emails (password reset, billing receipts) and, if you opt in, product updates and tips. You can unsubscribe from marketing emails at any time.',
      },
      {
        subtitle: 'To improve the product',
        text: 'Aggregated, anonymized usage data helps us understand which features are most valuable and where to invest our time.',
      },
    ],
  },
  {
    title: 'Data Sharing',
    content: [
      {
        subtitle: 'We do not sell your data',
        text: 'We will never sell, rent, or trade your personal information to third parties for their marketing purposes.',
      },
      {
        subtitle: 'Service providers',
        text: 'We work with a small number of trusted providers (Supabase for database, Resend for email, Dodo Payments for billing). Each is bound by strict data processing agreements.',
      },
      {
        subtitle: 'Legal requirements',
        text: 'We may disclose information if required by law, subpoena, or to protect the rights, property, or safety of Owtra, our users, or the public.',
      },
    ],
  },
  {
    title: 'Data Retention & Deletion',
    content: [
      {
        subtitle: 'Your data, your control',
        text: 'Premium users can delete their data at any time, instantly. Free users retain data for 30 days after account closure, after which it is permanently deleted.',
      },
      {
        subtitle: 'Export your data',
        text: 'You can export all your application data in CSV format at any time from your account settings.',
      },
    ],
  },
  {
    title: 'Security',
    content: [
      {
        subtitle: 'How we protect your data',
        text: 'We use industry-standard encryption in transit (TLS 1.3) and at rest. Access to production systems is restricted to authorized personnel only. We conduct regular security reviews.',
      },
    ],
  },
  {
    title: 'Cookies',
    content: [
      {
        subtitle: 'What we use',
        text: 'We use essential session cookies to keep you logged in and preference cookies to remember your settings (e.g. dark mode). We do not use advertising cookies or third-party tracking.',
      },
    ],
  },
  {
    title: 'Your Rights',
    content: [
      {
        subtitle: 'Access, correction & deletion',
        text: 'You have the right to access the personal data we hold about you, correct any inaccuracies, and request deletion. Submit requests via our contact page and we will respond within 30 days.',
      },
      {
        subtitle: 'GDPR & CCPA',
        text: 'If you are in the EU or California, you have additional rights under GDPR and CCPA respectively, including data portability and the right to opt out of any data processing. Contact us to exercise these rights.',
      },
    ],
  },
  {
    title: 'Changes to This Policy',
    content: [
      {
        subtitle: 'How we notify you',
        text: 'If we make material changes to this policy, we will notify you by email and post a notice on the app at least 14 days before changes take effect. Continued use after that date constitutes acceptance.',
      },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12 sm:mb-16 pb-8 border-b border-border">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-base">
            Last updated: <span className="text-foreground font-medium">{lastUpdated}</span>
          </p>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Owtra is built on a simple principle: your job search data is yours. This policy explains
            exactly what we collect, why, and how you stay in control.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-muted/40 rounded-2xl border border-border">
          <p className="text-sm font-semibold text-foreground mb-4">Contents</p>
          <ol className="space-y-2">
            {sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="text-xs text-primary/50 font-mono w-4">{i + 1}.</span>
                  <span className="group-hover:underline underline-offset-2">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-12 sm:space-y-16">
          {sections.map((section, i) => (
            <div key={i} id={`section-${i}`} className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-6">
                <span className="text-xs font-mono text-primary/50 mt-2 w-4 flex-shrink-0">{i + 1}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">{section.title}</h2>
              </div>
              <div className="pl-8 space-y-6">
                {section.content.map((item, j) => (
                  <div key={j}>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{item.subtitle}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-base text-muted-foreground leading-relaxed">
            Questions about this policy?{' '}
            <a href="/contact" className="text-primary font-medium hover:underline underline-offset-2">
              Contact us
            </a>{' '}
            and we'll respond within 2 business days.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}