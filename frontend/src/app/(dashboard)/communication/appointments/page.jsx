"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, Button, Modal, EmptyState, Badge, SectionHeader, Spinner } from "@/components/ui";
import { Plus, Trash2, Calendar, MapPin, Check } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";
const STATUS_COLORS = { upcoming:"cyan", completed:"success", cancelled:"danger" };

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [appts, setAppts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState({ title:"", description:"", scheduled_at:"", location:"" });

  const fetchAppts = async () => {
    try { const r = await api.get("/communication/appointments"); setAppts(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAppts(); }, []);

  const handleSave = async () => {
    if (!form.title||!form.scheduled_at) { toast.error("Title and date required"); return; }
    setSaving(true);
    try {
      await api.post("/communication/appointments", {
        title:form.title, description:form.description||null,
        scheduled_at:new Date(form.scheduled_at).toISOString(),
        location:form.location||null,
      });
      toast.success("Appointment created!");
      setForm({title:"",description:"",scheduled_at:"",location:""}); setModal(false); fetchAppts();
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const markComplete = async (id) => {
    try { await api.patch(`/communication/appointments/${id}/status`,null,{params:{status:"completed"}}); fetchAppts(); toast.success("Marked complete"); }
    catch { toast.error("Failed"); }
  };

  const handleDelete = async (id) => {
    if(!confirm("Cancel appointment?")) return;
    try { await api.delete(`/communication/appointments/${id}`); setAppts(p=>p.filter(a=>a.id!==id)); toast.success("Cancelled"); }
    catch { toast.error("Failed"); }
  };

  const upcoming = appts.filter(a=>a.status==="upcoming");
  const past     = appts.filter(a=>a.status!=="upcoming");

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Appointments"
        description="Feature 2 — Schedule and track medical appointments"
        action={<Button onClick={()=>{setForm({title:"",description:"",scheduled_at:"",location:""});setModal(true);}}><Plus size={15}/> Add Appointment</Button>}
      />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28}/></div>
      : appts.length===0 ? (
        <Card><EmptyState icon="📅" title="No appointments" description="Schedule your next doctor visit"
          action={<Button onClick={()=>setModal(true)}><Plus size={14}/> Add</Button>} /></Card>
      ) : (
        <div className="space-y-6">
          {upcoming.length>0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Upcoming</p>
              <div className="space-y-3">
                {upcoming.map(a=>(
                  <Card key={a.id} className="border-accent-cyan/20">
                    <div className="flex items-start gap-4 p-5">
                      <div className="w-11 h-11 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-xl flex-shrink-0">📅</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text">{a.title}</p>
                        <p className="text-sm text-accent-cyan">{new Date(a.scheduled_at).toLocaleDateString("en",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})}</p>
                        {a.location&&<p className="text-xs text-muted mt-1 flex items-center gap-1"><MapPin size={11}/>{a.location}</p>}
                        {a.description&&<p className="text-xs text-muted mt-1">{a.description}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="secondary" size="sm" onClick={()=>markComplete(a.id)} className="text-accent border-accent/30 hover:bg-accent/10 text-xs">
                          <Check size={11}/> Done
                        </Button>
                        <Button variant="ghost" size="icon" onClick={()=>handleDelete(a.id)} className="hover:text-red-400"><Trash2 size={13}/></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          {past.length>0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-3">Past</p>
              <div className="space-y-2">
                {past.map(a=>(
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-surface-border opacity-60">
                    <span className="text-xl">📅</span>
                    <div className="flex-1 min-w-0"><p className="text-sm text-text truncate">{a.title}</p><p className="text-xs text-muted">{new Date(a.scheduled_at).toLocaleDateString()}</p></div>
                    <Badge variant={STATUS_COLORS[a.status]}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="New Appointment">
        <div className="space-y-4">
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Title</label><input className={ic} placeholder="e.g. Diabetes checkup" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Date & Time</label><input className={ic} type="datetime-local" value={form.scheduled_at} onChange={e=>setForm(p=>({...p,scheduled_at:e.target.value}))}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Location</label><input className={ic} placeholder="Hospital / Clinic name" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Notes</label><textarea className={ic} rows={2} placeholder="What is it for?" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{resize:"none"}}/></div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
