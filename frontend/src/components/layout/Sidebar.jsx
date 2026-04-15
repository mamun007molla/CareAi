// src/components/layout/Sidebar.jsx
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";
import { LayoutDashboard, Activity, Pill, ClipboardList, CalendarClock, LogOut, Heart } from "lucide-react";

const NAV = [
  { href: "/dashboard",                       label: "Dashboard",          icon: LayoutDashboard },
  { href: "/physical/activity-tracker",       label: "Activity Tracker",   icon: Activity,       badge: "AI" },
  { href: "/physical/medication-verify",      label: "Medication Verify",  icon: Pill,           badge: "AI" },
  { href: "/physical/activity-log",           label: "Activity Log",       icon: ClipboardList },
  { href: "/physical/routine-schedule",       label: "Routine Schedule",   icon: CalendarClock },
];

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <aside className="flex flex-col h-full bg-surface border-r border-surface-border w-64">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center flex-shrink-0">
          <Heart size={15} className="text-bg" />
        </div>
        <div>
          <span className="font-bold text-text">CareAI</span>
          <p className="text-[10px] text-muted -mt-0.5">Module 1 — Physical</p>
        </div>
      </div>

      {/* Module label */}
      <div className="px-5 py-3 border-b border-surface-border">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Physical Monitoring</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                active ? "bg-accent/10 text-accent font-medium" : "text-muted hover:text-text hover:bg-surface2"
              )}>
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent-amber/20 text-accent-amber border border-accent-amber/20">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent flex items-center justify-center text-bg text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{user?.name}</p>
            <p className="text-[11px] text-muted truncate">{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="text-muted hover:text-accent-red transition-colors p-1.5 rounded-lg hover:bg-accent-red/10" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
