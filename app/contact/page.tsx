import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-slate-700 leading-relaxed mb-8">
          Questions about billing, usage limits, account access, or product issues? Reach
          us at{" "}
          <a
            href="mailto:tookeylabs@protonmail.com"
            className="font-semibold text-blue-700 hover:underline"
          >
            tookeylabs@protonmail.com
          </a>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Support Topics</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Billing and subscription questions</li>
              <li>Usage limit or rate-limit requests</li>
              <li>Login and account access issues</li>
              <li>Bug reports and unexpected errors</li>
            </ul>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Before You Email</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Include your account email</li>
              <li>Add a short description of what happened</li>
              <li>Include the approximate time of the issue</li>
              <li>Share screenshots if available</li>
            </ul>
          </section>
        </div>

        <p className="text-sm text-slate-500 mt-8">
          Typical response time: within 1-2 business days.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          For legal terms and privacy details, see{" "}
          <Link href="/terms" className="text-blue-700 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-700 hover:underline">
            Privacy
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
