"use client";

import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 👇 Aapka naya Google Places Component yahan import karein
import LocationAutocomplete from "./LocationAutoComplete";

type Suggestion = {
  id: string;
  type: "institute" | "city" | "category";
  name: string;
  url: string;
};

export const CATEGORY_MAP = [
  // ==========================================
  // 📚 ACADEMIC & SCHOOL TUITION
  // ==========================================
  { keywords: ["class 1", "1st standard", "1st grade", "class 1st"], slug: "class-1-tuition" },
  { keywords: ["class 2", "2nd standard", "2nd grade", "class 2nd"], slug: "class-2-tuition" },
  { keywords: ["class 3", "3rd standard", "3rd grade", "class 3rd"], slug: "class-3-tuition" },
  { keywords: ["class 4", "4th standard", "4th grade", "class 4th"], slug: "class-4-tuition" },
  { keywords: ["class 5", "5th standard", "5th grade", "class 5th"], slug: "class-5-tuition" },
  { keywords: ["class 6", "6th standard", "6th grade", "class 6th"], slug: "class-6-tuition" },
  { keywords: ["class 7", "7th standard", "7th grade", "class 7th"], slug: "class-7-tuition" },
  { keywords: ["class 8", "8th standard", "8th grade", "class 8th"], slug: "class-8-tuition" },
  { keywords: ["class 9", "9th standard", "9th grade", "class 9th"], slug: "class-9-tuition" },
  { keywords: ["class 10", "10th standard", "boards", "10th boards", "matric"], slug: "class-10-tuition" },
  { keywords: ["class 11", "11th standard", "plus one", "11th science", "11th commerce"], slug: "class-11-tuition" },
  { keywords: ["class 12", "12th standard", "12th boards", "plus two", "12th science", "12th commerce", "hsc"], slug: "class-12-tuition" },
  { keywords: ["online class", "online tuition", "zoom tuition"], slug: "online-tuition" },
  { keywords: ["home tuition", "private tutor", "home tutor", "tutor at home"], slug: "home-tuition" },
  { keywords: ["cuet", "central university entrance", "du admission"], slug: "cuet-coaching" },
  { keywords: ["foundation", "pre foundation", "ntse", "ijso"], slug: "foundation-courses" },
  { keywords: ["olympiad", "imo", "nso", "math olympiad", "science olympiad"], slug: "olympiad-coaching" },

  // ==========================================
  // 🔬 ENGINEERING & MEDICAL ENTRANCE
  // ==========================================
  { keywords: ["jee", "iit", "iit jee", "mains", "advanced", "btech preparation"], slug: "jee-coaching" },
  { keywords: ["neet", "medical", "mbbs", "aiims", "bds", "prmt"], slug: "neet-coaching" },
  { keywords: ["nursing", "bsc nursing", "gnm", "anm"], slug: "nursing-entrance-coaching" },

  // ==========================================
  // 🏛️ GOVERNMENT EXAMS
  // ==========================================
  { keywords: ["upsc", "ias", "ips", "civil services", "cse"], slug: "upsc-coaching" },
  { keywords: ["pcs", "uppsc", "bpsc", "mppsc", "ras", "state services"], slug: "state-pcs-coaching" },
  { keywords: ["ssc", "cgl", "chsl", "mts", "ssc gd", "staff selection"], slug: "ssc-coaching" },
  { keywords: ["bank", "banking", "ibps", "po", "clerk", "sbi", "rbi"], slug: "banking-coaching" },
  { keywords: ["railway", "rrb", "ntpc", "group d", "alp"], slug: "railway-coaching" },
  { keywords: ["nda", "national defence academy", "army entrance"], slug: "nda-coaching" },
  { keywords: ["cds", "combined defence services"], slug: "cds-coaching" },
  { keywords: ["afcat", "air force"], slug: "afcat-coaching" },
  { keywords: ["ugc net", "net jrf", "ntanet"], slug: "ugc-net-coaching" },
  { keywords: ["csir net", "science net"], slug: "csir-net-coaching" },
  { keywords: ["ctet", "central teacher eligibility"], slug: "ctet-coaching" },
  { keywords: ["tet", "uptet", "htet", "rtet", "teacher exam"], slug: "tet-coaching" },

  // ==========================================
  // 🎓 HIGHER EDUCATION & PROFESSIONAL
  // ==========================================
  { keywords: ["cat", "mba", "xat", "mat", "iim preparation"], slug: "cat-coaching" },
  { keywords: ["gate", "mtech", "psu"], slug: "gate-coaching" },
  { keywords: ["clat", "law", "llb", "nlu"], slug: "clat-coaching" },
  { keywords: ["judiciary", "judge", "pcs j", "civil judge"], slug: "judiciary-coaching" },
  { keywords: ["ca", "chartered accountant", "cpt", "ipcc", "ca final"], slug: "ca-coaching" },
  { keywords: ["cs", "company secretary", "cseet"], slug: "cs-coaching" },
  { keywords: ["cma", "icwa", "cost management"], slug: "cma-coaching" },

  // ==========================================
  // ✈️ STUDY ABROAD
  // ==========================================
  { keywords: ["ielts", "spoken english for abroad", "ielts band"], slug: "ielts-coaching" },
  { keywords: ["toefl"], slug: "toefl-coaching" },
  { keywords: ["pte", "pearson test"], slug: "pte-coaching" },
  { keywords: ["sat", "undergrad abroad"], slug: "sat-coaching" },
  { keywords: ["gre", "ms abroad"], slug: "gre-coaching" },
  { keywords: ["gmat", "mba abroad"], slug: "gmat-coaching" },
  { keywords: ["study abroad", "foreign university", "overseas consultant", "visa consultant"], slug: "study-abroad-consultants" },
  { keywords: ["mbbs abroad", "medical abroad", "study medicine outside"], slug: "mbbs-abroad-consultancy" },

  // ==========================================
  // 💻 COMPUTER & TECHNOLOGY
  // ==========================================
  { keywords: ["coding", "c++", "java", "python", "c", "c programming"], slug: "coding-classes" },
  { keywords: ["web development", "full stack", "frontend", "backend", "react", "html", "php"], slug: "web-development" },
  { keywords: ["app development", "android", "ios", "flutter", "react native"], slug: "app-development" },
  { keywords: ["testing", "qa", "manual testing", "selenium", "automation"], slug: "software-testing" },
  { keywords: ["data science", "data analytics", "power bi", "tableau", "machine learning", "pandas"], slug: "data-science-training" },
  { keywords: ["ai", "artificial intelligence", "ml", "deep learning"], slug: "ai-ml-courses" },
  { keywords: ["cloud", "cloud computing", "azure", "gcp"], slug: "cloud-computing" },
  { keywords: ["aws", "amazon web services"], slug: "aws-training" },
  { keywords: ["devops", "docker", "kubernetes", "jenkins"], slug: "devops-training" },
  { keywords: ["cyber security", "cybersecurity", "ethical hacking", "infosec", "penetration testing"], slug: "cyber-security-training" },
  { keywords: ["ui ux", "figma", "user interface", "user experience"], slug: "ui-ux-design" },
  { keywords: ["graphic design", "photoshop", "illustrator", "canva", "coreldraw"], slug: "graphic-design" },
  { keywords: ["video editing", "premiere pro", "after effects", "final cut pro", "vlog editing"], slug: "video-editing" },
  { keywords: ["animation", "vfx", "3d animation", "blender", "maya"], slug: "animation-vfx" },

  // ==========================================
  // 💼 BUSINESS & PROFESSIONAL SKILLS
  // ==========================================
  { keywords: ["digital marketing", "seo", "smm", "social media marketing", "google ads"], slug: "digital-marketing" },
  { keywords: ["sales", "b2b sales", "cold calling"], slug: "sales-training" },
  { keywords: ["stock market", "trading", "share market", "intraday", "options trading", "nifty"], slug: "stock-market-training" },
  { keywords: ["financial modelling", "finance analytics"], slug: "financial-modelling" },
  { keywords: ["tally", "gst", "accounting software", "tally erp9", "tally prime"], slug: "tally-gst-training" },
  { keywords: ["business analytics", "business intelligence"], slug: "business-analytics" },
  { keywords: ["project management", "pmp", "scrum", "agile"], slug: "project-management" },
  { keywords: ["hr", "human resources", "payroll"], slug: "hr-training" },
  { keywords: ["entrepreneurship", "startup", "business coaching"], slug: "entrepreneurship-training" },
  { keywords: ["interview prep", "mock interview", "gd pi"], slug: "interview-preparation" },
  { keywords: ["resume building", "cv maker"], slug: "resume-building" },
  { keywords: ["career counselling", "career guidance", "what to do after 12th"], slug: "career-counselling" },

  // ==========================================
  // 🛠️ VOCATIONAL & LIFESTYLE
  // ==========================================
  { keywords: ["medical coding", "icd 10", "cpt coding"], slug: "medical-coding" },
  { keywords: ["mlt", "dmlt", "bmlt", "lab technician", "pathology"], slug: "medical-lab-technician" },
  { keywords: ["hotel management", "ihm", "hospitality"], slug: "hotel-management-coaching" },
  { keywords: ["aviation", "cabin crew", "air hostess", "ground staff"], slug: "aviation-cabin-crew" },
  { keywords: ["makeup", "beautician", "salon course", "bridal makeup", "hair styling"], slug: "beauty-makeup-courses" },
  { keywords: ["baking", "cooking", "chef course", "culinary arts", "cake making"], slug: "culinary-baking-classes" },
  { keywords: ["fashion design", "boutique", "tailoring", "stitching", "apparel design"], slug: "fashion-designing" },
  { keywords: ["interior design", "architecture decor", "cad interior"], slug: "interior-designing" },

  // ==========================================
  // 🗣️ LANGUAGES
  // ==========================================
  { keywords: ["english", "spoken english", "fluent english", "communication skills", "grammar"], slug: "english-speaking" },
  { keywords: ["hindi", "spoken hindi", "learn hindi"], slug: "hindi-speaking" },
  { keywords: ["french", "learn french", "delf", "dalf"], slug: "french-classes" },
  { keywords: ["german", "learn german", "goethe"], slug: "german-classes" },
  { keywords: ["spanish", "learn spanish", "dele"], slug: "spanish-classes" },
  { keywords: ["japanese", "jlpt", "learn japanese"], slug: "japanese-classes" },
  { keywords: ["korean", "topik", "learn korean"], slug: "korean-classes" },

  // ==========================================
  // 🎨 ARTS & CREATIVITY
  // ==========================================
  { keywords: ["dance", "choreography", "hip hop", "classical dance", "kathak", "bharatanatyam", "salsa"], slug: "dance-classes" },
  { keywords: ["music", "vocal", "hindustani", "carnatic"], slug: "music-classes" },
  { keywords: ["singing", "vocal training"], slug: "singing-classes" },
  { keywords: ["acting", "theatre", "drama", "drama school"], slug: "theatre-acting" },
  { keywords: ["guitar", "acoustic", "electric guitar"], slug: "guitar-classes" },
  { keywords: ["piano", "keyboard", "synthesizer"], slug: "piano-classes" },
  { keywords: ["tabla", "dholak"], slug: "tabla-classes" },
  { keywords: ["violin", "strings"], slug: "violin-classes" },
  { keywords: ["drawing", "painting", "water color", "oil painting"], slug: "drawing-painting" },
  { keywords: ["fine arts", "bfa prep"], slug: "fine-arts" },
  { keywords: ["sketching", "pencil art", "portrait"], slug: "sketching" },
  { keywords: ["art and craft", "origami", "diy"], slug: "art-craft-classes" },

  // ==========================================
  // 🏅 SPORTS & FITNESS
  // ==========================================
  { keywords: ["swimming", "swimmer", "pool"], slug: "swimming-classes" },
  { keywords: ["cricket", "batting coaching", "bowling coaching"], slug: "cricket-academy" },
  { keywords: ["football", "soccer"], slug: "football-academy" },
  { keywords: ["basketball", "hoops"], slug: "basketball-academy" },
  { keywords: ["badminton", "shuttle"], slug: "badminton-academy" },
  { keywords: ["tennis", "lawn tennis"], slug: "tennis-academy" },
  { keywords: ["gymnastics"], slug: "gymnastics" },
  { keywords: ["skating", "roller skating"], slug: "skating-classes" },
  { keywords: ["athletics", "running", "track and field"], slug: "athletics" },
  { keywords: ["yoga", "meditation", "asanas"], slug: "yoga-classes" },
  { keywords: ["gym", "fitness center", "workout", "bodybuilding", "personal trainer"], slug: "gym" },
  { keywords: ["martial arts", "mma", "judo", "self defense"], slug: "martial-arts" },
  { keywords: ["karate"], slug: "karate" },
  { keywords: ["taekwondo"], slug: "taekwondo" },

  // ==========================================
  // 🧸 KIDS & HOBBY LEARNING
  // ==========================================
  { keywords: ["phonics", "reading for kids", "letter sounds"], slug: "phonics" },
  { keywords: ["preschool", "play school", "kindergarten", "nursery"], slug: "preschool-programs" },
  { keywords: ["handwriting", "calligraphy", "cursive"], slug: "handwriting-improvement" },
  { keywords: ["abacus", "brain development", "mental math kids"], slug: "abacus-classes" },
  { keywords: ["vedic math", "mental math", "speed math"], slug: "vedic-maths" },
  { keywords: ["robotics", "stem", "lego", "arduino for kids"], slug: "robotics-classes" },
  { keywords: ["coding for kids", "scratch", "whitehat", "kids programming"], slug: "coding-for-kids" },
  { keywords: ["chess", "grandmaster"], slug: "chess-academy" },
  { keywords: ["personality development", "soft skills", "grooming"], slug: "personality-development" },
  { keywords: ["public speaking", "communication skills", "elocution"], slug: "public-speaking" },
  { keywords: ["life coach", "mentoring", "personal growth"], slug: "life-coach" }
];

