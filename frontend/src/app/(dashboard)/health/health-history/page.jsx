// src/app/(dashboard)/health/health-history/page.jsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { healthRecordAPI } from "@/lib/api";
import {
  Card,
  Button,
  Modal,
  EmptyState,
  Badge,
  SectionHeader,
  Spinner,
} from "@/components/ui";
import { Plus, Trash2, Stethoscope, Calendar } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const ic =
  "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";
const empty = { visit_date: "", doctor_name: "", diagnosis: "", notes: "" };

export default function HealthHistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [expanded, setExpanded] = useState(null);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const fetchRecords = async () => {
    try {
      const r = await healthRecordAPI.getAll();
      setRecords(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.visit_date) errs.visit_date = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await healthRecordAPI.create({
        visit_date: new Date(form.visit_date).toISOString(),
        doctor_name: form.doctor_name || null,
        diagnosis: form.diagnosis || null,
        notes: form.notes || null,
      });
      toast.success("Record added!");
      setForm(empty);
      setModal(false);
      fetchRecords();
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await healthRecordAPI.remove(id);
      setRecords((p) => p.filter((r) => r.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  // Group records by year
  const grouped = records.reduce((acc, r) => {
    const year = new Date(r.visit_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Health History"
        description="Feature 2 — Complete medical visit history and document database"
        action={
          <Button
            onClick={() => {
              setForm(empty);
              setErrors({});
              setModal(true);
            }}
          >
            <Plus size={15} /> Add Record
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-surface-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent-cyan">
            {records.length}
          </p>
          <p className="text-xs text-muted mt-1">Total Visits</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">
            {
              records.filter(
                (r) =>
                  new Date(r.visit_date).getFullYear() ===
                  new Date().getFullYear(),
              ).length
            }
          </p>
          <p className="text-xs text-muted mt-1">This Year</p>
        </div>
        <div className="bg-surface border border-surface-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-accent-amber">
            {new Set(records.map((r) => r.doctor_name).filter(Boolean)).size}
          </p>
          <p className="text-xs text-muted mt-1">Doctors Seen</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <EmptyState
            icon="🏥"
            title="No health records yet"
            description="Keep track of all doctor visits, diagnoses, and treatments"
            action={
              <Button onClick={() => setModal(true)}>
                <Plus size={14} /> Add Record
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped)
            .sort((a, b) => b - a)
            .map((year) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={14} className="text-muted" />
                  <h2 className="text-sm font-semibold text-muted">{year}</h2>
                  <Badge variant="default">{grouped[year].length} visits</Badge>
                </div>
                <div className="space-y-3">
                  {grouped[year].map((record) => (
                    <Card
                      key={record.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        expanded === record.id
                          ? "border-accent/30"
                          : "hover:border-surface-border/80",
                      )}
                    >
                      <div
                        className="flex items-start gap-4 p-5"
                        onClick={() =>
                          setExpanded(expanded === record.id ? null : record.id)
                        }
                      >
                        <div className="w-11 h-11 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                          <Stethoscope size={18} className="text-accent-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-text">
                              {record.doctor_name || "Unknown Doctor"}
                            </p>
                            <Badge variant="cyan">
                              {formatDate(record.visit_date)}
                            </Badge>
                          </div>
                          {record.diagnosis && (
                            <p className="text-sm text-muted mt-0.5 truncate">
                              {record.diagnosis}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(record.id);
                          }}
                          className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Expanded details */}
                      {expanded === record.id && (
                        <div className="px-5 pb-5 pt-0 space-y-3 border-t border-surface-border mt-0">
                          {record.diagnosis && (
                            <div>
                              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                                Diagnosis
                              </p>
                              <p className="text-sm text-text">
                                {record.diagnosis}
                              </p>
                            </div>
                          )}
                          {record.notes && (
                            <div>
                              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                                Notes
                              </p>
                              <p className="text-sm text-text leading-relaxed">
                                {record.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Add Health Record"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">
              Visit date
            </label>
            <input
              className={ic}
              type="date"
              value={form.visit_date}
              onChange={set("visit_date")}
            />
            {errors.visit_date && (
              <p className="text-xs text-red-400">{errors.visit_date}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">
              Doctor name
            </label>
            <input
              className={ic}
              placeholder="Dr. Ahmed"
              value={form.doctor_name}
              onChange={set("doctor_name")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">
              Diagnosis
            </label>
            <input
              className={ic}
              placeholder="e.g. Type 2 Diabetes"
              value={form.diagnosis}
              onChange={set("diagnosis")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">
              Notes
            </label>
            <textarea
              className={ic}
              placeholder="Treatment plan, test results..."
              rows={3}
              value={form.notes}
              onChange={set("notes")}
              style={{ resize: "none" }}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
