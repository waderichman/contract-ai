
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 flex flex-col">
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy</h1>
        <p className="text-slate-700 leading-relaxed mb-4">
          Uploaded files are processed for analysis requests and are not intended to be
          retained beyond what is needed for operation and debugging.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Do not upload documents you are not authorized to share. If you need stricter
          retention, add explicit storage and deletion controls before production use.
        </p>
      </main>
    </div>
  );
}




