"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Button({ children, variant="primary", size="md", loading, className, ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary:   "bg-accent text-bg hover:bg-accent/90",
    secondary: "bg-surface2 text-text border border-surface-border hover:border-accent/40",
    danger:    "bg-red-400/10 text-red-400 border border-red-400/30 hover:bg-red-400/20",
    ghost:     "text-muted hover:text-text hover:bg-surface2",
    sos:       "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 animate-pulse",
  };
  const sizes = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2 text-sm", lg:"px-6 py-3 text-base", icon:"p-2" };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading||props.disabled} {...props}>
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ children, className, ...props }) {
  return <div className={cn("bg-surface border border-surface-border rounded-2xl", className)} {...props}>{children}</div>;
}
export function CardHeader({ children, className }) {
  return <div className={cn("px-6 pt-5 pb-4 border-b border-surface-border", className)}>{children}</div>;
}
export function CardBody({ children, className }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function Badge({ children, variant="default", className }) {
  const v = {
    default: "bg-surface2 text-muted border-surface-border",
    success: "bg-accent/10 text-accent border-accent/20",
    warning: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    danger:  "bg-red-400/10 text-red-400 border-red-400/20",
    cyan:    "bg-cyan-400/10 text-cyan-400 border-cyan-400/20",
    purple:  "bg-purple-400/10 text-purple-400 border-purple-400/20",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border", v[variant], className)}>{children}</span>;
}

export function Spinner({ size=20 }) {
  return <Loader2 size={size} className="animate-spin text-muted" />;
}

export function Modal({ open, onClose, title, children, maxWidth="max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative w-full bg-surface border border-surface-border rounded-2xl shadow-2xl animate-slide-up", maxWidth)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
            <h2 className="font-semibold text-lg text-text">{title}</h2>
            <button onClick={onClose} className="text-muted hover:text-text p-1 rounded-lg hover:bg-surface2">✕</button>
          </div>
        )}
        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
      {icon && <div className="text-5xl mb-4 opacity-40">{icon}</div>}
      <h3 className="text-sm font-medium text-text mb-1">{title}</h3>
      {description && <p className="text-xs text-muted mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function StatCard({ label, value, icon, color="text-accent", sub }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className={cn("text-2xl font-bold", color)}>{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        {icon && <div className="text-2xl opacity-60">{icon}</div>}
      </div>
    </Card>
  );
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-surface-border my-2" />;
}
