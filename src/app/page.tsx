"use client";

import { useState } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

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
        setMessage("Your book has been sent to your email! Please check your inbox.");
        setEmail("");
        setShowModal(true); // Open modal on success
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-24">
        
        <div className="w-full max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white text-slate-800 px-5 py-2 rounded-full text-sm font-semibold border border-slate-200 shadow-sm">
            <span>🎁</span>
            <span>100% Free — No Credit Card Needed</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Get a <span className="text-blue-600">Free Crossword Puzzle Book</span><br className="hidden md:block"/> Every Day for 30 Days.
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Crossword puzzles delivered straight to your inbox. Keep your mind sharp and entertained with our premium daily collection.
          </p>
          
          {/* Email Form */}
          <div className="w-full max-w-2xl mx-auto mt-10">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 shadow-xl bg-white p-3 rounded-2xl border border-slate-100">
              <div className="flex-1">
                <label htmlFor="email-input" className="sr-only">Enter your email address</label>
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
                  className="w-full h-14 px-6 text-lg rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none transition-shadow text-slate-900 placeholder:text-slate-400"
                  disabled={status === "loading"}
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || !email}
                className="h-14 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-70 shadow-md shadow-blue-600/20"
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
                    <span className="text-xl">📚</span>
                    Send me puzzles
                  </>
                )}
              </button>
            </form>
            
            {/* Error Message */}
            {status === "error" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-left flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-red-800 font-medium">{message}</p>
              </div>
            )}
            
            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-slate-500 font-medium text-sm">
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📧</span>
                <span>Unsubscribe Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💎</span>
                <span>30 Premium Books</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg">Three simple steps to start your daily reading adventure</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { icon: "✉️", title: "1. Sign Up", desc: "Enter your email address above. That's all we need." },
              { icon: "📬", title: "2. Check Inbox", desc: "Your first free crossword puzzle book arrives instantly." },
              { icon: "📖", title: "3. Enjoy Daily", desc: "A new ebook every day for 30 days. Read at your own pace." },
            ].map((step, i) => (
              <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-6 text-3xl">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 text-center bg-slate-900 text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} ElectedBooks. All rights reserved.</p>
      </footer>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform transition-all">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              ✅
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Success!</h3>
            <p className="text-slate-600 mb-8 text-lg">{message}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
