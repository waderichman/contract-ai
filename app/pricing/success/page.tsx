import Link from "next/link";

export default function PricingSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-green-50 flex flex-col">
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <p className="text-sm font-semibold text-emerald-700 mb-2">Payment Received</p>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">You are subscribed to Pro</h1>
          <p className="text-slate-600 mb-6">
            Your checkout completed successfully. If access does not update immediately,
            refresh after a few seconds.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
          >
            Return to Analyzer
          </Link>
        </div>
      </main>
    </div>
  );
}




