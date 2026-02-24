'use client'

import Link from 'next/link'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useState } from 'react'

export default function HomeNav() {
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const isHomePage = pathname === '/'

  const closeMobileMenu = () => setMobileMenuOpen(false)
  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev)

  /**
   * If on the homepage, smooth-scroll to the section.
   * If on any other page, navigate to /#section (browser will jump on load).
   */
  const handleSectionNav = (sectionId: string) => {
    closeMobileMenu()
    if (isHomePage) {
      const el = document.getElementById(sectionId)
      if (el) {
        // Account for sticky nav height
        const navHeight = 64
        const top = el.getBoundingClientRect().top + window.scrollY - navHeight
        window.scrollTo({ top, behavior: 'smooth' })
      }
    } else {
      router.push(`/#${sectionId}`)
    }
  }

  const scrollToTop = () => {
    closeMobileMenu()
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/')
    }
  }

  const navLinks = [
    { label: 'Features', type: 'section', id: 'features' },
    { label: 'Pricing', type: 'section', id: 'pricing' },
    { label: 'FAQ', type: 'section', id: 'faq' },
    { label: 'About', type: 'page', href: '/about' },
    { label: 'Contact', type: 'page', href: '/contact' },
  ] as const

  return (
    <nav className="border-b border-border sticky top-0 z-50 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" onClick={closeMobileMenu}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 relative">
              {theme === 'dark' ? (
                <Image
                  src="/owtra_logo2.png"
                  alt="Owtra Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src="/owtra_logo.png"
                  alt="Owtra Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                  priority
                  unoptimized
                />
              )}
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground leading-none">
              Owtra
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map(link => (
              link.type === 'section' ? (
                <button
                  key={link.id}
                  onClick={() => handleSectionNav(link.id)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            ))}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-accent" />
              )}
            </button>

            <button
              onClick={scrollToTop}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started
            </button>
          </div>

          {/* Mobile: Theme toggle + hamburger */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-accent" />
              )}
            </button>

            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-1 border-t border-border bg-background/95 backdrop-blur-md">
          {navLinks.map(link => (
            link.type === 'section' ? (
              <button
                key={link.id}
                onClick={() => handleSectionNav(link.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}

          <div className="pt-2">
            <button
              onClick={scrollToTop}
              className="w-full px-6 py-3 rounded-lg font-semibold text-base bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}