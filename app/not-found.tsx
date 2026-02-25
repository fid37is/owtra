'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const messages = [
  {
    headline: "Well, this is awkward.",
    sub: "The page you're looking for packed its bags and left. No forwarding address.",
  },
  {
    headline: "You found the void.",
    sub: "Congrats! Unfortunately the void doesn't have what you need.",
  },
  {
    headline: "404: Page on vacation.",
    sub: "It's somewhere tropical. You, however, are not.",
  },
  {
    headline: "Houston, we have a problem.",
    sub: "The page was last seen heading toward /somewhere-else. Trail went cold.",
  },
  {
    headline: "This page ghosted you.",
    sub: "Left on read. Never existed. Classic.",
  },
]

export default function NotFound() {
  const router = useRouter()
  const [msg] = useState(() => messages[Math.floor(Math.random() * messages.length)])
  const [dots, setDots] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setDots(d => (d + 1) % 4)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #f7f5f0;
          font-family: 'DM Sans', sans-serif;
        }

        .page {
          min-height: 100dvh;
          background: #f7f5f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Subtle decorative blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          pointer-events: none;
        }
        .blob-1 {
          width: 400px; height: 400px;
          background: #d4c5f9;
          top: -100px; right: -100px;
        }
        .blob-2 {
          width: 300px; height: 300px;
          background: #fbc2c2;
          bottom: -80px; left: -60px;
        }
        .blob-3 {
          width: 200px; height: 200px;
          background: #b9f0d4;
          top: 40%; left: 10%;
        }

        .card {
          position: relative;
          z-index: 1;
          background: #ffffff;
          border: 1px solid #e8e3da;
          border-radius: 24px;
          padding: 3rem 2.5rem;
          max-width: 520px;
          width: 100%;
          text-align: center;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.04),
            0 8px 32px rgba(0,0,0,0.06),
            0 0 0 1px rgba(255,255,255,0.8) inset;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
        }

        @keyframes fadeUp {
          to { opacity: 1; transform: translateY(0); }
        }

        .number-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 1.5rem;
        }

        .four-oh-four {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(5rem, 18vw, 8rem);
          font-weight: 400;
          line-height: 1;
          color: #1a1714;
          letter-spacing: -0.03em;
          position: relative;
          z-index: 1;
        }

        .four-oh-four .zero {
          color: transparent;
          -webkit-text-stroke: 2px #1a1714;
          display: inline-block;
          animation: wobble 3s ease-in-out infinite;
        }

        @keyframes wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-4deg); }
          75% { transform: rotate(4deg); }
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0ece4;
          border: 1px solid #e2ddd4;
          border-radius: 100px;
          padding: 4px 12px;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #8a8070;
          margin-bottom: 1.25rem;
        }

        .tag-dot {
          width: 6px; height: 6px;
          background: #e05c5c;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .headline {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(1.4rem, 5vw, 1.75rem);
          font-weight: 400;
          color: #1a1714;
          line-height: 1.2;
          margin-bottom: 0.75rem;
          font-style: italic;
        }

        .sub {
          font-size: 0.9rem;
          color: #8a8070;
          line-height: 1.6;
          font-weight: 300;
          margin-bottom: 2rem;
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }

        .actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #1a1714;
          color: #f7f5f0;
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-primary:hover {
          background: #2d2926;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(26,23,20,0.2);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          color: #8a8070;
          border: 1px solid #e2ddd4;
          border-radius: 12px;
          padding: 0.75rem 1.5rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f0ece4;
          color: #1a1714;
          border-color: #d4cfc6;
          transform: translateY(-1px);
        }

        .footer-note {
          margin-top: 1.75rem;
          font-size: 0.75rem;
          color: #c4bfb5;
          font-weight: 300;
        }

        .footer-note a {
          color: #a09890;
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }

        .footer-note a:hover {
          color: #1a1714;
        }

        .searching {
          font-size: 0.7rem;
          color: #c4bfb5;
          margin-top: 1rem;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.05em;
        }

        @media (max-width: 480px) {
          .card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
          }
          .actions {
            flex-direction: column;
          }
          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="card">
          <div className="number-wrap">
            <div className="four-oh-four">
              4<span className="zero">0</span>4
            </div>
          </div>

          <div className="tag">
            <span className="tag-dot" />
            Page not found
          </div>

          <h1 className="headline">{msg.headline}</h1>
          <p className="sub">{msg.sub}</p>

          <div className="actions">
            <button className="btn-primary" onClick={() => router.push('/dashboard')}>
              ← Take me home
            </button>
            <button className="btn-secondary" onClick={() => router.back()}>
              Go back
            </button>
          </div>

          {mounted && (
            <p className="searching">
              still searching{'.'.repeat(dots)}
            </p>
          )}

          <p className="footer-note">
            If this keeps happening, <a onClick={() => router.push('/dashboard')}>let us know</a>.
          </p>
        </div>
      </div>
    </>
  )
}