import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-sm font-medium text-gray-500 whitespace-nowrap overflow-x-auto no-scrollbar pb-1">
      <Link href="/" className="flex items-center hover:text-gray-900 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center">
          <ChevronRight className="w-4 h-4 mx-1.5 text-gray-400 flex-shrink-0" />
          <Link 
            href={item.href} 
            className={`hover:text-gray-900 transition-colors truncate max-w-[150px] sm:max-w-none ${index === items.length - 1 ? 'text-gray-900 pointer-events-none' : ''}`}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}