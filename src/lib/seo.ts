import type { Metadata } from "next";

const BASE_URL = "https://egolpe.com";
const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "http://127.0.0.1:9000"
    : "http://127.0.0.1:8001");

export async function getSeoMetadata(path: string = "/"): Promise<Metadata> {
  const normalizedPath = path === "" ? "/" : path;
  const pageUrl = `${BASE_URL}${normalizedPath === "/" ? "" : normalizedPath}`;
  const defaultImageUrl = `${BASE_URL}/seo/default_banner.png`;

  const fallbackTitle = "É Golpe | Tecnologia Brasileira Anti-Golpes Telefônicos";
  const fallbackDescription =
    "Proteja você e sua família contra chamadas falsas e números clonados com a Inteligência Artificial gratuita do É Golpe.";

  const defaultMetadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: fallbackTitle,
    description: fallbackDescription,
    keywords: [
      "segurança",
      "anti-golpe",
      "bloqueador de chamadas",
      "É Golpe",
      "inteligência artificial",
    ],
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
      url: pageUrl,
      siteName: "É Golpe",
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
      `${API_URL}/api/seo/page?path=${encodedPath}&hub_slug=e-golpe`,
      {
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return defaultMetadata;
    }

    const json = await res.json();
    const seo = json.data || (json.hub_slug ? json : null);

    if (seo) {
      let rawImage = (seo.og_image || "/seo/default_banner.png").replace(
        /egolpe\.com\.br/g,
        "egolpe.com"
      );
      let imageUrl = rawImage.startsWith("http")
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
        icons: defaultMetadata.icons,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title: ogTitle,
          description: ogDescription,
          url: canonicalUrl,
          siteName: "É Golpe",
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
          type: (seo.og_type as any) || "website",
        },
        twitter: {
          card: (seo.twitter_card as any) || "summary_large_image",
          title: seo.twitter_title || ogTitle,
          description: seo.twitter_description || ogDescription,
          images: [imageUrl],
        },
        other: seo.facebook_pixel_id
          ? { "fb:app_id": seo.facebook_pixel_id }
          : {},
      };
    }
  } catch (error) {
    console.error(`Erro ao buscar SEO para a rota [${normalizedPath}]:`, error);
  }

  return defaultMetadata;
}
