"use client";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import api, { medicationAPI } from "@/lib/api";
import {
  Card,
  CardBody,
  Button,
  Modal,
  EmptyState,
  Badge,
  SectionHeader,
  Spinner,
  StatCard,
} from "@/components/ui";
import { Plus, Trash2, Bell, Volume2, BellRing, Check } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";

const ic =
  "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";
const empty = {
  name: "",
  dosage: "",
  frequency: "once daily",
  times: "08:00",
  start_date: "",
  end_date: "",
  instructions: "",
};

export default function MedicationReminderPage() {
  const { user } = useAuthStore();
  const isElderly = user?.role === "ELDERLY";

  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [speaking, setSpeaking] = useState(null);
  const [notifPerm, setNotifPerm] = useState("default");
  const [upcomingReminder, setUpcomingReminder] = useState(null);
  const checkerRef = useRef(null);
  const notifiedRef = useRef(new Set());

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const fetchMeds = async () => {
    try {
      const r = await medicationAPI.getAll();
      setMeds(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
    if ("Notification" in window) setNotifPerm(Notification.permission);

    // Check every 20 seconds for reminders
    checkerRef.current = setInterval(() => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const nowSecs = now.getSeconds();
      const dateKey = now.toDateString();

      setMeds((curMeds) => {
        curMeds.forEach((med) => {
          if (!med.is_active) return;
          (med.times || []).forEach((t) => {
            const timeStr = t.trim().substring(0, 5);
            const [rh, rm] = timeStr.split(":").map(Number);
            const reminderMins = rh * 60 + rm;
            const diff = reminderMins - nowMins;
            const key = `${med.id}-${timeStr}-${dateKey}`;

            // Trigger if within 0-1 minute window (catches exact time + 30s interval gap)
            if (diff >= 0 && diff <= 1 && !notifiedRef.current.has(key)) {
              notifiedRef.current.add(key);
              triggerReminder(med);
              // Save to notification bell (caregiver also gets notified)
              api
                .post(`/notifications/medication-reminder/${med.id}`, null, {
                  params: { med_name: med.name, dosage: med.dosage },
                })
                .catch(() => {});
            }

            // Show upcoming in next 5 minutes
            if (diff > 1 && diff <= 5) {
              setUpcomingReminder({ med, timeStr, minsLeft: diff });
            }
          });
        });
        return curMeds;
      });
    }, 20000);

    return () => clearInterval(checkerRef.current);
  }, []);

  const triggerReminder = (med) => {
    // Browser notification
    if (Notification.permission === "granted") {
      new Notification("💊 Medication Reminder — CareAI", {
        body: `Time to take ${med.dosage} of ${med.name}. ${med.instructions || ""}`,
        icon: "/favicon.ico",
        requireInteraction: true,
      });
    }
    // Voice reminder
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(
        `Medication reminder. It is time to take your medicine. Please take ${med.dosage} of ${med.name}. ${med.instructions || ""}`,
      );
      msg.rate = 0.85;
      msg.pitch = 1;
      msg.lang = "en-US";
      window.speechSynthesis.speak(msg);
    }
    // Toast
    toast(`💊 Time for: ${med.name} — ${med.dosage}`, {
      duration: 10000,
      icon: "🔔",
    });
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser does not support notifications");
      return;
    }
    const r = await Notification.requestPermission();
    setNotifPerm(r);
    if (r === "granted")
      toast.success(
        "✅ Notifications enabled! You will get reminders at scheduled times.",
      );
    else
      toast.error("Notifications blocked. Please enable in browser settings.");
  };

  const speakNow = (med) => {
    if (!window.speechSynthesis) {
      toast.error("Voice not supported in this browser");
      return;
    }
    setSpeaking(med.id);
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(
      `Time to take your medication. Please take ${med.dosage} of ${med.name}. ${med.instructions || "Take with water."}`,
    );
    msg.rate = 0.85;
    msg.lang = "en-US";
    msg.onend = () => setSpeaking(null);
    window.speechSynthesis.speak(msg);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.dosage.trim()) errs.dosage = "Required";
    if (!form.start_date) errs.start_date = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await medicationAPI.create({
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        times: form.times
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        instructions: form.instructions || null,
      });
      toast.success("Medication added!");
      setForm(empty);
      setModal(false);
      fetchMeds();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add medication");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove medication?")) return;
    try {
      await medicationAPI.remove(id);
      setMeds((p) => p.filter((m) => m.id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Medication Reminder"
        description={
          isElderly
            ? "Feature 1 — Manage your medications with automatic voice and browser reminders"
            : "View linked patient's medication schedule"
        }
        action={
          isElderly && (
            <Button
              onClick={() => {
                setForm(empty);
                setErrors({});
                setModal(true);
              }}
            >
              <Plus size={15} /> Add Medication
            </Button>
          )
        }
      />

      {/* Upcoming reminder alert */}
      {upcomingReminder && isElderly && (
        <Card className="border-accent-amber/40 bg-accent-amber/5 animate-pulse">
          <CardBody className="flex items-center gap-3 py-3">
            <BellRing size={18} className="text-accent-amber flex-shrink-0" />
            <p className="text-sm font-medium text-accent-amber">
              💊 {upcomingReminder.med.name} reminder in{" "}
              {upcomingReminder.minsLeft} minute
              {upcomingReminder.minsLeft > 1 ? "s" : ""} (
              {upcomingReminder.timeStr})
            </p>
            <button
              onClick={() => setUpcomingReminder(null)}
              className="ml-auto text-muted hover:text-text"
            >
              ✕
            </button>
          </CardBody>
        </Card>
      )}

      {/* Notification permission */}
      {isElderly && notifPerm !== "granted" && (
        <Card className="border-accent/30 bg-accent/5">
          <CardBody className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-accent flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">
                  Enable automatic reminders
                </p>
                <p className="text-xs text-muted">
                  Get browser popup + voice alert at medication times. Keep this
                  page open.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={requestPermission}
              className="flex-shrink-0"
            >
              Enable Reminders
            </Button>
          </CardBody>
        </Card>
      )}

      {isElderly && notifPerm === "granted" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/20 bg-accent/5 text-sm text-muted">
          <Check size={14} className="text-accent" />
          Reminders active — voice + browser popup will trigger at scheduled
          times
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Active Medications"
          value={meds.length}
          icon="💊"
          color="text-accent-cyan"
        />
        <StatCard
          label="Daily Doses"
          value={meds.reduce((s, m) => s + (m.times?.length || 0), 0)}
          icon="🕐"
          color="text-accent"
        />
      </div>

      {/* Medication list */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : meds.length === 0 ? (
          <EmptyState
            icon="💊"
            title="No medications added"
            description={
              isElderly
                ? "Add your medications to get reminders"
                : "Patient has no medications yet"
            }
            action={
              isElderly && (
                <Button onClick={() => setModal(true)}>
                  <Plus size={14} /> Add Medication
                </Button>
              )
            }
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {meds.map((med) => (
              <div
                key={med.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-surface2/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-xl flex-shrink-0">
                  💊
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-text">{med.name}</p>
                    <Badge variant="cyan">{med.dosage}</Badge>
                    <Badge variant="default">{med.frequency}</Badge>
                  </div>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {med.times?.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs bg-surface2 text-muted px-2 py-0.5 rounded-lg border border-surface-border flex items-center gap-1"
                      >
                        <Bell size={10} />
                        {t}
                      </span>
                    ))}
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-muted mt-1">
                      {med.instructions}
                    </p>
                  )}
                  <p className="text-xs text-muted mt-1">
                    From {formatDate(med.start_date)}
                    {med.end_date ? ` to ${formatDate(med.end_date)}` : ""}
                  </p>
                </div>
                {isElderly && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => triggerReminder(med)}
                      className="text-accent-amber border-amber-400/30 hover:bg-amber-400/10 text-xs"
                    >
                      Test
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => speakNow(med)}
                      className={
                        speaking === med.id
                          ? "text-accent border-accent/40"
                          : ""
                      }
                      title="Voice"
                    >
                      <Volume2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(med.id)}
                      className="hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {isElderly && (
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Add Medication"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Medication name
              </label>
              <input
                className={ic}
                placeholder="e.g. Metformin"
                value={form.name}
                onChange={set("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-400">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Dosage
              </label>
              <input
                className={ic}
                placeholder="e.g. 500mg"
                value={form.dosage}
                onChange={set("dosage")}
              />
              {errors.dosage && (
                <p className="text-xs text-red-400">{errors.dosage}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Frequency
              </label>
              <select
                className={ic}
                value={form.frequency}
                onChange={set("frequency")}
              >
                <option>once daily</option>
                <option>twice daily</option>
                <option>three times daily</option>
                <option>as needed</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Reminder times (comma separated)
              </label>
              <input
                className={ic}
                placeholder="08:00, 14:00, 20:00"
                value={form.times}
                onChange={set("times")}
              />
              <p className="text-xs text-muted">
                Use 24h format. Multiple times: 08:00, 20:00
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-muted">
                  Start date
                </label>
                <input
                  className={ic}
                  type="date"
                  value={form.start_date}
                  onChange={set("start_date")}
                />
                {errors.start_date && (
                  <p className="text-xs text-red-400">{errors.start_date}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-muted">
                  End date (optional)
                </label>
                <input
                  className={ic}
                  type="date"
                  value={form.end_date}
                  onChange={set("end_date")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Instructions
              </label>
              <textarea
                className={ic}
                placeholder="Take after meal, with water..."
                rows={2}
                value={form.instructions}
                onChange={set("instructions")}
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
      )}
    </div>
  );
}
