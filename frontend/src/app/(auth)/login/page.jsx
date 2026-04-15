// src/app/(auth)/login/page.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Heart } from "lucide-react";
import { authAPI } from "@/lib/api";
import useAuthStore from "@/store/authStore";
import { Button, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));
  const ic = "w-full bg-surface2 border border-surface-border rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-accent/60 transition-colors";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = "Required";
    if (!form.password) errs.password = "Required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await authAPI.login(form);
      setAuth(res.data.user, res.data.access_token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-cyan mb-4">
          <Heart size={24} className="text-bg" />
        </div>
        <h1 className="text-3xl font-bold text-text">Welcome back</h1>
        <p className="text-sm text-muted mt-1">CareAI — Physical Monitoring</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Email</label>
            <input className={ic} type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
            {errors.email && <p className="text-xs text-accent-red">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">Password</label>
            <input className={ic} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
            {errors.password && <p className="text-xs text-accent-red">{errors.password}</p>}
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>Sign In</Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link href="/register" className="text-accent hover:underline font-medium">Register</Link>
      </p>
    </div>
  );
}
