import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://egolpe.com';
  const BASE_URL = rawBaseUrl.replace('egolpe.com.br', 'egolpe.com').replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'], 
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
