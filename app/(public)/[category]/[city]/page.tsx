// ============================================================
// OPTIMIZED METADATA + JSON-LD — AcademyFind [category]/[city]
// ============================================================
//
// Drop-in replacement for your existing generateMetadata function
// and add the JSON-LD component inside the page's <main>.
//
// KEY IMPROVEMENTS:
//  1. Keyword-rich, formula-based title & description
//  2. Canonical URL (prevents duplicate content penalty)
//  3. robots meta (controls indexing explicitly)
//  4. alternates (canonical)
//  5. JSON-LD: ItemList (for listings) + LocalBusiness (top institutes)
//  6. JSON-LD: BreadcrumbList
//  7. JSON-LD: FAQPage (powers FAQ rich snippet in SERP)
// ============================================================

import { getInstitutesByCategoryAndCity } from "@/lib/institutes/institutes_cat_city";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import formatSlug from "@/lib/formatSlug";
import Script from "next/script";

import Breadcrumb from "@/components/navigation/BreadCrumbs";
import CityHero from "@/components/City_Category/CityHero";
import CityFilters from "@/components/City_Category/CityFilters";
import InstituteListing from "@/components/City_Category/InstituteListing";
import CityAbout from "@/components/City_Category/CityAbout";
import RelatedCities from "@/components/City_Category/RelatedCities";
import CityFAQ from "@/components/City_Category/CityFAQ";
import CityCTA from "@/components/City_Category/CityCTA";
import Pagination from "@/components/navigation/Pagination";
import MapToggleSection from "@/components/maps/MapToggleSection";
import { getCachedInstitutesByCategoryAndCity, getUncachedInstitutesByCategoryAndCity } from "@/lib/cachedQueries";

export const revalidate = 86400;

// ─── Types ───────────────────────────────────────────────────
interface PageProps {
  params: Promise<{ category: string; city: string }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
    q?: string;
    lat?: string;
    lng?: string;
    address?: string;
    radius?: string;
    rating?: string;
    userLat?: string;
    userLng?: string;
    closestUser?: string;
    mode?: string;
    providerType?: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Returns a realistic student-count estimate string like "50+" or "100+"
 * so your title/description doesn't sound empty on new cities.
 * Replace with real DB count if available.
 */
function estimateCount(count: number): string {
  if (count <= 0) return "Top";
  const rounded = Math.floor(count / 10) * 10;
  return `${rounded > 0 ? rounded + "+" : count}`;
}

// ─── 1. METADATA ─────────────────────────────────────────────
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category, city } = await params;
  if (category === 'api' || category.startsWith('api')) {
    notFound();
  }
  const { page } = await searchParams;  // ← was missing entirely

  const categoryName = formatSlug(category);
  const cityName = formatSlug(city);
  const currentYear = new Date().getFullYear();
  const currentPage = page && parseInt(page, 10) > 1 ? parseInt(page, 10) : null;

  // Page 1 → clean URL, page 2+ → self-referential with ?page=
  const canonicalUrl = currentPage
    ? `https://academyfind.com/${category}/${city}?page=${currentPage}`
    : `https://academyfind.com/${category}/${city}`;

  const seoTitle = currentPage
    ? `Best ${categoryName} in ${cityName} - Page ${currentPage} | AcademyFind`
    : `Best ${categoryName} in ${cityName} ${currentYear} | Fees, Reviews & Admissions`;

  const seoDescription = `Find the best ${categoryName} in ${cityName}. Compare fees, read student reviews, check batch timings, and get directions. Updated ${currentYear} listings on AcademyFind.`;

  return {
    title: seoTitle,
    description: seoDescription,

    alternates: {
      canonical: canonicalUrl,  // ← self-referential now
    },

    // Page 2+ = noindex but follow
    robots: currentPage
      ? { index: false, follow: true }
      : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-snippet": -1,
          "max-image-preview": "large",
          "max-video-preview": -1,
        },
      },

    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "AcademyFind",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: "https://academyfind.com/final-logo.png",
          width: 1200,
          height: 630,
          alt: `Best ${categoryName} in ${cityName} - AcademyFind`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      site: "@academyfind",
      images: ["https://academyfind.com/final-logo.png"],
    },

    // Only emit keywords on page 1
    ...(currentPage === null && {
      keywords: [
        `${categoryName} in ${cityName}`,
        `best ${categoryName} ${cityName}`,
        `top 10 ${categoryName} in ${cityName}`,
        `${categoryName} classes in ${cityName}`,
        `${categoryName} coaching centers ${cityName}`,
        `${categoryName} fees in ${cityName}`,
        `${categoryName} near me`,
        `${categoryName} reviews ${cityName}`,
        `${categoryName} admission ${cityName}`,
        `${categoryName} contact number ${cityName}`,
        `affordable ${categoryName} ${cityName}`,
        `top rated ${categoryName} in ${cityName}`,
        `list of ${categoryName} in ${cityName}`,
        `where to study ${categoryName} in ${cityName}`,
      ],
    }),
  };
}

