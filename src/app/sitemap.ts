import { MetadataRoute } from 'next'

const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://upzlab.com';
const BASE_URL = rawBaseUrl.replace(/\/$/, '');
const API_URL = (process.env.UPZCONTROL_API_URL || (process.env.NODE_ENV === 'production' ? 'https://egolpe.com' : 'http://127.0.0.1:8000')).replace(/\/+$/, '');
const HUB_SLUG = process.env.UPZCONTROL_SEO_HUB_SLUG || 'upzlab';
const STATIC_PUBLIC_ROUTES = [
  '/',
  '/docs',
  '/sdk',
  '/sdk/api',
  '/sdk/integracao',
  '/sdk/integracao/react-native',
  '/sdk/integracao/capacitor',
  '/sdk/integracao/kotlin',
  '/tutorial',
  '/upzlabrouter',
];

type SeoPage = {
  page_path?: string;
  is_active?: boolean;
  updated_at?: string;
};

function isPublicUpzLabPath(path: string): boolean {
  return (
    STATIC_PUBLIC_ROUTES.includes(path) ||
    path.startsWith('/docs/') ||
    path.startsWith('/docslab/')
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = STATIC_PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route === '/' ? '' : route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '/' ? 1 : route.startsWith('/sdk') || route === '/upzlabrouter' ? 0.75 : 0.8,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    const res = await fetch(`${API_URL}/api/seo/pages?hub_slug=${encodeURIComponent(HUB_SLUG)}`, {
      next: { revalidate: 3600 } // O Next.js vai fazer cache dessa requisição por 1 hora
    });
    
    if (res.ok) {
      const data = await res.json() as { pages?: SeoPage[]; data?: SeoPage[] };
      const pages = data.pages || data.data || [];
      
      dynamicRoutes = pages
        .filter((page) => page.is_active !== false)
        .map((page) => {
          let path = page.page_path || '';
          if (!path.startsWith('/') && !path.startsWith('http')) {
            path = '/' + path;
          }
          if (path.startsWith('http')) {
            return null;
          }
          if (!isPublicUpzLabPath(path)) {
            return null;
          }
          const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
          return {
            url,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: path === '/' ? 1.0 : 0.6,
          };
        })
        .filter((route): route is MetadataRoute.Sitemap[number] => route !== null);
    }
  } catch (error) {
    console.error("Erro ao buscar rotas dinâmicas para o sitemap:", error);
    // Se a API estiver fora do ar no momento do build, o sitemap estático continua funcionando normalmente
  }

  // 3. Mesclar rotas (Evitando páginas duplicadas caso a API retorne a home, por exemplo)
  const allRoutes: MetadataRoute.Sitemap = [...staticRoutes];
  const staticUrls = new Set(staticRoutes.map(r => r.url));
  
  for (const route of dynamicRoutes) {
    if (!staticUrls.has(route.url)) {
      allRoutes.push(route);
    }
  }

  return allRoutes;
}
