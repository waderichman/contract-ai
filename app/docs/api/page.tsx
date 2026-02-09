import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">API Docs</h1>
        <p className="text-slate-600 mb-8 max-w-3xl">
          Contract analysis is available through a multipart endpoint that accepts one PDF
          file and returns structured JSON.
        </p>

        <section className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-2">POST /api/analyze</h2>
          <p className="text-sm text-slate-600 mb-4">
            Content type: multipart/form-data with field name <code>file</code>.
          </p>
          <pre className="text-sm bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
{`curl -X POST http://localhost:3000/api/analyze \\
  -F "file=@contract.pdf"`}
          </pre>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Response Shape</h2>
          <pre className="text-sm bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto">
{`{
  "summary": "string",
  "analysis": {
    "plain_summary": ["string"],
    "obligations": ["string"],
    "risks": ["string"],
    "deadlines": ["string"],
    "deadline_events": [{"title": "string", "date": "YYYY-MM-DD", "note": "string"}],
    "uncertainty_note": "string"
  },
  "truncated": false,
  "analyzedSections": 1,
  "totalSections": 1
}`}
          </pre>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
