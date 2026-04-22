"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, Button, Modal, EmptyState, Badge, SectionHeader, Spinner } from "@/components/ui";
import { Plus, Trash2, Phone, Star } from "lucide-react";
import toast from "react-hot-toast";

const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name:"", phone:"", relation:"", is_primary:false });

  const fetchContacts = async () => {
    try { const r = await api.get("/communication/emergency-contacts"); setContacts(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchContacts(); }, []);

  const handleSave = async () => {
    if(!form.name||!form.phone||!form.relation) { toast.error("All fields required"); return; }
    setSaving(true);
    try {
      await api.post("/communication/emergency-contacts", form);
      toast.success("Contact added!"); setForm({name:"",phone:"",relation:"",is_primary:false}); setModal(false); fetchContacts();
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if(!confirm("Delete contact?")) return;
    try { await api.delete(`/communication/emergency-contacts/${id}`); setContacts(p=>p.filter(c=>c.id!==id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Emergency Contacts"
        description="Feature 3 — Quick access contacts for emergencies"
        action={<Button onClick={()=>{setForm({name:"",phone:"",relation:"",is_primary:false});setModal(true);}}><Plus size={15}/> Add Contact</Button>}
      />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28}/></div>
      : contacts.length===0 ? (
        <Card><EmptyState icon="📞" title="No emergency contacts" description="Add contacts who can be called in emergencies"
          action={<Button onClick={()=>setModal(true)}><Plus size={14}/> Add</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {contacts.map(c=>(
            <Card key={c.id} className={c.is_primary?"border-accent-red/30 bg-accent-red/5":""}>
              <div className="flex items-center gap-4 p-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${c.is_primary?"bg-red-400/20":"bg-surface2 border border-surface-border"}`}>
                  {c.is_primary?"🆘":"👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text">{c.name}</p>
                    {c.is_primary && <Badge variant="danger"><Star size={10}/> Primary</Badge>}
                  </div>
                  <p className="text-sm text-muted capitalize">{c.relation}</p>
                  <a href={`tel:${c.phone}`} className="text-sm text-accent-cyan flex items-center gap-1 mt-1 hover:underline">
                    <Phone size={12}/>{c.phone}
                  </a>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/20 text-accent border border-accent/30 text-xs font-medium hover:bg-accent/30 transition-colors">
                    <Phone size={11}/> Call
                  </a>
                  <Button variant="ghost" size="icon" onClick={()=>handleDelete(c.id)} className="hover:text-red-400"><Trash2 size={14}/></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Emergency Contact">
        <div className="space-y-4">
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Full name</label><input className={ic} placeholder="Contact name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Phone number</label><input className={ic} type="tel" placeholder="01778..." value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>
          <div className="space-y-1.5"><label className="block text-sm font-medium text-muted">Relation</label>
            <select className={ic} value={form.relation} onChange={e=>setForm(p=>({...p,relation:e.target.value}))}>
              <option value="">Select...</option>
              <option>Son</option><option>Daughter</option><option>Spouse</option>
              <option>Sibling</option><option>Friend</option><option>Neighbor</option><option>Other</option>
            </select>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_primary} onChange={e=>setForm(p=>({...p,is_primary:e.target.checked}))}
              className="w-4 h-4 rounded accent-accent"/>
            <div><p className="text-sm text-text">Set as primary emergency contact</p><p className="text-xs text-muted">First person to be called in emergency</p></div>
          </label>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Add Contact</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
