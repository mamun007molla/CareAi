// src/app/(dashboard)/physical/routine-schedule/page.jsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { physicalAPI } from "@/lib/api";
import { Card, CardBody, Button, Modal, EmptyState, Badge, SectionHeader, Spinner } from "@/components/ui";
import { Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TYPES = ["medication", "meal", "exercise"];
const TYPE_ICONS  = { medication: "💊", meal: "🍽️", exercise: "🏋️" };
const TYPE_COLORS = { medication: "cyan", meal: "warning", exercise: "success" };
const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";
const empty = { title: "", type: "medication", scheduled_at: "08:00", days: [], is_active: true };

export default function RoutineSchedulePage() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(empty);
  const [errors, setErrors]     = useState({});

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const toggleDay = (d) => setForm(p => ({
    ...p,
    days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d],
  }));

  const fetchRoutines = async () => {
    try { const r = await physicalAPI.getRoutines(); setRoutines(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchRoutines(); }, []);

  const openCreate = () => { setForm(empty); setEditId(null); setErrors({}); setModal(true); };
  const openEdit   = (r) => {
    setForm({ title: r.title, type: r.type, scheduled_at: r.scheduled_at, days: r.days || [], is_active: r.is_active });
    setEditId(r.id);
    setErrors({});
    setModal(true);
  };

  const handleSave = async () => {
    const errs = {};
    if (!form.title.trim())    errs.title = "Title is required";
    if (!form.scheduled_at)    errs.time  = "Time is required";
    if (!form.days.length)     errs.days  = "Select at least one day";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      if (editId) {
        await physicalAPI.updateRoutine(editId, form);
        toast.success("Routine updated!");
      } else {
        await physicalAPI.createRoutine(form);
        toast.success("Routine created!");
      }
      setModal(false);
      fetchRoutines();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this routine?")) return;
    try {
      await physicalAPI.deleteRoutine(id);
      toast.success("Deleted");
      setRoutines(p => p.filter(r => r.id !== id));
    } catch { toast.error("Failed"); }
  };

  // Group by type for display
  const grouped = TYPES.reduce((acc, t) => {
    acc[t] = routines.filter(r => r.type === t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Routine Schedule"
        description="Feature 4 — Daily routines for medication, meals, and exercise with reminders"
        action={<Button onClick={openCreate}><Plus size={15} /> Add Routine</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : routines.length === 0 ? (
        <Card>
          <EmptyState
            icon="📅"
            title="No routines yet"
            description="Create structured daily routines to stay on track"
            action={<Button onClick={openCreate}><Plus size={14} /> Add Routine</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {TYPES.map(type => grouped[type].length > 0 && (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{TYPE_ICONS[type]}</span>
                <h2 className="text-sm font-semibold text-text capitalize">{type} Routines</h2>
                <Badge variant={TYPE_COLORS[type]}>{grouped[type].length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[type].map(r => (
                  <Card key={r.id}>
                    <CardBody className="flex items-start gap-4 py-4">
                      {/* Time badge */}
                      <div className="w-16 h-16 rounded-xl bg-surface2 border border-surface-border flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs text-muted">Time</span>
                        <span className="text-base font-bold text-accent">{r.scheduled_at}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text">{r.title}</p>
                        {/* Days */}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {DAYS.map(d => (
                            <span key={d} className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-medium",
                              r.days?.includes(d) ? "bg-accent/20 text-accent" : "bg-surface2 text-muted"
                            )}>{d}</span>
                          ))}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Edit Routine" : "New Routine"}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Title</label>
            <input className={ic} placeholder="e.g. Morning Medication" value={form.title} onChange={set("title")} />
            {errors.title && <p className="text-xs text-accent-red">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Type</label>
            <select className={ic} value={form.type} onChange={set("type")}>
              {TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Scheduled time</label>
            <input className={ic} type="time" value={form.scheduled_at} onChange={set("scheduled_at")} />
            {errors.time && <p className="text-xs text-accent-red">{errors.time}</p>}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted">Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    form.days.includes(d)
                      ? "bg-accent/20 text-accent border-accent/40"
                      : "bg-surface2 text-muted border-surface-border hover:border-accent/30")}>
                  {d}
                </button>
              ))}
            </div>
            {errors.days && <p className="text-xs text-accent-red">{errors.days}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
