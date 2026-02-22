'use client'

import AuthSection from './auth-section'
import { Target, BarChart3, Bell, Search, TrendingUp, Zap, Check, Users, Award, Clock, Shield, ChevronDown } from 'lucide-react'
import ReviewsSection from './reviews-section'
import { useState } from 'react'

export default function HomeHero() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const getPriceId = (cycle: 'monthly' | 'yearly'): string | null => {
    if (cycle === 'monthly') {
      return process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || null
    } else {
      return process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || null
    }
  }

  const handleUpgradeClick = () => {
    const priceId = getPriceId(billingCycle)
    const url = new URL(window.location.href)
    url.searchParams.set('upgrade', 'true')
    url.searchParams.set('plan', billingCycle)
    if (priceId) url.searchParams.set('priceId', priceId)
    window.history.pushState({}, '', url)
    window.dispatchEvent(new CustomEvent('upgrade-intent', { detail: { billingCycle, priceId } }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFreeClick = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('upgrade')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new CustomEvent('free-signup'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="bg-background">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
      `}} />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="order-2 lg:order-1">
            <AuthSection />
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative w-full max-w-4xl mx-auto h-[400px] sm:h-[500px] lg:h-[700px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-blue-50/20 to-transparent"></div>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(25)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full bg-white/60"
                    style={{
                      width: `${2 + Math.random() * 3}px`,
                      height: `${2 + Math.random() * 3}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: 0.4 + Math.random() * 0.4,
                      animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
              <div className="relative w-full h-full flex flex-col items-center justify-start pt-16 sm:pt-24 lg:pt-32 px-4 sm:px-8">
                <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold text-slate-800/90 mb-4 sm:mb-6 tracking-tight text-center">
                  Owtra
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-slate-600/80 font-normal max-w-2xl leading-relaxed mb-12 sm:mb-16 text-center px-4">
                  Smart tracking and insights for every job application.
                </p>
                <div className="relative w-full max-w-md lg:max-w-xl">
                  <div className="absolute left-0 top-0 bg-white/70 backdrop-blur-md rounded-xl shadow-lg p-4 w-48 sm:w-56 border border-white/40 z-10">
                    <div className="bg-blue-100/80 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium inline-block mb-3">Applied</div>
                    <div className="flex items-center gap-2 text-slate-400/70">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                      <span className="text-sm">Company name</span>
                    </div>
                  </div>
                  <div className="absolute left-0 top-24 bg-white/60 backdrop-blur-md rounded-xl shadow-lg p-4 w-40 sm:w-48 border border-white/30">
                    <div className="bg-slate-100/80 text-slate-600 px-3 py-1 rounded-lg text-xs font-medium inline-block">Referral</div>
                  </div>
                  <div className="absolute right-0 top-12 bg-white/50 backdrop-blur-md rounded-2xl shadow-xl p-5 sm:p-6 w-72 sm:w-80 lg:w-96 border border-white/30">
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                      {['27', '28', '24', '25', '26', '', ''].map((num, i) => (
                        <div key={i} className="text-[10px] text-slate-400/60 font-medium">{num}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 mb-4">
                      {[
                        { day: '27', bg: '' }, { day: '28', bg: '' },
                        { day: '29', bg: 'bg-blue-500' }, { day: '30', bg: '' },
                        { day: '31', bg: 'bg-emerald-400' }, { day: '1', bg: 'bg-blue-300' },
                        { day: '2', bg: '' }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-center">
                          <div className={`w-7 h-7 flex items-center justify-center text-xs rounded-lg ${item.bg ? `${item.bg} text-white font-medium` : 'text-slate-500/60'}`}>
                            {item.day}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 bg-blue-400/70 rounded-full" style={{ width: '35%' }} />
                        <div className="h-1.5 bg-slate-300/40 rounded-full" style={{ width: '25%' }} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 bg-orange-300/70 rounded-full" style={{ width: '28%' }} />
                        <div className="h-1.5 bg-slate-300/40 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-30">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gradient-to-br from-primary/5 via-accent/5 to-primary/3 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">Everything you need to succeed</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4">Track, analyze, and land your perfect role with powerful tools designed for modern job seekers</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard icon={<Target className="w-6 h-6 sm:w-8 sm:h-8" />} title="Smart Matching" description="See how well you match the role, understand the company, and predict response chances, before or after applying." color="primary" />
            <FeatureCard icon={<BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />} title="Organized Tracking" description="Centralize your applications, contacts, and company research in a dashboard tailored to your job-search style." color="accent" />
            <FeatureCard icon={<Bell className="w-6 h-6 sm:w-8 sm:h-8" />} title="Interview Ready" description="Walk into interviews prepared with tailored questions, answers, and insights as soon as you're shortlisted." color="secondary" />
            <FeatureCard icon={<Search className="w-6 h-6 sm:w-8 sm:h-8" />} title="Company Insights" description="Instantly learn about company culture, values, team structure, leadership, and workplace experience to make informed career decisions." color="primary" />
            <FeatureCard icon={<TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />} title="Track Progress" description="Visualize your application-to-interview conversion rates, identify successful strategies, and optimize your approach with detailed analytics." color="accent" />
            <FeatureCard icon={<Zap className="w-6 h-6 sm:w-8 sm:h-8" />} title="Lightning Fast" description="Add applications in seconds with smart job posting parsers that automatically extract company details, role info, and requirements." color="secondary" />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div id="about" className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">About Owtra</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">We're on a mission to make job searching less overwhelming and more successful</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center mb-12 sm:mb-16">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground">Our Story</h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Owtra was born from the frustration of managing dozens of job applications on spreadsheets. We realized that job seekers needed a centralized, intelligent system to track their journey and maximize their chances of success.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Today, we help thousands of professionals organize their job search, discover better opportunities, and land roles at companies they love. Our AI-powered platform learns from successful job searches to give you personalized insights and recommendations.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <StatCard icon={<Users className="w-6 h-6 sm:w-8 sm:h-8" />} value="10K+" label="Active Users" />
              <StatCard icon={<Award className="w-6 h-6 sm:w-8 sm:h-8" />} value="50K+" label="Jobs Tracked" />
              <StatCard icon={<Clock className="w-6 h-6 sm:w-8 sm:h-8" />} value="30 hrs" label="Time Saved" />
              <StatCard icon={<Shield className="w-6 h-6 sm:w-8 sm:h-8" />} value="99.9%" label="Uptime" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">Our Values</h3>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mt-6 sm:mt-8">
              <ValueCard title="Transparency" description="Clear pricing, honest features, no hidden surprises" />
              <ValueCard title="Privacy First" description="Your data is yours. We never sell or share it" />
              <ValueCard title="User-Centric" description="Built by job seekers, for job seekers" />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">Simple, transparent pricing</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4">Start free, upgrade when you're ready to go unlimited</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-card rounded-2xl sm:rounded-3xl border-2 border-border p-6 sm:p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Free</h3>
                <div className="flex items-baseline mb-4">
                  <span className="text-4xl sm:text-5xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">Perfect for getting started</p>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <BenefitItem text="Track up to 10 applications" />
                <BenefitItem text="AI job fit analysis" />
                <BenefitItem text="Company research & insights" />
                <BenefitItem text="Interview prep questions" />
                <BenefitItem text="Delete after 30 days only" muted />
              </ul>
              <button onClick={handleFreeClick} className="w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-all duration-300">
                Get Started Free
              </button>
            </div>

            {/* Premium Tier */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl sm:rounded-3xl border-2 border-primary p-6 sm:p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden animate-float">
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-secondary text-primary-foreground px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold">
                Recommended
              </div>
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4">Premium</h3>
                <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1 mb-4">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${billingCycle === 'yearly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
                  >
                    Yearly <span className="text-[10px] sm:text-xs text-primary ml-1">-20%</span>
                  </button>
                </div>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl sm:text-5xl font-bold text-foreground">
                    ${billingCycle === 'monthly' ? '18' : '183'}
                  </span>
                  <span className="text-muted-foreground ml-2">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-xs sm:text-sm text-primary font-semibold mb-2">Save $32/year (15% off)</p>
                )}
                <p className="text-sm sm:text-base text-muted-foreground">For serious job seekers</p>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <BenefitItem text="200 Applications" premium />
                <BenefitItem text="All AI features unlocked" premium />
                <BenefitItem text="Advanced company insights" premium />
                <BenefitItem text="Interview prep" premium />
                <BenefitItem text="Instant delete anytime" premium />
                <BenefitItem text="Application analytics" premium />
              </ul>
              <button onClick={handleUpgradeClick} className="w-full py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl">
                {billingCycle === 'monthly' ? 'Start With Premium' : 'Get Yearly Plan'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/3">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">Frequently Asked Questions</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4">Everything you need to know about Owtra</p>
          </div>
          <div className="space-y-4">
            <FaqItem question="How does the free plan work?" answer="The free plan allows you to track up to 10 applications with full access to AI job fit analysis, company insights, and interview prep. It's perfect for testing out Owtra or if you're just starting your job search." isOpen={openFaq === 0} onClick={() => toggleFaq(0)} />
            <FaqItem question="Can I upgrade or downgrade anytime?" answer="Absolutely! You can upgrade to Premium at any time, and your new features will be available immediately. If you downgrade, you'll keep your premium features until the end of your billing cycle." isOpen={openFaq === 1} onClick={() => toggleFaq(1)} />
            <FaqItem question="What happens to my data if I cancel?" answer="Your data is always yours. If you cancel, you can export all your data at any time. Free users have 30 days to export before deletion, while Premium users can export anytime and delete instantly." isOpen={openFaq === 2} onClick={() => toggleFaq(2)} />
            <FaqItem question="How does the AI matching work?" answer="Our AI analyzes job descriptions, company data, and your preferences to calculate fit scores. It looks at culture alignment, growth stage, tech stack, team size, and more to help you prioritize opportunities that match your goals." isOpen={openFaq === 3} onClick={() => toggleFaq(3)} />
            <FaqItem question="Is my data secure and private?" answer="Yes! We use industry-standard encryption, never sell your data, and give you full control over your information. Your job search details are private and only accessible to you." isOpen={openFaq === 4} onClick={() => toggleFaq(4)} />
            <FaqItem question="Do you offer refunds?" answer="Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not satisfied for any reason, just contact us and we'll process a full refund." isOpen={openFaq === 5} onClick={() => toggleFaq(5)} />
          </div>
        </div>
      </div>

      {/* Reviews — dynamic from DB */}
      <ReviewsSection />

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">Ready to find your way?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8">Join thousands of job seekers who found their perfect role with Owtra</p>
          <button onClick={handleFreeClick} className="bg-primary text-primary-foreground hover:opacity-90 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold transition-opacity">
            Get Started Free
          </button>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: 'primary' | 'accent' | 'secondary' }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20 hover:border-primary/40',
    accent: 'bg-accent/10 text-accent-foreground border-accent/20 hover:border-accent/40',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20 hover:border-secondary/40'
  }
  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border hover:shadow-lg transition-all group">
      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 ${colorClasses[color]} group-hover:scale-110`}>
        <div className="animate-pulse-subtle">{icon}</div>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border text-center hover:shadow-lg transition-all">
      <div className="flex justify-center mb-2 sm:mb-3 text-primary">{icon}</div>
      <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function ValueCard({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{title}</h4>
      <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
    </div>
  )
}

function BenefitItem({ text, muted = false, premium = false }: { text: string; muted?: boolean; premium?: boolean }) {
  return (
    <li className="flex items-start gap-2 sm:gap-3">
      <Check className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${premium ? 'text-primary' : muted ? 'text-muted-foreground' : 'text-foreground'}`} />
      <span className={`text-sm sm:text-base ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{text}</span>
    </li>
  )
}

function FaqItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden transition-all hover:shadow-md">
      <button
        onClick={onClick}
        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-base sm:text-lg font-semibold text-foreground pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  )
}