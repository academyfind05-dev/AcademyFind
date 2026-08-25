"use client";
import Link from "next/link";
import { FaWhatsapp, FaTelegramPlane, FaInstagram, FaFacebook, FaLinkedin, FaYoutube } from "react-icons/fa";
import { useState } from "react";
import { Share2, X } from "lucide-react";

export function SocialSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const socials = [
    {
      name: "WhatsApp",
      href: "https://wa.me/919045699938",
      icon: <FaWhatsapp className="h-5 w-5" />,
      color: "hover:bg-[#25D366] hover:text-white",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/academyfind",
      icon: <FaInstagram className="h-5 w-5" />,
      color: "hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white",
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61561180379260",
      icon: <FaFacebook className="h-5 w-5" />,
      color: "hover:bg-[#1877F2] hover:text-white",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/academyfind",
      icon: <FaLinkedin className="h-5 w-5" />,
      color: "hover:bg-[#0A66C2] hover:text-white",
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/channel/UCYiRb6vo_Rr_w3PO746hsKg",
      icon: <FaYoutube className="h-5 w-5" />,
      color: "hover:bg-[#FF0000] hover:text-white",
    },
    {
      name: "Telegram",
      href: "https://t.me/academyfind",
      icon: <FaTelegramPlane className="h-5 w-5" />,
      color: "hover:bg-[#229ED9] hover:text-white",
    },
  ];

  return (
    <>
      {/* Desktop Version - Always open */}
      <div className="fixed left-0 top-[35%] z-[60] hidden -translate-y-1/2 flex-col gap-2 rounded-r-xl bg-white/90 p-2 shadow-lg backdrop-blur-md border border-l-0 border-slate-200 transition-all hover:pr-4 md:flex">
        {socials.map((social) => (
          <Link
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            title={social.name}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-all duration-300 ${social.color}`}
          >
            {social.icon}
          </Link>
        ))}
      </div>

      {/* Mobile Version - Collapsible */}
      <div className="fixed left-0 top-[35%] z-[60] flex flex-col items-start gap-2 -translate-y-1/2 md:hidden">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="flex h-10 w-10 items-center justify-center rounded-r-xl bg-white/90 backdrop-blur-md shadow-lg border border-l-0 border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          aria-label="Toggle social links"
        >
          {isOpen ? <X className="h-5 w-5 text-slate-600" /> : <Share2 className="h-5 w-5 text-slate-600" />}
        </button>
        
        {/* Expanded Links */}
        <div 
          className={`absolute left-12 top-0 w-max grid grid-cols-3 gap-2 rounded-xl bg-white/90 p-2 shadow-lg backdrop-blur-md border border-slate-200 transition-all duration-300 origin-left ${
            isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
          }`}
        >
          {socials.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              title={social.name}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-all duration-300 ${social.color}`}
              onClick={() => setIsOpen(false)}
            >
              {social.icon}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
