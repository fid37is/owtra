'use client'

import Link from 'next/link'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import Image from 'next/image'
import { useState } from 'react'

export default function HomeNav() {
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    closeMobileMenu()
  }

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
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              About Us
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>

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

          {/* Mobile Menu Button & Theme Toggle */}
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
        <div className="px-4 pt-2 pb-4 space-y-3 border-t border-border bg-background/95 backdrop-blur-md">
          <a
            href="#features"
            onClick={closeMobileMenu}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            Features
          </a>
          <a
            href="#about"
            onClick={closeMobileMenu}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            About Us
          </a>
          <a
            href="#testimonials"
            onClick={closeMobileMenu}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            Testimonials
          </a>
          <a
            href="#pricing"
            onClick={closeMobileMenu}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            onClick={closeMobileMenu}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
          >
            FAQ
          </a>
          <button
            onClick={scrollToTop}
            className="w-full px-6 py-3 rounded-lg font-semibold text-base bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  )
}