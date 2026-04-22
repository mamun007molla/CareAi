"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { notificationAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";

const TYPE_ICONS = {
  sos:          "🚨",
  medication:   "💊",
  meal:         "🍽️",
  routine:      "📅",
  prescription: "📄",
  link:         "🔗",
  summary:      "📊",
  default:      "🔔",
};

export default function NotificationBell() {
  const [open, setOpen]       = useState(false);
  const [notifs, setNotifs]   = useState([]);
  const [count, setCount]     = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchCount = async () => {
    try { const r = await notificationAPI.unreadCount(); setCount(r.data.count); } catch {}
  };

  const fetchNotifs = async () => {
    setLoading(true);
    try { const r = await notificationAPI.getAll(); setNotifs(r.data); }
    finally { setLoading(false); }
  };

  const handleOpen = () => {
    setOpen(p => !p);
    if (!open) fetchNotifs();
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifs(p => p.map(n => n.id===id ? {...n, is_read:true} : n));
      setCount(p => Math.max(0, p-1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifs(p => p.map(n => ({...n, is_read:true})));
      setCount(0);
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen}
        className="relative p-2 rounded-xl text-muted hover:text-text hover:bg-surface2 transition-colors">
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-surface-border rounded-2xl shadow-2xl z-50 animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
            <h3 className="font-semibold text-text text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent hover:underline flex items-center gap-1">
                  <CheckCheck size={12} /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted hover:text-text p-0.5">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted">Loading…</div>
            ) : notifs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-muted">No notifications yet</p>
              </div>
            ) : (
              notifs.map(n => (
                <div key={n.id} className={cn(
                  "flex gap-3 px-4 py-3 border-b border-surface-border last:border-0 transition-colors hover:bg-surface2/40",
                  !n.is_read && "bg-accent/3"
                )}>
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || TYPE_ICONS.default}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", !n.is_read ? "text-text" : "text-muted")}>{n.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)}
                      className="p-1 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors flex-shrink-0 mt-0.5">
                      <Check size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
