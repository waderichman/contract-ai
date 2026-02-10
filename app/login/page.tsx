"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-cyan-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-md mx-auto px-6 py-16 w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign in</h1>
        <p className="text-sm text-slate-600 mb-6">Access your ContractAI account.</p>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <label className="block text-sm text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4"
          />
          <label className="block text-sm text-slate-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-4"
          />
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium ${
              loading ? "bg-slate-300 text-slate-700" : "bg-slate-900 text-white"
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-sm text-slate-600 mt-4">
            No account?{" "}
            <Link href="/signup" className="text-blue-700 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
