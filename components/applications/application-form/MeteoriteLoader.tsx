'use client'

import React, { useEffect, useRef } from 'react'

interface MeteoriteLoaderProps {
  message?: string
}

export default function MeteoriteLoader({ message = 'Processing...' }: MeteoriteLoaderProps) {
  const dotsRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-28 select-none">
      {/* Loader */}
      <div className="relative flex items-center justify-center w-16 h-16 mb-8">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border border-border"
          style={{ opacity: 0.4 }}
        />

        {/* Spinning arc */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 75%, hsl(var(--primary)) 100%)',
            animation: 'spin 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            borderRadius: '50%',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))',
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), white calc(100% - 1.5px))',
          }}
        />

        {/* Inner dot — pulses subtly */}
        <div
          className="w-1.5 h-1.5 rounded-full bg-primary"
          style={{
            animation: 'pulse 1.4s ease-in-out infinite',
            opacity: 0.7,
          }}
        />
      </div>

      {/* Message */}
      <p
        className="text-sm font-medium tracking-wide text-muted-foreground text-center"
        style={{ letterSpacing: '0.04em' }}
      >
        {message}
      </p>

      {/* Animated dots */}
      <div className="flex gap-1 mt-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-muted-foreground"
            style={{
              animation: `dotBounce 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.16}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}