// src/app/(dashboard)/physical/medication-verify/page.jsx
"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { physicalAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge } from "@/components/ui";
import { Upload, CheckCircle2, XCircle, AlertTriangle, History, Clock } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";

export default function MedicationVerifyPage() {
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [prescribed, setPrescribed] = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [history, setHistory]       = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

  const onDrop = useCallback((f) => {
    setFile(f[0]);
    setPreview(URL.createObjectURL(f[0]));
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, maxFiles: 1,
  });

  const handleVerify = async () => {
    if (!file) { toast.error("Upload a medicine image first"); return; }
    if (!prescribed.trim()) { toast.error("Enter the prescribed medication name"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("prescribed_medication", prescribed);
      const res = await physicalAPI.verifyMedication(fd);
      setResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Verification failed. Make sure Ollama is running.");
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await physicalAPI.getVerifyHistory();
      setHistory(res.data);
      setShowHistory(true);
    } catch { toast.error("Failed to load history"); }
    finally { setLoadingHistory(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        title="Medication Verification"
        description="Feature 2 — Upload a medicine image to verify it matches the prescription using AI"
        action={
          <Button variant="secondary" size="sm" onClick={loadHistory} loading={loadingHistory}>
            <History size={13} /> History
          </Button>
        }
      />

      {/* How it works */}
      <Card className="border-accent/20 bg-accent/5">
        <CardBody className="py-3">
          <div className="flex items-center gap-4 text-xs text-muted flex-wrap">
            <span className="flex items-center gap-1.5"><span className="text-accent font-bold">AI Model:</span> gemma3:4b (Ollama local)</span>
            <span className="text-surface-border">|</span>
            <span className="flex items-center gap-1.5"><span className="text-accent font-bold">Fallback:</span> GPT-4o (if OPENAI_API_KEY set)</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-text">Upload Medicine Image</h2></CardHeader>
        <CardBody className="space-y-5">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive ? "border-accent bg-accent/5" : "border-surface-border hover:border-accent/40 hover:bg-surface2/30"
            )}
          >
            <input {...getInputProps()} />
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Medicine" className="max-h-52 mx-auto rounded-xl object-contain border border-surface-border" />
                <p className="text-xs text-muted">{file?.name} — click to replace</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload size={32} className="mx-auto text-muted" />
                <p className="text-sm font-medium text-text">Drag & drop or click to browse</p>
                <p className="text-xs text-muted">Clear photo of pill/packaging — JPG, PNG, WEBP</p>
              </div>
            )}
          </div>

          {/* Prescribed name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Prescribed medication name</label>
            <input
              className={ic}
              placeholder="e.g. Metformin 500mg"
              value={prescribed}
              onChange={e => setPrescribed(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
            />
            <p className="text-xs text-muted">Or describe the expected tablets (e.g. "Morning: 1 red, 1 blue, 1 green")</p>
          </div>

          <Button onClick={handleVerify} loading={loading} className="w-full" size="lg">
            {loading ? "AI is analyzing the image…" : "Verify Medication"}
          </Button>
        </CardBody>
      </Card>

      {/* Result */}
      {result && (
        <Card className={cn(
          "border-2 animate-slide-up",
          result.matched ? "border-accent/40 bg-accent/5" : "border-accent-red/40 bg-accent-red/5"
        )}>
          <CardBody className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              {result.matched
                ? <CheckCircle2 size={32} className="text-accent flex-shrink-0" />
                : <XCircle     size={32} className="text-accent-red flex-shrink-0" />
              }
              <div>
                <h3 className={cn("text-xl font-bold", result.matched ? "text-accent" : "text-accent-red")}>
                  {result.matched ? "✅ Medication Verified" : "❌ Mismatch Detected"}
                </h3>
                <p className="text-sm text-muted">
                  AI Confidence: <span className="text-text font-medium">{Math.round((result.confidence || 0) * 100)}%</span>
                </p>
              </div>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface2 rounded-xl p-3 border border-surface-border">
                <p className="text-xs text-muted mb-1 font-medium">Prescribed</p>
                <p className="text-sm font-medium text-text">{result.prescribed_medication || "—"}</p>
              </div>
              <div className="bg-surface2 rounded-xl p-3 border border-surface-border">
                <p className="text-xs text-muted mb-1 font-medium">Detected in Image</p>
                <p className="text-sm font-medium text-text">{result.detected_medication || "Not identified"}</p>
              </div>
            </div>

            {/* Confidence bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted">
                <span>Confidence</span>
                <span>{Math.round((result.confidence || 0) * 100)}%</span>
              </div>
              <div className="h-2 bg-surface2 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", result.matched ? "bg-accent" : "bg-accent-red")}
                  style={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Warnings */}
            {result.warnings?.length > 0 && (
              <div className="space-y-1.5">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-accent-amber">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* History */}
      {showHistory && (
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text flex items-center gap-2"><History size={15} /> Verification History</h2>
              <button onClick={() => setShowHistory(false)} className="text-xs text-muted hover:text-text">Close</button>
            </div>
          </CardHeader>
          {history.length === 0 ? (
            <CardBody><p className="text-sm text-muted text-center">No verifications yet.</p></CardBody>
          ) : (
            <div className="divide-y divide-surface-border">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 px-6 py-3">
                  {h.matched
                    ? <CheckCircle2 size={16} className="text-accent flex-shrink-0" />
                    : <XCircle     size={16} className="text-accent-red flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{h.prescribed_medication}</p>
                    <p className="text-xs text-muted">Detected: {h.detected_medication || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={h.matched ? "success" : "danger"}>{h.matched ? "Match" : "Mismatch"}</Badge>
                    <p className="text-xs text-muted mt-1">{formatDateTime(h.verified_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
