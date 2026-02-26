'use client'

import HomeNav from '../components/home/home-nav'
import Link from 'next/link'

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeNav />
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card text-card-foreground py-8 sm:py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">Owtra</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Find your way to the perfect role
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-foreground">Product</h4>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-foreground">Company</h4>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/reviews/new" className="hover:text-primary transition-colors">Leave a Review</Link></li>
                <li><Link href="/how-to" className="hover:text-primary transition-colors">How To</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm sm:text-base text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Owtra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}