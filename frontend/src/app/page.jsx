"use client";
import Link from "next/link";
import { Heart, Shield, Activity, Bell, FileSearch, UtensilsCrossed, ChevronRight, Users, Stethoscope, AlertTriangle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-surface-border bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-cyan flex items-center justify-center">
              <Heart size={15} className="text-bg" />
            </div>
            <span className="font-bold text-lg text-text">CareAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted hover:text-text transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="text-sm bg-accent text-bg font-medium px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-4 py-2 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          AI-Powered Elderly Care System
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold text-text mb-6 leading-tight">
          Smart Care for<br />
          <span className="bg-gradient-to-r from-accent to-accent-cyan bg-clip-text text-transparent">
            Your Loved Ones
          </span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          CareAI connects elderly patients with family caregivers and doctors through intelligent monitoring,
          medication reminders, fall detection, and real-time health tracking.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="inline-flex items-center gap-2 bg-accent text-bg font-semibold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all text-base">
            Get Started Free <ChevronRight size={18} />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 bg-surface border border-surface-border text-text font-medium px-8 py-4 rounded-xl hover:border-accent/40 transition-all text-base">
            Sign In
          </Link>
        </div>
      </section>

      {/* Roles */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-text mb-3">Built for Everyone</h2>
        <p className="text-muted text-center mb-12">Three roles, one unified platform</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "👴", role: "Elderly Patient", color: "border-accent-amber/30 bg-accent-amber/5",
              iconBg: "bg-accent-amber/20 text-accent-amber",
              desc: "Monitor your own health, log activities, track meals, and quickly send SOS alerts to caregivers.",
              features: ["Activity & meal logging", "Medication reminders", "One-tap SOS button", "View health history"],
            },
            {
              icon: "👨‍👩‍👧", role: "Family Caregiver", color: "border-accent-cyan/30 bg-accent-cyan/5",
              iconBg: "bg-accent-cyan/20 text-accent-cyan",
              desc: "Stay connected with your elderly family member and monitor their daily health and activities.",
              features: ["Real-time health overview", "Medication alerts", "Activity monitoring", "SOS notifications"],
            },
            {
              icon: "👨‍⚕️", role: "Doctor", color: "border-accent/30 bg-accent/5",
              iconBg: "bg-accent/20 text-accent",
              desc: "Access patient health records, upload prescriptions, and get AI-powered medical summaries.",
              features: ["Patient health records", "AI prescription summary", "Prescription upload", "Medical history"],
            },
          ].map(r => (
            <div key={r.role} className={`rounded-2xl border p-6 ${r.color}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 ${r.iconBg}`}>
                {r.icon}
              </div>
              <h3 className="text-xl font-bold text-text mb-2">{r.role}</h3>
              <p className="text-sm text-muted mb-4 leading-relaxed">{r.desc}</p>
              <ul className="space-y-2">
                {r.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted">
                    <span className="text-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-text mb-3">All Features</h2>
        <p className="text-muted text-center mb-12">8 powerful features across 2 modules</p>

        <div className="mb-8">
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-4 px-2">Module 1 — Physical Monitoring</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Activity size={20}/>, title:"Activity Tracker", desc:"AI fall detection using XGBoost + AST multimodal model", color:"text-accent" },
              { icon: <Shield size={20}/>, title:"Medication Verify", desc:"AI verifies pill color and count from photo", color:"text-accent-cyan" },
              { icon: <FileSearch size={20}/>, title:"Activity Log", desc:"Manual logging of walking, exercise, eating, therapy", color:"text-accent-amber" },
              { icon: <Bell size={20}/>, title:"Routine Schedule", desc:"Daily medication, meal and exercise schedule with reminders", color:"text-purple-400" },
            ].map(f => (
              <div key={f.title} className="bg-surface border border-surface-border rounded-2xl p-5">
                <div className={`mb-3 ${f.color}`}>{f.icon}</div>
                <h3 className="font-semibold text-text mb-1">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-accent-cyan uppercase tracking-widest mb-4 px-2">Module 2 — Health Management</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Bell size={20}/>, title:"Medication Reminder", desc:"Voice + browser notifications at scheduled medication times", color:"text-accent-cyan" },
              { icon: <FileSearch size={20}/>, title:"Health History", desc:"Complete medical visit history organized by year", color:"text-accent" },
              { icon: <Stethoscope size={20}/>, title:"Prescription Tracker", desc:"Upload prescriptions with Groq AI-powered summaries", color:"text-accent-amber" },
              { icon: <UtensilsCrossed size={20}/>, title:"Nutrition Tracker", desc:"Photo-based food analysis using Groq Vision AI", color:"text-green-400" },
            ].map(f => (
              <div key={f.title} className="bg-surface border border-surface-border rounded-2xl p-5">
                <div className={`mb-3 ${f.color}`}>{f.icon}</div>
                <h3 className="font-semibold text-text mb-1">{f.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOS highlight */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-br from-accent-red/10 to-accent-red/5 border border-accent-red/30 rounded-3xl p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-accent-red/20 border-2 border-accent-red/40 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-accent-red" />
          </div>
          <h2 className="text-3xl font-bold text-text mb-3">One-Tap SOS Alert</h2>
          <p className="text-muted max-w-xl mx-auto mb-6">
            When an elderly person needs help, one tap instantly notifies all linked caregivers and doctors
            via in-app notification and SMS message.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted flex-wrap">
            <span className="flex items-center gap-2"><span className="text-accent-red">🔴</span> In-app alert</span>
            <span className="flex items-center gap-2"><span className="text-accent-red">📱</span> SMS to all caregivers</span>
            <span className="flex items-center gap-2"><span className="text-accent-red">⚡</span> Instant notification</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold text-text mb-4">Start Monitoring Today</h2>
        <p className="text-muted mb-8">Free to use. No credit card required.</p>
        <Link href="/register" className="inline-flex items-center gap-2 bg-accent text-bg font-bold px-10 py-5 rounded-2xl hover:bg-accent/90 transition-all text-lg">
          Create Free Account <ChevronRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 px-6 text-center text-sm text-muted">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart size={14} className="text-accent" />
          <span className="font-semibold text-text">CareAI</span>
        </div>
        <p>AI-Powered Elderly Monitoring System</p>
      </footer>
    </div>
  );
}
