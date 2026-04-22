"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api, { physicalAPI, linksAPI } from "@/lib/api";
import { Card, Button, Modal, EmptyState, Badge, SectionHeader, Spinner, StatCard } from "@/components/ui";
import { Plus, Trash2, Filter } from "lucide-react";
import { formatDateTime, getActivityIcon, getActivityColor, cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";

const ACTIVITY_TYPES = ["walking","eating","sleeping","exercise","rest","therapy","other"];
const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function ActivityLogPage() {
  const { user } = useAuthStore();
  const isElderly = user?.role === "ELDERLY";
  const isDoctor  = user?.role === "DOCTOR";

  const [activities, setActivities] = useState([]);
  const [stats, setStats]           = useState(null);
  const [patients, setPatients]     = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [filter, setFilter]         = useState("all");
  const [form, setForm]             = useState({ type:"walking", duration:"", notes:"" });

  useEffect(() => {
    if (isElderly) {
      Promise.allSettled([physicalAPI.getActivities(), physicalAPI.getStats()])
        .then(([actRes, statsRes]) => {
          if (actRes.status==="fulfilled")   setActivities(actRes.value.data);
          if (statsRes.status==="fulfilled") setStats(statsRes.value.data);
        }).finally(() => setLoading(false));
    } else {
      // Caregiver/Doctor: load linked patients
      linksAPI.getMyPatients().then(r => {
        setPatients(r.data);
        if (r.data.length > 0) loadPatientActivities(r.data[0]);
        else setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, []);

  const loadPatientActivities = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const r = await api.get(`/physical/activities/patient/${patient.id}`);
      setActivities(r.data);
    } catch { toast.error("Failed to load patient activities"); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.type) { toast.error("Select activity type"); return; }
    setSaving(true);
    try {
      await physicalAPI.logActivity({
        type: form.type,
        duration: form.duration ? parseInt(form.duration) : null,
        notes: form.notes || null,
      });
      toast.success("Activity logged!");
      setForm({type:"walking",duration:"",notes:""}); setModal(false);
      const [actRes, statsRes] = await Promise.allSettled([physicalAPI.getActivities(), physicalAPI.getStats()]);
      if (actRes.status==="fulfilled")   setActivities(actRes.value.data);
      if (statsRes.status==="fulfilled") setStats(statsRes.value.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      await physicalAPI.deleteActivity(id);
      setActivities(p=>p.filter(a=>a.id!==id));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const displayed = filter==="all" ? activities : activities.filter(a=>a.type===filter);

  // Stats for elder
  const totalActivities = isElderly ? (stats?.total||0) : activities.length;
  const todayActivities = isElderly ? (stats?.today||0) : activities.filter(a=>new Date(a.logged_at).toDateString()===new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Activity Log"
        description={isElderly
          ? "Feature 3 — Log your daily activities"
          : `Viewing ${selectedPatient?.name||"patient"}'s activity log`}
        action={isElderly && (
          <Button onClick={()=>{setForm({type:"walking",duration:"",notes:""});setModal(true);}}>
            <Plus size={15}/> Log Activity
          </Button>
        )}
      />

      {/* Patient selector for Caregiver/Doctor */}
      {!isElderly && patients.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {patients.map(p=>(
            <button key={p.id} onClick={()=>loadPatientActivities(p)}
              className={cn("px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                selectedPatient?.id===p.id?"bg-accent/20 text-accent border-accent/40":"border-surface-border text-muted hover:border-accent/30")}>
              👴 {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Info for non-elderly */}
      {!isElderly && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface2/40 text-xs text-muted">
          <span className="text-lg">{isDoctor?"👨‍⚕️":"👨‍👩‍👧"}</span>
          {selectedPatient
            ? `Showing ${selectedPatient.name}'s activities. Use Caregiver Tools to log on their behalf.`
            : "No patients linked. Go to Settings to link a patient."}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={totalActivities} icon="📊" color="text-accent"/>
        <StatCard label="Today" value={todayActivities} icon="📅" color="text-accent-cyan"/>
        <StatCard label="Types" value={new Set(activities.map(a=>a.type)).size} icon="🏃" color="text-accent-amber"/>
        <StatCard label="Duration" value={`${activities.reduce((s,a)=>s+(a.duration||0),0)}m`} icon="⏱️" color="text-purple-400"/>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <Filter size={13} className="text-muted"/>
        {["all",...ACTIVITY_TYPES].map(t=>(
          <button key={t} onClick={()=>setFilter(t)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
              filter===t?"bg-accent/20 text-accent border-accent/40":"bg-surface text-muted border-surface-border hover:border-accent/30")}>
            {t==="all"?"All":t}
          </button>
        ))}
      </div>

      <Card>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28}/></div>
        : displayed.length===0 ? (
          <EmptyState icon="🏃"
            title={isElderly ? "No activities logged" : `No activities for ${selectedPatient?.name||"patient"}`}
            description={isElderly ? "Start logging your daily activities" : "Patient hasn't logged any activities yet"}
            action={isElderly && <Button onClick={()=>setModal(true)}><Plus size={14}/> Log Activity</Button>}
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {displayed.map(a=>(
              <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface2/30 transition-colors group">
                <div className="w-11 h-11 rounded-xl bg-surface2 border border-surface-border flex items-center justify-center text-2xl flex-shrink-0">
                  {getActivityIcon(a.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("font-medium capitalize", getActivityColor(a.type))}>{a.type}</p>
                    {a.duration && <Badge variant="default">{a.duration} min</Badge>}
                    {a.logged_by && <Badge variant="warning" className="text-xs">By {a.logged_by}</Badge>}
                  </div>
                  {a.notes && <p className="text-xs text-muted mt-0.5 truncate">{a.notes}</p>}
                  <p className="text-xs text-muted mt-0.5">{formatDateTime(a.logged_at)}</p>
                </div>
                {isElderly && (
                  <button onClick={()=>handleDelete(a.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-red-400 transition-all">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {isElderly && (
        <Modal open={modal} onClose={()=>setModal(false)} title="Log Activity">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_TYPES.map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,type:t}))}
                  className={cn("p-2 rounded-xl border text-center text-xs font-medium capitalize transition-all",
                    form.type===t?"bg-accent/20 text-accent border-accent/40":"border-surface-border text-muted hover:border-accent/30")}>
                  <div className="text-xl mb-0.5">{getActivityIcon(t)}</div>{t}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Duration (minutes)</label>
              <input className={ic} type="number" placeholder="30" value={form.duration} onChange={e=>setForm(p=>({...p,duration:e.target.value}))}/>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Notes</label>
              <textarea className={ic} rows={2} placeholder="How did it go?" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{resize:"none"}}/>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={handleSave}>Log Activity</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
