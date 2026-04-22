"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/authStore";
import {
  LayoutDashboard, Activity, Pill, ClipboardList, CalendarClock,
  Bell, FileText, FileSearch, UtensilsCrossed,
  Brain, MessageCircle, HelpCircle, Stethoscope, FileSearch2,
  MessageSquare, Calendar, Phone, CheckSquare,
  Settings, LogOut, Heart, Users
} from "lucide-react";

const NAV = {
  physical: [
    { href:"/physical/activity-tracker",  label:"Activity Tracker",    icon:Activity,      badge:"AI", roles:["ELDERLY","CAREGIVER"] },
    { href:"/physical/medication-verify", label:"Medication Verify",   icon:Pill,          badge:"AI", roles:["ELDERLY"] },
    { href:"/physical/activity-log",      label:"Activity Log",        icon:ClipboardList,             roles:["ELDERLY","CAREGIVER","DOCTOR"] },
    { href:"/physical/routine-schedule",  label:"Daily Routine",       icon:CalendarClock,             roles:["ELDERLY"] },
  ],
  health: [
    { href:"/health/medication-reminder", label:"Medications",         icon:Bell,                      roles:["ELDERLY","CAREGIVER","DOCTOR"] },
    { href:"/health/health-history",      label:"Health History",      icon:FileText,                  roles:["ELDERLY","CAREGIVER","DOCTOR"] },
    { href:"/health/prescriptions",       label:"Prescriptions",       icon:FileSearch,    badge:"AI", roles:["ELDERLY","CAREGIVER","DOCTOR"] },
    { href:"/health/nutrition",           label:"Nutrition",           icon:UtensilsCrossed,badge:"AI",roles:["ELDERLY"] },
  ],
  mental: [
    { href:"/mental/mood-tracking",       label:"Mood Tracking",       icon:Brain,         badge:"AI", roles:["ELDERLY"] },
    { href:"/mental/medical-vqa",         label:"Medical Q&A",         icon:HelpCircle,    badge:"AI", roles:["ELDERLY","DOCTOR"] },
    { href:"/mental/disease-diagnostic",  label:"Disease Diagnostic",  icon:Stethoscope,   badge:"AI", roles:["ELDERLY","DOCTOR"] },
    { href:"/mental/report-summary",      label:"Report Summary",      icon:FileSearch2,   badge:"AI", roles:["ELDERLY","DOCTOR"] },
  ],
  communication: [
    { href:"/checklist",                         label:"Daily Checklist",     icon:CheckSquare,           roles:["ELDERLY"] },
    { href:"/communication/messages",            label:"Messages",            icon:MessageSquare,         roles:["ELDERLY","CAREGIVER","DOCTOR"] },
    { href:"/communication/appointments",        label:"Appointments",        icon:Calendar,              roles:["ELDERLY","CAREGIVER","DOCTOR"] },
    { href:"/communication/emergency-contacts",  label:"Emergency Contacts",  icon:Phone,                 roles:["ELDERLY"] },
    { href:"/caregiver-tools",                   label:"Caregiver Tools",     icon:Users,                 roles:["CAREGIVER","DOCTOR"] },
  ],
};

function NavItem({ href, label, icon: Icon, badge, onClose }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} onClick={onClose}
      className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
        active ? "bg-accent/10 text-accent font-medium" : "text-muted hover:text-text hover:bg-surface2")}>
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/20">{badge}</span>}
    </Link>
  );
}

export default function Sidebar({ onClose }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const role = user?.role || "ELDERLY";
  const handleLogout = () => { logout(); router.push("/"); };

  const f = (items) => items.filter(i => !i.roles || i.roles.includes(role));

  const roleGradient = { ELDERLY:"from-amber-400 to-amber-500", CAREGIVER:"from-cyan-400 to-accent", DOCTOR:"from-accent to-accent-cyan" }[role];
  const roleLabel    = { ELDERLY:"👴 Patient", CAREGIVER:"👨‍👩‍👧 Caregiver", DOCTOR:"👨‍⚕️ Doctor" }[role];

  const sections = [
    { label:"Physical Monitoring",        items: f(NAV.physical) },
    { label:"Health Management",          items: f(NAV.health) },
    { label:"Mental Health & Support",    items: f(NAV.mental) },
    { label:"Communication & Tools",      items: f(NAV.communication) },
  ].filter(s => s.items.length > 0);

  return (
    <aside className="flex flex-col h-full bg-surface border-r border-surface-border w-64">
      <div className="px-5 py-5 border-b border-surface-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center flex-shrink-0">
          <Heart size={15} className="text-bg" />
        </div>
        <div>
          <span className="font-bold text-text">CareAI</span>
          <p className="text-[10px] text-muted -mt-0.5">Elderly Monitoring System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavItem href="/dashboard" label="Dashboard" icon={LayoutDashboard} onClose={onClose} />

        {sections.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 pt-4 pb-1">{section.label}</p>
            {section.items.map(item => <NavItem key={item.href} {...item} onClose={onClose} />)}
          </div>
        ))}

        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 pt-4 pb-1">Account</p>
        <NavItem href="/settings" label="Settings" icon={Settings} onClose={onClose} />
      </nav>

      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-bg text-xs font-bold flex-shrink-0", roleGradient)}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{user?.name}</p>
            <p className="text-[11px] text-muted truncate">{roleLabel}</p>
          </div>
          <button onClick={handleLogout} className="text-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-400/10" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
