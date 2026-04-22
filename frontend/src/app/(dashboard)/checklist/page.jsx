"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge } from "@/components/ui";
import { Plus, Check, Trash2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const CATEGORIES = [
  { value:"medication", emoji:"💊", label:"Medication",  color:"text-accent-cyan",   bg:"bg-accent-cyan/10 border-accent-cyan/20" },
  { value:"meal",       emoji:"🍽️", label:"Meal",        color:"text-accent-amber",  bg:"bg-amber-400/10 border-amber-400/20" },
  { value:"exercise",   emoji:"🏃", label:"Exercise",    color:"text-accent",        bg:"bg-accent/10 border-accent/20" },
  { value:"other",      emoji:"📋", label:"Other",       color:"text-muted",         bg:"bg-surface2 border-surface-border" },
];

const DEFAULT_ITEMS = [
  { title:"Take morning medication",   category:"medication" },
  { title:"Have breakfast",             category:"meal" },
  { title:"Take afternoon medication", category:"medication" },
  { title:"Have lunch",                category:"meal" },
  { title:"Evening walk (15 min)",     category:"exercise" },
  { title:"Take evening medication",   category:"medication" },
  { title:"Have dinner",               category:"meal" },
];

export default function ChecklistPage() {
  const [items, setItems]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat]   = useState("medication");
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"});

  const fetchItems = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.allSettled([
        api.get("/mental/checklist"),
        api.get("/mental/checklist/stats"),
      ]);
      if (itemsRes.status==="fulfilled") setItems(itemsRes.value.data);
      if (statsRes.status==="fulfilled") setStats(statsRes.value.data);
    } finally { setLoading(false); }
  };

  const setupDefaultItems = async () => {
    // Add default items if none exist
    for (const item of DEFAULT_ITEMS) {
      const fd = new FormData();
      fd.append("title", item.title);
      fd.append("category", item.category);
      await api.post("/mental/checklist", fd, { headers:{"Content-Type":"multipart/form-data"} });
    }
    fetchItems();
  };

  useEffect(() => { fetchItems(); }, []);
  useEffect(() => {
    if (!loading && items.length===0) { setupDefaultItems(); }
  }, [loading]);

  const toggleItem = async (id) => {
    try {
      const r = await api.patch(`/mental/checklist/${id}/toggle`);
      setItems(p=>p.map(i=>i.id===id?{...i,is_done:r.data.is_done,done_at:r.data.done_at}:i));
      fetchItems(); // refresh stats
    } catch { toast.error("Failed"); }
  };

  const deleteItem = async (id) => {
    try { await api.delete(`/mental/checklist/${id}`); setItems(p=>p.filter(i=>i.id!==id)); fetchItems(); }
    catch { toast.error("Failed"); }
  };

  const addItem = async () => {
    if (!newTitle.trim()) { toast.error("Enter a task"); return; }
    setAdding(true);
    try {
      const fd = new FormData();
      fd.append("title", newTitle);
      fd.append("category", newCat);
      const r = await api.post("/mental/checklist", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setItems(p=>[...p, r.data]);
      setNewTitle(""); setShowAdd(false);
      fetchItems();
    } catch { toast.error("Failed"); }
    finally { setAdding(false); }
  };

  const grouped = CATEGORIES.reduce((acc,c)=>{
    acc[c.value] = items.filter(i=>i.category===c.value);
    return acc;
  },{});

  const percentage = stats ? (stats.done/(stats.total||1)*100) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Daily Health Checklist"
        description="Feature 8 — Track daily tasks: medication, meals, and exercise"
        action={<Button size="sm" onClick={()=>setShowAdd(p=>!p)}><Plus size={14}/> Add Task</Button>}
      />

      {/* Date + Progress */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">{today}</p>
              <p className="text-2xl font-bold text-text mt-0.5">{stats?.done||0}/{stats?.total||0} completed</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center flex-shrink-0"
              style={{borderColor: percentage>=80?"#4ade80":percentage>=50?"#f59e0b":"#f87171"}}>
              <span className="text-sm font-bold" style={{color:percentage>=80?"#4ade80":percentage>=50?"#f59e0b":"#f87171"}}>
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
          <div className="h-3 bg-surface2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${percentage}%`, background:percentage>=80?"#4ade80":percentage>=50?"#f59e0b":"#f87171"}}/>
          </div>
          {percentage===100 && (
            <div className="text-center text-sm font-semibold text-accent animate-bounce">
              🎉 All tasks completed for today!
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add task */}
      {showAdd && (
        <Card className="border-accent/20 animate-slide-up">
          <CardBody className="space-y-3">
            <input className="w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors"
              placeholder="Task name..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} autoFocus/>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c=>(
                <button key={c.value} onClick={()=>setNewCat(c.value)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    newCat===c.value?"border-accent bg-accent/20 text-accent":"border-surface-border text-muted hover:border-accent/30")}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={()=>setShowAdd(false)}>Cancel</Button>
              <Button size="sm" loading={adding} onClick={addItem}>Add Task</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tasks grouped by category */}
      {CATEGORIES.map(cat=>{
        const catItems = grouped[cat.value]||[];
        if (!catItems.length) return null;
        const catDone = catItems.filter(i=>i.is_done).length;
        return (
          <div key={cat.value}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{cat.emoji}</span>
              <h2 className="text-sm font-semibold text-text">{cat.label}</h2>
              <Badge variant={catDone===catItems.length?"success":"default"}>{catDone}/{catItems.length}</Badge>
            </div>
            <div className="space-y-2">
              {catItems.map(item=>(
                <div key={item.id} className={cn("flex items-center gap-3 p-4 rounded-xl border transition-all group",
                  item.is_done?"bg-accent/5 border-accent/20":"bg-surface border-surface-border hover:border-accent/20")}>
                  <button onClick={()=>toggleItem(item.id)}
                    className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      item.is_done?"bg-accent border-accent":"border-surface-border hover:border-accent")}>
                    {item.is_done && <Check size={12} className="text-bg"/>}
                  </button>
                  <p className={cn("flex-1 text-sm transition-all", item.is_done?"line-through text-muted":"text-text")}>{item.title}</p>
                  {item.is_done && item.done_at && (
                    <span className="text-xs text-muted flex-shrink-0">
                      ✓ {new Date(item.done_at).toLocaleTimeString("en",{hour:"2-digit",minute:"2-digit"})}
                    </span>
                  )}
                  <button onClick={()=>deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
