"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge } from "@/components/ui";
import { Upload, Sparkles, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const URGENCY_COLORS = { low:"text-accent border-accent/30 bg-accent/5", medium:"text-amber-400 border-amber-400/30 bg-amber-400/5", high:"text-red-400 border-red-400/30 bg-red-400/5" };

export default function DiseaseDiagnosticPage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((f) => { setFile(f[0]); setPreview(URL.createObjectURL(f[0])); setResult(null); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept:{"image/*":[]}, maxFiles:1 });

  const handleAnalyze = async () => {
    if (!file) { toast.error("Upload a medical image first"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const r = await api.post("/mental/diagnostic", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setResult(r.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "AI analysis failed. Check GEMINI_API_KEY.");
    } finally { setLoading(false); }
  };

  const topCondition = result?.possible_conditions?.[0];

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader title="Disease Diagnostic" description="Feature 3 — Upload medical image for AI-powered disease prediction" />

      <Card>
        <CardBody className="p-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div {...getRootProps()} className={cn("p-8 border-r border-surface-border cursor-pointer transition-all flex flex-col items-center justify-center gap-4 min-h-[260px]",
              isDragActive?"bg-accent/5":"hover:bg-surface2/40")}>
              <input {...getInputProps()}/>
              {preview ? (
                <div className="space-y-2 text-center">
                  <img src={preview} alt="Medical" className="max-h-44 mx-auto rounded-xl object-contain border border-surface-border"/>
                  <p className="text-xs text-muted">{file?.name}</p>
                  <p className="text-xs text-accent">Click to replace</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-surface2 border border-surface-border flex items-center justify-center"><Upload size={24} className="text-muted"/></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-text">Drop medical image here</p>
                    <p className="text-xs text-muted mt-1">X-ray, CT scan, MRI, skin photo</p>
                  </div>
                </>
              )}
            </div>
            <div className="p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-text">What this analyzes:</p>
                {["🦴 Bone & Joint conditions","🫁 Chest & Lung findings","🧠 Neurological indicators","🫀 Cardiovascular signs","🦷 Dental conditions","🩻 General abnormalities"].map(item=>(
                  <div key={item} className="flex items-center gap-3 text-sm text-muted"><span>{item}</span></div>
                ))}
              </div>
              <Button onClick={handleAnalyze} loading={loading} className="w-full" size="lg" disabled={!file}>
                <Sparkles size={15}/> {loading?"Groq AI analyzing...":"Analyze Image"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Urgency badge */}
          {result.urgency && (
            <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold capitalize", URGENCY_COLORS[result.urgency])}>
              {result.urgency==="high"?"🔴":result.urgency==="medium"?"🟡":"🟢"} {result.urgency} urgency
            </div>
          )}

          {/* Top condition highlight */}
          {topCondition && (
            <Card className="border-accent-amber/30 bg-accent-amber/5">
              <CardBody className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-accent-amber/20 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-accent-amber">{Math.round((topCondition.probability||0)*100)}%</span>
                </div>
                <div>
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide">Most Likely</p>
                  <p className="font-bold text-text text-xl">{topCondition.name}</p>
                  {topCondition.description && <p className="text-sm text-muted mt-0.5">{topCondition.description}</p>}
                </div>
              </CardBody>
            </Card>
          )}

          {/* All conditions */}
          {result.possible_conditions?.length>0 && (
            <Card>
              <CardHeader><h3 className="font-semibold text-text">Possible Conditions</h3></CardHeader>
              <CardBody className="space-y-4">
                {result.possible_conditions.map((c,i)=>{
                  const pct = Math.round((c.probability||0)*100);
                  const color = i===0?"#f59e0b":i===1?"#22d3ee":"#8b949e";
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div><p className="text-sm font-medium text-text">{c.name}</p>{c.description&&<p className="text-xs text-muted">{c.description}</p>}</div>
                        <span className="text-sm font-bold" style={{color}}>{pct}%</span>
                      </div>
                      <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`,background:color}}/>
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}

          {/* Findings */}
          {result.findings && (
            <Card>
              <CardHeader><h3 className="font-semibold text-text">Key Findings</h3></CardHeader>
              <CardBody><p className="text-sm text-text leading-relaxed">{result.findings}</p></CardBody>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations?.length>0 && (
            <Card>
              <CardHeader><h3 className="font-semibold text-text">Recommendations</h3></CardHeader>
              <CardBody className="space-y-2">
                {result.recommendations.map((r,i)=>(
                  <div key={i} className="flex items-start gap-2 text-sm text-text">
                    <ChevronRight size={14} className="text-accent mt-0.5 flex-shrink-0"/>{r}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          <div className="flex items-start gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-xl">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0"/>
            <p className="text-xs text-amber-400">{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
