"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnalysisResult = {
  plain_summary: string[];
  obligations: string[];
  risks: string[];
  deadlines: string[];
  deadline_events?: { title: string; date: string; note?: string }[];
  uncertainty_note?: string;
};

type ApiResponse = {
  summary?: string;
  analysis?: AnalysisResult;
  truncated?: boolean;
  analyzedSections?: number;
  totalSections?: number;
};

type MeResponse = {
  user: {
    id: string;
    email: string;
    subscriptionStatus: string;
  } | null;
};

const emptyAnalysis: AnalysisResult = {
  plain_summary: [],
  obligations: [],
  risks: [],
  deadlines: [],
  deadline_events: [],
  uncertainty_note: "",
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [analyzedSections, setAnalyzedSections] = useState<number | null>(null);
  const [totalSections, setTotalSections] = useState<number | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy Summary");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [authNotice, setAuthNotice] = useState("");

  const hasResult = Boolean(result);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as MeResponse;
        setSignedIn(Boolean(data.user));
      } catch {
        setSignedIn(false);
      }
    };
    void run();
  }, []);

  const safeAnalysis = useMemo(() => analysis || emptyAnalysis, [analysis]);
  const hasCalendarEvents =
    (safeAnalysis.deadline_events || []).filter(
      (event) => event.title?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(event.date || "")
    ).length > 0;
  const calendarEvents = (safeAnalysis.deadline_events || []).filter(
    (event) => event.title?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(event.date || "")
  );

  const toIcsDate = (isoDate: string) => isoDate.replaceAll("-", "");
  const toIcsDateTimeUtc = (date: Date) =>
    `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(
      date.getUTCDate()
    ).padStart(2, "0")}T${String(date.getUTCHours()).padStart(2, "0")}${String(
      date.getUTCMinutes()
    ).padStart(2, "0")}${String(date.getUTCSeconds()).padStart(2, "0")}Z`;
  const escapeIcsText = (value: string) =>
    value
      .replaceAll("\\", "\\\\")
      .replaceAll(";", "\\;")
      .replaceAll(",", "\\,")
      .replaceAll("\n", "\\n");
  const formatDisplayDate = (isoDate: string) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

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

  const resetAnalysis = () => {
    setFile(null);
    setResult("");
    setAnalysis(null);
    setTruncated(false);
    setAnalyzedSections(null);
    setTotalSections(null);
    setCopyLabel("Copy Summary");
    setAuthNotice("");
  };

  const handleUpload = async () => {
    if (!file) return;
    if (signedIn !== true) {
      setAuthNotice("Please sign in to analyze contracts.");
      return;
    }

    setAuthNotice("");
    setLoading(true);
    setResult("");
    setAnalysis(null);
    setTruncated(false);
    setAnalyzedSections(null);
    setTotalSections(null);
    setCopyLabel("Copy Summary");
    setAuthNotice("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data: ApiResponse = await res.json();
      if (res.status === 401) {
        setAuthNotice(data.summary || "Please sign in to analyze contracts.");
        setResult("");
        setAnalysis(null);
        return;
      }
      setResult(data.summary || "No summary returned.");
      setAnalysis(data.analysis || null);
      setTruncated(Boolean(data.truncated));
      setAnalyzedSections(
        typeof data.analyzedSections === "number" ? data.analyzedSections : null
      );
      setTotalSections(
        typeof data.totalSections === "number" ? data.totalSections : null
      );
    } catch (err) {
      console.error(err);
      setResult("Error analyzing file.");
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy Summary"), 1200);
    } catch {
      setCopyLabel("Copy Failed");
      setTimeout(() => setCopyLabel("Copy Summary"), 1400);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `contract-analysis-${stamp}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCalendarDownload = () => {
    const events = calendarEvents;
    if (!events.length) return;

    const stamp = new Date();
    const nowUtc = toIcsDateTimeUtc(stamp);
    const body = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ContractAI//Contract Deadlines//EN",
      "CALSCALE:GREGORIAN",
      ...events.flatMap((event, idx) => {
        const uid = `contractai-${Date.now()}-${idx}@contractai.local`;
        const dateValue = toIcsDate(event.date);
        const description = event.note?.trim()
          ? `Source note: ${event.note}`
          : "Extracted by ContractAI";
        return [
          "BEGIN:VEVENT",
          `UID:${uid}`,
          `DTSTAMP:${nowUtc}`,
          `DTSTART;VALUE=DATE:${dateValue}`,
          `SUMMARY:${escapeIcsText(event.title.trim())}`,
          `DESCRIPTION:${escapeIcsText(description)}`,
          "END:VEVENT",
        ];
      }),
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `contract-deadlines-${stamp.toISOString().slice(0, 10)}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderList = (items: string[], emptyText: string) => {
    if (!items.length) {
      return <p className="text-sm text-slate-500">{emptyText}</p>;
    }

    return (
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={`${item}-${idx}`} className="text-slate-700 leading-relaxed">
            - {item}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 flex flex-col">
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-20 pb-32 w-full">
        {!hasResult ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Understand contracts
                <br />
                <span className="text-blue-600">in plain English</span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Upload any PDF contract. Get instant AI analysis of key obligations,
                risks, and deadlines.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-2xl mx-auto">
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
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setAuthNotice("");
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="text-3xl font-semibold text-green-700">Ready</div>
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
                    <div className="text-3xl font-semibold text-slate-700">PDF</div>
                    <p className="font-semibold text-slate-900">Drop your PDF here</p>
                    <p className="text-sm text-slate-500">
                      or click to browse (max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {signedIn === false && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Sign in is required before analyzing contracts.{" "}
                  <Link href="/login" className="font-semibold underline">
                    Login
                  </Link>
                </div>
              )}

              {authNotice && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  {authNotice}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || loading || signedIn !== true}
                className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-all ${
                  file && !loading && signedIn === true
                    ? "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                {loading ? "Analyzing..." : signedIn === true ? "Analyze Contract" : "Sign in to Analyze"}
              </button>
            </div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-xl font-semibold mb-2 text-blue-700">Core Duties</div>
                <h3 className="font-semibold text-slate-900 mb-1">Key Obligations</h3>
                <p className="text-sm text-slate-600">What you are committed to</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-xl font-semibold mb-2 text-rose-700">Risk Check</div>
                <h3 className="font-semibold text-slate-900 mb-1">Risk Analysis</h3>
                <p className="text-sm text-slate-600">Potential red flags</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-xl font-semibold mb-2 text-amber-700">Timeline</div>
                <h3 className="font-semibold text-slate-900 mb-1">Important Dates</h3>
                <p className="text-sm text-slate-600">Critical deadlines</p>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
              <h2 className="text-3xl font-bold text-slate-900">Analysis Complete</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  {copyLabel}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Download TXT
                </button>
                <button
                  onClick={handleCalendarDownload}
                  disabled={!hasCalendarEvents}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                    hasCalendarEvents
                      ? "text-slate-700 border-slate-300 bg-white hover:bg-slate-50"
                      : "text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed"
                  }`}
                >
                  Download Calendar (.ics)
                </button>
                <button
                  onClick={resetAnalysis}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                  New Analysis
                </button>
              </div>
            </div>

            {truncated && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold text-sm">Partial Analysis</p>
                <p className="text-sm mt-1">
                  This file was chunked beyond the processing limit.
                  {analyzedSections && totalSections
                    ? ` Analyzed ${analyzedSections} of ${totalSections} sections.`
                    : " Some sections may be omitted."}
                </p>
              </div>
            )}

            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="font-semibold text-slate-900 text-sm">
                  Calendar Events in This Contract
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                  {calendarEvents.length} event{calendarEvents.length === 1 ? "" : "s"}
                </span>
              </div>
              {calendarEvents.length ? (
                <ul className="space-y-2">
                  {calendarEvents.map((event, idx) => (
                    <li
                      key={`${event.date}-${event.title}-${idx}`}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 text-sm"
                    >
                      <span className="text-slate-800">{event.title}</span>
                      <span className="text-slate-500">{formatDisplayDate(event.date)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No concrete calendar dates were found in this analysis.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Plain-English Summary
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    Overview
                  </span>
                </div>
                {renderList(
                  safeAnalysis.plain_summary,
                  "No summary bullets were returned."
                )}
              </section>

              <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Key Obligations</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700">
                    Must Do
                  </span>
                </div>
                {renderList(
                  safeAnalysis.obligations,
                  "No explicit obligations were identified."
                )}
              </section>

              <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Risks or Red Flags</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                    Attention
                  </span>
                </div>
                {renderList(
                  safeAnalysis.risks,
                  "No major risk indicators were identified."
                )}
              </section>

              <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Important Dates or Deadlines
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    Timeline
                  </span>
                </div>
                {renderList(
                  safeAnalysis.deadlines,
                  "No concrete dates/deadlines were identified."
                )}
              </section>
            </div>

            {safeAnalysis.uncertainty_note && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Note:</span>{" "}
                  {safeAnalysis.uncertainty_note}
                </p>
              </div>
            )}

            {!analysis && (
              <div className="mt-6 bg-white rounded-2xl shadow-md border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Full Text Output
                </h3>
                <pre className="whitespace-pre-wrap text-slate-700 leading-relaxed font-sans text-base">
                  {result}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}






