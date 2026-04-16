// src/app/(dashboard)/health/prescriptions/page.jsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { prescriptionAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, Button, Modal, EmptyState, Badge, SectionHeader, Spinner } from "@/components/ui";
import { Upload, Trash2, Sparkles, FileText, ChevronDown, ChevronUp, FileSearch } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [file, setFile]         = useState(null);
  const [summarizing, setSummarizing] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [textModal, setTextModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [form, setForm] = useState({ doctor_name: "", issued_date: "", notes: "" });

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const onDrop = useCallback((f) => setFile(f[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [], "application/pdf": [] }, maxFiles: 1,
  });

  const fetchPrescriptions = async () => {
    try { const r = await prescriptionAPI.getAll(); setPrescriptions(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchPrescriptions(); }, []);

  const handleUpload = async () => {
    if (!file) { toast.error("Select a file first"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (form.doctor_name) fd.append("doctor_name", form.doctor_name);
      if (form.issued_date) fd.append("issued_date", new Date(form.issued_date).toISOString());
      if (form.notes)       fd.append("notes", form.notes);
      await prescriptionAPI.upload(fd);
      toast.success("Prescription uploaded!");
      setFile(null); setForm({ doctor_name:"", issued_date:"", notes:"" }); setModal(false);
      fetchPrescriptions();
    } catch { toast.error("Upload failed"); }
    finally { setSaving(false); }
  };

  const handleSummarize = async (id) => {
    setSummarizing(id);
    try {
      const r = await prescriptionAPI.summarize(id);
      setPrescriptions(p => p.map(x => x.id===id ? {...x, ai_summary: r.data.summary} : x));
      toast.success("AI summary generated!");
    } catch { toast.error("AI unavailable. Start Ollama: ollama serve && ollama pull gemma3:4b"); }
    finally { setSummarizing(null); }
  };

  const handleSummarizeText = async () => {
    if (!reportText.trim()) { toast.error("Paste report text first"); return; }
    setTextLoading(true);
    try {
      const fd = new FormData();
      fd.append("report_text", reportText);
      const r = await prescriptionAPI.summarizeText(fd);
      setTextResult(r.data);
    } catch { toast.error("AI unavailable"); }
    finally { setTextLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this prescription?")) return;
    try { await prescriptionAPI.remove(id); setPrescriptions(p => p.filter(x => x.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Prescription Tracker"
        description="Feature 3 — Upload and manage prescriptions with AI-powered summaries"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setTextResult(null); setReportText(""); setTextModal(true); }}>
              <Sparkles size={13} /> Summarize Text
            </Button>
            <Button onClick={() => { setFile(null); setForm({doctor_name:"",issued_date:"",notes:""}); setModal(true); }}>
              <Upload size={15} /> Upload
            </Button>
          </div>
        }
      />

      {/* AI info */}
      <Card className="border-accent-amber/20 bg-accent-amber/5">
        <CardBody className="py-3 flex items-center gap-3">
          <Sparkles size={14} className="text-accent-amber flex-shrink-0" />
          <p className="text-xs text-muted">
            AI Summary uses <span className="text-accent-amber font-medium">gemma3:4b (Ollama)</span> to extract key findings, medications, and follow-up requirements from uploaded reports.
          </p>
        </CardBody>
      </Card>

      {/* List */}
      <Card>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div>
        : prescriptions.length === 0 ? (
          <EmptyState icon="📄" title="No prescriptions uploaded"
            description="Upload doctor prescriptions or medical reports"
            action={<Button onClick={() => setModal(true)}><Upload size={14} /> Upload</Button>} />
        ) : (
          <div className="divide-y divide-surface-border">
            {prescriptions.map(p => (
              <div key={p.id}>
                <div className="flex items-start gap-4 px-6 py-4">
                  <div className="w-11 h-11 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center text-xl flex-shrink-0">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">{p.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.doctor_name && <span className="text-xs text-muted">Dr. {p.doctor_name}</span>}
                      {p.issued_date && <Badge variant="default">{formatDate(p.issued_date)}</Badge>}
                      {p.ai_summary && <Badge variant="success">AI Summarized</Badge>}
                    </div>
                    {p.notes && <p className="text-xs text-muted mt-1 truncate">{p.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Summarize button */}
                    <Button variant="secondary" size="sm"
                      onClick={() => handleSummarize(p.id)}
                      loading={summarizing === p.id}
                      className="text-accent-amber border-accent-amber/30 hover:bg-accent-amber/10 text-xs">
                      <Sparkles size={11} /> AI
                    </Button>
                    {/* Expand */}
                    <Button variant="ghost" size="icon" onClick={() => setExpanded(expanded===p.id ? null : p.id)}>
                      {expanded===p.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </Button>
                    {/* Delete */}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="hover:text-red-400">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Expanded AI summary */}
                {expanded===p.id && p.ai_summary && (
                  <div className="mx-6 mb-4 p-4 bg-accent-amber/5 rounded-xl border border-accent-amber/20">
                    <p className="text-xs font-semibold text-accent-amber mb-2 flex items-center gap-1.5">
                      <Sparkles size={11}/> AI Summary
                    </p>
                    <p className="text-sm text-text leading-relaxed">{p.ai_summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Upload Prescription">
        <div className="space-y-4">
          <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
            isDragActive ? "border-accent bg-accent/5" : "border-surface-border hover:border-accent/40"
          )}>
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-1">
                <FileText size={24} className="mx-auto text-accent" />
                <p className="text-sm text-accent font-medium">{file.name}</p>
                <p className="text-xs text-muted">Click to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={24} className="mx-auto text-muted" />
                <p className="text-sm text-text">Drop prescription or click to browse</p>
                <p className="text-xs text-muted">PDF, JPG, PNG</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Doctor name</label>
            <input className={ic} placeholder="Dr. Ahmed" value={form.doctor_name} onChange={set("doctor_name")} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Date issued</label>
            <input className={ic} type="date" value={form.issued_date} onChange={set("issued_date")} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Notes</label>
            <textarea className={ic} rows={2} placeholder="Any additional notes..." value={form.notes} onChange={set("notes")} style={{resize:"none"}} />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancel</Button>
            <Button className="flex-1" loading={saving} onClick={handleUpload}>Upload</Button>
          </div>
        </div>
      </Modal>

      {/* Summarize text modal */}
      <Modal open={textModal} onClose={() => setTextModal(false)} title="AI Report Summarizer" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <p className="text-xs text-muted">Paste medical report text — AI will extract key findings, medications, and next steps.</p>
          <textarea className={cn(ic, "min-h-[140px]")} placeholder="Paste medical report text here..."
            value={reportText} onChange={e => setReportText(e.target.value)} />
          <Button onClick={handleSummarizeText} loading={textLoading} className="w-full">
            <Sparkles size={14} /> Summarize with AI
          </Button>

          {textResult && (
            <div className="space-y-3 animate-slide-up">
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <p className="text-xs font-semibold text-accent mb-2">Summary</p>
                <p className="text-sm text-text leading-relaxed">{textResult.summary}</p>
              </div>
              {textResult.key_findings?.length > 0 && (
                <div className="p-4 bg-surface2 border border-surface-border rounded-xl">
                  <p className="text-xs font-semibold text-muted mb-2">Key Findings</p>
                  {textResult.key_findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-text mb-1">
                      <span className="text-accent mt-0.5">•</span>{f}
                    </div>
                  ))}
                </div>
              )}
              {textResult.medications_mentioned?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {textResult.medications_mentioned.map((m, i) => <Badge key={i} variant="cyan">💊 {m}</Badge>)}
                </div>
              )}
              {textResult.follow_up_needed && (
                <div className="flex items-center gap-2 p-3 bg-accent-amber/5 border border-accent-amber/20 rounded-xl text-sm text-accent-amber">
                  ⚠️ Follow-up appointment recommended
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