const CITY_MAP = [
  // Delhi NCR & Nearby
  { keywords: ["Greater Noida"], slug: "greater-noida" },
  { keywords: ["noida"], slug: "noida" },
  { keywords: ["delhi", "new delhi"], slug: "delhi" },
  { keywords: ["Faridabad"], slug: "faridabad" },
  { keywords: ["gurugram", "gurgaon"], slug: "gurugram" },
  { keywords: ["modinagar"], slug: "modinagar" },
  { keywords: ["sonipat"], slug: "sonipat" },
  { keywords: ["ghaziabad"], slug: "ghaziabad" },
  { keywords: ["meerut"], slug: "meerut" },
  
  // Metro Cities
  { keywords: ["mumbai", "navi mumbai", "thane"], slug: "mumbai" },
  { keywords: ["bangalore", "bengaluru"], slug: "bangalore" },
  { keywords: ["hyderabad", "secunderabad"], slug: "hyderabad" },
  { keywords: ["chennai", "madras"], slug: "chennai" },
  { keywords: ["kolkata", "calcutta"], slug: "kolkata" },
  { keywords: ["pune", "pcmc"], slug: "pune" },
  { keywords: ["ahmedabad", "gandhinagar"], slug: "ahmedabad" },

  // Other Major Cities & Coaching Hubs
  { keywords: ["jaipur"], slug: "jaipur" },
  { keywords: ["kota"], slug: "kota" },
  { keywords: ["lucknow"], slug: "lucknow" },
  { keywords: ["kanpur"], slug: "kanpur" },
  { keywords: ["patna"], slug: "patna" },
  { keywords: ["indore"], slug: "indore" },
  { keywords: ["bhopal"], slug: "bhopal" },
  { keywords: ["chandigarh", "mohali", "panchkula"], slug: "chandigarh" },
  { keywords: ["dehradun"], slug: "dehradun" },
  { keywords: ["visakhapatnam", "vizag"], slug: "visakhapatnam" },
  { keywords: ["surat"], slug: "surat" },
  { keywords: ["nagpur"], slug: "nagpur" },
  { keywords: ["vadodara", "baroda"], slug: "vadodara" },
  { keywords: ["ranchi"], slug: "ranchi" },
  { keywords: ["bhubaneswar"], slug: "bhubaneswar" },
  { keywords: ["guwahati"], slug: "guwahati" },
];


