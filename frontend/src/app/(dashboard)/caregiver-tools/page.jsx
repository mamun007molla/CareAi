"use client";
import { useEffect, useState } from "react";
import api, { linksAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, Button, Modal, EmptyState, Badge, SectionHeader, Spinner } from "@/components/ui";
import { Plus, Activity, UtensilsCrossed, FileText, AlertTriangle } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function CaregiverToolsPage() {
  const { user } = useAuthStore();
  const [patients, setPatients]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [overview, setOverview]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [overviewLoading, setOvLoading] = useState(false);
  const [actModal, setActModal]     = useState(false);
  const [mealModal, setMealModal]   = useState(false);
  const [noteModal, setNoteModal]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [actForm, setActForm]       = useState({ type:"walking", duration:"", notes:"" });
  const [mealForm, setMealForm]     = useState({ meal_type:"breakfast", description:"", calories:"" });
  const [note, setNote]             = useState("");
  const [sosLoading, setSosLoading] = useState(false);

  const ACTIVITY_TYPES = ["walking","eating","sleeping","exercise","rest","therapy","other"];
  const MEAL_TYPES = ["breakfast","lunch","dinner","snack"];

  useEffect(() => {
    linksAPI.getMyPatients().then(r=>setPatients(r.data)).finally(()=>setLoading(false));
  }, []);

  const loadOverview = async (patient) => {
    setSelected(patient);
    setOvLoading(true);
    try {
      const r = await api.get(`/caregiver/patient-overview/${patient.id}`);
      setOverview(r.data);
    } catch { toast.error("Failed to load patient data"); }
    finally { setOvLoading(false); }
  };

  const logActivity = async () => {
    if (!actForm.type) { toast.error("Select activity type"); return; }
    setSaving(true);
    try {
      await api.post(`/caregiver/log-activity/${selected.id}`, {
        type: actForm.type,
        duration: actForm.duration ? parseInt(actForm.duration) : null,
        notes: actForm.notes || null,
      });
      toast.success(`Activity logged for ${selected.name}!`);
      setActModal(false); setActForm({type:"walking",duration:"",notes:""});
      loadOverview(selected);
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const logMeal = async () => {
    if (!mealForm.description) { toast.error("Add meal description"); return; }
    setSaving(true);
    try {
      await api.post(`/caregiver/log-meal/${selected.id}`, {
        meal_type: mealForm.meal_type,
        description: mealForm.description,
        calories: mealForm.calories ? parseInt(mealForm.calories) : null,
      });
      toast.success(`Meal logged for ${selected.name}!`);
      setMealModal(false); setMealForm({meal_type:"breakfast",description:"",calories:""});
      loadOverview(selected);
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const addNote = async () => {
    if (!note.trim()) { toast.error("Write a note"); return; }
    setSaving(true);
    try {
      await api.post(`/caregiver/add-note/${selected.id}`, null, { params: { note } });
      toast.success("Observation added!");
      setNoteModal(false); setNote("");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const triggerSOS = async () => {
    if (!confirm(`🚨 Send SOS alert for ${selected.name}?`)) return;
    setSosLoading(true);
    try {
      const r = await api.post(`/caregiver/sos/${selected.id}`, null, { params: { message: `${selected.name} needs immediate help!` } });
      toast.success(`SOS sent! ${r.data.notified} people notified.`, { duration: 8000 });
    } catch { toast.error("Failed to send SOS"); }
    finally { setSosLoading(false); }
  };

  if (user?.role === "ELDERLY") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Caregiver Tools" description="This section is for caregivers only" />
        <Card><CardBody><p className="text-sm text-muted text-center py-4">This page is only accessible to Caregivers and Doctors.</p></CardBody></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Caregiver Tools"
        description="Log activities and meals on behalf of your patient when they are unable to do it themselves"
      />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28}/></div>
      : patients.length === 0 ? (
        <Card><EmptyState icon="👴" title="No patients linked" description="Go to Settings to link an elderly patient" /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient selector */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-widest">Select Patient</p>
            {patients.map(p=>(
              <button key={p.id} onClick={()=>loadOverview(p)}
                className={cn("w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
                  selected?.id===p.id?"border-accent/40 bg-accent/5":"border-surface-border bg-surface hover:border-accent/20")}>
                <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center font-bold text-text flex-shrink-0">{p.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text">{p.name}</p>
                  <p className="text-xs text-muted capitalize">{p.relation}</p>
                </div>
                {selected?.id===p.id && <Badge variant="success">Selected</Badge>}
              </button>
            ))}
          </div>

          {/* Actions + Overview */}
          <div className="lg:col-span-2 space-y-4">
            {!selected ? (
              <Card><CardBody><p className="text-sm text-muted text-center py-6">← Select a patient to see actions</p></CardBody></Card>
            ) : (
              <>
                {/* Quick actions */}
                <Card>
                  <CardHeader><h2 className="font-semibold text-text">Actions for {selected.name}</h2></CardHeader>
                  <CardBody className="grid grid-cols-2 gap-3">
                    <Button onClick={()=>setActModal(true)} variant="secondary" className="justify-start gap-2 text-accent border-accent/30 hover:bg-accent/10">
                      <Activity size={15}/> Log Activity
                    </Button>
                    <Button onClick={()=>setMealModal(true)} variant="secondary" className="justify-start gap-2 text-accent-cyan border-accent-cyan/30 hover:bg-accent-cyan/10">
                      <UtensilsCrossed size={15}/> Log Meal
                    </Button>
                    <Button onClick={()=>setNoteModal(true)} variant="secondary" className="justify-start gap-2 text-accent-amber border-accent-amber/30 hover:bg-accent-amber/10">
                      <FileText size={15}/> Add Observation
                    </Button>
                    <Button onClick={triggerSOS} loading={sosLoading} variant="danger" className="justify-start gap-2">
                      <AlertTriangle size={15}/> Send SOS
                    </Button>
                  </CardBody>
                </Card>

                {/* Overview */}
                {overviewLoading ? <div className="flex justify-center py-8"><Spinner size={24}/></div>
                : overview && (
                  <Card>
                    <CardHeader><h2 className="font-semibold text-text">Today's Overview</h2></CardHeader>
                    <CardBody className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-surface2 rounded-xl border border-surface-border">
                        <p className="text-2xl font-bold text-accent">{overview.today_meals}</p>
                        <p className="text-xs text-muted mt-1">Meals Today</p>
                      </div>
                      <div className="text-center p-3 bg-surface2 rounded-xl border border-surface-border">
                        <p className="text-2xl font-bold text-accent-amber">{overview.today_calories}</p>
                        <p className="text-xs text-muted mt-1">Calories</p>
                      </div>
                      <div className="text-center p-3 bg-surface2 rounded-xl border border-surface-border">
                        <p className="text-2xl font-bold text-accent-cyan">{overview.active_medications}</p>
                        <p className="text-xs text-muted mt-1">Medications</p>
                      </div>
                    </CardBody>
                    {overview.recent_activities?.length > 0 && (
                      <div className="px-6 pb-5">
                        <p className="text-xs font-semibold text-muted mb-2">Recent Activities</p>
                        <div className="space-y-1.5">
                          {overview.recent_activities.map((a,i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted">
                              <span className="text-accent">•</span>
                              <span className="capitalize font-medium text-text">{a.type}</span>
                              {a.duration && <span>({a.duration}min)</span>}
                              {a.logged_by && <span className="text-accent-amber">by {a.logged_by}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Log Activity Modal */}
      <Modal open={actModal} onClose={()=>setActModal(false)} title={`Log Activity for ${selected?.name}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Activity type</label>
            <select className={ic} value={actForm.type} onChange={e=>setActForm(p=>({...p,type:e.target.value}))}>
              {ACTIVITY_TYPES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Duration (minutes)</label><input className={ic} type="number" placeholder="30" value={actForm.duration} onChange={e=>setActForm(p=>({...p,duration:e.target.value}))}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Notes</label><textarea className={ic} rows={2} placeholder="How did it go?" value={actForm.notes} onChange={e=>setActForm(p=>({...p,notes:e.target.value}))} style={{resize:"none"}}/></div>
          <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={()=>setActModal(false)}>Cancel</Button><Button className="flex-1" loading={saving} onClick={logActivity}>Log Activity</Button></div>
        </div>
      </Modal>

      {/* Log Meal Modal */}
      <Modal open={mealModal} onClose={()=>setMealModal(false)} title={`Log Meal for ${selected?.name}`}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Meal type</label>
            <select className={ic} value={mealForm.meal_type} onChange={e=>setMealForm(p=>({...p,meal_type:e.target.value}))}>
              {MEAL_TYPES.map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Description</label><textarea className={ic} rows={2} placeholder="What did they eat?" value={mealForm.description} onChange={e=>setMealForm(p=>({...p,description:e.target.value}))} style={{resize:"none"}}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Calories (optional)</label><input className={ic} type="number" placeholder="350" value={mealForm.calories} onChange={e=>setMealForm(p=>({...p,calories:e.target.value}))}/></div>
          <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={()=>setMealModal(false)}>Cancel</Button><Button className="flex-1" loading={saving} onClick={logMeal}>Log Meal</Button></div>
        </div>
      </Modal>

      {/* Note Modal */}
      <Modal open={noteModal} onClose={()=>setNoteModal(false)} title={`Add Observation for ${selected?.name}`}>
        <div className="space-y-4">
          <p className="text-xs text-muted">Add a health observation note. This will appear in their activity log and notify the patient.</p>
          <textarea className={cn(ic,"min-h-[120px]")} placeholder="e.g. Patient seemed confused this morning, had difficulty walking..." value={note} onChange={e=>setNote(e.target.value)}/>
          <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={()=>setNoteModal(false)}>Cancel</Button><Button className="flex-1" loading={saving} onClick={addNote}>Add Note</Button></div>
        </div>
      </Modal>
    </div>
  );
}
