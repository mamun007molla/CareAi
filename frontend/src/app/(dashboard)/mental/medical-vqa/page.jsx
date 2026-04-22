"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge } from "@/components/ui";
import { Upload, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const SAMPLE_QUESTIONS = [
  "What does this medical image show?",
  "Are there any abnormalities visible?",
  "What organ or body part is shown?",
  "Is there any sign of infection or disease?",
];

export default function MedicalVQAPage() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [question, setQuestion] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((f) => { setFile(f[0]); setPreview(URL.createObjectURL(f[0])); setResult(null); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept:{"image/*":[]}, maxFiles:1 });

  const handleAnalyze = async () => {
    if (!file) { toast.error("Upload a medical image first"); return; }
    if (!question.trim()) { toast.error("Enter a question about the image"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("question", question);
      const r = await api.post("/mental/vqa", fd, { headers:{"Content-Type":"multipart/form-data"} });
      setResult(r.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "AI analysis failed. Check GEMINI_API_KEY.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader title="Medical Visual Q&A" description="Feature 2 — Upload a medical image and ask AI any question about it" />

      <Card className="border-accent-cyan/20 bg-accent-cyan/5">
        <CardBody className="py-3 flex items-center gap-3">
          <Sparkles size={14} className="text-accent-cyan flex-shrink-0"/>
          <p className="text-xs text-muted">Powered by <span className="text-accent-cyan font-semibold">Google AI (Groq)</span> — ask any medical question about your image</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-text">Upload Medical Image</h2></CardHeader>
        <CardBody className="space-y-5">
          <div {...getRootProps()} className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            isDragActive?"border-accent-cyan bg-accent-cyan/5":"border-surface-border hover:border-accent-cyan/40 hover:bg-surface2/30")}>
            <input {...getInputProps()}/>
            {preview ? (
              <div className="space-y-2">
                <img src={preview} alt="Medical" className="max-h-52 mx-auto rounded-xl object-contain border border-surface-border"/>
                <p className="text-xs text-muted">{file?.name} — click to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={28} className="mx-auto text-muted"/>
                <p className="text-sm text-text font-medium">Upload X-ray, MRI, CT scan or any medical image</p>
                <p className="text-xs text-muted">JPG, PNG, WEBP</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted">Your question</label>
            <textarea className="w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors"
              placeholder="e.g. What does this X-ray show? Are there any abnormalities?"
              value={question} onChange={e=>setQuestion(e.target.value)} rows={2} style={{resize:"none"}}/>
          </div>

          {/* Sample questions */}
          <div className="space-y-2">
            <p className="text-xs text-muted">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q,i)=>(
                <button key={i} onClick={()=>setQuestion(q)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-muted hover:border-accent/40 hover:text-text transition-all bg-surface2">
                  {q}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleAnalyze} loading={loading} className="w-full" size="lg">
            <Sparkles size={15}/> {loading?"Groq AI analyzing...":"Ask AI"}
          </Button>
        </CardBody>
      </Card>

      {result && (
        <Card className="border-accent-cyan/20 animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent-cyan"/>
              <h2 className="font-semibold text-text">AI Answer</h2>
              <Badge variant="cyan">{Math.round((result.confidence||0)*100)}% confident</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="p-4 bg-surface2 rounded-xl border border-surface-border">
              <p className="text-xs text-muted italic mb-2">Q: {question}</p>
              <p className="text-sm text-text leading-relaxed">{result.answer}</p>
            </div>

            {result.related_findings?.length>0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Related Findings</p>
                {result.related_findings.map((f,i)=>(
                  <div key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="text-accent-cyan mt-0.5">•</span>{f}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-xl">
              <AlertTriangle size={13} className="text-amber-400 mt-0.5 flex-shrink-0"/>
              <p className="text-xs text-amber-400">{result.disclaimer}</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
