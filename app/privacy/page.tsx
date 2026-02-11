
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy</h1>
        <p className="text-slate-700 leading-relaxed mb-4">
          We do not store uploaded contract files or extracted contract text in our
          database after analysis is completed.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          To operate billing limits and abuse protections, we store minimal usage
          metadata tied to your account (for example: analysis event counts, token
          usage, and estimated API cost). We do not save full contract contents as part
          of that usage tracking.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Contract text is sent to our AI provider only for processing your request.
          Their handling is governed by their own terms and policies.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Do not upload documents you are not authorized to share. If you need stricter
          retention or data residency guarantees, add explicit storage, deletion, and
          vendor controls before production use.
        </p>
      </main>
    </div>
  );
}




