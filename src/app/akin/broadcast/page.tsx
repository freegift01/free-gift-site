"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Book {
  id: string;
  title: string;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
}

interface Broadcast {
  id: string;
  scheduledDate: string;
  bookId: string | null;
  emailSubject: string;
  emailBody: string;
  status: string;
  targetSubscriberIds: string[];
  createdAt: string;
}

export default function BroadcastPage() {
  const router = useRouter();

  // Data state
  const [books, setBooks] = useState<Book[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Composer state
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Table state
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscriberIds, setSelectedSubscriberIds] = useState<Set<string>>(new Set());

  // UI state
  const [scheduling, setScheduling] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, subsRes, broadcastsRes] = await Promise.all([
        fetch("/api/books", { cache: "no-store" }),
        fetch("/api/admin/subscribers", { cache: "no-store" }),
        fetch("/api/admin/broadcasts", { cache: "no-store" }),
      ]);

      if (booksRes.status === 401 || subsRes.status === 401 || broadcastsRes.status === 401) {
        router.push("/akin/login");
        return;
      }

      if (booksRes.ok && subsRes.ok && broadcastsRes.ok) {
        const booksData = await booksRes.json();
        const subsData = await subsRes.json();
        const broadcastsData = await broadcastsRes.json();
        
        // Safely extract books array (API returns { books: [...] })
        const booksArray = Array.isArray(booksData) ? booksData : booksData.books || [];
        setBooks(booksArray);
        // Safely extract subscribers array (API returns { subscribers: [...] })
        const subsArray = Array.isArray(subsData) ? subsData : subsData.subscribers || [];
        // Only show active or completed subscribers (exclude unsubscribed)
        setSubscribers(subsArray.filter((s: Subscriber) => s.status !== "UNSUBSCRIBED"));
        
        setBroadcasts(Array.isArray(broadcastsData) ? broadcastsData : []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  // Pagination logic
  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(subscribers.length / rowsPerPage);
  const displayedSubscribers = rowsPerPage === -1 
    ? subscribers 
    : subscribers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleMasterCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const newSelected = new Set(selectedSubscriberIds);
    displayedSubscribers.forEach((sub) => {
      if (isChecked) {
        newSelected.add(sub.id);
      } else {
        newSelected.delete(sub.id);
      }
    });
    setSelectedSubscriberIds(newSelected);
  };

  const isAllDisplayedSelected = displayedSubscribers.length > 0 && displayedSubscribers.every(sub => selectedSubscriberIds.has(sub.id));

  const handleRowCheckboxChange = (id: string, isChecked: boolean) => {
    const newSelected = new Set(selectedSubscriberIds);
    if (isChecked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedSubscriberIds(newSelected);
  };

  const handleSchedule = async () => {
    if (!scheduledDate || !emailSubject || !emailBody) {
      setMessage({ type: "error", text: "Please fill in date, subject, and body." });
      return;
    }
    if (selectedSubscriberIds.size === 0) {
      setMessage({ type: "error", text: "Please select at least one subscriber." });
      return;
    }

    setScheduling(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate,
          bookId: selectedBookId || null,
          emailSubject,
          emailBody,
          targetSubscriberIds: Array.from(selectedSubscriberIds),
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Broadcast scheduled successfully!" });
        setScheduledDate("");
        setEmailSubject("");
        setEmailBody("");
        setSelectedBookId("");
        setSelectedSubscriberIds(new Set());
        fetchData(); // Refresh the broadcasts list
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to schedule broadcast." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setScheduling(false);
    }
  };

  const handleDeleteBroadcast = async (id: string, subject: string) => {
    if (!confirm(`Are you sure you want to cancel the scheduled broadcast: "${subject}"?`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Broadcast cancelled successfully!" });
        setBroadcasts(broadcasts.filter(b => b.id !== id));
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to cancel broadcast" });
      }
    } catch {
      setMessage({ type: "error", text: "Connection error during cancellation" });
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-inter), sans-serif" }}>
            Broadcast Scheduler
          </h1>
          <p className="text-gray-400">Compose and schedule one-off email broadcasts.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* A. SCHEDULING & CONTENT COMPOSER */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Composer</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Book Attachment</label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- No Attachment --</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>{book.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter subject line..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Body (HTML/Text)</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={8}
                  placeholder="<p>Hello!</p>"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              
              <div className="pt-4">
                <button
                  onClick={handleSchedule}
                  disabled={scheduling}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                >
                  {scheduling ? "Scheduling..." : "Schedule Broadcast"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* B. SUBSCRIBER TARGETING TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Target Subscribers</h2>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  {selectedSubscriberIds.size} selected
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value={200}>200 per page</option>
                  <option value={-1}>All</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="p-4 w-12">
                      <input
                        type="checkbox"
                        checked={isAllDisplayedSelected}
                        onChange={handleMasterCheckboxChange}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                      />
                    </th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedSubscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSubscriberIds.has(sub.id)}
                          onChange={(e) => handleRowCheckboxChange(sub.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                        />
                      </td>
                      <td className="p-4 text-sm text-gray-200">{sub.email}</td>
                      <td className="p-4 text-sm">
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayedSubscribers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-400">
                        No active subscribers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {rowsPerPage !== -1 && totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-white/10 transition-colors text-sm"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg disabled:opacity-50 hover:bg-white/10 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            )}
            
          </div>
        </div>

      </div>

      {/* C. SCHEDULED BROADCASTS QUEUE */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Scheduled Broadcasts Queue</h2>
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Subject</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Targeted</th>
                <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {broadcasts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    No broadcasts currently scheduled.
                  </td>
                </tr>
              ) : (
                broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-sm text-gray-200">
                      {new Date(b.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-white font-medium">
                      {b.emailSubject}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {b.targetSubscriberIds.length} subscribers
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteBroadcast(b.id, b.emailSubject)}
                        className="px-3 py-1.5 rounded-lg font-medium text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
