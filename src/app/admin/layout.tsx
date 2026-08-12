"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f1117" }}>
      {/* Top Navigation */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(15, 17, 23, 0.8)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)" }}
            >
              <span className="text-lg">📚</span>
            </div>
            <span
              className="text-white font-bold"
              style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1.1rem" }}
            >
              Drip Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              style={{ fontSize: "0.9rem" }}
            >
              View Site →
            </a>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-gray-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
              style={{ fontSize: "0.9rem", fontFamily: "var(--font-inter), sans-serif" }}
              id="logout-button"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
