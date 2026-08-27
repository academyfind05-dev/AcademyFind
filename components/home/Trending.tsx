"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useRef, useState, useEffect } from "react";

const destinations = [
  {
    title: "Best JEE Coaching in Noida",
    subtitle: "500+ Institutes",
    href: "/jee-coaching/noida",
  },
  {
    title: "Top NEET Coaching in Greater Noida",
    subtitle: "450+ Institutes",
    href: "/neet-coaching/greater-noida",
  },
  {
    title: "Highest rated BasketBall Academy in Delhi",
    subtitle: "80+ Academies",
    href: "/basketball-academy/delhi",
  },
  {
    title: "Best Violin Classes in Faridabad",
    subtitle: "70+ Classes",
    href: "/violin-classes/faridabad",
  },
  {
    title: "Class 10 Tuition In Delhi",
    subtitle: "300+ Institutes",
    href: "/class-10-tuition/delhi",
  },
];

const categories = [
  {
    title: "JEE",
    href: "/jee-coaching",
  },
  {
    title: "NEET",
    href: "/neet-coaching",
  },
  {
    title: "UPSC",
    href: "/upsc-coaching",
  },
  {
    title: "CLAT",
    href: "/clat-coaching",
  },
  {
    title: "Fashion Designing",
    href: "/fashion-designing",
  },
  {
    title: "Cricket",
    href: "/cricket-academy",
  },
  {
    title: "AWS Training",
    href: "/aws-training",
  },
  // {
  //   title: "Graphic Designing",
  //   href: "/graphic-designing",
  // },
  {
    title: "Karate",
    href: "/karate",
  },
  {
    title: "Class 6 Tuition",
    href: "/class-6-tuition",
  },
];

export function TrendingDestinations() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Vertical Infinite Auto-Scroll Logic
  useEffect(() => {
    let animationFrameId: number;
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scroll = () => {
      if (!isHovered) {
        scrollContainer.scrollTop += 0.8; // scroll speed
        // Loop back when we scroll through a full set
        if (scrollContainer.scrollTop >= scrollContainer.scrollHeight / 3) {
          scrollContainer.scrollTop = 0;
        }
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered]);

  return (
    <section className="py-12 sm:py-16 lg:py-24 z-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-sm font-medium text-amber-500">
              Trending Searches
            </span>

            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              What Students Are Searching
            </h2>

            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Discover the most searched coaching destinations across India.
            </p>
          </div>

          <Link
            href="/categories"
            prefetch={false}
            className="hidden items-center gap-2 font-medium transition-colors hover:text-amber-500 md:flex"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left */}
          <div className="lg:col-span-8 min-w-0">
            <div
              ref={scrollRef}
              className="space-y-3 max-h-[450px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
            >
              {[...destinations, ...destinations, ...destinations].map((item, index) => (
                <Link
                  key={`${item.title}-${index}`}
                  href={item.href}
                  prefetch={false}
                  className="
                    group
                    flex
                    min-w-0
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    bg-background
                    p-4
                    transition-all
                    hover:border-amber-200
                    hover:shadow-md
                    sm:p-5
                  "
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-amber-50
                        text-sm
                        font-semibold
                        text-amber-500
                      "
                    >
                      #{(index % destinations.length) + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium sm:text-base">
                        {item.title}
                      </h3>

                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className="
                      h-4
                      w-4
                      shrink-0
                      text-muted-foreground
                      transition-all
                      group-hover:translate-x-1
                      group-hover:text-amber-500
                    "
                  />
                </Link>
              ))}
            </div>

            {/* Mobile CTA */}
            <Link
              href="/search"
              className="
                mt-5
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                p-3
                font-medium
                transition-colors
                hover:bg-amber-50
                md:hidden
              "
            >
              View All Searches
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 min-w-0">
            <div className="rounded-2xl border bg-background p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-amber-500" />

                <h3 className="font-semibold">
                  Popular Categories
                </h3>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                Explore coaching categories students search the most.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.href}
                    href={category.href}
                    prefetch={false}
                    className="
                      rounded-full
                      border
                      px-3
                      py-1.5
                      text-xs
                      font-medium
                      transition-all
                      hover:border-amber-200
                      hover:bg-amber-50
                      sm:px-4
                      sm:py-2
                      sm:text-sm
                    "
                  >
                    {category.title}
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-medium">
                  🔥 Most Searched This Week
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  JEE Coaching in Noida and Dance Classes in Noida are trending.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}