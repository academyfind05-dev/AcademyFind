"use client";

import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { SearchBar } from "@/components/search/SearchBar";
import TypingHeading from "./TypingHeading";
import { SocialSidebar } from "@/components/layout/SocialSidebar";
import { AdvertiseButton } from "@/components/layout/AdvertiseButton";


const trendingSearches = [
  {
    title: "Dance Classes in Noida",
    slug: "dance-classes/noida"
  },
  {
    title: "JEE Coaching in Delhi",
    slug: "jee-coaching/delhi",
  },
  {
    title: "Swimming Classes in Faridabad",
    slug: "swimming-classes/faridabad"
  },
  {
    title: "CLAT Coaching in Noida",
    slug: "clat-coaching/noida"
  },
  {
    title: "Class 9 tuitions in Gurgaon",
    slug: "class-9-tuition/gurugram"
  }


];

export function HeroSection() {
  const container = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Staggered entrance for hero elements
    tl.fromTo(
      ".hero-stagger",
      { y: 50, opacity: 0, rotateX: 10 },
      { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.15 }
    );

    // Floating animation for ambient orbs
    gsap.to(".hero-orb", {
      y: "random(-20, 20)",
      x: "random(-20, 20)",
      duration: "random(4, 6)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.5
    });
  }, { scope: container });

  return (
    <section ref={container} className="relative border-b bg-linear-to-b from-amber-50 via-background to-background perspective-[1000px]">
      {/* Social Sidebar localized to Hero Section */}
      <SocialSidebar />
      <AdvertiseButton />
      
      {/* Background Glow */}
      <div
        className="
            hero-orb
            absolute
            left-1/2
            top-10
            -z-10
            h-64
            w-64
            -translate-x-1/2
            rounded-full
            bg-amber-200/30
            blur-[60px]

            sm:h-96
            sm:w-96
          "
      />

      <div className="container mx-auto px-4 py-10 sm:py-8 lg:py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          {/* Badge */}
          <div
            className="
                hero-stagger
                mb-3
                rounded-full
                border
                border-white/50
                bg-white/30
                px-4
                py-2
                text-xs
                font-medium
                shadow-sm
                backdrop-blur-md
              "
          >
            India's Coaching Discovery Platform
          </div>

          {/* Heading */}
          <h1
            className="
                hero-stagger
                font-extrabold
                tracking-tight
                leading-[1.05]
                text-[clamp(1.9rem,4.5vw,4.25rem)]
              "
          >
            Find the Right
            <TypingHeading />
          </h1>

          {/* Description */}
          <p
            className="
                hero-stagger
                mt-3
                max-w-xl
                text-xs
                text-muted-foreground

                sm:text-sm
                lg:text-base
              "
          >
            Discover coaching institutes, tuition centers, skill-development programs, and extracurricular classes for your preparation journey.
          </p>

          {/* Search Label */}
          <p
            className="
                hero-stagger
                mt-6
                mb-3
                text-xs
                font-semibold
                uppercase
                tracking-[0.2em]
                text-amber-500

                sm:text-sm
              "
          >
            Search by Exam, Institute or City
          </p>

          {/* Search */}
          <div className="relative z-50 w-full max-w-4xl hero-stagger">
            {/* Outer Glow */}
            <div
              className="
                  pointer-events-none
                  absolute
                  inset-0
                  -z-10
                  scale-110
                  rounded-[2rem]
                  bg-linear-to-r
                  from-amber-300/20
                  via-yellow-200/20
                  to-amber-300/20
                  blur-[50px]
                "
            />

            {/* Secondary Glow */}
            <div
              className="
                  pointer-events-none
                  absolute
                  left-1/2
                  top-1/2
                  -z-10
                  h-32
                  w-[80%]
                  -translate-x-1/2
                  -translate-y-1/2
                  rounded-full
                  bg-amber-400/20
                  blur-[60px]
                  hero-orb
                "
            />

            {/* Search Card */}
            <div
              className="
                  relative
                  rounded-[2rem]
                  border
                  border-white/50
                  bg-white/40
                  p-3
                  shadow-[0_8px_32px_rgba(31,38,135,0.07)]
                  backdrop-blur-xl
                  overflow-visible
                  sm:p-4
                "
            >
              <SearchBar />
            </div>
          </div>

          {/* Trending */}
          <div className="mt-6 w-full max-w-4xl overflow-hidden">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              🔥 Trending Today
            </p>

            <div className="relative flex w-full overflow-hidden mask-horizontal-fades">
              <div className="flex w-max min-w-full shrink-0 animate-marquee gap-2 py-2">
                {[...trendingSearches, ...trendingSearches, ...trendingSearches, ...trendingSearches].map((item, index) => (
                  <Link
                    key={`${item.slug}-${index}`}
                    href={item.slug}
                    prefetch={false}
                    className="
                      shrink-0
                      rounded-full
                      border
                      border-white/30
                      bg-white/20
                      backdrop-blur-sm
                      px-4
                      py-2
                      text-sm
                      transition-all
                      hover:border-amber-200/50
                      hover:bg-white/40
                    "
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/categories"
            prefetch={false}
            className="
                mt-5
                inline-flex
                items-center
                gap-2
                font-medium
                text-amber-500
                transition-colors
                hover:text-amber-600
              "
          >
            Browse All Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row hero-stagger">
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm shadow-sm transition-all hover:border-amber-300 hover:bg-amber-100/80">
              <span className="text-slate-600">Confused about what to choose in life?</span>
              <Link
                href="/user/life-coach"
                className="inline-flex items-center gap-1 font-bold text-amber-400 transition-colors hover:text-amber-500"
                prefetch={false}
              >
                Ask our Life Coach
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}