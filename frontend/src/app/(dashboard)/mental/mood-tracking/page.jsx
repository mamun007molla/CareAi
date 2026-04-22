"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Spinner, Badge } from "@/components/ui";
import { Smile, Meh, Frown, Sparkles, TrendingUp } from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MOODS = [
  { value:"happy",    emoji:"😊", label:"Happy",    color:"text-accent" },
  { value:"calm",     emoji:"😌", label:"Calm",     color:"text-accent-cyan" },
  { value:"content",  emoji:"🙂", label:"Content",  color:"text-green-400" },
  { value:"anxious",  emoji:"😰", label:"Anxious",  color:"text-accent-amber" },
  { value:"sad",      emoji:"😢", label:"Sad",      color:"text-blue-400" },
  { value:"lonely",   emoji:"😔", label:"Lonely",   color:"text-purple-400" },
  { value:"angry",    emoji:"😠", label:"Angry",    color:"text-red-400" },
  { value:"confused", emoji:"😕", label:"Confused", color:"text-muted" },
];

const SENTIMENT_COLORS = { positive:"text-accent", neutral:"text-accent-amber", negative:"text-red-400" };
const SENTIMENT_BG = { positive:"bg-accent/10 border-accent/20", neutral:"bg-amber-400/10 border-amber-400/20", negative:"bg-red-400/10 border-red-400/20" };

