"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge } from "@/components/ui";
import { Upload, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ReportSummaryPage() {
  const [tab, setTab]         = useState("text");
  const [text, setText]       = useState("");
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((f) => { setFile(f[0]); setPreview(URL.createObjectURL(f[0])); setResult(null); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept:{"image/*":[],"application/pdf":[]}, maxFiles:1 });

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      if (tab==="text") {
        if (!text.trim()) { toast.error("Paste report text first"); setLoading(false); return; }
        fd.append("report_text", text);
      } else {
        if (!file) { toast.error("Upload a file first"); setLoading(false); return; }
        fd.append("file", file);
      }
      const r = await api.post("/mental/summarize-report", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setResult(r.data);
      toast.success("Report summarized!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "AI failed. Check GROQ_API_KEY.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader title="Medical Report Summary" description="Feature 4 — Paste or upload a medical report for AI-powered summary" />

      <div className="flex gap-1 bg-surface2 rounded-xl p-1 border border-surface-border">
        {[{id:"text",label:"📝 Paste Text"},{id:"image",label:"📄 Upload File"}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setResult(null);}}
            className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              tab===t.id?"bg-accent/20 text-accent":"text-muted hover:text-text")}>
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-accent-amber"/>
            <h2 className="font-semibold text-text">AI Report Summarizer</h2>
            <Badge variant="warning">Groq AI</Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {tab==="text" ? (
            <textarea className="w-full bg-surface2 border border-surface-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors min-h-[180px]"
              placeholder="Paste your medical report, lab results, or clinical notes here...&#10;&#10;Example: Patient presents with elevated blood glucose levels (HbA1c 8.2%). Recommended metformin 500mg twice daily..."
              value={text} onChange={e=>setText(e.target.value)} style={{resize:"none"}}/>
          ) : (
            <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive?"border-accent bg-accent/5":"border-surface-border hover:border-accent/40")}>
              <input {...getInputProps()}/>
              {file ? (
                <div className="space-y-2">
                  {preview && file.type.startsWith("image") ? (
                    <img src={preview} alt="Report" className="max-h-36 mx-auto rounded-xl object-contain border border-surface-border"/>
                  ) : <FileText size={32} className="mx-auto text-accent"/>}
                  <p className="text-sm text-accent font-medium">{file.name}</p>
                  <p className="text-xs text-muted">Click to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={28} className="mx-auto text-muted"/>
                  <p className="text-sm text-text">Upload report image or PDF</p>
                  <p className="text-xs text-muted">AI will extract text and summarize</p>
                </div>
              )}
            </div>
          )}
          <Button onClick={handleSummarize} loading={loading} className="w-full" size="lg">
            <Sparkles size={15}/> {loading?"Groq AI summarizing...":"Summarize Report"}
          </Button>
        </CardBody>
      </Card>

      {result && (
        <div className="space-y-4 animate-slide-up">
          <Card className="border-accent/20">
            <CardHeader><h2 className="font-semibold text-text flex items-center gap-2"><Sparkles size={14} className="text-accent"/> Summary</h2></CardHeader>
            <CardBody><p className="text-sm text-text leading-relaxed">{result.summary}</p></CardBody>
          </Card>
          {result.key_findings?.length>0 && (
            <Card>
              <CardHeader><h2 className="font-semibold text-text">Key Findings</h2></CardHeader>
              <CardBody className="space-y-2">
                {result.key_findings.map((f,i)=>(
                  <div key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="text-accent mt-0.5 flex-shrink-0">•</span>{f}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          {result.medications_mentioned?.length>0 && (
            <div className="flex flex-wrap gap-2">
              {result.medications_mentioned.map((m,i)=><Badge key={i} variant="cyan">💊 {m}</Badge>)}
            </div>
          )}
          {result.follow_up_needed && (
            <div className="flex items-center gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-xl text-sm text-amber-400">
              ⚠️ Follow-up appointment recommended
            </div>
          )}
        </div>
      )}
    </div>
  );
}
