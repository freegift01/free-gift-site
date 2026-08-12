"use client";

import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Connection error. Please check your internet and try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #ffd700 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 animate-pulse-gentle"
            style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-16 text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm font-semibold mb-8 border border-white/30">
            <span className="text-xl">🎁</span>
            <span>100% Free — No Credit Card Needed</span>
          </div>

          {/* Main heading */}
          <h1
            className="animate-fade-in-up delay-100 text-white font-bold leading-tight mb-6"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            }}
          >
            Get a <span className="text-yellow-300">Free Puzzle Ebook</span><br />
            Every Day for 30 Days!
          </h1>

          {/* Subtitle */}
          <p
            className="animate-fade-in-up delay-200 text-white/90 mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ fontSize: "1.25rem" }}
          >
            Brain teasers, crosswords, sudoku, and more — delivered straight to your inbox.
            Keep your mind sharp and entertained!
          </p>

          {/* Email Form */}
          <div className="animate-fade-in-up delay-300">
            <form
              onSubmit={handleSubmit}
              className="glass-card rounded-2xl p-8 max-w-md mx-auto"
              id="subscribe-form"
            >
              <label
                htmlFor="email-input"
                className="block text-left text-gray-700 font-semibold mb-3"
                style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1rem" }}
              >
                Enter your email address:
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="your.email@example.com"
                required
                className="input-lg mb-4"
                disabled={status === "loading"}
                aria-describedby="email-help"
              />
              <p id="email-help" className="sr-only">
                We will send you a free ebook every day for 30 days.
              </p>

              <button
                type="submit"
                disabled={status === "loading" || !email}
                className="btn-primary w-full flex items-center justify-center gap-3"
                id="submit-button"
                style={{ fontSize: "1.2rem" }}
              >
                {status === "loading" ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📚</span>
                    Send me free puzzle
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success Message */}
          {status === "success" && (
            <div
              className="toast-enter mt-6 max-w-md mx-auto bg-emerald-50 border-2 border-emerald-400 rounded-xl p-6 text-left"
              role="alert"
              id="success-alert"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">✅</span>
                <div>
                  <p className="font-bold text-emerald-800" style={{ fontSize: "1.15rem" }}>
                    Success!
                  </p>
                  <p className="text-emerald-700 mt-1" style={{ fontSize: "1.05rem" }}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === "error" && (
            <div
              className="toast-enter mt-6 max-w-md mx-auto bg-red-50 border-2 border-red-400 rounded-xl p-6 text-left"
              role="alert"
              id="error-alert"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-bold text-red-800" style={{ fontSize: "1.15rem" }}>
                    Oops!
                  </p>
                  <p className="text-red-700 mt-1" style={{ fontSize: "1.05rem" }}>
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trust indicators */}
          <div className="animate-fade-in-up delay-500 mt-10 flex flex-wrap justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔒</span>
              <span style={{ fontSize: "0.95rem" }}>Your email is safe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📧</span>
              <span style={{ fontSize: "0.95rem" }}>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💎</span>
              <span style={{ fontSize: "0.95rem" }}>30 premium ebooks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #fefefe 0%, #f8f6ff 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center font-bold mb-4"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
              color: "#1a1a2e",
            }}
          >
            How It Works
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-lg mx-auto" style={{ fontSize: "1.1rem" }}>
            Three simple steps to start your daily reading adventure
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "✉️",
                title: "1. Sign Up",
                desc: "Enter your email address above. That's all we need!",
                color: "#4263eb",
              },
              {
                icon: "📬",
                title: "2. Check Your Inbox",
                desc: "Your first free puzzle ebook arrives instantly.",
                color: "#7c3aed",
              },
              {
                icon: "📖",
                title: "3. Enjoy Daily",
                desc: "A new ebook every day for 30 days. Read at your own pace!",
                color: "#f59e0b",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300"
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: `${step.color}15` }}
                >
                  <span className="text-4xl">{step.icon}</span>
                </div>
                <h3
                  className="font-bold mb-3"
                  style={{
                    fontFamily: "var(--font-inter), sans-serif",
                    fontSize: "1.3rem",
                    color: step.color,
                  }}
                >
                  {step.title}
                </h3>
                <p className="text-gray-600" style={{ fontSize: "1.05rem", lineHeight: "1.7" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-gray-100" style={{ background: "#fafafa" }}>
        <p className="text-gray-400" style={{ fontSize: "0.9rem" }}>
          © {new Date().getFullYear()} ElectedBooks. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
