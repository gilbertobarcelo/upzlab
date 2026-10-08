import { MetadataRoute } from 'next'

// URLs base
const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://egolpe.com';
const BASE_URL = rawBaseUrl.replace('egolpe.com.br', 'egolpe.com').replace(/\/$/, '');
const API_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'http://127.0.0.1:9000' : 'http://127.0.0.1:8001');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Definimos as rotas estáticas do site
  const staticRoutes = [
    '',
    '/beta',
    '/como-funciona',
    '/contato',
    '/comunidade',
    '/diferenciais',
    '/faq',
    '/problema',
    '/sobre',
    '/tecnologia',
    '/privacidade',
    '/termos',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Buscamos rotas dinâmicas do Banco (Hub "e-golpe")
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    // Faz a requisição para a nossa API do upzcontroll
    const res = await fetch(`${API_URL}/api/seo/pages?hub_slug=e-golpe`, {
      next: { revalidate: 3600 } // O Next.js vai fazer cache dessa requisição por 1 hora
    });
    
    if (res.ok) {
      const data = await res.json();
      const pages = data.pages || data.data || [];
      
      dynamicRoutes = pages
        .filter((page: any) => page.is_active !== false)
        .map((page: any) => {
          let path = page.page_path || '';
          if (!path.startsWith('/') && !path.startsWith('http')) {
            path = '/' + path;
          }
          let url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
          url = url.replace('egolpe.com.br', 'egolpe.com');
          return {
            url,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: path === '/' ? 1.0 : 0.6,
          };
        });
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
