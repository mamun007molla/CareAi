"use client";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { nutritionAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, Button, Modal, EmptyState, Badge, SectionHeader, Spinner, StatCard } from "@/components/ui";
import { Plus, Trash2, Camera, Sparkles } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MEAL_TYPES = ["breakfast","lunch","dinner","snack"];
const MEAL_ICONS = { breakfast:"🌅", lunch:"☀️", dinner:"🌙", snack:"🍎" };
const MEAL_COLORS = { breakfast:"text-amber-400", lunch:"text-cyan-400", dinner:"text-purple-400", snack:"text-accent" };
const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";
const empty = { meal_type:"breakfast", description:"", calories:"", protein:"", carbs:"", fat:"" };

export default function NutritionPage() {
  const { user } = useAuthStore();

  // Elder logs meals, Caregiver/Doctor only view
  const canLog = user?.role === "ELDERLY";

  const [meals, setMeals]     = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState(empty);
  const [filter, setFilter]   = useState("all");
  const [imgFile, setImgFile]       = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult, setAiResult]     = useState(null);

  const set = (f) => (e) => setForm(p => ({...p, [f]: e.target.value}));

  const onDrop = useCallback((f) => {
    setImgFile(f[0]); setImgPreview(URL.createObjectURL(f[0])); setAiResult(null);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept:{"image/*":[]}, maxFiles:1,
  });

  const fetchData = async () => {
    try {
      const [mRes, sRes] = await Promise.allSettled([nutritionAPI.getMeals(), nutritionAPI.todayStats()]);
      if (mRes.status==="fulfilled") setMeals(mRes.value.data);
      if (sRes.status==="fulfilled") setStats(sRes.value.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleAnalyzeFood = async () => {
    if (!imgFile) { toast.error("Upload a food photo first"); return; }
    setAiLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", imgFile);
      const res = await nutritionAPI.analyzeFood(fd);
      const d = res.data;
      setAiResult(d);
      setForm({
        meal_type:   d.meal_type_suggestion || "breakfast",
        description: d.food_name + (d.ingredients?.length ? ` (${d.ingredients.slice(0,3).join(", ")})` : ""),
        calories:    d.calories?.toString() || "",
        protein:     d.protein?.toString()  || "",
        carbs:       d.carbs?.toString()    || "",
        fat:         d.fat?.toString()      || "",
      });
      toast.success("AI analyzed your food! Review and save.");
    } catch (err) {
      const msg = err.response?.data?.detail || "";
      if (msg.includes("GROQ") || msg.includes("503")) {
        toast.error("AI failed. Check GROQ_API_KEY in backend/.env");
      } else {
        toast.error("AI failed: " + (msg || "Check GROQ_API_KEY in backend/.env"));
      }
    } finally { setAiLoading(false); }
  };

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error("Add food description"); return; }
    setSaving(true);
    try {
      await nutritionAPI.logMeal({
        meal_type:   form.meal_type,
        description: form.description,
        calories:    form.calories ? parseInt(form.calories)    : null,
        protein:     form.protein  ? parseFloat(form.protein)  : null,
        carbs:       form.carbs    ? parseFloat(form.carbs)    : null,
        fat:         form.fat      ? parseFloat(form.fat)      : null,
      });
      toast.success("Meal logged!");
      setForm(empty); setModal(false);
      setImgFile(null); setImgPreview(null); setAiResult(null);
      fetchData();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this meal?")) return;
    try { await nutritionAPI.removeMeal(id); setMeals(p=>p.filter(m=>m.id!==id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  };

  const displayed = filter==="all" ? meals : meals.filter(m=>m.meal_type===filter);
  const macroData = stats ? [
    {name:"Protein", value:Math.round(stats.protein||0), color:"#4ade80"},
    {name:"Carbs",   value:Math.round(stats.carbs||0),   color:"#22d3ee"},
    {name:"Fat",     value:Math.round(stats.fat||0),     color:"#f59e0b"},
  ].filter(d=>d.value>0) : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Nutrition Tracker"
        description={canLog
          ? "Feature 4 — Log your meals manually or use AI photo analysis"
          : "View patient's daily meal and nutrition log"}
        action={canLog && (
          <Button onClick={()=>{setForm(empty);setImgFile(null);setImgPreview(null);setAiResult(null);setModal(true);}}>
            <Plus size={15}/> Log Meal
          </Button>
        )}
      />

      {/* View-only banner for Caregiver/Doctor */}
      {!canLog && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface2/40 text-xs text-muted">
          <span className="text-lg">👁️</span>
          <span>You can view the patient's nutrition log. Patient logs their own meals.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Meals Today" value={stats?.total_meals??0}               icon="🍽️" color="text-accent"/>
        <StatCard label="Calories"    value={`${stats?.calories??0}`}             icon="🔥" color="text-amber-400" sub="kcal"/>
        <StatCard label="Protein"     value={`${Math.round(stats?.protein??0)}g`} icon="💪" color="text-accent-cyan"/>
        <StatCard label="Carbs"       value={`${Math.round(stats?.carbs??0)}g`}   icon="🌾" color="text-purple-400"/>
      </div>

      {/* Macro chart + meal list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {macroData.length > 0 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-text text-sm">Today's Macros</h2></CardHeader>
            <CardBody className="py-2">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {macroData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#161b22",border:"1px solid #2a3441",borderRadius:"10px",fontSize:12}}
                    formatter={(v,n)=>[`${v}g`,n]}/>
                  <Legend iconType="circle" iconSize={8} formatter={v=><span className="text-xs text-muted">{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        <div className={cn("space-y-3", macroData.length>0?"lg:col-span-2":"lg:col-span-3")}>
          <div className="flex gap-2 flex-wrap">
            {["all",...MEAL_TYPES].map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                  filter===f?"bg-accent/20 text-accent border-accent/40":"bg-surface text-muted border-surface-border hover:border-accent/30")}>
                {f==="all"?"All":`${MEAL_ICONS[f]} ${f}`}
              </button>
            ))}
          </div>

          <Card>
            {loading ? <div className="flex justify-center py-12"><Spinner size={28}/></div>
            : displayed.length===0 ? (
              <EmptyState icon="🍽️"
                title={canLog ? "No meals logged today" : "No meals logged yet"}
                description={canLog ? "Log your first meal or take a photo for AI analysis" : "Patient hasn't logged any meals yet"}
                action={canLog && <Button onClick={()=>setModal(true)}><Plus size={14}/> Log Meal</Button>}
              />
            ) : (
              <div className="divide-y divide-surface-border">
                {displayed.map(meal=>(
                  <div key={meal.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface2/30 transition-colors group">
                    <span className="text-2xl flex-shrink-0">{MEAL_ICONS[meal.meal_type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium capitalize text-sm", MEAL_COLORS[meal.meal_type])}>{meal.meal_type}</p>
                        {meal.calories && <Badge variant="warning">{meal.calories} kcal</Badge>}
                      </div>
                      <p className="text-sm text-text mt-0.5 truncate">{meal.description}</p>
                      {(meal.protein||meal.carbs||meal.fat) && (
                        <div className="flex gap-3 mt-1">
                          {meal.protein && <span className="text-xs text-muted">P:{meal.protein}g</span>}
                          {meal.carbs   && <span className="text-xs text-muted">C:{meal.carbs}g</span>}
                          {meal.fat     && <span className="text-xs text-muted">F:{meal.fat}g</span>}
                        </div>
                      )}
                    </div>
                    {canLog && (
                      <button onClick={()=>handleDelete(meal.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-red-400 transition-all">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Log Meal Modal — Elder only */}
      {canLog && (
        <Modal open={modal} onClose={()=>setModal(false)} title="Log Meal" maxWidth="max-w-xl">
          <div className="space-y-4">
            {/* AI Photo */}
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
              <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                <Sparkles size={12}/> AI Food Analysis — Groq Vision AI
              </p>
              <p className="text-xs text-muted">Take a food photo — AI fills in all nutrition details automatically.</p>
              <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all",
                isDragActive?"border-accent bg-accent/5":"border-surface-border hover:border-accent/40")}>
                <input {...getInputProps()}/>
                {imgPreview ? (
                  <div className="space-y-2">
                    <img src={imgPreview} alt="Food" className="max-h-36 mx-auto rounded-xl object-contain border border-surface-border"/>
                    <p className="text-xs text-muted">{imgFile?.name} — click to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera size={24} className="mx-auto text-muted"/>
                    <p className="text-sm text-text">Drop food photo or click to browse</p>
                  </div>
                )}
              </div>
              {imgFile && (
                <Button onClick={handleAnalyzeFood} loading={aiLoading} className="w-full bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30">
                  <Sparkles size={14}/> {aiLoading ? "Groq AI analyzing…" : "Analyze Food with AI"}
                </Button>
              )}
              {aiResult && (
                <div className="bg-surface2 rounded-xl p-3 border border-surface-border text-xs text-muted space-y-1">
                  <p className="font-semibold text-accent">{aiResult.food_name}</p>
                  {aiResult.health_notes && <p className="italic">{aiResult.health_notes}</p>}
                  <p className="text-green-400">✅ Form filled below — review and save</p>
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted">— or fill manually —</p>

            {/* Meal type */}
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(t=>(
                <button key={t} onClick={()=>setForm(p=>({...p,meal_type:t}))}
                  className={cn("p-2 rounded-xl border text-center text-xs font-medium capitalize transition-all",
                    form.meal_type===t?"bg-accent/20 text-accent border-accent/40":"border-surface-border text-muted hover:border-accent/30")}>
                  <div className="text-lg mb-0.5">{MEAL_ICONS[t]}</div>{t}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Food description *</label>
              <textarea className={ic} rows={2} placeholder="Rice, fish curry, salad..." value={form.description} onChange={set("description")} style={{resize:"none"}}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-muted mb-1">Calories</label><input className={ic} type="number" placeholder="350" value={form.calories} onChange={set("calories")}/></div>
              <div><label className="block text-xs font-medium text-muted mb-1">Protein (g)</label><input className={ic} type="number" placeholder="25" value={form.protein} onChange={set("protein")}/></div>
              <div><label className="block text-xs font-medium text-muted mb-1">Carbs (g)</label><input className={ic} type="number" placeholder="45" value={form.carbs} onChange={set("carbs")}/></div>
              <div><label className="block text-xs font-medium text-muted mb-1">Fat (g)</label><input className={ic} type="number" placeholder="12" value={form.fat} onChange={set("fat")}/></div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={()=>setModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={saving} onClick={handleSave}>Save Meal</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
