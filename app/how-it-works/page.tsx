import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">How ContractAI Works</h1>
        <p className="text-slate-600 mb-10 max-w-3xl">
          ContractAI converts dense legal PDFs into practical outputs: plain-language
          summaries, obligations, risk flags, and calendar-ready deadlines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs text-blue-700 font-semibold mb-2">STEP 1</p>
            <h2 className="font-semibold text-slate-900 mb-2">Upload PDF</h2>
            <p className="text-sm text-slate-600">
              Drag and drop a contract PDF. The file is parsed and split into sections for
              reliable processing.
            </p>
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs text-blue-700 font-semibold mb-2">STEP 2</p>
            <h2 className="font-semibold text-slate-900 mb-2">AI Analysis</h2>
            <p className="text-sm text-slate-600">
              The model extracts key duties, risks, and deadlines, then merges section
              findings into one final analysis.
            </p>
          </section>
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-xs text-blue-700 font-semibold mb-2">STEP 3</p>
            <h2 className="font-semibold text-slate-900 mb-2">Take Action</h2>
            <p className="text-sm text-slate-600">
              Export a text report and download an ICS calendar file for concrete contract
              dates.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
