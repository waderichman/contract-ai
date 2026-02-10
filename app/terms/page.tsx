
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms</h1>
        <p className="text-slate-700 leading-relaxed mb-4">
          ContractAI provides AI-generated insights to assist review workflows. It does not
          provide legal advice and should not replace qualified counsel.
        </p>
        <p className="text-slate-600 leading-relaxed">
          You are responsible for validating outputs and final decisions before signing or
          acting on any contract obligations.
        </p>
      </main>
    </div>
  );
}




