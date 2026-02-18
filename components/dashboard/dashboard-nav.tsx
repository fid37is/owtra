'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, Briefcase, TrendingUp, Settings, LogOut, Moon, Sun, Building2, User, Menu, X, Sparkles, XCircle } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

interface DashboardNavProps {
  user: SupabaseUser
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileHint, setShowProfileHint] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // Check if user is new and needs to complete profile
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, profile_completed')
          .eq('id', user.id)
          .single()

        if (profile && profile.created_at) {
          const accountAge = new Date().getTime() - new Date(profile.created_at).getTime()
          const isWithin24Hours = accountAge < 24 * 60 * 60 * 1000 // 24 hours

          // Show hint if:
          // 1. Account is less than 24 hours old
          // 2. Profile not marked as completed
          // 3. User hasn't dismissed the hint before (check localStorage)
          const hintDismissed = localStorage.getItem(`profile-hint-dismissed-${user.id}`)
          
          if (isWithin24Hours && !profile.profile_completed && !hintDismissed) {
            setIsNewUser(true)
            setShowProfileHint(true)
          }
        }
      } catch (error) {
        console.error('Error checking profile completion:', error)
      }
    }

    checkProfileCompletion()
  }, [user.id, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const dismissProfileHint = () => {
    setShowProfileHint(false)
    localStorage.setItem(`profile-hint-dismissed-${user.id}`, 'true')
  }

  const handleProfileClick = () => {
    dismissProfileHint()
    router.push('/dashboard/profile')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/applications', label: 'Applications', icon: Briefcase },
    { href: '/dashboard/companies', label: 'Companies', icon: Building2 },
    { href: '/dashboard/insights', label: 'Insights', icon: TrendingUp },
  ]

  const isCompaniesActive = pathname === '/dashboard/companies' || pathname.startsWith('/dashboard/companies/')

  return (
    <nav className="border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/dashboard" className="flex items-center" onClick={closeMobileMenu}>
              <div className="w-10 h-10 relative">
                {theme === 'dark' ? (
                  <Image
                    src="/owtra_logo2.png"
                    alt="Owtra Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    priority
                    unoptimized
                  />
                ) : (
                  <Image
                    src="/owtra_logo.png"
                    alt="Owtra Logo"
                    width={40}
                    height={40}
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
          </div>

          <div className="hidden sm:flex sm:space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/dashboard/companies' 
                ? isCompaniesActive 
                : pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-primary" />
              ) : (
                <Moon className="w-4 h-4 text-accent" />
              )}
            </button>

            {/* Profile Dropdown with Hint */}
            <div className="relative">
              {/* Profile Completion Hint Callout */}
              {showProfileHint && (
                <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white dark:bg-gray-950 border-2 border-primary/30 rounded-lg shadow-xl p-4 z-[60] animate-in slide-in-from-top-5 pointer-events-auto">
                  <button
                    onClick={dismissProfileHint}
                    className="absolute top-2 right-2 p-1 hover:bg-primary/10 rounded-full transition-colors z-[61]"
                    aria-label="Close hint"
                  >
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                  
                  <div className="flex items-start space-x-3 relative z-[61]">
                    <div className="flex-shrink-0 mt-1">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        Complete Your Profile
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Add your preferences for better job recommendations and personalized analysis!
                      </p>
                    </div>
                  </div>

                  {/* Arrow pointer */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white dark:bg-gray-950 border-l-2 border-t-2 border-primary/30 rotate-45 z-[59]"></div>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex items-center space-x-2 relative ${showProfileHint ? 'ring-2 ring-primary ring-offset-2 animate-pulse' : ''}`}
                  >
                    <User className="w-4 h-4" />
                    {isNewUser && showProfileHint && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping"></span>
                    )}
                    {isNewUser && showProfileHint && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">My Account</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/dashboard/profile" 
                      className="flex items-center cursor-pointer"
                      onClick={dismissProfileHint}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile
                      {isNewUser && showProfileHint && (
                        <Sparkles className="w-3 h-3 ml-auto text-primary" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === '/dashboard/companies' 
              ? isCompaniesActive 
              : pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-foreground border-l-4 border-primary'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Mobile Profile Hint Banner */}
        {showProfileHint && (
          <div className="mx-2 mb-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  Complete Your Profile
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Add your preferences for better job recommendations!
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleProfileClick}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Go to Profile
                  </Button>
                  <Button
                    onClick={dismissProfileHint}
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}