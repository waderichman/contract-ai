"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./brand-logo";

const navLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/disclosure", label: "Disclosure" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo textClassName="text-lg font-semibold text-slate-900" iconSize={34} />
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/"
          className="text-sm font-medium px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
        >
          Analyze PDF
        </Link>
      </div>
    </header>
  );
}
