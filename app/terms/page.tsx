import PageLayout from '@/components/page-layout'

const lastUpdated = 'January 15, 2025'

const sections = [
  {
    title: 'Acceptance of Terms',
    content: 'By creating an account or using Owtra, you agree to these Terms of Service. If you do not agree, please do not use the service. We may update these terms from time to time and will notify you of material changes by email.',
  },
  {
    title: 'Description of Service',
    content: 'Owtra is a job application tracking and insights platform. We provide tools to organize your job search, generate AI-powered insights, research companies, and prepare for interviews. Features vary between our Free and Premium plans.',
  },
  {
    title: 'Your Account',
    content: 'You are responsible for maintaining the security of your account credentials. You must not share your account with others or allow unauthorized access. You must be at least 16 years old to use Owtra. You agree to provide accurate information and keep it up to date.',
  },
  {
    title: 'Acceptable Use',
    subsections: [
      {
        subtitle: 'You may not:',
        items: [
          'Use Owtra for any unlawful purpose or in violation of any regulations',
          'Attempt to reverse-engineer, scrape, or copy the platform or its AI models',
          'Upload harmful, offensive, or infringing content',
          'Use automated tools to access or interact with the service in unauthorized ways',
          'Resell or sublicense access to the service',
        ],
      },
    ],
  },
  {
    title: 'Subscription & Billing',
    content: 'Paid plans are billed in advance on a monthly or annual basis. Prices are listed on our pricing page. We reserve the right to change pricing with 30 days\' notice. Billing is handled by Dodo Payments. By subscribing, you authorize recurring charges until you cancel.',
  },
  {
    title: 'Cancellation & Refunds',
    content: 'You may cancel your subscription at any time from your account settings. You will retain access to paid features until the end of your current billing period. We offer a 14-day money-back guarantee on all paid plans — contact us within 14 days of your initial purchase for a full refund.',
  },
  {
    title: 'Your Content',
    content: 'You retain full ownership of all content you create in Owtra (application notes, company research, etc.). By using the service, you grant Owtra a limited license to store and process your content solely to provide the service. We will never use your personal job search data to train AI models without your explicit consent.',
  },
  {
    title: 'AI-Generated Content',
    content: 'Owtra uses AI to generate insights, suggestions, and analysis. AI outputs are provided for informational purposes only and may contain inaccuracies. We do not guarantee the accuracy of AI-generated content. Always exercise your own judgment before making career decisions based on AI insights.',
  },
  {
    title: 'Intellectual Property',
    content: 'The Owtra name, logo, design, and underlying software are the intellectual property of Owtra and are protected by copyright, trademark, and other laws. You may not copy, modify, or distribute any part of the service without our written permission.',
  },
  {
    title: 'Disclaimers',
    content: 'Owtra is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that it will help you find employment. Job search outcomes depend on many factors outside our control.',
  },
  {
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by law, Owtra shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability to you in any month shall not exceed the amount you paid us in that month.',
  },
  {
    title: 'Termination',
    content: 'You may delete your account at any time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted according to our Privacy Policy.',
  },
  {
    title: 'Governing Law',
    content: 'These terms are governed by the laws of the jurisdiction in which Owtra is incorporated. Any disputes shall be resolved through binding arbitration before resorting to litigation.',
  },
  {
    title: 'Contact',
    content: 'If you have questions about these terms, please contact us through our contact page. We aim to respond within 2 business days.',
  },
]

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-12 sm:mb-16 pb-8 border-b border-border">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-4">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-base">
            Last updated: <span className="text-foreground font-medium">{lastUpdated}</span>
          </p>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Please read these terms carefully before using Owtra. They outline your rights and
            responsibilities as a user of our service.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 p-6 bg-muted/40 rounded-2xl border border-border">
          <p className="text-sm font-semibold text-foreground mb-4">Contents</p>
          <ol className="grid sm:grid-cols-2 gap-2">
            {sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-start gap-2 group"
                >
                  <span className="text-xs text-primary/50 font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span className="group-hover:underline underline-offset-2">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-10 sm:space-y-12">
          {sections.map((section, i) => (
            <div key={i} id={`section-${i}`} className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-xs font-mono text-primary/50 mt-1.5 w-4 flex-shrink-0">{i + 1}</span>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{section.title}</h2>
              </div>
              <div className="pl-8">
                {section.content && (
                  <p className="text-base text-muted-foreground leading-relaxed">{section.content}</p>
                )}
                {section.subsections?.map((sub, j) => (
                  <div key={j} className="mt-4">
                    <p className="text-sm font-semibold text-foreground mb-3">{sub.subtitle}</p>
                    <ul className="space-y-2">
                      {sub.items.map((item, k) => (
                        <li key={k} className="flex items-start gap-3 text-base text-muted-foreground">
                          <span className="mt-2 w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-base text-muted-foreground leading-relaxed">
            Questions about these terms?{' '}
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