"use client";
import { useState, useEffect } from "react";
import useAuthStore from "@/store/authStore";
import { linksAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge, Spinner } from "@/components/ui";
import { User, Link2, Unlink, Mail, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [myPatients, setMyPatients]   = useState([]);
  const [myCaregivers, setMyCaregivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [relation, setRelation] = useState("parent");
  const [linking, setLinking] = useState(false);

  const roleLabel = { ELDERLY:"👴 Elderly Patient", CAREGIVER:"👨‍👩‍👧 Family Caregiver", DOCTOR:"👨‍⚕️ Doctor" };
  const roleBadgeColor = { ELDERLY:"bg-amber-400/10 text-amber-400 border-amber-400/20", CAREGIVER:"bg-cyan-400/10 text-cyan-400 border-cyan-400/20", DOCTOR:"bg-accent/10 text-accent border-accent/20" };

  useEffect(() => { if (user) loadLinks(); }, [user]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      if (user.role==="ELDERLY") {
        const r = await linksAPI.getMyCaregivers();
        setMyCaregivers(r.data);
      } else {
        const r = await linksAPI.getMyPatients();
        setMyPatients(r.data);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleLink = async () => {
    if (!emailInput.trim()) { toast.error("Enter email address"); return; }
    setLinking(true);
    try {
      const res = await linksAPI.linkByEmail(emailInput.trim(), relation);
      toast.success(`✅ Linked to ${res.data.patient_name}!`);
      setEmailInput("");
      loadLinks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Patient not found. Make sure they registered with ELDERLY role.");
    } finally { setLinking(false); }
  };

  const handleUnlink = async (id, name) => {
    if (!confirm(`Unlink ${name}?`)) return;
    try { await linksAPI.unlink(id); toast.success("Unlinked"); loadLinks(); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Settings" description="Manage your account and patient connections" />

      {/* Profile */}
      <Card>
        <CardHeader><div className="flex items-center gap-2"><User size={15}/><h2 className="font-medium text-text">My Profile</h2></div></CardHeader>
        <CardBody>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface2 border border-surface-border">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent flex items-center justify-center text-bg text-2xl font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-text text-lg">{user?.name}</p>
              <p className="text-sm text-muted">{user?.email}</p>
              {user?.phone && <p className="text-sm text-muted">{user?.phone}</p>}
              <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-2", roleBadgeColor[user?.role])}>
                {roleLabel[user?.role]}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* CAREGIVER / DOCTOR: Link patient */}
      {(user?.role==="CAREGIVER"||user?.role==="DOCTOR") && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-cyan-400"/>
              <h2 className="font-medium text-text">
                {user?.role==="DOCTOR" ? "My Patients" : "Linked Elderly Patients"}
              </h2>
              <Badge variant="cyan">{myPatients.length} linked</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-5">
            <div className="p-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 space-y-3">
              <div className="flex items-center gap-2"><Mail size={13} className="text-cyan-400"/><p className="text-sm font-medium text-text">Add by Email</p></div>
              <p className="text-xs text-muted">Enter the elderly patient's email. They must have registered with <span className="text-amber-400 font-medium">ELDERLY</span> role.</p>
              <input className={ic} type="email" placeholder="elder@example.com" value={emailInput} onChange={e=>setEmailInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLink()} />
              {user?.role==="CAREGIVER" && (
                <select className={ic} value={relation} onChange={e=>setRelation(e.target.value)}>
                  <option value="parent">Parent</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="other">Other</option>
                </select>
              )}
              <Button onClick={handleLink} loading={linking} className="w-full">Link Patient</Button>
            </div>

            {loading ? <div className="flex justify-center py-3"><Spinner size={20}/></div>
            : myPatients.length===0 ? <p className="text-sm text-muted text-center py-3">No patients linked yet.</p>
            : <div className="space-y-2">
                {myPatients.map(p=>(
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface2 border border-surface-border">
                    <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center text-text font-bold text-sm">{p.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{p.name}</p>
                      <p className="text-xs text-muted">{p.email} {p.relation&&`· ${p.relation}`}</p>
                    </div>
                    <Badge variant="warning">👴 Patient</Badge>
                    <button onClick={()=>handleUnlink(p.id, p.name)} className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      <Unlink size={13}/>
                    </button>
                  </div>
                ))}
              </div>
            }
          </CardBody>
        </Card>
      )}

      {/* ELDERLY: My caregivers */}
      {user?.role==="ELDERLY" && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-amber-400"/>
              <h2 className="font-medium text-text">My Caregivers & Doctors</h2>
              <Badge variant="warning">{myCaregivers.length}</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface2 border border-accent/20">
              <Mail size={13} className="text-accent flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted">Share your email with caregivers/doctors so they can link to you</p>
                <p className="text-sm font-mono text-accent mt-0.5">{user?.email}</p>
              </div>
              <button onClick={()=>{navigator.clipboard.writeText(user?.email||"");toast.success("Copied!");}}
                className="text-xs text-muted hover:text-text px-2 py-1 rounded-lg border border-surface-border hover:border-accent/40 transition-all flex-shrink-0">
                Copy
              </button>
            </div>

            {loading ? <div className="flex justify-center py-3"><Spinner size={20}/></div>
            : myCaregivers.length===0 ? <p className="text-sm text-muted text-center py-3">No caregivers linked yet.</p>
            : <div className="space-y-2">
                {myCaregivers.map(c=>(
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface2 border border-surface-border">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-bg text-sm font-bold",
                      c.role==="DOCTOR"?"bg-gradient-to-br from-accent to-accent-cyan":"bg-gradient-to-br from-cyan-400 to-accent")}>
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{c.name}</p>
                      <p className="text-xs text-muted capitalize">{c.relation||c.role.toLowerCase()} · {c.email}</p>
                    </div>
                    <Badge variant={c.role==="DOCTOR"?"success":"cyan"}>
                      {c.role==="DOCTOR"?"👨‍⚕️ Doctor":"👨‍👩‍👧 Caregiver"}
                    </Badge>
                  </div>
                ))}
              </div>
            }
          </CardBody>
        </Card>
      )}

      {/* Sign Out */}
      <Card className="border-red-400/20">
        <CardBody className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-text">Sign out</p><p className="text-xs text-muted">Sign out of your CareAI account</p></div>
          <Button variant="danger" onClick={()=>{logout();router.push("/");}}><LogOut size={14}/> Sign Out</Button>
        </CardBody>
      </Card>
    </div>
  );
}
