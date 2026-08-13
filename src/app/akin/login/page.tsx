"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ text: "", type: "" });

  const handleResetRequest = async () => {
    setResetLoading(true);
    setResetMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/auth/reset-request", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResetMessage({ text: "Password reset link sent to admin email.", type: "success" });
      } else {
        setResetMessage({ text: data.error || "Failed to send reset email.", type: "error" });
      }
    } catch {
      setResetMessage({ text: "Connection error.", type: "error" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/akin");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }}
    >
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)" }}>
            <span className="text-3xl">🔐</span>
          </div>
          <h1
            className="text-white font-bold"
            style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1.8rem" }}
          >
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-2" style={{ fontSize: "1rem" }}>
            Sign in to manage your ebook drip funnel
          </p>
        </div>

        {/* Login Form Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(255, 255, 255, 0.07)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="admin-username"
                className="block text-gray-300 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.95rem" }}
              >
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="w-full px-4 py-3 rounded-xl border-0 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  fontSize: "1.05rem",
                }}
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="admin-password"
                className="block text-gray-300 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "0.95rem" }}
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 rounded-xl border-0 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  fontSize: "1.05rem",
                }}
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className="mb-5 p-4 rounded-xl text-red-300 border border-red-500/30"
                style={{ background: "rgba(239, 68, 68, 0.1)" }}
                role="alert"
                id="login-error"
              >
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span style={{ fontSize: "0.95rem" }}>{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? "rgba(99, 102, 241, 0.5)"
                  : "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)",
                fontSize: "1.1rem",
                fontFamily: "var(--font-inter), sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px rgba(66, 99, 235, 0.4)",
              }}
              id="login-button"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {resetMessage.text && (
              <div className={`mt-4 p-3 rounded-lg text-sm text-center ${resetMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {resetMessage.text}
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleResetRequest}
                disabled={resetLoading}
                className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                {resetLoading ? "Sending..." : "Forgot Password?"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-6" style={{ fontSize: "0.85rem" }}>
          Protected admin area.
        </p>
      </div>
    </div>
  );
}
