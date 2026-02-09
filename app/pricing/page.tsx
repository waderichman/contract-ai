import Link from "next/link";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Pricing</h1>
        <p className="text-slate-600 mb-10 max-w-2xl">
          Start with a simple free workflow and upgrade when you need higher volume and
          team-level controls.
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
            <p className="text-3xl font-bold mb-1">$29/mo</p>
            <p className="text-sm text-slate-300 mb-6">For recurring contract workflows.</p>
            <ul className="space-y-2 text-sm text-slate-200 mb-8">
              <li>Higher upload limits</li>
              <li>Priority processing</li>
              <li>Saved analysis history</li>
            </ul>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-medium"
            >
              Upgrade
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
