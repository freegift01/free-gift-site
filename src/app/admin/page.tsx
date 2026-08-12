"use client";

import { useState, useEffect, useCallback } from "react";

interface Book {
  id: string;
  title: string;
  filename: string;
  sizeBytes: number;
  blobUrl: string;
  createdAt: string;
}

interface ScheduleSlot {
  dayNumber: number;
  isEnabled: boolean;
  bookId: string | null;
  emailSubject: string;
  emailBody: string;
  book?: Book | null;
}

export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"books" | "schedule">("books");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      if (res.ok) setBooks(data.books);
    } catch (err) {
      console.error("Failed to fetch books:", err);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();
      if (res.ok) setSlots(data.slots);
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchSchedule();
  }, [fetchBooks, fetchSchedule]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/books", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast("success", `"${data.book.title}" uploaded successfully!`);
        fetchBooks();
      } else {
        showToast("error", data.error || "Upload failed");
      }
    } catch {
      showToast("error", "Connection error during upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also remove it from any scheduled slots.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", `"${title}" deleted successfully`);
        fetchBooks();
        fetchSchedule();
      } else {
        const data = await res.json();
        showToast("error", data.error || "Delete failed");
      }
    } catch {
      showToast("error", "Connection error during deletion");
    }
  };

  const updateSlot = (dayNumber: number, updates: Partial<ScheduleSlot>) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.dayNumber === dayNumber ? { ...slot, ...updates } : slot
      )
    );
  };

  const getDuplicateBookIds = (): Set<string> => {
    const enabledBookIds = slots
      .filter((s) => s.isEnabled && s.bookId)
      .map((s) => s.bookId!);

    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const id of enabledBookIds) {
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    }

    return duplicates;
  };

  const handleSaveSchedule = async () => {
    // Client-side validation: check for duplicate books
    const duplicates = getDuplicateBookIds();
    if (duplicates.size > 0) {
      showToast("error", "Each book can only be assigned to one enabled day. Please fix duplicate assignments highlighted in red.");
      return;
    }

    // Check enabled slots without books
    for (const slot of slots) {
      if (slot.isEnabled && !slot.bookId) {
        showToast("error", `Day ${slot.dayNumber} is enabled but has no book assigned.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: slots.map((s) => ({
            dayNumber: s.dayNumber,
            isEnabled: s.isEnabled,
            bookId: s.bookId,
            emailSubject: s.emailSubject,
            emailBody: s.emailBody,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("success", "Schedule saved successfully!");
        fetchSchedule();
      } else {
        showToast("error", data.error || "Failed to save schedule");
      }
    } catch {
      showToast("error", "Connection error while saving");
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const duplicateBookIds = getDuplicateBookIds();

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          className="fixed top-20 right-6 z-50 toast-enter max-w-sm"
          role="alert"
        >
          <div
            className="rounded-xl px-5 py-4 flex items-start gap-3 shadow-xl"
            style={{
              background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="text-xl flex-shrink-0">{toast.type === "success" ? "✅" : "❌"}</span>
            <p className="text-white font-medium" style={{ fontSize: "0.95rem" }}>
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <h1
          className="text-white font-bold mb-2"
          style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1.8rem" }}
        >
          Dashboard
        </h1>
        <p className="text-gray-400" style={{ fontSize: "1rem" }}>
          Manage your ebook library and 30-day drip schedule
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        {(["books", "schedule"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 rounded-xl font-medium transition-all duration-200"
            style={{
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "0.95rem",
              background: activeTab === tab ? "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)" : "rgba(255, 255, 255, 0.05)",
              color: activeTab === tab ? "white" : "#9ca3af",
              border: activeTab === tab ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
            }}
            id={`tab-${tab}`}
          >
            {tab === "books" ? "📚 Book Library" : "📅 Drip Schedule"}
          </button>
        ))}
      </div>

      {/* ===== BOOKS TAB ===== */}
      {activeTab === "books" && (
        <div className="animate-fade-in">
          {/* Upload Area */}
          <div
            className="rounded-2xl p-8 mb-8 border-2 border-dashed text-center transition-colors"
            style={{
              borderColor: "rgba(66, 99, 235, 0.3)",
              background: "rgba(66, 99, 235, 0.05)",
            }}
          >
            <div className="text-4xl mb-3">📤</div>
            <p className="text-gray-300 mb-4" style={{ fontFamily: "var(--font-inter), sans-serif", fontSize: "1.05rem" }}>
              Upload PDF or EPUB files (max 10MB each)
            </p>
            <label
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white cursor-pointer transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #4263eb 0%, #5c7cfa 100%)",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "1rem",
                opacity: uploading ? 0.6 : 1,
                pointerEvents: uploading ? "none" : "auto",
              }}
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>Choose File</>
              )}
              <input
                type="file"
                accept=".pdf,.epub"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
                id="file-upload-input"
              />
            </label>
          </div>

          {/* Book List */}
          <div className="space-y-3">
            {books.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4 opacity-50">📚</div>
                <p className="text-gray-500" style={{ fontSize: "1.1rem" }}>
                  No books uploaded yet. Upload your first ebook above!
                </p>
              </div>
            ) : (
              books.map((book) => (
                <div
                  key={book.id}
                  className="rounded-xl p-5 flex items-center justify-between gap-4 transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: book.filename.endsWith(".pdf")
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(16, 185, 129, 0.15)",
                      }}
                    >
                      <span className="text-xl">
                        {book.filename.endsWith(".pdf") ? "📕" : "📗"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate" style={{ fontSize: "1rem" }}>
                        {book.title}
                      </p>
                      <p className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                        {formatBytes(book.sizeBytes)} • {new Date(book.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBook(book.id, book.title)}
                    className="flex-shrink-0 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    style={{ fontSize: "0.9rem", fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
          <p className="text-gray-500 mt-4" style={{ fontSize: "0.85rem" }}>
            {books.length} book{books.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
      )}

      {/* ===== SCHEDULE TAB ===== */}
      {activeTab === "schedule" && (
        <div className="animate-fade-in">
          {/* Save Button (top) */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400" style={{ fontSize: "0.95rem" }}>
              Configure which book to send on each day, along with the email subject and body.
            </p>
            <button
              onClick={handleSaveSchedule}
              disabled={saving || duplicateBookIds.size > 0}
              className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all"
              style={{
                background: saving || duplicateBookIds.size > 0
                  ? "rgba(99, 102, 241, 0.4)"
                  : "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "0.95rem",
                cursor: saving || duplicateBookIds.size > 0 ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 14px rgba(66, 99, 235, 0.3)",
              }}
              id="save-schedule-button"
            >
              {saving ? "Saving..." : "💾 Save Schedule"}
            </button>
          </div>

          {duplicateBookIds.size > 0 && (
            <div
              className="mb-6 p-4 rounded-xl border"
              style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.3)" }}
              role="alert"
              id="duplicate-error"
            >
              <p className="text-red-400 font-medium flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
                <span>⚠️</span>
                Duplicate book assignments detected! Each book can only be assigned to one enabled day.
              </p>
            </div>
          )}

          {/* Schedule Grid */}
          <div className="space-y-2">
            {slots.map((slot) => {
              const isDuplicate = slot.isEnabled && slot.bookId && duplicateBookIds.has(slot.bookId);
              const isExpanded = expandedDay === slot.dayNumber;

              return (
                <div
                  key={slot.dayNumber}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background: isDuplicate
                      ? "rgba(239, 68, 68, 0.08)"
                      : slot.isEnabled
                      ? "rgba(66, 99, 235, 0.08)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${
                      isDuplicate
                        ? "rgba(239, 68, 68, 0.3)"
                        : slot.isEnabled
                        ? "rgba(66, 99, 235, 0.2)"
                        : "rgba(255, 255, 255, 0.06)"
                    }`,
                  }}
                >
                  {/* Collapsed Row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Enable/Disable */}
                    <label className="flex items-center gap-3 cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={slot.isEnabled}
                        onChange={(e) => updateSlot(slot.dayNumber, { isEnabled: e.target.checked })}
                        className="w-5 h-5 rounded accent-indigo-500"
                        id={`day-${slot.dayNumber}-checkbox`}
                      />
                      <span
                        className="font-bold min-w-[70px]"
                        style={{
                          fontFamily: "var(--font-inter), sans-serif",
                          fontSize: "0.95rem",
                          color: slot.isEnabled ? "#818cf8" : "#6b7280",
                        }}
                      >
                        Day {slot.dayNumber}
                      </span>
                    </label>

                    {/* Book Select */}
                    <select
                      value={slot.bookId || ""}
                      onChange={(e) => updateSlot(slot.dayNumber, { bookId: e.target.value || null })}
                      className="flex-1 px-3 py-2 rounded-lg text-white border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-0"
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        fontSize: "0.9rem",
                        fontFamily: "var(--font-inter), sans-serif",
                      }}
                      id={`day-${slot.dayNumber}-book`}
                    >
                      <option value="" style={{ background: "#1e1e2e" }}>— Select a book —</option>
                      {books.map((book) => (
                        <option key={book.id} value={book.id} style={{ background: "#1e1e2e" }}>
                          {book.title} ({formatBytes(book.sizeBytes)})
                        </option>
                      ))}
                    </select>

                    {/* Expand Toggle */}
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : slot.dayNumber)}
                      className="flex-shrink-0 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      style={{ fontSize: "0.85rem", fontFamily: "var(--font-inter), sans-serif" }}
                    >
                      {isExpanded ? "▲ Less" : "▼ Email"}
                    </button>
                  </div>

                  {/* Expanded Email Fields */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <div className="mt-4 space-y-3">
                        <div>
                          <label
                            className="block text-gray-400 text-sm font-medium mb-1"
                            style={{ fontFamily: "var(--font-inter), sans-serif" }}
                          >
                            Email Subject
                          </label>
                          <input
                            type="text"
                            value={slot.emailSubject}
                            onChange={(e) => updateSlot(slot.dayNumber, { emailSubject: e.target.value })}
                            placeholder={`Day ${slot.dayNumber}: Your Free Ebook is Here! 📚`}
                            className="w-full px-4 py-2.5 rounded-lg text-white border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            style={{
                              background: "rgba(255, 255, 255, 0.06)",
                              fontSize: "0.95rem",
                            }}
                            id={`day-${slot.dayNumber}-subject`}
                          />
                        </div>
                        <div>
                          <label
                            className="block text-gray-400 text-sm font-medium mb-1"
                            style={{ fontFamily: "var(--font-inter), sans-serif" }}
                          >
                            Email Body (HTML supported)
                          </label>
                          <textarea
                            value={slot.emailBody}
                            onChange={(e) => updateSlot(slot.dayNumber, { emailBody: e.target.value })}
                            placeholder={`<p>Hello! Here is your free ebook for Day ${slot.dayNumber}. Enjoy reading!</p>`}
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-lg text-white border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                            style={{
                              background: "rgba(255, 255, 255, 0.06)",
                              fontSize: "0.9rem",
                              lineHeight: "1.5",
                            }}
                            id={`day-${slot.dayNumber}-body`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Button (bottom) */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveSchedule}
              disabled={saving || duplicateBookIds.size > 0}
              className="px-8 py-3 rounded-xl font-semibold text-white transition-all"
              style={{
                background: saving || duplicateBookIds.size > 0
                  ? "rgba(99, 102, 241, 0.4)"
                  : "linear-gradient(135deg, #4263eb 0%, #7c3aed 100%)",
                fontFamily: "var(--font-inter), sans-serif",
                fontSize: "1rem",
                cursor: saving || duplicateBookIds.size > 0 ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 4px 14px rgba(66, 99, 235, 0.3)",
              }}
            >
              {saving ? "Saving..." : "💾 Save Schedule"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
