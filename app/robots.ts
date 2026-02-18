import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === 'production'
  const isMainDomain =
    process.env.NEXT_PUBLIC_APP_URL === 'https://owtra.xyz'

  // Block staging completely
  if (!isMainDomain) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/auth',
          '/api',
          '/onboarding',
          '/subscription',
        ],
      },
    ],
    sitemap: 'https://owtra.xyz/sitemap.xml',
  }
}
