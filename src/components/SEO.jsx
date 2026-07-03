import React from 'react'
import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'PawPawTrain'
const BASE_URL = 'https://pawpawtrain.com'
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`

/**
 * Reusable SEO component for per-route meta tags.
 * Falls back to defaults if any prop is omitted.
 */
export default function SEO({
  title,
  description = 'AI-powered virtual pet social platform. Adopt, train, play and create AI art for your pets.',
  keywords = 'virtual pet, AI pet, pet social, pet training, AI art, pet game',
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  type = 'website',
  schema = null,
  noIndex = false,
  children,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - AI Virtual Pet Social Platform`

  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PawPawTrain',
    url: BASE_URL,
    description: 'AI-powered virtual pet social platform for adopting, training, and creating art with virtual pets.',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}

      {children}
    </Helmet>
  )
}

export { SITE_NAME, BASE_URL, DEFAULT_IMAGE }
