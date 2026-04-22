"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, Button, SectionHeader, Spinner, EmptyState } from "@/components/ui";
import { Send } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { formatDateTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const roleEmoji = { ELDERLY:"👴", CAREGIVER:"👨‍👩‍👧", DOCTOR:"👨‍⚕️" };

  useEffect(() => {
    api.get("/communication/contacts").then(r=>setContacts(r.data)).finally(()=>setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = () => api.get(`/communication/messages/${selected.id}`).then(r=>setMessages(r.data)).catch(()=>{});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [selected]);

  const handleSend = async () => {
    if (!text.trim() || !selected) return;
    setSending(true);
    try {
      await api.post("/communication/messages", { receiver_id: selected.id, content: text.trim() });
      setText("");
      const r = await api.get(`/communication/messages/${selected.id}`);
      setMessages(r.data);
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Messages" description="Feature 1 — Communicate with your care team" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{height:"580px"}}>
        <Card className="overflow-hidden flex flex-col">
          <CardHeader><h2 className="text-sm font-semibold text-text">Contacts</h2></CardHeader>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="flex justify-center py-8"><Spinner/></div>
            : contacts.length === 0 ? <p className="p-4 text-sm text-muted text-center">No contacts yet. Link patients/caregivers from Settings.</p>
            : contacts.map(c => (
              <button key={c.id} onClick={()=>setSelected(c)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 border-b border-surface-border text-left transition-colors hover:bg-surface2/40",
                  selected?.id===c.id && "bg-accent/10")}>
                <div className="w-9 h-9 rounded-full bg-surface2 border border-surface-border flex items-center justify-center font-bold text-sm flex-shrink-0">{c.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{c.name}</p>
                  <p className="text-xs text-muted">{roleEmoji[c.role]} {c.role}</p>
                </div>
                {c.unread>0 && <span className="w-5 h-5 rounded-full bg-accent text-bg text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon="💬" title="Select a contact" description="Click a contact to start chatting" />
            </div>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center font-bold text-sm">{selected.name[0]}</div>
                  <div><p className="font-semibold text-text text-sm">{selected.name}</p><p className="text-xs text-muted">{roleEmoji[selected.role]} {selected.role}</p></div>
                </div>
              </CardHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length===0 ? <p className="text-center text-sm text-muted py-8">No messages yet. Send the first message!</p>
                : messages.map(m=>(
                  <div key={m.id} className={cn("flex",m.sender_id===user?.id?"justify-end":"justify-start")}>
                    <div className={cn("max-w-xs px-4 py-2.5 rounded-2xl text-sm",
                      m.sender_id===user?.id?"bg-accent text-bg rounded-br-sm":"bg-surface2 text-text rounded-bl-sm border border-surface-border")}>
                      <p>{m.content}</p>
                      <p className={cn("text-[10px] mt-1",m.sender_id===user?.id?"text-bg/60":"text-muted")}>{formatDateTime(m.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-surface-border flex gap-2">
                <input className="flex-1 bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60"
                  placeholder="Type a message..." value={text} onChange={e=>setText(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&handleSend()} />
                <Button onClick={handleSend} loading={sending} size="icon" disabled={!text.trim()}><Send size={16}/></Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