// ─── 2. JSON-LD COMPONENT ────────────────────────────────────
// Yeh component page ke andar Script tag se inject hoga.
// Teen schema types:
//   a) ItemList  → Google ko samajh aata hai ki page pe listings hain
//   b) BreadcrumbList → Breadcrumbs SERP mein dikhte hain
//   c) FAQPage   → FAQ rich snippets (bahut CTR badhaata hai)

interface Institute {
  id: string;
  name: string;
  slug: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  phone?: string | null;
}

interface JsonLdProps {
  institutes: Institute[];
  categoryName: string;
  cityName: string;
  category: string;
  city: string;
  totalCount: number;
}

function JsonLdSchemas({
  institutes,
  categoryName,
  cityName,
  category,
  city,
  totalCount,
}: JsonLdProps) {
  const baseUrl = "https://academyfind.com";
  const pageUrl = `${baseUrl}/${category}/${city}`;
  const currentYear = new Date().getFullYear();

  // ── a) ItemList Schema ──
  // Google isko carousel ya listing rich result ke liye use karta hai
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${categoryName} in ${cityName} ${currentYear}`,
    description: `Top ${estimateCount(totalCount)} ${categoryName} in ${cityName} with fees, reviews, and contact details.`,
    url: pageUrl,
    numberOfItems: totalCount,
    itemListElement: institutes.slice(0, 10).map((institute, index) => {
      const reviewSchema = institute.googleRating ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: institute.googleRating,
          reviewCount: institute.googleReviewCount || 1, // Default 1 if rating exists but count is 0
        }
      } : {};
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "EducationalOrganization",
          url: `${baseUrl}/institute/${institute.id}-${institute.slug}`,
          name: institute.name,
          telephone: institute.phone || undefined,
          address: {
            "@type": "PostalAddress",
            addressLocality: cityName,
            streetAddress: institute.address || undefined,
          },
          ...reviewSchema
        }
      };
    }),
  }
  // ── b) BreadcrumbList Schema ──
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@id": `${pageUrl}#breadcrumb`,
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${baseUrl}/${category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${categoryName} in ${cityName}`,
        item: pageUrl,
      },
    ],
  };

  // ── c) FAQPage Schema ──
  // Yeh SERP mein directly FAQ dropdown dikhata hai → bahut CTR boost karta hai
  // Ideally CityFAQ component se real FAQs fetch karo — filhaal common ones hardcode
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Which are the top 10 best ${categoryName} in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `AcademyFind lists the top-rated ${categoryName} in ${cityName} ranked by student reviews, faculty experience, and past results. Visit our page to explore the top 10 institutes, compare their fees, and check batch timings.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the average fee structure for ${categoryName} in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The fees for ${categoryName} in ${cityName} can vary greatly depending on the institute's reputation and facilities. Generally, it ranges from affordable options to premium coaching. You can check the exact fee structure for each institute on AcademyFind.`,
        },
      },
      {
        "@type": "Question",
        name: `How can I find ${categoryName} near my location in ${cityName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use the "Closest to Me" filter on the AcademyFind ${cityName} page to instantly find ${categoryName} near your current location. You can also view them on our interactive map.`,
        },
      },
    ],
  };

  // ── d) WebPage Schema (optional but helpful for E-E-A-T signals) ──
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Best ${categoryName} in ${cityName} ${currentYear}`,
    url: pageUrl,
    description: `Discover and compare the best ${categoryName} in ${cityName}. Updated ${currentYear} listings with fees, reviews, and admissions info.`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: categoryName, item: `${baseUrl}/${category}` },
        { "@type": "ListItem", position: 3, name: `${categoryName} in ${cityName}`, item: pageUrl },
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "AcademyFind",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/final-logo.png`,
      },
    },
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      name: "AcademyFind",
      url: baseUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  };
  // ── e) CollectionPage Schema (🔥 GOD LEVEL: Defines the page purpose) ──
  const collectionPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${categoryName} in ${cityName} ${currentYear}`,
    description: `Top ${estimateCount(totalCount)} ${categoryName} in ${cityName} with fees, reviews, and contact details.`,
    url: pageUrl,
    about: {
      "@type": "Thing",
      name: `${categoryName} in ${cityName}`
    }
  };

  return (
    <>
      <Script
        id="schema-itemlist"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="schema-webpage"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Script
        id="schema-collection"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageSchema) }}
      />
    </>
  );
}

// ─── 3. PAGE COMPONENT ───────────────────────────────────────
export default async function CategoryCityPage({ params, searchParams }: PageProps) {
  const { category, city } = await params;
  if (category === 'api' || category.startsWith('api')) {
    notFound();
  }
  const { sort = "reviews", page, q, lat, lng, address, radius, rating, userLat, userLng, closestUser, mode, providerType } =
    await searchParams;

  const categoryName = formatSlug(category);
  const cityName = formatSlug(city);

  const rawPage = page ? parseInt(page, 10) : 1;
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const isClosestToMeActive = closestUser === "true";
  const finalLat = isClosestToMeActive ? userLat : lat;
  const finalLng = isClosestToMeActive ? userLng : lng;

  const parsedLat = finalLat ? parseFloat(finalLat) : undefined;
  const parsedLng = finalLng ? parseFloat(finalLng) : undefined;
  const parsedRadius = radius ? parseInt(radius, 10) : undefined;
  const minRating = rating ? parseFloat(rating) : undefined;

  const hasUniqueParams = !!(q || parsedLat || parsedLng);

  const { institutes, totalPages, totalCount, exactAreaMatch } = hasUniqueParams
    ? await getUncachedInstitutesByCategoryAndCity(
      category,
      city,
      sort,
      currentPage,
      q,
      parsedLat,
      parsedLng,
      parsedRadius,
      minRating,
      mode,
      providerType
    )
    : await getCachedInstitutesByCategoryAndCity(
      category,
      city,
      sort,
      currentPage,
      minRating,
      mode,
      providerType
    );

  const displayLocationText = address || q || cityName;

  return (
    <main className="max-w-7xl mx-auto px-5 py-10">
      {/* ✅ JSON-LD Structured Data — inject karo page 1 pe hi, paginated pages pe skip karo */}
      {currentPage === 1 && (
        <JsonLdSchemas
          institutes={institutes}
          categoryName={categoryName}
          cityName={cityName}
          category={category}
          city={city}
          totalCount={totalCount}
        />
      )}

      <Breadcrumb
        items={[
          { label: categoryName, href: `/${category}` },
          { label: cityName, href: `/${category}/${city}` },
        ]}
      />

      <CityHero categoryName={categoryName} cityName={cityName} totalCount={totalCount} />

      <div className="flex flex-col lg:flex-row gap-8 relative mt-8">
        <aside className="lg:w-64 shrink-0 relative lg:sticky lg:top-24 self-start h-fit z-10 mb-6 lg:mb-0">
          <div className="sticky top-24">
            <CityFilters category={category} city={city} hasLocation={!!lat} />
          </div>
        </aside>

        <div className="flex-1 min-w-0 w-full">
          <MapToggleSection
            institutes={institutes.map((institute) => ({
              id: institute.id,
              name: institute.name,
              latitude: institute.latitude,
              longitude: institute.longitude,
              slug: `${institute.id}-${institute.slug}`,
            }))}
          />

          {/* 🔴 Fallback Banner */}
          {(q || address || isClosestToMeActive) && exactAreaMatch === false && (
            <div className="mt-6 mb-2 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm animate-in fade-in zoom-in duration-300">
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-1">📍</span>
                <div>
                  <h4 className="text-lg font-bold">
                    Couldn&apos;t find verified {categoryName} institutes near your exact location
                  </h4>
                  <p className="mt-1 text-sm text-amber-700">
                    Don&apos;t worry! We&apos;ve found the best and highly-rated institutes in other
                    areas of <strong>{cityName}</strong> for you (Sorted by distance).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 🟢 Success Banner */}
          {(q || address || isClosestToMeActive) && exactAreaMatch === true && (
            <div className="mt-6 mb-2 text-sm text-slate-500 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Showing results near:{" "}
              <span className="font-semibold text-slate-800 capitalize">
                &quot;{isClosestToMeActive ? "Your Current Location" : displayLocationText}&quot;
              </span>
            </div>
          )}

          <InstituteListing institutes={institutes} category={category} />

          <Pagination totalPages={totalPages} />
        </div>
      </div>

      <CityAbout categoryName={categoryName} cityName={cityName} />
      <RelatedCities category={category} cityName={city} citySlug={city} />
      <CityFAQ categoryName={categoryName} cityName={cityName} />
      <CityCTA />
    </main>
  );
}