"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import { authAPI } from "@/lib/api";
import useAuthStore from "@/store/authStore";
import { Button, Card } from "@/components/ui";

const ROLES = [
  { value:"ELDERLY",   emoji:"👴", label:"Elderly Patient",  desc:"I am the patient being monitored" },
  { value:"CAREGIVER", emoji:"👨‍👩‍👧", label:"Family Caregiver", desc:"I monitor a family member" },
  { value:"DOCTOR",    emoji:"👨‍⚕️", label:"Doctor",            desc:"I provide medical care" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("ELDERLY");
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirmPassword:"" });
  const [errors, setErrors] = useState({});
  const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.email.includes("@")) errs.email = "Valid email required";
    if (form.password.length < 6) errs.password = "Min 6 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.register({ name:form.name, email:form.email, phone:form.phone||undefined, password:form.password, role });
      setAuth(res.data.user, res.data.access_token);
      toast.success("Account created!");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center">
        <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-cyan mb-4">
          <Heart size={24} className="text-bg" />
        </Link>
        <h1 className="text-3xl font-bold text-text">Create account</h1>
        <p className="text-sm text-muted mt-1">CareAI — Elderly Monitoring System</p>
      </div>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Full name</label>
            <input className={ic} placeholder="Your name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Email</label>
            <input className={ic} type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Phone (optional)</label>
            <input className={ic} type="tel" placeholder="01778..." value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted">I am a…</label>
            {ROLES.map(r => (
              <label key={r.value} onClick={()=>setRole(r.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${role===r.value?"border-accent bg-accent/5":"border-surface-border hover:border-accent/30"}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${role===r.value?"border-accent bg-accent":"border-muted"}`} />
                <span className="text-xl">{r.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-text">{r.label}</p>
                  <p className="text-xs text-muted">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Password</label>
            <input className={ic} type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} />
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Confirm password</label>
            <input className={ic} type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e=>setForm(p=>({...p,confirmPassword:e.target.value}))} />
            {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword}</p>}
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>Create Account</Button>
        </form>
      </Card>
      <p className="text-center text-sm text-muted">
        Already have an account? <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}
