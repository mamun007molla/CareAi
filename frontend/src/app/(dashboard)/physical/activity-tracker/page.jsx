// src/app/(dashboard)/physical/activity-tracker/page.jsx
"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Card, CardHeader, CardBody, Button, SectionHeader, Badge } from "@/components/ui";
import { Camera, Upload, AlertTriangle, Info, Sparkles, Video, CheckCircle2, XCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActivityTrackerPage() {
  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("fall"); // "fall" | "image" | "guide"

  // ── Fall Detection state ───────────────────────────────────────────────────
  const [videoFile, setVideoFile]   = useState(null);
  const [fallResult, setFallResult] = useState(null);
  const [fallLoading, setFallLoading] = useState(false);

  // ── Image Analysis state ───────────────────────────────────────────────────
  const [imgFile, setImgFile]       = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [imgQuestion, setImgQuestion] = useState("Analyze the person's posture and activity level. Is there any abnormality?");
  const [imgResult, setImgResult]   = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

  // ── Video dropzone ─────────────────────────────────────────────────────────
  const onDropVideo = useCallback((f) => { setVideoFile(f[0]); setFallResult(null); }, []);
  const { getRootProps: getVidProps, getInputProps: getVidInput, isDragActive: vidDrag } = useDropzone({
    onDrop: onDropVideo, accept: { "video/*": [] }, maxFiles: 1,
  });

  // ── Image dropzone ─────────────────────────────────────────────────────────
  const onDropImg = useCallback((f) => {
    setImgFile(f[0]); setImgPreview(URL.createObjectURL(f[0])); setImgResult(null);
  }, []);
  const { getRootProps: getImgProps, getInputProps: getImgInput, isDragActive: imgDrag } = useDropzone({
    onDrop: onDropImg, accept: { "image/*": [] }, maxFiles: 1,
  });

  // ── Fall Detection Submit ──────────────────────────────────────────────────
  const handleFallDetect = async () => {
    if (!videoFile) { toast.error("Upload a video first"); return; }
    setFallLoading(true);
    toast("Processing video… this may take 30-60 seconds ⏳", { duration: 8000 });
    try {
      const fd = new FormData();
      fd.append("video", videoFile);
      const res = await api.post("/physical/detect-fall", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000, // 5 min timeout
      });
      setFallResult(res.data);
      if (res.data.fall_detected) {
        toast.error("⚠️ FALL DETECTED!", { duration: 10000 });
      } else {
        toast.success("✅ No fall detected");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Detection failed. Make sure ffmpeg is installed.");
    } finally { setFallLoading(false); }
  };

  // ── Image Analysis Submit ──────────────────────────────────────────────────
  const handleImgAnalyze = async () => {
    if (!imgFile) { toast.error("Upload an image first"); return; }
    setImgLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", imgFile);
      fd.append("question", imgQuestion);
      const res = await api.post("/physical/analyze-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImgResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Analysis failed.");
    } finally { setImgLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader
        title="Activity Tracker"
        description="Feature 1 — Multimodal fall detection (Audio + Vision) and posture analysis"
      />

      {/* Model info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-accent/20 bg-accent/5">
          <CardBody className="py-3 space-y-1">
            <p className="text-xs font-semibold text-accent">Vision Model</p>
            <p className="text-xs text-muted">MediaPipe Pose + XGBoost</p>
            <p className="text-xs text-muted font-mono">xgb_final_model.json</p>
          </CardBody>
        </Card>
        <Card className="border-accent-cyan/20 bg-accent-cyan/5">
          <CardBody className="py-3 space-y-1">
            <p className="text-xs font-semibold text-accent-cyan">Audio Model</p>
            <p className="text-xs text-muted">AST (Audio Spectrogram)</p>
            <p className="text-xs text-muted font-mono">ast_model.torchscript.pt</p>
          </CardBody>
        </Card>
        <Card className="border-accent-amber/20 bg-accent-amber/5">
          <CardBody className="py-3 space-y-1">
            <p className="text-xs font-semibold text-accent-amber">Ensemble</p>
            <p className="text-xs text-muted">Soft Voting (50% + 50%)</p>
            <p className="text-xs text-muted font-mono">Multimodal_Final.py</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface2 rounded-xl p-1 border border-surface-border">
        {[
          { id: "fall",  label: "🎥 Fall Detection",     desc: "Upload video" },
          { id: "image", label: "📷 Posture Analysis",   desc: "Upload image" },
          { id: "guide", label: "📋 Integration Guide",  desc: "" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
              tab === t.id ? "bg-accent/20 text-accent" : "text-muted hover:text-text"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Fall Detection ── */}
      {tab === "fall" && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Video size={15} className="text-accent" />
                <h2 className="font-semibold text-text">Multimodal Fall Detection</h2>
                <Badge variant="success">XGBoost + AST</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-xs text-muted">
                Upload a video clip. The system analyzes <strong className="text-text">audio</strong> (fall sounds via AST) and <strong className="text-text">vision</strong> (pose landmarks via XGBoost) together using soft voting ensemble.
              </p>

              {/* Video dropzone */}
              <div
                {...getVidProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  vidDrag ? "border-accent bg-accent/5" : "border-surface-border hover:border-accent/40 hover:bg-surface2/30"
                )}
              >
                <input {...getVidInput()} />
                {videoFile ? (
                  <div className="space-y-2">
                    <Video size={32} className="mx-auto text-accent" />
                    <p className="text-sm font-medium text-accent">{videoFile.name}</p>
                    <p className="text-xs text-muted">{(videoFile.size / 1024 / 1024).toFixed(1)} MB — click to replace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="mx-auto text-muted" />
                    <p className="text-sm font-medium text-text">Upload video clip</p>
                    <p className="text-xs text-muted">MP4, AVI, MOV — max 100MB</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-3">
                <Info size={13} className="text-accent-amber mt-0.5 flex-shrink-0" />
                <div className="text-xs text-accent-amber space-y-0.5">
                  <p>Processing takes <strong>30–90 seconds</strong> depending on video length.</p>
                  <p>FFmpeg must be installed for audio extraction.</p>
                </div>
              </div>

              <Button onClick={handleFallDetect} loading={fallLoading} className="w-full" size="lg">
                {fallLoading
                  ? "Analyzing video (Audio + Vision)…"
                  : <><Sparkles size={15} /> Run Fall Detection</>
                }
              </Button>
            </CardBody>
          </Card>

          {/* Fall Result */}
          {fallResult && (
            <Card className={cn(
              "border-2 animate-slide-up",
              fallResult.fall_detected ? "border-accent-red/50 bg-accent-red/5" : "border-accent/40 bg-accent/5"
            )}>
              <CardBody className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                  {fallResult.fall_detected
                    ? <XCircle size={32} className="text-accent-red flex-shrink-0" />
                    : <CheckCircle2 size={32} className="text-accent flex-shrink-0" />
                  }
                  <div>
                    <h3 className={cn("text-xl font-bold", fallResult.fall_detected ? "text-accent-red" : "text-accent")}>
                      {fallResult.message}
                    </h3>
                    <p className="text-sm text-muted">
                      Ensemble confidence: <span className="text-text font-medium">{Math.round(fallResult.confidence * 100)}%</span>
                    </p>
                  </div>
                </div>

                {/* Annotated video */}
                {fallResult.output_video_url && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">Annotated Output Video</p>
                    <video
                      src={`http://localhost:8000${fallResult.output_video_url}`}
                      controls
                      className="w-full rounded-xl border border-surface-border"
                    />
                    <a
                      href={`http://localhost:8000${fallResult.output_video_url}`}
                      download
                      className="inline-flex items-center gap-2 text-xs text-accent hover:underline"
                    >
                      ⬇ Download annotated video
                    </a>
                  </div>
                )}

                {/* Segment breakdown */}
                {fallResult.segments?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">Segment Analysis</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {fallResult.segments.map((s, i) => (
                        <div key={i} className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                          s.fall ? "bg-accent-red/10 text-accent-red" : "bg-surface2 text-muted"
                        )}>
                          {s.fall ? "⚠️" : "✅"}
                          <span className="font-mono truncate">{s.log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB: Image Analysis ── */}
      {tab === "image" && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera size={15} className="text-accent-cyan" />
                <h2 className="font-semibold text-text">Posture & Activity Analysis</h2>
                <Badge variant="cyan">Groq Vision AI AI</Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-xs text-muted">
                Upload a photo for posture analysis using Groq Vision AI vision model via Groq.
              </p>

              <div
                {...getImgProps()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  imgDrag ? "border-accent-cyan bg-accent-cyan/5" : "border-surface-border hover:border-accent-cyan/40 hover:bg-surface2/30"
                )}
              >
                <input {...getImgInput()} />
                {imgPreview ? (
                  <div className="space-y-2">
                    <img src={imgPreview} alt="Activity" className="max-h-48 mx-auto rounded-xl object-contain border border-surface-border" />
                    <p className="text-xs text-muted">{imgFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera size={32} className="mx-auto text-muted" />
                    <p className="text-sm font-medium text-text">Upload patient photo</p>
                    <p className="text-xs text-muted">JPG, PNG — posture or activity photo</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-muted">Analysis question</label>
                <textarea className={ic} rows={2} value={imgQuestion}
                  onChange={e => setImgQuestion(e.target.value)} style={{ resize: "none" }} />
              </div>

              <Button onClick={handleImgAnalyze} loading={imgLoading} className="w-full" size="lg">
                {imgLoading ? "Groq Vision AI analyzing…" : <><Sparkles size={15} /> Analyze Posture</>}
              </Button>
            </CardBody>
          </Card>

          {imgResult && (
            <Card className="border-accent-cyan/20 animate-slide-up">
              <CardHeader>
                <h2 className="font-semibold text-text flex items-center gap-2">
                  <Sparkles size={14} className="text-accent-cyan" /> Groq Vision AI Analysis
                </h2>
              </CardHeader>
              <CardBody>
                <p className="text-xs text-muted italic mb-3">Q: {imgResult.question}</p>
                <div className="bg-surface2 rounded-xl p-4 border border-surface-border">
                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{imgResult.analysis}</p>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ── TAB: Guide ── */}
      {tab === "guide" && (
        <div className="space-y-4 animate-fade-in">
          <Card>
            <CardHeader><h2 className="font-semibold text-text">System Architecture</h2></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon:"🎵", title:"Audio Branch (AST)", items:["Extract audio from video via FFmpeg","Segment into 3s windows","AST model → FALL/NOT FALL probabilities"] },
                  { icon:"👁️", title:"Vision Branch (XGBoost)", items:["MediaPipe BlazePose → 33 landmarks","Per-frame feature extraction","XGBoost temporal model → probabilities"] },
                  { icon:"🔀", title:"Ensemble", items:["Soft voting: 50% audio + 50% vision","Sticky fall logic (once fall, always fall)","Annotate each frame with predictions"] },
                  { icon:"📹", title:"Output", items:["Annotated MP4 video with overlays","AUDIO / VISION / ENSEMBLE labels","Fall confidence percentage per segment"] },
                ].map(s => (
                  <div key={s.title} className="bg-surface2 rounded-xl p-4 border border-surface-border">
                    <p className="text-sm font-semibold text-text mb-2">{s.icon} {s.title}</p>
                    {s.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted mb-1">
                        <span className="text-accent mt-0.5">•</span>{item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="bg-accent-amber/5 border border-accent-amber/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-accent-amber mb-2">⚠️ Requirements</p>
                <div className="space-y-1 text-xs text-muted font-mono">
                  <p>pip install mediapipe xgboost torch torchaudio librosa transformers</p>
                  <p>pip install opencv-python ffmpeg-python pandas scikit-learn</p>
                  <p># Also: FFmpeg must be installed on system PATH</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
