'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Link from 'next/link'

interface Review {
  id: string
  name: string
  role: string | null
  quote: string
  rating: number
  created_at: string
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-primary text-primary'
              : 'fill-none text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-card p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <StarDisplay rating={review.rating} />
      <p className="text-sm sm:text-base text-card-foreground mb-5 leading-relaxed">
        "{review.quote}"
      </p>
      <div>
        <p className="font-semibold text-sm sm:text-base text-foreground">{review.name}</p>
        {review.role && (
          <p className="text-xs sm:text-sm text-muted-foreground">{review.role}</p>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-card p-6 sm:p-8 rounded-xl sm:rounded-2xl border border-border animate-pulse">
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-4 h-4 rounded bg-muted" />
        ))}
      </div>
      <div className="space-y-2 mb-5">
        <div className="h-3.5 bg-muted rounded w-full" />
        <div className="h-3.5 bg-muted rounded w-5/6" />
        <div className="h-3.5 bg-muted rounded w-4/6" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 bg-muted rounded w-28" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    </div>
  )
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  // Fallback reviews shown only when DB is empty (not an error)
  const fallbackReviews: Review[] = [
    {
      id: '1',
      name: 'Sarah M.',
      role: 'Software Engineer',
      quote:
        'Owtra helped me organize 50+ applications and land my dream role at a Series B startup. The AI matching feature showed me companies I never would have found on my own.',
      rating: 5,
      created_at: '',
    },
    {
      id: '2',
      name: 'James K.',
      role: 'Product Manager',
      quote:
        'Finally, a tool that understands what I\'m looking for in company culture. The automated research saved me literally hours every week.',
      rating: 5,
      created_at: '',
    },
    {
      id: '3',
      name: 'Emily R.',
      role: 'Marketing Lead',
      quote:
        'I went from scattered spreadsheets to a streamlined process. Never missed a follow-up again and my response rate doubled.',
      rating: 5,
      created_at: '',
    },
  ]

  const displayReviews = !loading && !error && reviews.length === 0 ? fallbackReviews : reviews

  return (
    <div id="testimonials" className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 sm:mb-16">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Loved by job seekers
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground">
              Join thousands who transformed their job search with Owtra
            </p>
          </div>
          <Link
            href="/reviews/new"
            className="flex-shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted transition-all"
          >
            Leave a review
          </Link>
        </div>

        {error ? (
          <p className="text-center text-muted-foreground py-12">
            Couldn't load reviews right now. Check back soon.
          </p>
        ) : loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}