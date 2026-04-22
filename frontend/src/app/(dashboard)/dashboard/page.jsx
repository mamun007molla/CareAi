"use client";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { physicalAPI, medicationAPI, nutritionAPI, notificationAPI, linksAPI, mentalAPI, caregiverAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, StatCard, Badge, Button, Spinner, EmptyState } from "@/components/ui";
import { formatDateTime, getActivityIcon, getActivityColor } from "@/lib/utils";
import { Activity, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#4ade80","#22d3ee","#f59e0b","#f87171","#a78bfa","#fb923c"];

// ── Elder Dashboard ───────────────────────────────────────────────────────────
function ElderlyDashboard() {
  const { user } = useAuthStore();
  const [data, setData]         = useState({ actStats:null, activities:[], routines:[], medStats:null, checklistStats:null });
  const [loading, setLoading]   = useState(true);
  const [sosLoading, setSosLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      physicalAPI.getStats(),
      physicalAPI.getActivities(),
      physicalAPI.getRoutines(),
      medicationAPI.getStats(),
      mentalAPI.checklistStats(),
    ]).then(([as,ac,ro,ms,cs]) => {
      setData({
        actStats:       as.status==="fulfilled" ? as.value.data : null,
        activities:     ac.status==="fulfilled" ? ac.value.data.slice(0,4) : [],
        routines:       ro.status==="fulfilled" ? ro.value.data.slice(0,4) : [],
        medStats:       ms.status==="fulfilled" ? ms.value.data : null,
        checklistStats: cs.status==="fulfilled" ? cs.value.data : null,
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSOS = async () => {
    if (!confirm("🚨 Send SOS alert to all your caregivers and doctors?")) return;
    setSosLoading(true);
    try {
      const res = await notificationAPI.triggerSOS("I need help! Please check on me immediately.");
      toast.success(`🚨 SOS sent to ${res.data.notified_count} people!`, { duration: 8000 });
    } catch { toast.error("SOS failed."); }
    finally { setSosLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32}/></div>;
  const chartData = data.actStats ? Object.entries(data.actStats.by_type||{}).map(([type,count])=>({type,count})) : [];
  const hour = new Date().getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome + SOS */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-surface2 border border-surface-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">CareAI</p>
            <h1 className="text-3xl font-bold text-text">{greeting}, {user?.name?.split(" ")[0]} 👋</h1>
            <p className="text-muted text-sm mt-1">{new Date().toLocaleDateString("en",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
            <div className="flex gap-5 mt-4 flex-wrap">
              <div><p className="text-2xl font-bold text-accent">{data.actStats?.today||0}</p><p className="text-xs text-muted">Activities</p></div>
              <div className="w-px bg-surface-border"/>
              <div><p className="text-2xl font-bold text-accent-cyan">{data.medStats?.active_count||0}</p><p className="text-xs text-muted">Medications</p></div>
              <div className="w-px bg-surface-border"/>
              <div><p className="text-2xl font-bold text-accent-amber">{data.checklistStats?.done||0}/{data.checklistStats?.total||0}</p><p className="text-xs text-muted">Checklist</p></div>
            </div>
          </div>
          <div className="flex-shrink-0 text-center">
            <button onClick={handleSOS} disabled={sosLoading}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold shadow-2xl shadow-red-500/40 transition-all active:scale-95 disabled:opacity-70 flex flex-col items-center justify-center gap-1">
              {sosLoading ? <Spinner size={20}/> : <><AlertTriangle size={22}/><span className="text-xs font-bold">SOS</span></>}
            </button>
            <p className="text-[10px] text-muted mt-2">Tap for help</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Activities Today"   value={data.actStats?.today||0}        icon="🏃" color="text-accent"/>
        <StatCard label="Active Medications" value={data.medStats?.active_count||0} icon="💊" color="text-accent-cyan"/>
        <StatCard label="Daily Doses"        value={data.medStats?.daily_doses||0}  icon="🕐" color="text-accent-amber"/>
        <StatCard label="Checklist Done"     value={`${data.checklistStats?.percentage||0}%`} icon="✅" color="text-green-400"/>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href:"/physical/activity-tracker",  label:"🎥 Fall Detection",   color:"bg-accent/10 border-accent/20 text-accent" },
          { href:"/physical/medication-verify",  label:"💊 Verify Medicine",  color:"bg-surface2 border-surface-border text-text" },
          { href:"/health/medication-reminder",  label:"🔔 Medications",      color:"bg-cyan-400/10 border-cyan-400/20 text-cyan-400" },
          { href:"/mental/mood-tracking",        label:"😊 Log Mood",         color:"bg-purple-400/10 border-purple-400/20 text-purple-400" },
          { href:"/health/nutrition",            label:"🍽️ Log Meal",        color:"bg-green-400/10 border-green-400/20 text-green-400" },
          { href:"/checklist",                   label:"✅ Daily Checklist",  color:"bg-amber-400/10 border-amber-400/20 text-amber-400" },
          { href:"/mental/disease-diagnostic",   label:"🔬 Diagnose",        color:"bg-surface2 border-surface-border text-text" },
          { href:"/communication/messages",      label:"💬 Messages",        color:"bg-surface2 border-surface-border text-text" },
        ].map(a=>(
          <Link key={a.href} href={a.href}
            className={`flex items-center justify-center p-3 rounded-xl border text-sm font-medium text-center transition-all hover:opacity-80 ${a.color}`}>
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.length>0 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-text text-sm flex items-center gap-2"><Activity size={14}/> Activity Breakdown</h2></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} barSize={24}>
                  <XAxis dataKey="type" tick={{fill:"#8b949e",fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#8b949e",fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:"#161b22",border:"1px solid #2a3441",borderRadius:"10px",fontSize:11}}/>
                  <Bar dataKey="count" radius={[5,5,0,0]}>
                    {chartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text text-sm flex items-center gap-2"><Activity size={14}/> Recent Activities</h2>
              <Link href="/physical/activity-log" className="text-xs text-accent hover:underline">View all</Link>
            </div>
          </CardHeader>
          {data.activities.length===0
            ? <CardBody><EmptyState icon="🏃" title="No activities yet"/></CardBody>
            : <div className="divide-y divide-surface-border">
                {data.activities.map(a=>(
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-xl">{getActivityIcon(a.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium capitalize ${getActivityColor(a.type)}`}>{a.type}</p>
                      <p className="text-xs text-muted">{formatDateTime(a.logged_at)}</p>
                    </div>
                    {a.duration && <Badge variant="default">{a.duration}m</Badge>}
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>

      {data.routines.length>0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text text-sm">Today's Routines</h2>
              <Link href="/physical/routine-schedule" className="text-xs text-accent hover:underline">Manage</Link>
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-surface-border">
            {data.routines.map(r=>(
              <div key={r.id} className="px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">{r.type==="medication"?"💊":r.type==="meal"?"🍽️":"🏋️"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{r.title}</p>
                  <p className="text-xs text-accent">{r.scheduled_at}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Caregiver Dashboard ───────────────────────────────────────────────────────
function CaregiverDashboard() {
  const { user } = useAuthStore();
  const [patients, setPatients]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [overview, setOverview]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [ovLoading, setOvLoading] = useState(false);

  useEffect(() => {
    linksAPI.getMyPatients().then(r => {
      setPatients(r.data);
      if (r.data.length > 0) loadOverview(r.data[0]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const loadOverview = async (patient) => {
    setSelected(patient);
    setOvLoading(true);
    try {
      const r = await caregiverAPI.getOverview(patient.id);
      setOverview(r.data);
    } catch {} finally { setOvLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32}/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-surface to-surface2 border border-surface-border p-6">
        <h1 className="text-3xl font-bold text-text">👨‍👩‍👧 {user?.name}</h1>
        <p className="text-muted text-sm mt-1">Family Caregiver — {patients.length} patient{patients.length!==1?"s":""} linked</p>
      </div>

      {patients.length===0 ? (
        <Card><CardBody>
          <EmptyState icon="👴" title="No patients linked"
            description="Go to Settings and link your elderly family member."
            action={<Link href="/settings"><Button>Go to Settings</Button></Link>}/>
        </CardBody></Card>
      ) : (
        <>
          {/* Patient selector */}
          {patients.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {patients.map(p=>(
                <button key={p.id} onClick={()=>loadOverview(p)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${selected?.id===p.id?"bg-accent/20 text-accent border-accent/40":"border-surface-border text-muted hover:border-accent/30"}`}>
                  👴 {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Patient overview */}
          {ovLoading ? <div className="flex justify-center py-8"><Spinner size={24}/></div>
          : overview && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Meals Today"   value={overview.today_meals}        icon="🍽️" color="text-accent-amber"/>
                <StatCard label="Calories"      value={overview.today_calories}     icon="🔥" color="text-accent"/>
                <StatCard label="Medications"   value={overview.active_medications} icon="💊" color="text-accent-cyan"/>
                <StatCard label="Recent Activity" value={overview.recent_activities?.length||0} icon="🏃" color="text-green-400"/>
              </div>

              {/* Recent activities */}
              {overview.recent_activities?.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-text text-sm">
                        {selected?.name}'s Recent Activities
                      </h2>
                      <Link href="/physical/activity-log" className="text-xs text-accent hover:underline">View all</Link>
                    </div>
                  </CardHeader>
                  <div className="divide-y divide-surface-border">
                    {overview.recent_activities.map((a,i)=>(
                      <div key={i} className="flex items-center gap-3 px-6 py-3">
                        <span className="text-xl">{getActivityIcon(a.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium capitalize ${getActivityColor(a.type)}`}>{a.type}</p>
                          <p className="text-xs text-muted">{formatDateTime(a.logged_at)}</p>
                        </div>
                        {a.logged_by && <Badge variant="warning" className="text-xs">By {a.logged_by}</Badge>}
                        {a.duration && <Badge variant="default">{a.duration}m</Badge>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Medications */}
              {overview.medication_names?.length > 0 && (
                <Card>
                  <CardHeader><h2 className="font-semibold text-text text-sm">💊 Active Medications</h2></CardHeader>
                  <CardBody className="flex flex-wrap gap-2">
                    {overview.medication_names.map((m,i)=><Badge key={i} variant="cyan">{m}</Badge>)}
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href:"/caregiver-tools",            label:"🛠️ Caregiver Tools",  color:"bg-accent/10 border-accent/20 text-accent" },
              { href:"/physical/activity-log",      label:"🏃 Activity Log",     color:"bg-surface2 border-surface-border text-text" },
              { href:"/health/health-history",      label:"🏥 Health History",   color:"bg-surface2 border-surface-border text-text" },
              { href:"/communication/messages",     label:"💬 Messages",         color:"bg-cyan-400/10 border-cyan-400/20 text-cyan-400" },
            ].map(a=>(
              <Link key={a.href} href={a.href}
                className={`flex items-center justify-center p-4 rounded-xl border text-sm font-medium text-center transition-all hover:opacity-80 ${a.color}`}>
                {a.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Doctor Dashboard ──────────────────────────────────────────────────────────
function DoctorDashboard() {
  const { user } = useAuthStore();
  const [patients, setPatients]   = useState([]);
  const [selected, setSelected]   = useState(null);
  const [overview, setOverview]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [ovLoading, setOvLoading] = useState(false);

  useEffect(() => {
    linksAPI.getMyPatients().then(r => {
      setPatients(r.data);
      if (r.data.length > 0) loadOverview(r.data[0]);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const loadOverview = async (patient) => {
    setSelected(patient);
    setOvLoading(true);
    try {
      const r = await caregiverAPI.getOverview(patient.id);
      setOverview(r.data);
    } catch {} finally { setOvLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32}/></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-br from-surface to-surface2 border border-surface-border p-6">
        <h1 className="text-3xl font-bold text-text">👨‍⚕️ Dr. {user?.name}</h1>
        <p className="text-muted text-sm mt-1">Doctor Dashboard — {patients.length} patient{patients.length!==1?"s":""} under care</p>
      </div>

      {patients.length===0 ? (
        <Card><CardBody>
          <EmptyState icon="👴" title="No patients linked"
            description="Go to Settings and link a patient using their email."
            action={<Link href="/settings"><Button>Go to Settings</Button></Link>}/>
        </CardBody></Card>
      ) : (
        <>
          {/* Patient selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Select Patient</p>
            <div className="flex gap-2 flex-wrap">
              {patients.map(p=>(
                <button key={p.id} onClick={()=>loadOverview(p)}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${selected?.id===p.id?"bg-accent/20 text-accent border-accent/40":"border-surface-border text-muted hover:border-accent/30"}`}>
                  👴 {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Patient overview */}
          {ovLoading ? <div className="flex justify-center py-8"><Spinner size={24}/></div>
          : overview && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Meals Today"   value={overview.today_meals}        icon="🍽️" color="text-accent-amber"/>
                <StatCard label="Calories"      value={overview.today_calories}     icon="🔥" color="text-accent"/>
                <StatCard label="Medications"   value={overview.active_medications} icon="💊" color="text-accent-cyan"/>
                <StatCard label="Recent Activity" value={overview.recent_activities?.length||0} icon="🏃" color="text-green-400"/>
              </div>

              {/* Recent activities */}
              {overview.recent_activities?.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-text text-sm">{selected?.name}'s Recent Activities</h2>
                      <Link href="/physical/activity-log" className="text-xs text-accent hover:underline">View all</Link>
                    </div>
                  </CardHeader>
                  <div className="divide-y divide-surface-border">
                    {overview.recent_activities.map((a,i)=>(
                      <div key={i} className="flex items-center gap-3 px-6 py-3">
                        <span className="text-xl">{getActivityIcon(a.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium capitalize ${getActivityColor(a.type)}`}>{a.type}</p>
                          <p className="text-xs text-muted">{formatDateTime(a.logged_at)}</p>
                        </div>
                        {a.logged_by && <Badge variant="warning" className="text-xs">By {a.logged_by}</Badge>}
                        {a.duration && <Badge variant="default">{a.duration}m</Badge>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Medications */}
              {overview.medication_names?.length > 0 && (
                <Card>
                  <CardHeader><h2 className="font-semibold text-text text-sm">💊 Patient's Medications</h2></CardHeader>
                  <CardBody className="flex flex-wrap gap-2">
                    {overview.medication_names.map((m,i)=><Badge key={i} variant="cyan">{m}</Badge>)}
                  </CardBody>
                </Card>
              )}
            </>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href:"/health/health-history",      label:"🏥 Add Health Record",  color:"bg-accent/10 border-accent/20 text-accent" },
              { href:"/health/prescriptions",       label:"📄 Prescriptions",      color:"bg-amber-400/10 border-amber-400/20 text-amber-400" },
              { href:"/mental/disease-diagnostic",  label:"🔬 Diagnostics",        color:"bg-purple-400/10 border-purple-400/20 text-purple-400" },
              { href:"/mental/report-summary",      label:"📋 Report Summary",     color:"bg-surface2 border-surface-border text-text" },
              { href:"/communication/appointments", label:"📅 Appointments",       color:"bg-cyan-400/10 border-cyan-400/20 text-cyan-400" },
              { href:"/communication/messages",     label:"💬 Messages",           color:"bg-surface2 border-surface-border text-text" },
              { href:"/mental/medical-vqa",         label:"❓ Medical Q&A",        color:"bg-surface2 border-surface-border text-text" },
              { href:"/health/medication-reminder", label:"💊 Medications",        color:"bg-surface2 border-surface-border text-text" },
            ].map(a=>(
              <Link key={a.href} href={a.href}
                className={`flex items-center justify-center p-3 rounded-xl border text-sm font-medium text-center transition-all hover:opacity-80 ${a.color}`}>
                {a.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready || !user) return <div className="flex justify-center py-20"><Spinner size={32}/></div>;
  if (user.role === "DOCTOR")    return <DoctorDashboard/>;
  if (user.role === "CAREGIVER") return <CaregiverDashboard/>;
  return <ElderlyDashboard/>;
}
