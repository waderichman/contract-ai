"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "./brand-logo";

const navLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/disclosure", label: "Disclosure" },
];

type MeResponse = {
  user: {
    id: string;
    email: string;
    subscriptionStatus: string;
  } | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeResponse["user"]>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;
        setUser(data.user);
      } catch {
        setUser(null);
      }
    };
    void run();
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  return (
    <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
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

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden md:inline text-xs text-slate-600">
                {user.email} ({user.subscriptionStatus || "free"})
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
