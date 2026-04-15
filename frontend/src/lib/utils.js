// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday } from "date-fns";

export const cn = (...i) => twMerge(clsx(i));

export const formatDate = (d, fmt = "MMM d, yyyy") => d ? format(new Date(d), fmt) : "—";

export const formatDateTime = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isToday(dt))     return `Today ${format(dt, "h:mm a")}`;
  if (isYesterday(dt)) return `Yesterday ${format(dt, "h:mm a")}`;
  return format(dt, "MMM d, yyyy h:mm a");
};

export const getActivityIcon = (type) => ({
  walking: "🚶", eating: "🍽️", sleeping: "😴",
  exercise: "🏋️", rest: "🛋️", therapy: "💊", other: "📋",
}[type?.toLowerCase()] || "📋");

export const getActivityColor = (type) => ({
  walking: "text-accent-cyan",
  eating:  "text-accent-amber",
  sleeping:"text-purple-400",
  exercise:"text-accent",
  rest:    "text-muted",
  therapy: "text-pink-400",
  other:   "text-muted",
}[type?.toLowerCase()] || "text-muted");