export default function MoodTrackingPage() {
  const [mood, setMood]       = useState("");
  const [text, setText]       = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [entries, setEntries] = useState([]);
  const [weekly, setWeekly]   = useState(null);
  const [tab, setTab]         = useState("log");

  useEffect(() => {
    api.get("/mental/mood?limit=20").then(r => setEntries(r.data)).catch(()=>{});
    api.get("/mental/mood/weekly-summary").then(r => setWeekly(r.data)).catch(()=>{});
  }, []);

  const handleAnalyze = async () => {
    if (!text.trim()) { toast.error("Describe how you are feeling"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("text", text);
      fd.append("mood_label", mood || "general");
      const r = await api.post("/mental/mood/analyze", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setResult(r.data);
      setEntries(p => [r.data, ...p]);
      // Refresh weekly
      api.get("/mental/mood/weekly-summary").then(r => setWeekly(r.data)).catch(()=>{});
      toast.success("Mood logged!");
      setText(""); setMood("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "AI analysis failed. Check GROQ_API_KEY.");
    } finally { setLoading(false); }
  };

  const chartData = weekly?.entries?.slice().reverse().map((e, i) => ({
    day: i + 1,
    score: e.score ? Math.round(e.score * 100) : 50,
    mood: e.mood,
  })) || [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Mood Tracking" description="Feature 1 — Daily mood check-in with AI sentiment analysis" />

      {/* Tabs */}
      <div className="flex gap-1 bg-surface2 rounded-xl p-1 border border-surface-border">
        {[{id:"log",label:"Log Mood"},{id:"history",label:"History"},{id:"weekly",label:"Weekly Report"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              tab===t.id?"bg-accent/20 text-accent":"text-muted hover:text-text")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Log Mood Tab */}
      {tab==="log" && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h2 className="font-semibold text-text">How are you feeling today?</h2></CardHeader>
            <CardBody className="space-y-5">
              {/* Mood selector */}
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map(m=>(
                  <button key={m.value} onClick={()=>setMood(m.value)}
                    className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                      mood===m.value?"border-accent bg-accent/10":"border-surface-border hover:border-accent/30 bg-surface2")}>
                    <span className="text-2xl">{m.emoji}</span>
                    <span className={cn("text-xs font-medium", mood===m.value?"text-accent":m.color)}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Text input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-muted">Tell us more about how you feel</label>
                <textarea
                  className="w-full bg-surface2 border border-surface-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors min-h-[100px]"
                  placeholder="I am feeling a bit tired today but overall okay. Had a good breakfast..."
                  value={text}
                  onChange={e=>setText(e.target.value)}
                  style={{resize:"none"}}
                />
              </div>

              <Button onClick={handleAnalyze} loading={loading} className="w-full" size="lg">
                <Sparkles size={15}/> {loading?"Groq AI analyzing...":"Analyze My Mood"}
              </Button>
            </CardBody>
          </Card>

          {/* AI Result */}
          {result && (
            <Card className={cn("border animate-slide-up", SENTIMENT_BG[result.sentiment])}>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOODS.find(m=>m.value===result.mood)?.emoji || "😐"}</span>
                  <div>
                    <p className="font-bold text-text text-lg capitalize">{result.mood}</p>
                    <p className={cn("text-sm font-medium capitalize", SENTIMENT_COLORS[result.sentiment])}>
                      {result.sentiment} sentiment • {Math.round(result.score*100)}% wellbeing score
                    </p>
                  </div>
                </div>

                {/* Score bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted"><span>Low</span><span>High</span></div>
                  <div className="h-3 bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{width:`${Math.round(result.score*100)}%`,
                        background: result.score>=0.6?"#4ade80":result.score>=0.4?"#f59e0b":"#f87171"}} />
                  </div>
                </div>

                {result.summary && (
                  <div className="p-3 bg-surface2 rounded-xl border border-surface-border">
                    <p className="text-sm text-text italic">"{result.summary}"</p>
                  </div>
                )}

                {result.emotions?.length>0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.emotions.map((e,i)=><Badge key={i} variant="default" className="capitalize">{e}</Badge>)}
                  </div>
                )}

                {result.recommendations?.length>0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">Suggestions</p>
                    {result.recommendations.map((r,i)=>(
                      <div key={i} className="flex items-start gap-2 text-sm text-text">
                        <span className="text-accent mt-0.5">•</span>{r}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab==="history" && (
        <Card className="animate-fade-in">
          {entries.length===0 ? (
            <CardBody><p className="text-sm text-muted text-center py-8">No mood entries yet. Log your first mood!</p></CardBody>
          ) : (
            <div className="divide-y divide-surface-border">
              {entries.map((e,i)=>(
                <div key={e.id||i} className="flex items-start gap-3 px-6 py-4">
                  <span className="text-2xl flex-shrink-0">{MOODS.find(m=>m.value===e.mood)?.emoji||"😐"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text capitalize">{e.mood||"Unknown"}</span>
                      <Badge variant={e.sentiment==="positive"?"success":e.sentiment==="negative"?"danger":"warning"} className="capitalize">
                        {e.sentiment}
                      </Badge>
                      {e.score && <span className="text-xs text-muted">{Math.round(e.score*100)}%</span>}
                    </div>
                    {e.summary && <p className="text-xs text-muted mt-0.5 line-clamp-2 italic">"{e.summary}"</p>}
                    <p className="text-xs text-muted mt-1">{formatDateTime(e.logged_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Weekly Tab */}
      {tab==="weekly" && weekly && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{weekly.total}</p>
              <p className="text-xs text-muted mt-1">Check-ins</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-accent-cyan">{Math.round((weekly.average_score||0)*100)}%</p>
              <p className="text-xs text-muted mt-1">Avg Wellbeing</p>
            </Card>
            <Card className={cn("p-4 text-center border",
              weekly.trend==="positive"?"border-accent/30 bg-accent/5":
              weekly.trend==="concerning"?"border-red-400/30 bg-red-400/5":"border-amber-400/30 bg-amber-400/5")}>
              <p className={cn("text-sm font-bold capitalize",
                weekly.trend==="positive"?"text-accent":weekly.trend==="concerning"?"text-red-400":"text-amber-400")}>
                {weekly.trend==="positive"?"😊 Good":weekly.trend==="concerning"?"😟 Needs Care":"😐 Neutral"}
              </p>
              <p className="text-xs text-muted mt-1">This Week</p>
            </Card>
          </div>

          {chartData.length>0 && (
            <Card>
              <CardHeader><h2 className="font-semibold text-text flex items-center gap-2"><TrendingUp size={15}/> Mood Trend</h2></CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="day" tick={{fill:"#8b949e",fontSize:11}} axisLine={false} tickLine={false} label={{value:"Day",position:"insideBottom",fill:"#8b949e",fontSize:10}} />
                    <YAxis domain={[0,100]} tick={{fill:"#8b949e",fontSize:11}} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{background:"#161b22",border:"1px solid #2a3441",borderRadius:"10px",fontSize:12}}
                      formatter={(v)=>[`${v}%`,"Wellbeing"]} />
                    <ReferenceLine y={60} stroke="#4ade80" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={2} dot={{fill:"#22d3ee",r:4}} />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}

          {/* Mood distribution */}
          {Object.keys(weekly.mood_distribution||{}).length>0 && (
            <Card>
              <CardHeader><h2 className="font-semibold text-text">Mood Distribution</h2></CardHeader>
              <CardBody className="flex flex-wrap gap-3">
                {Object.entries(weekly.mood_distribution).map(([mood,count])=>(
                  <div key={mood} className="flex items-center gap-2 bg-surface2 border border-surface-border rounded-xl px-3 py-2">
                    <span className="text-xl">{MOODS.find(m=>m.value===mood)?.emoji||"😐"}</span>
                    <div><p className="text-sm font-medium text-text capitalize">{mood}</p><p className="text-xs text-muted">{count} times</p></div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
