"use client";
import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      setResult(data.summary || "No summary returned.");
    } catch (err) {
      console.error(err);
      setResult("Error analyzing file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600"></div>
            <span className="text-lg font-semibold">ContractAI</span>
          </div>
          <span className="text-sm text-slate-600">🔒 Secure</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto px-6 pt-20 pb-32 w-full">
        {!result ? (
          <>
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Understand contracts
                <br />
                <span className="text-blue-600">in plain English</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Upload any PDF contract. Get instant AI analysis of key obligations, risks, and deadlines.
              </p>
            </div>

            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-2xl mx-auto">
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : file
                    ? "border-green-500 bg-green-50"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <div className="text-5xl">✅</div>
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-5xl">📄</div>
                    <p className="font-semibold text-slate-900">
                      Drop your PDF here
                    </p>
                    <p className="text-sm text-slate-500">
                      or click to browse (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all ${
                  file && !loading
                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                {loading ? "Analyzing..." : "Analyze Contract"}
              </button>
            </div>

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-3xl mb-2">✓</div>
                <h3 className="font-semibold text-slate-900 mb-1">Key Obligations</h3>
                <p className="text-sm text-slate-600">What you're committed to</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="font-semibold text-slate-900 mb-1">Risk Analysis</h3>
                <p className="text-sm text-slate-600">Potential red flags</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-semibold text-slate-900 mb-1">Important Dates</h3>
                <p className="text-sm text-slate-600">Critical deadlines</p>
              </div>
            </div>
          </>
        ) : (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Analysis Complete</h2>
              <button
                onClick={() => {
                  setFile(null);
                  setResult("");
                }}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                ← New Analysis
              </button>
            </div>

            {/* Results Content */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="prose prose-slate max-w-none">
                <pre className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-base">
                  {result}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600"></div>
                <span className="text-xl font-bold">ContractAI</span>
              </div>
              <p className="text-slate-400 text-sm">
                Understand your contracts in plain English.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>© 2024 ContractAI. All rights reserved.</p>
            <p>Your data is encrypted and never stored</p>
          </div>
        </div>
      </footer>
    </div>
  );
}