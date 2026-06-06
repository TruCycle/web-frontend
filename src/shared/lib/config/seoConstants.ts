/**
 * Centralised SEO constants.
 *
 * Every meta/OG/canonical tag should reference these instead of
 * scattering magic strings across features.
 */

/** Canonical origin — no trailing slash. */
export const SITE_ORIGIN = 'https://trucycle.co.uk' as const

export const BRAND_NAME = 'TruCycle' as const

export const DEFAULT_TITLE =
  'TruCycle — Free Local Reuse | Give & Collect Items Near You' as const

export const DEFAULT_DESCRIPTION =
  "Give away what you don't need. Collect what you do. TruCycle connects neighbours for free, local item exchange across London and the UK." as const

/** Relative path from public root — gets resolved against SITE_ORIGIN for absolute URLs. */
export const DEFAULT_OG_IMAGE = '/og-image.png' as const

export const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/share/14a4q94yc1A/',
  instagram: 'https://www.instagram.com/realtrucycle',
  linkedin: 'https://www.linkedin.com/company/tru-cycle/',
  twitter: 'https://x.com/realTruCycle',
  tiktok: 'https://www.tiktok.com/@trucycle',
  youtube: 'https://youtube.com/@realtrucycle',
} as const
