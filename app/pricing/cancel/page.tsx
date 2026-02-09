import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export default function PricingCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <p className="text-sm font-semibold text-amber-700 mb-2">Checkout Canceled</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">No charge was made</h1>
          <p className="text-slate-600 mb-6">
            You can restart checkout any time from the pricing page.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
          >
            Back to Pricing
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
