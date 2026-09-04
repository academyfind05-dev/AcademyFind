import SearchHero from "@/components/searchPage/SearchHero";
import SearchFilters from "@/components/searchPage/SearchFilters";
import SearchResultsHeader from "@/components/searchPage/SearchResultsHeader";
import InstituteResults from "@/components/searchPage/InstituteResults";
import RelatedCategories from "@/components/searchPage/RelatedCategories";
import RelatedCities from "@/components/searchPage/RelatedCities";
import RelatedBlogs from "@/components/searchPage/RelatedBlogs";
import CompareCTA from "@/components/searchPage/CompareCTA";
import MapToggleSection from "@/components/maps/MapToggleSection"; // 👈 Naya Import Map ke liye
import { prisma } from "@/lib/prisma"; 
import { Metadata } from "next"; 

type Props = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    city?: string;
    category?: string; 
    rating?: string;   
    lat?: string;
    lng?: string;
    address?: string;
    radius?: string;
    sort?: string;
    page?: string;
    userlat?: string;
    userlng?: string;
    providerType?: string;
  }>;
};

// ─── 1. DYNAMIC METADATA ───
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = "", city = "", category = "", address = "" } = await searchParams;

  let titleStr = "Search Institutes & Coaching";
  
  if (q) {
    titleStr = `Results for "${q}"`;
  } else if (address) {
    titleStr = `Top Institutes near ${address.split(',')[0]}`; // Crossings Republik
  } else if (category && city) {
    titleStr = `${category.replace(/-/g, ' ')} in ${city.replace(/-/g, ' ')}`;
  } else if (city) {
    titleStr = `Top Institutes in ${city.replace(/-/g, ' ')}`;
  } else if (category) {
    titleStr = `${category.replace(/-/g, ' ')} Institutes`;
  }

  const title = `${titleStr} | AcademyFind`;
  const description = "Search, filter, and compare the best coaching institutes and schools on AcademyFind.";

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, url: "https://www.academyfind.com/search", type: "website" },
  };
}

// ─── 2. PAGE COMPONENT ───
export default async function SearchPage({ searchParams }: Props) {
  const { 
    q = "", type = "", city = "", category = "", rating = "",
    lat = "", lng = "", address = "", radius = "5", sort = "rating", page = "1",
    userlat = "", userlng = "",
    providerType = "" 
  } = await searchParams;

  const categories = await prisma.category.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } });
  const cities = await prisma.city.findMany({
    where: { institutes: { some: { isActive: true, isPublished: true } } },
    select: { name: true, slug: true },
    orderBy: [{ name: 'asc' }, { state: 'asc' }]
  });

  return (
    <>
      <SearchHero query={q || address || city} />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          
          <SearchFilters 
            categories={categories} 
            cities={cities} 
            currentType={type} 
            currentCity={city} 
            currentCategory={category}
            currentRating={rating}
            currentLat={lat}
            currentLng={lng}
            currentRadius={radius}
            currentSort={sort}
            currentProviderType={providerType}
          />

          <div className="space-y-14">
            <SearchResultsHeader 
               query={q || address} 
               type={type} 
               city={city} 
               category={category} 
               rating={rating}
            />

            <InstituteResults 
               query={q} type={type} city={city} category={category} 
               rating={rating} lat={lat} lng={lng} radius={radius} 
               sort={sort} page={page} providerType={providerType}
               userlat={userlat} userlng={userlng}
            />

            <RelatedCategories />
            <RelatedCities />
            <RelatedBlogs />
            <CompareCTA />
          </div>
        </div>
      </section>
    </>
  );
}