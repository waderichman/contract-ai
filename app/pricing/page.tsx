"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export default function PricingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async () => {
    const value = email.trim();
    if (!value) {
      setError("Enter your email to continue.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Checkout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Pricing</h1>
        <p className="text-slate-600 mb-10 max-w-2xl">
          Start free and upgrade when you need higher usage limits and subscription-backed
          features.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-7">
            <p className="text-sm font-semibold text-blue-700 mb-2">Starter</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">$0</p>
            <p className="text-sm text-slate-500 mb-6">For individual use and demos.</p>
            <ul className="space-y-2 text-sm text-slate-700 mb-8">
              <li>Single contract analysis</li>
              <li>Obligation and risk extraction</li>
              <li>TXT and ICS exports</li>
            </ul>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
            >
              Start Free
            </Link>
          </section>

          <section className="bg-slate-900 text-white border border-slate-900 rounded-2xl p-7">
            <p className="text-sm font-semibold text-cyan-300 mb-2">Pro</p>
            <p className="text-3xl font-bold mb-1">$9.99/mo</p>
            <p className="text-sm text-slate-300 mb-6">For recurring contract workflows.</p>
            <ul className="space-y-2 text-sm text-slate-200 mb-6">
              <li>Higher upload limits</li>
              <li>Priority processing</li>
              <li>Saved analysis history</li>
            </ul>

            <label className="block text-xs text-slate-300 mb-2" htmlFor="billing-email">
              Work email
            </label>
            <input
              id="billing-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2 rounded-lg bg-white text-slate-900 border border-white/30 mb-3 text-sm"
            />

            {error && <p className="text-xs text-rose-300 mb-3">{error}</p>}

            <button
              onClick={startCheckout}
              disabled={loading}
              className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                loading
                  ? "bg-slate-300 text-slate-700 cursor-not-allowed"
                  : "bg-white text-slate-900"
              }`}
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </section>
        </div>

        <p className="text-xs text-slate-500 mt-6">
          Subscriptions are processed by Stripe. Pro access enforcement requires a linked
          user account and entitlement store.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
