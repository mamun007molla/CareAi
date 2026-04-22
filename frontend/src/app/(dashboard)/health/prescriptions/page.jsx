"use client";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { prescriptionAPI } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Modal,
  EmptyState,
  Badge,
  SectionHeader,
  Spinner,
} from "@/components/ui";
import {
  Upload,
  Trash2,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";

const ic =
  "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

export default function PrescriptionsPage() {
  const { user } = useAuthStore();
  const isDoctor = user?.role === "DOCTOR";

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ issued_date: "", notes: "" });

  // Summary state — same as Report Summary page
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [sumFile, setSumFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [sumLoading, setSumLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const onDrop = useCallback((f) => setFile(f[0]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
  });

  const onSumDrop = useCallback((f) => {
    setSumFile(f[0]);
    setPreview(URL.createObjectURL(f[0]));
    setResult(null);
  }, []);
  const {
    getRootProps: getSumRootProps,
    getInputProps: getSumInputProps,
    isDragActive: isSumDrag,
  } = useDropzone({
    onDrop: onSumDrop,
    accept: { "image/*": [], "application/pdf": [] },
    maxFiles: 1,
  });

  const fetchAll = async () => {
    try {
      const r = await prescriptionAPI.getAll();
      setPrescriptions(r.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a file first");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (form.issued_date)
        fd.append("issued_date", new Date(form.issued_date).toISOString());
      if (form.notes) fd.append("notes", form.notes);
      await prescriptionAPI.upload(fd);
      toast.success("Uploaded!");
      setFile(null);
      setForm({ issued_date: "", notes: "" });
      setModal(false);
      fetchAll();
    } catch {
      toast.error("Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      await prescriptionAPI.remove(id);
      setPrescriptions((p) => p.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleSummarize = async () => {
    setSumLoading(true);
    try {
      const fd = new FormData();
      if (tab === "text") {
        if (!text.trim()) {
          toast.error("Paste prescription text first");
          setSumLoading(false);
          return;
        }
        fd.append("report_text", text);
      } else {
        if (!sumFile) {
          toast.error("Upload a file first");
          setSumLoading(false);
          return;
        }
        fd.append("file", sumFile);
      }
      const r = await prescriptionAPI.summarizeText(fd);
      setResult(r.data);
      toast.success("Summary generated!");
    } catch (err) {
      const msg = err.response?.data?.detail || "";
      if (msg.includes("GROQ") || msg.includes("503")) {
        toast.error("AI failed. Check GROQ_API_KEY in backend/.env");
      } else {
        toast.error("AI failed. Check GROQ_API_KEY in .env");
      }
    } finally {
      setSumLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Prescription Tracker"
        description={
          isDoctor
            ? "Upload and manage patient prescriptions with AI-powered summaries"
            : "View your prescriptions and summarize reports with AI"
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowSummary((p) => !p);
                setResult(null);
                setText("");
                setSumFile(null);
                setPreview(null);
                setTab("text");
              }}
            >
              <Sparkles size={13} />{" "}
              {showSummary ? "Hide Summary" : "AI Summarizer"}
            </Button>
            {isDoctor && (
              <Button
                onClick={() => {
                  setFile(null);
                  setForm({ issued_date: "", notes: "" });
                  setModal(true);
                }}
              >
                <Upload size={15} /> Upload
              </Button>
            )}
          </div>
        }
      />

      {/* Info banner */}
      {!isDoctor && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-border bg-surface2/40 text-xs text-muted">
          <span className="text-lg">
            {user?.role === "ELDERLY" ? "👴" : "👨‍👩‍👧"}
          </span>
          Your doctor uploads prescriptions here. Use AI Summarizer to summarize
          any prescription text or image.
        </div>
      )}

      {/* AI Summarizer — same as Report Summary, always visible when toggled */}
      {showSummary && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex gap-1 bg-surface2 rounded-xl p-1 border border-surface-border">
            {[
              { id: "text", label: "📝 Paste Text" },
              { id: "image", label: "📄 Upload File" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setResult(null);
                }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                  tab === t.id
                    ? "bg-accent/20 text-accent"
                    : "text-muted hover:text-text",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent-amber" />
                <h2 className="font-semibold text-text">
                  AI Prescription Summarizer
                </h2>
                <Badge variant="warning">Groq AI</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {tab === "text" ? (
                <textarea
                  className="w-full bg-surface2 border border-surface-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors min-h-[180px]"
                  placeholder="Paste prescription or medical report text here...&#10;&#10;Example:&#10;Patient: Mohammad Ali, Age 65&#10;Diagnosis: Type 2 Diabetes&#10;Metformin 500mg - twice daily after meal&#10;Follow up in 4 weeks."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ resize: "none" }}
                />
              ) : (
                <div
                  {...getSumRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                    isSumDrag
                      ? "border-accent bg-accent/5"
                      : "border-surface-border hover:border-accent/40",
                  )}
                >
                  <input {...getSumInputProps()} />
                  {sumFile ? (
                    <div className="space-y-2">
                      {preview && sumFile.type.startsWith("image") ? (
                        <img
                          src={preview}
                          alt="Prescription"
                          className="max-h-36 mx-auto rounded-xl object-contain border border-surface-border"
                        />
                      ) : (
                        <FileText size={32} className="mx-auto text-accent" />
                      )}
                      <p className="text-sm text-accent font-medium">
                        {sumFile.name}
                      </p>
                      <p className="text-xs text-muted">Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={28} className="mx-auto text-muted" />
                      <p className="text-sm text-text">
                        Upload prescription image
                      </p>
                      <p className="text-xs text-muted">
                        AI extracts text and summarizes
                      </p>
                    </div>
                  )}
                </div>
              )}
              <Button
                onClick={handleSummarize}
                loading={sumLoading}
                className="w-full"
                size="lg"
              >
                <Sparkles size={15} />{" "}
                {sumLoading
                  ? "Groq AI summarizing..."
                  : "Summarize Prescription"}
              </Button>
            </CardBody>
          </Card>

          {/* Results — same as Report Summary */}
          {result && (
            <div className="space-y-4 animate-slide-up">
              <Card className="border-accent/20">
                <CardHeader>
                  <h2 className="font-semibold text-text flex items-center gap-2">
                    <Sparkles size={14} className="text-accent" /> Summary
                  </h2>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-text leading-relaxed">
                    {result.summary}
                  </p>
                </CardBody>
              </Card>
              {result.key_findings?.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-text">Key Findings</h2>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    {result.key_findings.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-text"
                      >
                        <span className="text-accent mt-0.5 flex-shrink-0">
                          •
                        </span>
                        {f}
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
              {result.medications_mentioned?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.medications_mentioned.map((m, i) => (
                    <Badge key={i} variant="cyan">
                      💊 {m}
                    </Badge>
                  ))}
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
      )}

      {/* Prescription list */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon="📄"
            title={
              isDoctor ? "No prescriptions uploaded" : "No prescriptions yet"
            }
            description={
              isDoctor
                ? "Upload your patient's prescription"
                : "Your doctor will upload prescriptions here"
            }
            action={
              isDoctor && (
                <Button onClick={() => setModal(true)}>
                  <Upload size={14} /> Upload
                </Button>
              )
            }
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {prescriptions.map((p) => (
              <div key={p.id}>
                <div className="flex items-start gap-4 px-6 py-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl flex-shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">
                      {p.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {p.doctor_name && (
                        <span className="text-xs text-muted">
                          Dr. {p.doctor_name}
                        </span>
                      )}
                      {p.issued_date && (
                        <Badge variant="default">
                          {formatDate(p.issued_date)}
                        </Badge>
                      )}
                    </div>
                    {p.notes && (
                      <p className="text-xs text-muted mt-1 truncate">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Download — all roles */}
                    {p.file_url && (
                      <a
                        href={`http://localhost:8000${p.file_url}`}
                        target="_blank"
                        download={p.file_name}
                        className="inline-flex items-center justify-center p-2 rounded-xl text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Download"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    )}
                    {isDoctor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                        className="hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                    {p.notes && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpanded(expanded === p.id ? null : p.id)
                        }
                      >
                        {expanded === p.id ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {expanded === p.id && p.notes && (
                  <div className="mx-6 mb-4 p-4 bg-surface2 rounded-xl border border-surface-border">
                    <p className="text-xs font-semibold text-muted mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-text leading-relaxed">
                      {p.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upload Modal — Doctor only */}
      {isDoctor && (
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Upload Prescription"
        >
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-accent bg-accent/5"
                  : "border-surface-border hover:border-accent/40",
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="space-y-1">
                  <FileText size={24} className="mx-auto text-accent" />
                  <p className="text-sm text-accent font-medium">{file.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={24} className="mx-auto text-muted" />
                  <p className="text-sm text-text">
                    Drop file or click to browse
                  </p>
                  <p className="text-xs text-muted">PDF, JPG, PNG</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Date issued
              </label>
              <input
                className={ic}
                type="date"
                value={form.issued_date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, issued_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-muted">
                Notes (optional)
              </label>
              <textarea
                className={ic}
                rows={2}
                placeholder="Metformin 500mg twice daily..."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                style={{ resize: "none" }}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={saving}
                onClick={handleUpload}
              >
                Upload
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
