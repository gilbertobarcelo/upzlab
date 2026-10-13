import type { Metadata } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://upzlab.com").replace(/\/+$/, "");
const SEO_API_URL = (
  process.env.UPZCONTROL_API_URL ||
  (process.env.NODE_ENV === "production" ? "https://egolpe.com" : "http://127.0.0.1:8000")
).replace(/\/+$/, "");
const SEO_HUB_SLUG = process.env.UPZCONTROL_SEO_HUB_SLUG || "upzlab";

type SeoPage = {
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  canonical_url?: string;
  robots?: string;
  schema_json?: string;
  facebook_pixel_id?: string;
};

export async function getSeoMetadata(path: string = "/"): Promise<Metadata> {
  const normalizedPath = path === "" ? "/" : path;
  const pageUrl = `${BASE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
  const defaultImageUrl = `${BASE_URL}/seo/default_banner.png`;

  const fallbackTitle = "UpzLab | Comunidade e ferramentas para desenvolvedores";
  const fallbackDescription =
    "Uma comunidade para desenvolvedores criarem, testarem e evoluírem com ferramentas e projetos reais.";

  const defaultMetadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: fallbackTitle,
    description: fallbackDescription,
    keywords: [
      "UpzLab",
      "desenvolvedores",
      "comunidade de tecnologia",
      "testes de aplicativos",
      "ferramentas para desenvolvedores",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
      url: pageUrl,
      siteName: "UpzLab",
      images: [
        {
          url: defaultImageUrl,
          secureUrl: defaultImageUrl,
          width: 1200,
          height: 630,
          alt: fallbackTitle,
        },
      ],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fallbackTitle,
      description: fallbackDescription,
      images: [defaultImageUrl],
    },
  };

  try {
    const encodedPath = encodeURIComponent(normalizedPath);
    const res = await fetch(
      `${SEO_API_URL}/api/seo/page?path=${encodedPath}&hub_slug=${encodeURIComponent(SEO_HUB_SLUG)}`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return defaultMetadata;
    }

    const json = await res.json() as { data?: SeoPage; hub_slug?: string };
    const seo = json.data || (json.hub_slug ? json as SeoPage : null);

    if (seo) {
      const rawImage = (seo.og_image || "/seo/default_banner.png").replace(
        /egolpe\.com\.br/g,
        "egolpe.com"
      );
      const imageUrl = rawImage.startsWith("http")
        ? rawImage
        : `${BASE_URL}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`;

      const title = seo.meta_title || fallbackTitle;
      const description = seo.meta_description || fallbackDescription;
      const ogTitle = seo.og_title || title;
      const ogDescription = seo.og_description || description;
      const canonicalUrl = seo.canonical_url
        ? seo.canonical_url.replace(/egolpe\.com\.br/g, "egolpe.com")
        : pageUrl;

      return {
        metadataBase: new URL(BASE_URL),
        title,
        description,
        keywords: seo.meta_keywords
          ? seo.meta_keywords.split(",")
          : defaultMetadata.keywords,
        icons: {
          icon: [{ url: "/favicon.svg?v=5", type: "image/svg+xml" }],
          shortcut: "/favicon.svg?v=5",
          apple: "/favicon.svg?v=5",
        },
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          url: canonicalUrl,
          siteName: "UpzLab",
          images: [
            {
              url: imageUrl,
              secureUrl: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ],
          locale: "pt_BR",
          type: seo.og_type === "article" || seo.og_type === "book" || seo.og_type === "profile"
            ? seo.og_type
            : "website",
        },
        twitter: {
          card: seo.twitter_card === "summary" ? "summary" : "summary_large_image",
          title: seo.twitter_title || ogTitle,
          description: seo.twitter_description || ogDescription,
          images: [imageUrl],
        },
        robots: seo.robots
          ? { index: !seo.robots.toLowerCase().includes("noindex"), follow: !seo.robots.toLowerCase().includes("nofollow") }
          : undefined,
        other: {
          ...(seo.facebook_pixel_id ? { "fb:app_id": seo.facebook_pixel_id } : {}),
          ...(seo.schema_json ? { "upzlab:schema_json": seo.schema_json } : {}),
        },
      };
    }
  } catch (error) {
    console.error(`Erro ao buscar SEO para a rota [${normalizedPath}]:`, error);
  }

  return defaultMetadata;
}
