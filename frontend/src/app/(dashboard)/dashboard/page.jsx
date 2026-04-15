// src/app/(dashboard)/dashboard/page.jsx
"use client";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import { physicalAPI } from "@/lib/api";
import { Card, CardHeader, CardBody, StatCard, Badge, Spinner, EmptyState } from "@/components/ui";
import { formatDateTime, getActivityIcon, getActivityColor } from "@/lib/utils";
import { Activity, Pill, CalendarClock, ClipboardList, TrendingUp } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, actRes, routRes] = await Promise.allSettled([
          physicalAPI.getStats(),
          physicalAPI.getActivities(),
          physicalAPI.getRoutines(),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (actRes.status   === "fulfilled") setActivities(actRes.value.data.slice(0, 5));
        if (routRes.status  === "fulfilled") setRoutines(routRes.value.data.slice(0, 4));
      } finally { setLoading(false); }
    }
    load();
  }, []);

  // Chart data from by_type
  const chartData = stats ? Object.entries(stats.by_type || {}).map(([type, count]) => ({ type, count })) : [];

  const COLORS = ["#4ade80", "#22d3ee", "#f59e0b", "#f87171", "#a78bfa", "#fb923c"];

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-surface2 border border-surface-border p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="relative">
          <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-1">Module 1 — Physical Monitoring</p>
          <h1 className="text-3xl font-bold text-text">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted text-sm mt-1">
            {new Date().toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <div className="flex gap-6 mt-4">
            <div><p className="text-2xl font-bold text-accent">{stats?.today ?? 0}</p><p className="text-xs text-muted">Activities Today</p></div>
            <div className="w-px bg-surface-border" />
            <div><p className="text-2xl font-bold text-accent-cyan">{stats?.total ?? 0}</p><p className="text-xs text-muted">Total Logged</p></div>
            <div className="w-px bg-surface-border" />
            <div><p className="text-2xl font-bold text-accent-amber">{routines.length}</p><p className="text-xs text-muted">Active Routines</p></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Activities" value={stats?.today ?? 0} icon="🏃" color="text-accent" />
        <StatCard label="Total Activities"   value={stats?.total ?? 0} icon="📊" color="text-accent-cyan" />
        <StatCard label="Total Duration"     value={`${stats?.total_duration_min ?? 0}m`} icon="⏱️" color="text-accent-amber" />
        <StatCard label="Active Routines"    value={routines.length} icon="📅" color="text-purple-400" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href:"/physical/activity-tracker",  label:"🎥 Activity Tracker",  color:"bg-accent/10 border-accent/20 text-accent hover:bg-accent/20" },
          { href:"/physical/medication-verify", label:"💊 Verify Medicine",    color:"bg-accent-amber/10 border-accent-amber/20 text-accent-amber hover:bg-accent-amber/20" },
          { href:"/physical/activity-log",      label:"📝 Log Activity",       color:"bg-surface2 border-surface-border text-text hover:bg-surface" },
          { href:"/physical/routine-schedule",  label:"📅 Routines",           color:"bg-surface2 border-surface-border text-text hover:bg-surface" },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`flex items-center justify-center p-4 rounded-xl border text-sm font-medium text-center transition-all ${a.color}`}>
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader><h2 className="font-semibold text-text flex items-center gap-2"><TrendingUp size={15} /> Activity Breakdown</h2></CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="type" tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #2a3441", borderRadius: "10px", fontSize: 12 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Recent activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text flex items-center gap-2"><Activity size={15} /> Recent Activities</h2>
              <Link href="/physical/activity-log" className="text-xs text-accent hover:underline">View all</Link>
            </div>
          </CardHeader>
          {activities.length === 0 ? (
            <CardBody><EmptyState icon="🏃" title="No activities yet" description="Start logging your activities" /></CardBody>
          ) : (
            <div className="divide-y divide-surface-border">
              {activities.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                  <span className="text-xl">{getActivityIcon(a.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium capitalize ${getActivityColor(a.type)}`}>{a.type}</p>
                    <p className="text-xs text-muted">{formatDateTime(a.logged_at)}</p>
                  </div>
                  {a.duration && <Badge variant="default">{a.duration}m</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Today's routines */}
      {routines.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-text flex items-center gap-2"><CalendarClock size={15} /> Today's Routines</h2>
              <Link href="/physical/routine-schedule" className="text-xs text-accent hover:underline">Manage</Link>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-border">
            {routines.map(r => (
              <div key={r.id} className="px-6 py-4 flex items-center gap-3">
                <span className="text-2xl">{r.type==="medication"?"💊":r.type==="meal"?"🍽️":"🏋️"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{r.title}</p>
                  <p className="text-xs text-accent">{r.scheduled_at}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
