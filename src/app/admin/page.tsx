"use client";

import { useState, useEffect } from "react";

interface AttendanceLog {
  id: string;
  timestamp: string;
  status: string;
  student: {
    name: string;
    studentId: string;
  };
}

interface AttendanceResponse {
  logs: AttendanceLog[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminPage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      if (!cancelled) setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (date) params.set("date", date);
        params.set("page", page.toString());
        params.set("limit", "20");

        const res = await fetch(`/api/attendance?${params}`);
        const data: AttendanceResponse = await res.json();
        if (!cancelled) {
          setLogs(data.logs);
          setTotalPages(data.totalPages);
          setTotal(data.total);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchLogs();
    return () => { cancelled = true; };
  }, [date, page]);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    window.open(`/api/attendance/export?${params}`, "_blank");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold">Rekap Kehadiran</h1>
        <p className="text-muted text-sm mt-1">Dashboard admin absensi</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-success text-white rounded-xl text-sm font-medium flex items-center gap-1.5 active:opacity-80 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </button>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-muted">Total Kehadiran</p>
            <p className="text-2xl font-bold text-primary">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Tanggal</p>
            <p className="text-sm font-medium">
              {date
                ? new Date(date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Semua tanggal"}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-gray-300 mx-auto mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <p className="text-muted text-sm">Belum ada data kehadiran</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div
              key={log.id}
              className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {(page - 1) * 20 + i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {log.student.name}
                </p>
                <p className="text-xs text-muted">
                  {log.student.studentId}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-medium">{formatTime(log.timestamp)}</p>
                <p className="text-xs text-muted">{formatDate(log.timestamp)}</p>
              </div>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">
                {log.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
