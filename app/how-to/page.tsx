'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Maximize2, X, Play, PlusCircle, Building2, BarChart2, Search, Settings } from 'lucide-react'
import PageLayout from '@/components/page-layout'
import Link from 'next/link'

// ─────────────────────────────────────────────
// TUTORIALS — paste your YouTube URL into each
// ─────────────────────────────────────────────
const tutorials = [
    {
        id: 'add-application',
        icon: <PlusCircle className="w-5 h-5" />,
        category: 'Getting started',
        title: 'Log your first application',
        summary: 'Add a job application manually or paste a job listing URL to auto-fill the details.',
        youtubeUrl: 'https://youtu.be/3h4orXkRVCU',
        steps: [
            {
                title: 'Go to Applications',
                description: 'From the dashboard, click "Applications" in the navbar, then select "Add Application" at the top right.',
            },
            {
                title: 'Enter the Details',
                description: 'Fill in your application information manually',
            },
            {
                title: 'Analyze Match',
                description: 'Click "Analyze Match" to let AI compare your profile with the job and provide insights about your fit.',
            },
            {
                title: 'Set a Status',
                description: 'Mark the application as "Not Applied" or "Applied." You can update this status anytime as your application progresses.',
            },
            {
                title: 'Proceed to Company Research',
                description: 'Click "Research Company" to let Owtra gather detailed information about the company you’re applying to.',
            },
            {
                title: 'Save and Track',
                description: 'Hit "Save" to complete the process. All application and company information will be stored for easy tracking.',
            },
        ],
    },
    {
        id: 'import-from-url',
        icon: <Search className="w-5 h-5" />,
        category: 'Importing',
        title: 'Import from a job listing URL',
        summary: 'Save time by pasting a job URL and letting Owtra extract the details automatically.',
        youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_ME_4', // ← paste your URL here
        steps: [
            {
                title: 'Go to Applications',
                description: 'From the dashboard, click "Applications" in the navbar, then select "Add Application" at the top right.',
            },
            {
                title: 'Automatic application (paste URL)',
                description: 'Paste the job listing URL into the "Job listing URL" field. Owtra will try to extract the job title, company, and location automatically.',
            },
            {
                title: 'Analyze Match',
                description: 'Click "Analyze Match" to let AI compare your profile with the job and provide insights about your fit.',
            },
            {
                title: 'Set a Status',
                description: 'Mark the application as "Not Applied" or "Applied." You can update this status anytime as your application progresses.',
            },
            {
                title: 'Proceed to Company Research',
                description: 'Click "Research Company" to let Owtra gather detailed information about the company you’re applying to.',
            },
             {
                title: 'Save and Track',
                description: 'Hit "Save" to complete the process. All application and company information will be stored for easy tracking.',
            },
        ],
    },
    {
        id: 'research-company',
        icon: <Building2 className="w-5 h-5" />,
        category: 'Companies',
        title: 'Research a company',
        summary: 'Get an AI-generated report on culture, ratings, pros and cons, before or after you apply.',
        youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_ME_2', // ← paste your URL here
        steps: [
            {
                title: 'Navigate to the companies page',
                description: "Click \"Companies\" in the navbar. You'll see all companies linked to your applications, plus a button to research any company independently.",
            },
            {
                title: 'Click "Research a Company"',
                description: 'Enter a company name and optional website URL. Providing the website gives more accurate results.',
            },
            {
                title: 'Wait for the report',
                description: 'Owtra searches the web, scrapes the company site, and runs AI analysis. This takes around 20-30 seconds.',
            },
            {
                title: 'Review and save',
                description: "You'll see the full report - culture summary, ratings, pros and cons. Click \"Save to My Companies\" to keep it. Nothing is saved until you confirm.",
            },
        ],
    },
    {
        id: 'update-status',
        icon: <BarChart2 className="w-5 h-5" />,
        category: 'Tracking',
        title: 'Update application status',
        summary: 'Keep your tracker accurate by updating statuses as you move through the hiring process.',
        youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_ME_3', // ← paste your URL here
        steps: [
            {
                title: 'Find the application',
                description: 'Go to Applications and locate the role. Search by company name or filter by current status.',
            },
            {
                title: 'Open the application',
                description: 'Click the row to open its detail view - full timeline, notes, and current status.',
            },
            {
                title: 'Change the status',
                description: 'Click the status badge and select the new status - Applied, Interviewing, Offer, Rejected, or Withdrawn.',
            },
            {
                title: 'Add a note (optional)',
                description: 'Use the notes field to record what happened - interview feedback, salary discussed, or next steps. Notes are timestamped automatically.',
            },
        ],
    },
    {
        id: 'account-settings',
        icon: <Settings className="w-5 h-5" />,
        category: 'Account',
        title: 'Manage your account settings',
        summary: 'Update your profile, manage your subscription, or delete your account.',
        youtubeUrl: 'https://www.youtube.com/watch?v=REPLACE_ME_5', // ← paste your URL here
        steps: [
            {
                title: 'Open Settings',
                description: 'Click your avatar or initials in the top right of the dashboard, then select "Settings" from the dropdown.',
            },
            {
                title: 'Update your profile',
                description: 'In the Profile tab, update your display name, preferences and password. Changes take effect immediately.',
            },
            {
                title: 'Manage billing',
                description: 'Go to the Billing tab to view your current plan, see upcoming invoices, or change your payment method.',
            },
            {
                title: 'Hibernate or delete your account',
                description: 'Hibernate to pause your account with all data saved. Delete has a grace period of 30 days in case you change your mind. Scroll to the Danger Zone at the bottom of Settings.',
            },
        ],
    },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function getYouTubeEmbedUrl(url: string): string {
    try {
        const u = new URL(url)
        const id =
            u.searchParams.get('v') ||
            u.pathname.split('/').filter(Boolean).pop() ||
            ''
        return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
    } catch {
        return ''
    }
}

function isPlaceholder(url: string) {
    return url.includes('REPLACE_ME')
}

// ─────────────────────────────────────────────
// Video overlay
// ─────────────────────────────────────────────
function VideoOverlay({
    embedUrl,
    title,
    onClose,
}: {
    embedUrl: string
    title: string
    onClose: () => void
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-10"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <iframe
                    src={embedUrl + '&autoplay=1'}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                />
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors z-10"
                    aria-label="Close video"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            {/* Click outside hint */}
            <p className="absolute bottom-4 text-white/40 text-xs">Click outside to close</p>
        </div>
    )
}

// ─────────────────────────────────────────────
// Tutorial card
// ─────────────────────────────────────────────
function TutorialCard({
    tutorial,
    index,
    isOpen,
    onToggle,
}: {
    tutorial: (typeof tutorials)[number]
    index: number
    isOpen: boolean
    onToggle: () => void
}) {
    const [videoOverlay, setVideoOverlay] = useState(false)
    const embedUrl = getYouTubeEmbedUrl(tutorial.youtubeUrl)
    const placeholder = isPlaceholder(tutorial.youtubeUrl)

    return (
        <>
            {videoOverlay && !placeholder && (
                <VideoOverlay
                    embedUrl={embedUrl}
                    title={tutorial.title}
                    onClose={() => setVideoOverlay(false)}
                />
            )}

            <div
                className={`rounded-2xl border transition-colors duration-200 overflow-hidden ${isOpen
                    ? 'border-primary/30 bg-card shadow-sm'
                    : 'border-border bg-card hover:border-primary/20'
                    }`}
            >
                {/* ── Header (always visible) ── */}
                <button
                    onClick={onToggle}
                    className="w-full text-left px-5 sm:px-7 py-5 flex items-center gap-4 group"
                >
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isOpen
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/8 border border-primary/15 text-primary'
                            }`}
                    >
                        {tutorial.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold tracking-widest text-primary/60 uppercase mb-0.5">
                            {tutorial.category}
                        </p>
                        <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                            <span className="text-muted-foreground font-normal mr-1.5">
                                {String(index + 1).padStart(2, '0')}.
                            </span>
                            {tutorial.title}
                        </h2>
                        {!isOpen && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                {tutorial.summary}
                            </p>
                        )}
                    </div>

                    <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                        {isOpen ? (
                            <ChevronUp className="w-5 h-5" />
                        ) : (
                            <ChevronDown className="w-5 h-5" />
                        )}
                    </div>
                </button>

                {/* ── Expanded body ── */}
                {isOpen && (
                    <div className="px-5 sm:px-7 pb-8 border-t border-border">
                        <p className="text-sm text-muted-foreground mt-5 mb-8 leading-relaxed max-w-2xl">
                            {tutorial.summary}
                        </p>

                        <div className="grid lg:grid-cols-2 gap-10 items-start">
                            {/* Left — steps */}
                            <div>
                                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-5">
                                    Steps
                                </p>
                                <div className="space-y-0">
                                    {tutorial.steps.map((step, j) => (
                                        <div key={j} className="flex gap-4 pb-6 last:pb-0 relative">
                                            {/* connector line */}
                                            {j < tutorial.steps.length - 1 && (
                                                <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border" />
                                            )}
                                            {/* step number */}
                                            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 z-10">
                                                <span className="text-[11px] font-bold text-primary">{j + 1}</span>
                                            </div>
                                            {/* content */}
                                            <div className="pt-0.5">
                                                <h3 className="text-sm font-semibold text-foreground mb-1">
                                                    {step.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right — video */}
                            <div>
                                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-5">
                                    Video walkthrough
                                </p>

                                {placeholder ? (
                                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 aspect-video flex flex-col items-center justify-center gap-3 text-center p-6">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                            <Play className="w-5 h-5 text-muted-foreground ml-0.5" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">Video coming soon</p>
                                        <p className="text-xs text-muted-foreground/50 max-w-[180px]">
                                            Replace the YouTube URL in the code to enable this video
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl overflow-hidden border border-border shadow-sm relative group">
                                        <div className="aspect-video">
                                            <iframe
                                                src={embedUrl}
                                                title={tutorial.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        </div>
                                        {/* Expand button — appears on hover */}
                                        <button
                                            onClick={() => setVideoOverlay(true)}
                                            className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Expand video"
                                        >
                                            <Maximize2 className="w-3 h-3" />
                                            Expand
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function HowToPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const handleToggle = (i: number) => {
        const opening = openIndex !== i
        setOpenIndex(opening ? i : null)
        if (opening) {
            setTimeout(() => {
                document
                    .getElementById(`tutorial-${i}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 50)
        }
    }

    return (
        <PageLayout>
            {/* Header */}
            <div className="border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-5">How To</p>
                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5">
                        Short guides to get the most
                        <br className="hidden sm:block" /> out of Owtra.
                    </h1>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                        Read through the steps or watch the video walkthrough — your choice. Each guide covers one
                        task, top to bottom.
                    </p>
                </div>
            </div>

            {/* Tutorials */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="space-y-3">
                    {tutorials.map((tutorial, i) => (
                        <div key={tutorial.id} id={`tutorial-${i}`} className="scroll-mt-6">
                            <TutorialCard
                                tutorial={tutorial}
                                index={i}
                                isOpen={openIndex === i}
                                onToggle={() => handleToggle(i)}
                            />
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-16 pt-10 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">Still stuck?</h2>
                        <p className="text-base text-muted-foreground">
                            We're happy to help — reach out and we'll get back to you fast.
                        </p>
                    </div>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all flex-shrink-0"
                    >
                        Contact us
                    </Link>
                </div>
            </div>
        </PageLayout>
    )
}