export function SearchBar() {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 👇 Naya State: Google Places se aaye hue coordinates ke liye
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Agar click wrapperRef (Input + Dropdown) ke BAHAR hua hai
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false); // Dropdown band kar do
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(input)}`
        );
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error("Suggestion fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [input]);

  // Handle Search Execution
  // Handle Search Execution
  const handleSearch = () => {
    if (!input.trim() && !selectedLocation) return;
    setSuggestions([]);

    const lowerInput = input.toLowerCase();
    const lowerAddress = selectedLocation?.address.toLowerCase() || "";

    let matchedCategorySlug = null;
    let matchedCitySlug = null;

    // 🚀 NEW: Helper function to safely escape regex special characters
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 1. Find Category from "What" input
    for (const cat of CATEGORY_MAP) {
      for (const kw of cat.keywords) {
        // 🚀 FIX: kw ko pehle escape karein
        const safeKw = escapeRegExp(kw);

        // 🚨 PRO TIP: "c++" jaise words word-boundary (\b) ke sath kaam nahi karte kyunki '+' is not a word.
        // Isiliye agar keyword mein special char hai, toh normal includes() use karein
        const hasSpecialChar = /[.*+?^${}()|[\]\\]/.test(kw);

        if (hasSpecialChar) {
          if (lowerInput.includes(kw)) {
            matchedCategorySlug = cat.slug;
            break;
          }
        } else {
          if (new RegExp(`\\b${safeKw}\\b`, "i").test(lowerInput)) {
            matchedCategorySlug = cat.slug;
            break;
          }
        }
      }
      if (matchedCategorySlug) break;
    }

    // 2. Find City from "Where" Address
    const citySearchText = lowerAddress || lowerInput;
    for (const c of CITY_MAP) {
      for (const kw of c.keywords) {
        if (new RegExp(`\\b${escapeRegExp(kw)}\\b`, "i").test(citySearchText)) {
          matchedCitySlug = c.slug;
          break;
        }
      }
      if (matchedCitySlug) break;
    }

    // 3. 🧹 Magic Cleaner (Apply escapeRegExp here too)
    let cleanQuery = lowerInput;
    const stopWords = ["best", "top", "in", "near", "me", "coaching", "coachings", "institute", "institutes", "classes", "academy", "academies", "courses"];

    stopWords.forEach((kw) => {
      cleanQuery = cleanQuery.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, "gi"), "");
    });

    if (matchedCategorySlug) {
      CATEGORY_MAP.find(c => c.slug === matchedCategorySlug)?.keywords.forEach(kw => {
        // Special chars wale keywords directly string replace se hatayein
        if (/[.*+?^${}()|[\]\\]/.test(kw)) {
          cleanQuery = cleanQuery.replace(kw, "");
        } else {
          cleanQuery = cleanQuery.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, "gi"), "");
        }
      });
    }

    if (matchedCitySlug && !selectedLocation) {
      CITY_MAP.find(c => c.slug === matchedCitySlug)?.keywords.forEach(kw => {
        cleanQuery = cleanQuery.replace(new RegExp(`\\b${escapeRegExp(kw)}\\b`, "gi"), "");
      });
    }

    cleanQuery = cleanQuery.replace(/\s+/g, " ").trim();


    // 4. Build URL Parameters
    const params = new URLSearchParams();
    if (cleanQuery) params.set("q", cleanQuery);

    // 👇 SABSE ZAROORI: Google Coordinates URL me pass karo
    if (selectedLocation) {
      params.set("lat", selectedLocation.lat.toString());
      params.set("lng", selectedLocation.lng.toString());
      params.set("address", selectedLocation.address);
    }

    if (selectedLocation?.lat === 28.4743879 && selectedLocation?.lng === 77.50399039999999) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug)
        router.push(`/${matchedCategorySlug}/greater-noida?${params.toString()}`);
      else {
        params.set("city", "greater-noida");
        router.push(`/search?${params.toString()}`);
      }
    }
    else if (selectedLocation?.lat === 28.5355161 && selectedLocation?.lng === 77.3910265) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/noida?${params.toString()}`);
      else {
        params.set("city", "noida");
        router.push(`/search?${params.toString()}`);
      }
    }
    else if (selectedLocation?.lat === 28.7040592 && selectedLocation?.lng === 77.10249019999999) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/delhi?${params.toString()}`);
      else {
        params.set("city", "delhi");
        router.push(`/search?${params.toString()}`);
      }
    }
    else if (selectedLocation?.lat === 28.4089123 && selectedLocation?.lng === 77.3177894) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/faridabad?${params.toString()}`);
      else {
        params.set("city", "faridabad");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 28.8344396 && selectedLocation?.lng === 77.5698527) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/modinagar?${params.toString()}`);
      else {
        params.set("city", "modinagar");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 28.4594965 && selectedLocation?.lng === 77.0266383) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/gurugram?${params.toString()}`);
      else {
        params.set("city", "gurugram");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 28.99308229999999 && selectedLocation?.lng === 77.0150735) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/sonipat?${params.toString()}`);
      else {
        params.set("city", "sonipat");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 28.6691565 && selectedLocation?.lng === 77.45375779999999) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/ghaziabad?${params.toString()}`);
      else {
        params.set("city", "ghaziabad");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 28.9844618 && selectedLocation?.lng === 77.7064137) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/meerut?${params.toString()}`);
      else {
        params.set("city", "meerut");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 18.9582347 && selectedLocation?.lng === 72.8319514) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/mumbai?${params.toString()}`);
      else {
        params.set("city", "mumbai");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 17.7343219 && selectedLocation?.lng === 83.3129841) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/visakhapatnam?${params.toString()}`);
      else {
        params.set("city", "visakhapatnam");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 12.9628957 && selectedLocation?.lng === 77.57754) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/bangalore?${params.toString()}`);
      else {
        params.set("city", "bangalore");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 23.0225237 && selectedLocation?.lng === 72.57128639999999) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/ahmedabad?${params.toString()}`);
      else {
        params.set("city", "ahmedabad");
        router.push(`/search?${params.toString()}`);
      }
    } else if (selectedLocation?.lat === 26.9124336 && selectedLocation?.lng === 75.7872709) {
      params.delete("lat");
      params.delete("lng");
      if (matchedCategorySlug) router.push(`/${matchedCategorySlug}/jaipur?${params.toString()}`);
      else {
        params.set("city", "jaipur");
        router.push(`/search?${params.toString()}`);
      }
    }
    else if (matchedCategorySlug && matchedCitySlug) {
      router.push(`/${matchedCategorySlug}/${matchedCitySlug}?${params.toString()}`);
    } else if (matchedCategorySlug) {
      router.push(`/${matchedCategorySlug}?${params.toString()}`);
    } else {
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleSuggestionClick = (url: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    router.push(url);
  };

  return (
    <div
      className="
        flex
        flex-col
        w-full
        rounded-2xl sm:rounded-[2rem]
        border border-slate-200 sm:border-slate-200
        bg-white
        shadow-xl shadow-amber-500/5
        sm:h-16
        sm:flex-row
        sm:items-center
        sm:p-2
        overflow-visible
      "
    >
      {/* 1. "What" Input Box */}
      <div ref={wrapperRef} className="relative min-w-0 w-full flex-1 bg-white p-2 sm:p-0">
        <div className="flex items-center h-12 px-2 sm:px-0">
          <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400 sm:text-amber-500 sm:ml-2" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              if (input.trim().length >= 2) setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setShowSuggestions(false)
                handleSearch();
              }
            }}
            placeholder="What? (e.g. JEE Coaching, Aakash)"
            className="
              min-w-0
              flex-1
              border-0
              p-0
              text-base
              shadow-none
              focus-visible:ring-0
              placeholder:text-slate-400
              font-medium text-slate-800
            "
          />
        </div>

        {/* Suggestions Dropdown Container */}
        {(showSuggestions && (suggestions.length > 0 || loading)) && (
          <div className="absolute left-0 top-full z-[120] mt-1 sm:mt-3 w-full max-h-80 overflow-y-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {loading && (
              <div className="px-4 py-4 text-sm text-slate-500 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin"></span>
                Searching databases...
              </div>
            )}

            {!loading &&
              suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSuggestionClick(item.url)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-amber-50 border-b border-slate-50 last:border-0"
                >
                  <span className="text-lg shrink-0 bg-slate-50 p-2 rounded-lg">
                    {item.type === "institute" && "🏫"}
                    {item.type === "city" && "📍"}
                    {item.type === "category" && "📚"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">
                      {item.name}
                    </p>
                    <p className="truncate text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
                      {item.type}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* 🚀 MOBILE FIX: Clear Visual Divider */}
      <div className="h-px w-full bg-slate-200 sm:hidden"></div>

      {/* Desktop Divider */}
      <div className="hidden h-8 w-px bg-slate-200 sm:block mx-1"></div>

      {/* 2. "Where" Location Autocomplete Box */}
      {/* 🚀 MOBILE FIX: Added gray background so it looks like a distinct input box */}
      <div className="w-full sm:w-72 bg-slate-50/50 sm:bg-transparent p-2 sm:p-0">
        <LocationAutocomplete
          onLocationSelect={(lat, lng, address) => {
            setSelectedLocation({ lat, lng, address });
          }}
        />
      </div>

      {/* 🚀 MOBILE FIX: Separated Search Button */}
      <div className="p-2 sm:p-0 w-full sm:w-auto mt-1 sm:mt-0 bg-white sm:bg-transparent">
        <Button
          onClick={handleSearch}
          className="
            h-12
            w-full
            sm:w-auto
            sm:shrink-0
            rounded-xl sm:rounded-[1.2rem]
            bg-amber-400
            px-8
            text-white
            font-bold
            text-base
            hover:bg-amber-500 hover:shadow-lg hover:-translate-y-0.5
            transition-all duration-200
            md:ml-1
          "
        >
          Search
        </Button>
      </div>
    </div>
  );
}