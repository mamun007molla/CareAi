// src/app/(dashboard)/health/nutrition/page.jsx
"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { nutritionAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, Button, Modal, EmptyState, Badge, SectionHeader, Spinner, StatCard } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
const MEAL_COLORS = { breakfast: "text-accent-amber", lunch: "text-accent-cyan", dinner: "text-purple-400", snack: "text-accent" };
const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";
const empty = { meal_type: "breakfast", description: "", calories: "", protein: "", carbs: "", fat: "" };

export default function NutritionPage() {
  const [meals, setMeals]       = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(empty);
  const [errors, setErrors]     = useState({});
  const [filter, setFilter]     = useState("all");

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const fetchData = async () => {
    try {
      const [mRes, sRes] = await Promise.allSettled([nutritionAPI.getMeals(), nutritionAPI.todayStats()]);
      if (mRes.status === "fulfilled") setMeals(mRes.value.data);
      if (sRes.status === "fulfilled") setStats(sRes.value.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await nutritionAPI.logMeal({
        meal_type:   form.meal_type,
        description: form.description,
        calories:    form.calories ? parseInt(form.calories) : null,
        protein:     form.protein  ? parseFloat(form.protein) : null,
        carbs:       form.carbs    ? parseFloat(form.carbs)   : null,
        fat:         form.fat      ? parseFloat(form.fat)     : null,
      });
      toast.success("Meal logged!");
      setForm(empty); setModal(false); fetchData();
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this meal?")) return;
    try {
      await nutritionAPI.removeMeal(id);
      setMeals(p => p.filter(m => m.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const displayed = filter === "all" ? meals : meals.filter(m => m.meal_type === filter);

  // Macro chart data
  const macroData = stats ? [
    { name: "Protein", value: Math.round(stats.protein || 0), color: "#4ade80" },
    { name: "Carbs",   value: Math.round(stats.carbs   || 0), color: "#22d3ee" },
    { name: "Fat",     value: Math.round(stats.fat     || 0), color: "#f59e0b" },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Nutrition Tracker"
        description="Feature 4 — Log daily meals and track calories, protein, carbs, and fat"
        action={<Button onClick={() => { setForm(empty); setErrors({}); setModal(true); }}><Plus size={15} /> Log Meal</Button>}
      />

      {/* Today's stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Meals Today"      value={stats?.total_meals ?? 0} icon="🍽️" color="text-accent" />
        <StatCard label="Calories"         value={`${stats?.calories ?? 0}`} icon="🔥" color="text-accent-amber" sub="kcal" />
        <StatCard label="Protein"          value={`${Math.round(stats?.protein ?? 0)}g`} icon="💪" color="text-accent-cyan" />
        <StatCard label="Carbs"            value={`${Math.round(stats?.carbs ?? 0)}g`}   icon="🌾" color="text-purple-400" />
      </div>

      {/* Macro chart + filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {macroData.length > 0 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-text text-sm">Today's Macros</h2></CardHeader>
            <CardBody className="py-2">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={macroData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background:"#161b22", border:"1px solid #2a3441", borderRadius:"10px", fontSize:12 }} formatter={(v, n) => [`${v}g`, n]} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        <div className={cn("space-y-4", macroData.length > 0 ? "lg:col-span-2" : "lg:col-span-3")}>
          {/* Filter */}
          <div className="flex gap-2 flex-wrap">
            {["all", ...MEAL_TYPES].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize",
                  filter === f ? "bg-accent/20 text-accent border-accent/40" : "bg-surface text-muted border-surface-border hover:border-accent/30")}>
                {f === "all" ? "All" : `${MEAL_ICONS[f]} ${f}`}
              </button>
            ))}
          </div>

          <Card>
            {loading ? <div className="flex justify-center py-12"><Spinner size={28} /></div>
            : displayed.length === 0 ? (
              <EmptyState icon="🍽️" title="No meals logged" description="Start tracking your nutrition"
                action={filter==="all" && <Button onClick={() => setModal(true)}><Plus size={14} /> Log Meal</Button>} />
            ) : (
              <div className="divide-y divide-surface-border">
                {displayed.map(meal => (
                  <div key={meal.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface2/30 transition-colors group">
                    <span className="text-2xl flex-shrink-0">{MEAL_ICONS[meal.meal_type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-medium capitalize text-sm", MEAL_COLORS[meal.meal_type])}>{meal.meal_type}</p>
                        {meal.calories && <Badge variant="warning">{meal.calories} kcal</Badge>}
                      </div>
                      <p className="text-sm text-text mt-0.5 truncate">{meal.description}</p>
                      {(meal.protein || meal.carbs || meal.fat) && (
                        <div className="flex gap-3 mt-1">
                          {meal.protein && <span className="text-xs text-muted">P: {meal.protein}g</span>}
                          {meal.carbs   && <span className="text-xs text-muted">C: {meal.carbs}g</span>}
                          {meal.fat     && <span className="text-xs text-muted">F: {meal.fat}g</span>}
                        </div>
                      )}
                      <p className="text-xs text-muted mt-0.5">{formatDateTime(meal.logged_at)}</p>
                    </div>
                    <button onClick={() => handleDelete(meal.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Log Meal">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted">Meal type</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setForm(p=>({...p, meal_type:t}))}
                  className={cn("p-2.5 rounded-xl border text-center text-xs font-medium capitalize transition-all",
                    form.meal_type===t ? "bg-accent/20 text-accent border-accent/40" : "border-surface-border text-muted hover:border-accent/30")}>
                  <div className="text-lg mb-0.5">{MEAL_ICONS[t]}</div>{t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">What did you eat?</label>
            <textarea className={ic} rows={2} placeholder="e.g. Rice, fish curry, salad" value={form.description} onChange={set("description")} style={{resize:"none"}} />
            {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Calories (kcal)</label>
              <input className={ic} type="number" placeholder="350" value={form.calories} onChange={set("calories")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Protein (g)</label>
              <input className={ic} type="number" placeholder="25" value={form.protein} onChange={set("protein")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Carbs (g)</label>
              <input className={ic} type="number" placeholder="45" value={form.carbs} onChange={set("carbs")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">Fat (g)</label>
              <input className={ic} type="number" placeholder="12" value={form.fat} onChange={set("fat")} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>Log Meal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
