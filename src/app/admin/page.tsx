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

interface Subscriber {
  id: string;
  email: string;
  status: string;
  currentDay: number;
  startDate: string;
  lastSentAt: string | null;
}

export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"books" | "schedule" | "subscribers">("books");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Subscriber management state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [perPage, setPerPage] = useState<number | "all">(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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

  const fetchSubscribers = useCallback(async () => {
    setSubscribersLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers");
      const data = await res.json();
      if (res.ok) setSubscribers(data.subscribers || []);
    } catch (err) {
      console.error("Failed to fetch subscribers:", err);
    } finally {
      setSubscribersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchSchedule();
  }, [fetchBooks, fetchSchedule]);

  useEffect(() => {
    if (activeTab === "subscribers" && subscribers.length === 0) {
      fetchSubscribers();
    }
  }, [activeTab, subscribers.length, fetchSubscribers]);

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

  // ==========================================
  // Subscriber Management Logic
  // ==========================================

  const totalSubscribers = subscribers.length;
  const effectivePerPage = perPage === "all" ? totalSubscribers : perPage;
  const totalPages = effectivePerPage > 0 ? Math.max(1, Math.ceil(totalSubscribers / effectivePerPage)) : 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSubscribers = perPage === "all"
    ? subscribers
    : subscribers.slice((safePage - 1) * effectivePerPage, safePage * effectivePerPage);

  const allOnPageSelected = paginatedSubscribers.length > 0 && paginatedSubscribers.every((s) => selectedIds.has(s.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedSubscribers.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginatedSubscribers.forEach((s) => next.add(s.id));
        return next;
      });
    }
  };

  const handleBulkUnsubscribe = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Unsubscribe ${ids.length} selected subscriber(s)? They will remain in records but stop receiving emails.`)) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `${data.count} subscriber(s) unsubscribed.`);
        setSelectedIds(new Set());
        fetchSubscribers();
      } else {
        showToast("error", data.error || "Failed to unsubscribe");
      }
    } catch {
      showToast("error", "Connection error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`PERMANENTLY DELETE ${ids.length} selected subscriber(s)? This action cannot be undone.`)) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `${data.count} subscriber(s) permanently deleted.`);
        setSelectedIds(new Set());
        fetchSubscribers();
      } else {
        showToast("error", data.error || "Failed to delete");
      }
    } catch {
      showToast("error", "Connection error");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (subscribers.length === 0) {
      showToast("error", "No subscribers to export.");
      return;
    }
    const headers = ["Email", "Status", "Current Day", "Start Date", "Last Sent At"];
    const rows = subscribers.map((s) =>
      [
        s.email,
        s.status,
        String(s.currentDay),
        new Date(s.startDate).toLocaleString(),
        s.lastSentAt ? new Date(s.lastSentAt).toLocaleString() : "",
      ]
        .map((val) => `"${val.replace(/"/g, '""')}"`)
        .join(",")
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("success", `CSV exported: ${subscribers.length} subscriber(s).`);
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
        {(["books", "schedule", "subscribers"] as const).map((tab) => (
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
            {tab === "books" ? "📚 Book Library" : tab === "schedule" ? "📅 Drip Schedule" : "👥 Subscribers"}
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

      {/* ===== SUBSCRIBERS TAB ===== */}
      {activeTab === "subscribers" && (
        <div className="animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Per-page selector */}
              <label className="text-gray-400 flex items-center gap-2" style={{ fontSize: "0.9rem", fontFamily: "var(--font-inter), sans-serif" }}>
                Show:
                <select
                  value={perPage === "all" ? "all" : String(perPage)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPerPage(val === "all" ? "all" : Number(val));
                    setCurrentPage(1);
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-2 rounded-lg text-white border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  style={{ background: "rgba(255, 255, 255, 0.08)", fontSize: "0.9rem" }}
                  id="per-page-selector"
                >
                  <option value="25" style={{ background: "#1e1e2e" }}>25</option>
                  <option value="50" style={{ background: "#1e1e2e" }}>50</option>
                  <option value="100" style={{ background: "#1e1e2e" }}>100</option>
                  <option value="200" style={{ background: "#1e1e2e" }}>200</option>
                  <option value="all" style={{ background: "#1e1e2e" }}>All</option>
                </select>
              </label>
              <span className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                {totalSubscribers} total subscriber{totalSubscribers !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Bulk actions */}
              <button
                onClick={handleBulkUnsubscribe}
                disabled={selectedIds.size === 0 || bulkActionLoading}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: selectedIds.size > 0 ? "rgba(251, 191, 36, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  color: selectedIds.size > 0 ? "#fbbf24" : "#6b7280",
                  border: "1px solid " + (selectedIds.size > 0 ? "rgba(251, 191, 36, 0.3)" : "rgba(255, 255, 255, 0.08)"),
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-inter), sans-serif",
                  cursor: selectedIds.size === 0 || bulkActionLoading ? "not-allowed" : "pointer",
                  opacity: bulkActionLoading ? 0.6 : 1,
                }}
                id="unsubscribe-selected-button"
              >
                Unsubscribe Selected {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkActionLoading}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: selectedIds.size > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  color: selectedIds.size > 0 ? "#ef4444" : "#6b7280",
                  border: "1px solid " + (selectedIds.size > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.08)"),
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-inter), sans-serif",
                  cursor: selectedIds.size === 0 || bulkActionLoading ? "not-allowed" : "pointer",
                  opacity: bulkActionLoading ? 0.6 : 1,
                }}
                id="delete-permanently-button"
              >
                Delete Permanently {selectedIds.size > 0 && `(${selectedIds.size})`}
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={subscribers.length === 0}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: subscribers.length > 0 ? "#10b981" : "#6b7280",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-inter), sans-serif",
                  cursor: subscribers.length === 0 ? "not-allowed" : "pointer",
                }}
                id="download-csv-button"
              >
                📥 Download CSV
              </button>
            </div>
          </div>

          {/* Loading state */}
          {subscribersLoading ? (
            <div className="text-center py-16">
              <svg className="animate-spin h-8 w-8 mx-auto text-indigo-400 mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-500" style={{ fontSize: "1rem" }}>Loading subscribers...</p>
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4 opacity-50">👥</div>
              <p className="text-gray-500" style={{ fontSize: "1.1rem" }}>
                No subscribers yet.
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255, 255, 255, 0.06)" }}
              >
                <table className="w-full" id="subscribers-table">
                  <thead>
                    <tr style={{ background: "rgba(255, 255, 255, 0.04)" }}>
                      <th className="px-4 py-3 text-left" style={{ width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded accent-indigo-500"
                          id="select-all-checkbox"
                        />
                      </th>
                      <th
                        className="px-4 py-3 text-left text-gray-400 font-semibold"
                        style={{ fontSize: "0.8rem", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        Email
                      </th>
                      <th
                        className="px-4 py-3 text-left text-gray-400 font-semibold"
                        style={{ fontSize: "0.8rem", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        Status
                      </th>
                      <th
                        className="px-4 py-3 text-left text-gray-400 font-semibold"
                        style={{ fontSize: "0.8rem", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        Day
                      </th>
                      <th
                        className="px-4 py-3 text-left text-gray-400 font-semibold"
                        style={{ fontSize: "0.8rem", fontFamily: "var(--font-inter), sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}
                      >
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSubscribers.map((sub) => (
                      <tr
                        key={sub.id}
                        className="transition-colors"
                        style={{
                          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                          background: selectedIds.has(sub.id) ? "rgba(66, 99, 235, 0.08)" : "transparent",
                        }}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sub.id)}
                            onChange={() => toggleSelect(sub.id)}
                            className="w-4 h-4 rounded accent-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-white" style={{ fontSize: "0.9rem" }}>
                          {sub.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full font-medium"
                            style={{
                              fontSize: "0.75rem",
                              background:
                                sub.status === "ACTIVE"
                                  ? "rgba(16, 185, 129, 0.15)"
                                  : sub.status === "COMPLETED"
                                  ? "rgba(59, 130, 246, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                              color:
                                sub.status === "ACTIVE"
                                  ? "#34d399"
                                  : sub.status === "COMPLETED"
                                  ? "#60a5fa"
                                  : "#f87171",
                            }}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400" style={{ fontSize: "0.9rem" }}>
                          {sub.currentDay}/30
                        </td>
                        <td className="px-4 py-3 text-gray-500" style={{ fontSize: "0.85rem" }}>
                          {new Date(sub.startDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {perPage !== "all" && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-gray-500" style={{ fontSize: "0.85rem" }}>
                    Page {safePage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); setSelectedIds(new Set()); }}
                      disabled={safePage <= 1}
                      className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      style={{
                        fontSize: "0.85rem",
                        cursor: safePage <= 1 ? "not-allowed" : "pointer",
                        opacity: safePage <= 1 ? 0.4 : 1,
                      }}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); setSelectedIds(new Set()); }}
                      disabled={safePage >= totalPages}
                      className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                      style={{
                        fontSize: "0.85rem",
                        cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                        opacity: safePage >= totalPages ? 0.4 : 1,
                      }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
