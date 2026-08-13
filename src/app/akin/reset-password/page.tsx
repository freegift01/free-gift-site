"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("No reset token found in URL.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        setSuccess("Password has been reset successfully. Redirecting to login...");
        setTimeout(() => {
          router.push("/akin/login");
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-4">Invalid or missing reset token.</p>
        <button
          onClick={() => router.push("/akin/login")}
          className="text-indigo-400 hover:text-indigo-300"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center">
          {success}
        </div>
      )}
      
      <div>
        <label className="block text-gray-400 text-sm font-medium mb-1" htmlFor="password">
          New Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-lg text-white border-0 focus:ring-2 focus:ring-indigo-500 bg-white/5"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-gray-400 text-sm font-medium mb-1" htmlFor="confirmPassword">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          className="w-full px-4 py-2.5 rounded-lg text-white border-0 focus:ring-2 focus:ring-indigo-500 bg-white/5"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !!success}
        className="w-full py-3 rounded-lg font-semibold text-white mt-6 transition-all"
        style={{
          background: "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)",
          opacity: loading || !!success ? 0.7 : 1,
        }}
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0a0a0f" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
            Reset Password
          </h1>
          <p className="text-gray-400 text-sm">
            Enter your new admin password below.
          </p>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
          <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
