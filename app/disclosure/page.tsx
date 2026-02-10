
export default function DisclosurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Legal Disclosure</h1>
        <p className="text-slate-700 leading-relaxed mb-8">
          This disclosure governs use of ContractAI and any outputs produced by the
          platform. By using the service, you acknowledge and agree to the statements below.
        </p>

        <div className="space-y-5">
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-2">No Legal Advice</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              ContractAI provides automated information and summaries for general
              informational purposes only. The service does not provide legal advice,
              legal opinion, or legal representation.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-2">
              No Attorney-Client Relationship
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              Use of ContractAI does not create an attorney-client relationship between you
              and ContractAI, its operators, or any affiliated party.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-2">User Responsibility</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              You are solely responsible for reviewing all outputs, validating accuracy,
              and obtaining qualified legal counsel before relying on any analysis for
              contractual, legal, financial, or operational decisions.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-2">
              No Warranty; Service Provided As Is
            </h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              ContractAI is provided on an &quot;as is&quot; and &quot;as available&quot;
              basis without warranties of any kind, express or implied, including
              warranties of accuracy, completeness, merchantability, fitness for a
              particular purpose, or non-infringement.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="font-semibold text-slate-900 mb-2">Limitation of Liability</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              To the maximum extent permitted by applicable law, ContractAI and its
              operators shall not be liable for any direct, indirect, incidental, special,
              consequential, exemplary, or punitive damages, or for any loss of data,
              profits, business, or opportunities arising out of or related to your use of
              the service or reliance on its outputs.
            </p>
          </section>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          Last updated: February 9, 2026.
        </p>
      </main>
    </div>
  );
}




