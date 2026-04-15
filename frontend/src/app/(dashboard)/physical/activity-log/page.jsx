// src/app/(dashboard)/physical/activity-log/page.jsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { physicalAPI } from "@/lib/api";
import { Card, Button, Modal, EmptyState, Badge, SectionHeader, Spinner } from "@/components/ui";
import { formatDateTime, getActivityIcon, getActivityColor, cn } from "@/lib/utils";
import { Plus, Trash2, Filter } from "lucide-react";

const TYPES = ["walking", "eating", "sleeping", "exercise", "rest", "therapy", "other"];
const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function ActivityLogPage() {
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState("all");
  const [form, setForm]         = useState({ type: "walking", duration: "", notes: "" });
  const [error, setError]       = useState("");

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const fetchLogs = async () => {
    try { const r = await physicalAPI.getActivities(); setLogs(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLogs(); }, []);

  const handleSave = async () => {
    if (!form.type) { setError("Select an activity type"); return; }
    setError("");
    setSaving(true);
    try {
      await physicalAPI.logActivity({
        type: form.type,
        duration: form.duration ? parseInt(form.duration) : null,
        notes: form.notes || null,
      });
      toast.success("Activity logged!");
      setForm({ type: "walking", duration: "", notes: "" });
      setModal(false);
      fetchLogs();
    } catch { toast.error("Failed to log activity"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this activity?")) return;
    try {
      await physicalAPI.deleteActivity(id);
      toast.success("Deleted");
      setLogs(p => p.filter(l => l.id !== id));
    } catch { toast.error("Failed"); }
  };

  const displayed = filter === "all" ? logs : logs.filter(l => l.type === filter);
  const today     = new Date().toDateString();
  const todayCount = logs.filter(l => new Date(l.logged_at).toDateString() === today).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Activity Log"
        description="Feature 3 — Manually log daily activities: walking, eating, sleeping, exercise and more"
        action={<Button onClick={() => { setForm({ type:"walking", duration:"", notes:"" }); setError(""); setModal(true); }}><Plus size={15} /> Log Activity</Button>}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-surface-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{todayCount}</p>
          <p className="text-xs text-muted mt-1">Today</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent-cyan">{logs.length}</p>
          <p className="text-xs text-muted mt-1">Total</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent-amber">{logs.reduce((s, l) => s + (l.duration || 0), 0)}</p>
          <p className="text-xs text-muted mt-1">Total min</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...TYPES].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
              filter === f ? "bg-accent/20 text-accent border-accent/40" : "bg-surface text-muted border-surface-border hover:border-accent/30")}>
            {f === "all" ? "All" : `${getActivityIcon(f)} ${f}`}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon="🏃"
            title={filter === "all" ? "No activities logged yet" : `No ${filter} activities`}
            description="Start by logging your first activity"
            action={filter === "all" && <Button onClick={() => setModal(true)}><Plus size={14} /> Log Activity</Button>}
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {displayed.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface2/30 transition-colors group">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-surface2 border border-surface-border flex items-center justify-center text-xl flex-shrink-0">
                  {getActivityIcon(log.type)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium capitalize", getActivityColor(log.type))}>{log.type}</p>
                  {log.notes && <p className="text-sm text-muted mt-0.5 truncate">{log.notes}</p>}
                  <p className="text-xs text-muted mt-0.5">{formatDateTime(log.logged_at)}</p>
                </div>
                {/* Duration */}
                {log.duration && <Badge variant="default">{log.duration} min</Badge>}
                {/* Delete */}
                <button
                  onClick={() => handleDelete(log.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModal(false)} title="Log Activity">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Activity type</label>
            <select className={ic} value={form.type} onChange={set("type")}>
              {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            {error && <p className="text-xs text-accent-red">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Duration (minutes)</label>
            <input className={ic} type="number" placeholder="30" min="1" value={form.duration} onChange={set("duration")} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Notes (optional)</label>
            <textarea className={ic} placeholder="How did it go?" rows={3} value={form.notes} onChange={set("notes")} style={{ resize: "none" }} />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
