"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeResponse = {
  user: {
    id: string;
    email: string;
    subscriptionStatus: string;
  } | null;
};

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<MeResponse["user"]>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setCheckingUser(false);
      }
    };
    void run();
  }, []);

  const startCheckout = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
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
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Pricing</h1>
        <p className="text-slate-600 mb-10 max-w-2xl">
          Start free and upgrade when you need higher analysis limits with fair-use
          protections.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-7">
            <p className="text-sm font-semibold text-blue-700 mb-2">Starter</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">$0</p>
            <p className="text-sm text-slate-500 mb-6">For individual use and demos.</p>
            <ul className="space-y-2 text-sm text-slate-700 mb-8">
              <li>1 contract analysis per day</li>
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
              <li>Up to 20 analyses per day</li>
              <li>Up to 300 analyses per month</li>
              <li>Fair-use rate limits and usage safeguards</li>
            </ul>

            {checkingUser ? (
              <p className="text-sm text-slate-200 mb-3">Checking account...</p>
            ) : user ? (
              <p className="text-sm text-slate-200 mb-3">
                Signed in as <span className="font-semibold">{user.email}</span>
              </p>
            ) : (
              <p className="text-sm text-amber-200 mb-3">
                Sign in first to connect subscription to your account.
              </p>
            )}

            {error && <p className="text-xs text-rose-300 mb-3">{error}</p>}

            {user ? (
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
            ) : (
              <Link
                href="/login"
                className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-900"
              >
                Sign In to Upgrade
              </Link>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}



