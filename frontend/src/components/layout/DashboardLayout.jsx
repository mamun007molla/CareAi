"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { Menu } from "lucide-react";
import { Spinner } from "@/components/ui";

export default function DashboardLayout({ children }) {
  const { user, loadFromStorage } = useAuthStore();
  const router  = useRouter();
  const [ready, setReady]   = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => { loadFromStorage(); setReady(true); }, []);
  useEffect(() => {
    if (ready && !useAuthStore.getState().user) router.replace("/login");
  }, [ready]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-bg"><Spinner size={32} /></div>;

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0 lg:z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 left-0 w-64 z-10"><Sidebar onClose={() => setMobile(false)} /></div>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-surface border-b border-surface-border">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobile(true)} className="text-muted hover:text-text"><Menu size={20} /></button>
            <span className="font-bold text-text">CareAI</span>
          </div>
          <NotificationBell />
        </header>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-end px-8 py-3 border-b border-surface-border bg-surface/50">
          <NotificationBell />
        </div>

        <main className="flex-1 p-4 lg:p-8 max-w-6xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
