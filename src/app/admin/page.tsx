"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Image,
  Video,
  FileText,
  Link,
  RefreshCw,
  Settings,
  Bell,
  Search,
  Download,
  Calendar,
  HardDrive,
  TrendingUp,
  Sparkles,
  Sun,
  Moon,
  Wand2,
  Palette,
  Crop,
  SunMedium,
  Contrast,
  User,
  Phone,
  Mail,
  Check,
  X,
  Lock,
  LogOut,
  Eye,
  Zap,
  Activity,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import type { UploadMetadata, DashboardStats } from "@/lib/db-schema";

const GEMINI_TOGGLES = [
  { id: "enhance", label: "Enhance", icon: Sparkles, description: "Auto-enhance quality" },
  { id: "crop", label: "Smart Crop", icon: Crop, description: "AI-powered cropping" },
  { id: "brightness", label: "Brightness", icon: SunMedium, description: "Adjust brightness" },
  { id: "contrast", label: "Contrast", icon: Contrast, description: "Boost contrast" },
  { id: "warmth", label: "Warmth", icon: Palette, description: "Color warmth" },
  { id: "sharpen", label: "Sharpen", icon: Wand2, description: "Enhance details" },
];

const PROMPT_PRESETS = [
  { id: "portrait", label: "Portrait", prompt: "Enhance this portrait with natural skin tones and soft background blur" },
  { id: "landscape", label: "Landscape", prompt: "Enhance this landscape with vibrant colors and dramatic sky" },
  { id: "food", label: "Food", prompt: "Make this food photo look delicious with warm lighting and rich colors" },
  { id: "document", label: "Document", prompt: "Clean up this document photo, enhance text readability, fix perspective" },
  { id: "night", label: "Night", prompt: "Enhance this low-light photo, reduce noise, improve exposure" },
  { id: "vintage", label: "Vintage", prompt: "Apply a warm vintage film look with subtle grain" },
];

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    startTime.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <>{display}</>;
}

function AdminLogin({ onLogin }: { onLogin: (password: string) => Promise<string | null> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    const err = await onLogin(password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-metallic rounded-3xl p-8 sm:p-10 w-full max-w-sm card-glow relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1
            className="text-2xl font-bold animated-gradient-text mb-2"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            Moments Admin
          </h1>
          <p
            className="text-sm text-muted"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Enter your password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className={cn(
                "w-full px-4 py-3.5 rounded-xl border-2 bg-background text-sm transition-all focus:outline-none",
                error
                  ? "border-red-300 dark:border-red-800 focus:ring-2 focus:ring-red-200"
                  : "border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
              )}
              style={{ fontFamily: "var(--font-inter)" }}
            />
            {error && (
              <p
                className="text-xs text-red-500 mt-2 ml-1"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 btn-metallic"
            style={{ fontFamily: "var(--font-jakarta)" }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                Sign In
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [uploads, setUploads] = useState<UploadMetadata[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "files" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<UploadMetadata | null>(null);
  const [geminiToggles, setGeminiToggles] = useState<Record<string, boolean>>({});
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        setCheckingAuth(false);
      })
      .catch(() => {
        setAuthenticated(false);
        setCheckingAuth(false);
      });
  }, []);

  const handleLogin = async (password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        return null;
      }
      return data.error || "Invalid password";
    } catch {
      return "Could not connect to server";
    }
  };

  const handleLogout = async () => {
    document.cookie = "admin_token=; path=/; max-age=0";
    setAuthenticated(false);
  };

  const fetchData = useCallback(async () => {
    if (!authenticated) return;
    setLoading(true);
    try {
      const res = await fetch("/api/files");
      const json = await res.json();
      setUploads(json.uploads || []);
      setStats(json.stats || null);
      setUnviewedCount(json.unviewedCount || 0);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
    setLoading(false);
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    // eslint-disable-next-line
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData, authenticated]);

  const toggleGemini = (id: string) => {
    setGeminiToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredUploads = uploads.filter(
    (u) =>
      u.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.type.includes(searchQuery.toLowerCase())
  );

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    photo: Image,
    video: Video,
    link: Link,
    file: FileText,
  };

  const typeColors: Record<string, string> = {
    photo: "from-blue-500/20 to-cyan-500/10",
    video: "from-accent/20 to-pink-500/10",
    link: "from-amber-500/20 to-orange-500/10",
    file: "from-emerald-500/20 to-green-500/10",
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className={cn("min-h-screen scrollable", isDark ? "dark" : "")}>
      <div className="min-h-screen bg-background scrollable">
        <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-surface/80 backdrop-blur-xl z-40 hidden lg:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h1
              className="text-xl font-bold animated-gradient-text"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Moments
            </h1>
            <p className="text-xs text-muted mt-1" style={{ fontFamily: "var(--font-inter)" }}>
              Admin Dashboard
            </p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "dashboard", label: "Overview", icon: LayoutDashboard },
              { id: "files", label: "Uploads", icon: FolderOpen },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.id === "files" && unviewedCount > 0 && (
                  <span className="ml-auto bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {unviewedCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover transition-all"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover hover:text-red-500 transition-all"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        <header className="lg:ml-64 h-16 border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                Live
              </span>
            </div>
            <h2 className="text-lg font-semibold capitalize" style={{ fontFamily: "var(--font-jakarta)" }}>
              {activeTab === "dashboard" ? "Overview" : activeTab}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search uploads..."
                className="pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-56 transition-all"
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-5 h-5 text-muted", loading && "animate-spin")} />
            </button>
            <button className="p-2 rounded-xl hover:bg-surface-hover transition-colors relative">
              <Bell className="w-5 h-5 text-muted" />
              {unviewedCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-ping" />
                </>
              )}
            </button>
          </div>
        </header>

        <main className="lg:ml-64 p-6 scrollable">
          {stats && (
            <div className="hidden sm:flex items-center gap-4 mb-6 px-4 py-3 glass rounded-2xl">
              <div className="flex items-center gap-2 text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                <Clock className="w-3.5 h-3.5" />
                Auto-refreshing every 15s
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-4 text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                <span><strong className="text-foreground">{uploads.length}</strong> entries</span>
                <span><strong className="text-foreground">{unviewedCount}</strong> new</span>
                <span><strong className="text-foreground">{stats.totalUploads}</strong> total</span>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Uploads",
                    value: stats.totalUploads,
                    icon: HardDrive,
                    gradient: "from-indigo-500/20 to-violet-500/10",
                    iconColor: "text-indigo-500",
                  },
                  {
                    label: "Photos",
                    value: stats.uploadsByType.photo || 0,
                    icon: Image,
                    gradient: "from-sky-500/20 to-cyan-500/10",
                    iconColor: "text-sky-500",
                  },
                  {
                    label: "Videos",
                    value: stats.uploadsByType.video || 0,
                    icon: Video,
                    gradient: "from-fuchsia-500/20 to-pink-500/10",
                    iconColor: "text-fuchsia-500",
                  },
                  {
                    label: "Links",
                    value: stats.uploadsByType.link || 0,
                    icon: Link,
                    gradient: "from-amber-500/20 to-orange-500/10",
                    iconColor: "text-amber-500",
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "relative overflow-hidden glass-metallic rounded-2xl p-5 card-glow",
                      "bg-gradient-to-br", stat.gradient
                    )}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-2xl" />
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.gradient, "bg-gradient-to-br")}>
                        <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
                      </div>
                      <TrendingUp className="w-4 h-4 text-success" />
                    </div>
                    <p
                      className="text-3xl font-bold tracking-tight"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      <AnimatedNumber value={stat.value} />
                    </p>
                    <p
                      className="text-xs text-muted mt-1 tracking-wide uppercase"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-metallic rounded-2xl p-6 card-glow">
                  <div className="flex items-center justify-between mb-5">
                    <h3
                      className="text-lg font-semibold flex items-center gap-2"
                      style={{ fontFamily: "var(--font-jakarta)" }}
                    >
                      <Zap className="w-4 h-4 text-primary" />
                      Recent Activity
                    </h3>
                    {unviewedCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        {unviewedCount} new
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {stats.recentUploads.length === 0 && (
                      <p className="text-sm text-muted text-center py-8" style={{ fontFamily: "var(--font-inter)" }}>
                        No uploads yet. Share your link to get started!
                      </p>
                    )}
                    {stats.recentUploads.map((upload, i) => {
                      const Icon = typeIcons[upload.type] || FileText;
                      return (
                        <motion.div
                          key={upload.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => setSelectedUpload(upload)}
                          className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-surface-hover transition-all cursor-pointer group"
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                              typeColors[upload.type] || "from-primary/20 to-accent/10"
                            )}
                          >
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className="text-sm font-semibold truncate group-hover:text-primary transition-colors"
                                style={{ fontFamily: "var(--font-jakarta)" }}
                              >
                                {upload.senderName || "Anonymous"}
                              </p>
                              {!upload.viewed && (
                                <span className="flex-shrink-0 w-2 h-2 bg-accent rounded-full animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                              {upload.type} · {upload.fileNames.length} file{upload.fileNames.length !== 1 ? "s" : ""} ·{" "}
                              {formatDate(upload.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="w-4 h-4 text-muted" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-metallic rounded-2xl p-6 card-glow">
                  <h3
                    className="text-lg font-semibold mb-5"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-hover">
                      <p
                        className="text-xs text-muted uppercase tracking-wider mb-1"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        Storage Used
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {formatFileSize(
                          uploads.reduce((sum, u) => sum + (u.totalSize || 0), 0)
                        )}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-hover">
                      <p
                        className="text-xs text-muted uppercase tracking-wider mb-1"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        Messages
                      </p>
                      <p
                        className="text-lg font-bold"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {uploads.filter((u) => u.message).length}
                      </p>
                    </div>
                    {Object.keys(stats.uploadsByDay).length > 0 && (
                      <div>
                        <p
                          className="text-xs text-muted uppercase tracking-wider mb-3"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          Last 7 Days
                        </p>
                        <div className="flex items-end gap-1 h-20">
                          {Object.entries(stats.uploadsByDay)
                            .slice(-7)
                            .map(([day, count]) => {
                              const maxCount = Math.max(
                                ...Object.values(stats.uploadsByDay).slice(-7),
                                1
                              );
                              const height = Math.max((count / maxCount) * 100, 4);
                              return (
                                <div
                                  key={day}
                                  className="flex-1 flex flex-col items-center gap-1"
                                >
                                  <div
                                    className="w-full rounded-sm bg-primary/30 hover:bg-primary/50 transition-colors relative group"
                                    style={{ height: `${height}%` }}
                                  >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                      {count}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                  {filteredUploads.length} upload{filteredUploads.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-3">
                {filteredUploads.length === 0 && (
                  <div className="glass-metallic rounded-2xl p-12 text-center">
                    <FolderOpen className="w-12 h-12 text-muted/30 mx-auto mb-4" />
                    <p className="text-sm text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                      No uploads match your search
                    </p>
                  </div>
                )}
                {filteredUploads.map((upload) => {
                  const Icon = typeIcons[upload.type] || FileText;
                  return (
                    <motion.div
                      key={upload.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedUpload(upload)}
                      className={cn(
                        "glass-metallic rounded-2xl p-5 cursor-pointer card-glow",
                        !upload.viewed &&
                          "border-l-[3px] border-accent shadow-accent/10"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                            typeColors[upload.type] || "from-primary/20 to-accent/10"
                          )}
                        >
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className="text-sm font-semibold"
                              style={{ fontFamily: "var(--font-jakarta)" }}
                            >
                              {upload.senderName || "Anonymous"}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize font-medium">
                              {upload.type}
                            </span>
                            {!upload.viewed && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                                New
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs text-muted mb-2"
                            style={{ fontFamily: "var(--font-inter)" }}
                          >
                            {formatDate(upload.createdAt)} ·{" "}
                            {upload.fileNames.length} file
                            {upload.fileNames.length !== 1 ? "s" : ""}
                            {upload.totalSize > 0 &&
                              ` · ${formatFileSize(upload.totalSize)}`}
                          </p>
                          {upload.message && (
                            <p
                              className="text-sm text-foreground/80 line-clamp-2 italic"
                              style={{ fontFamily: "var(--font-inter)" }}
                            >
                              &ldquo;{upload.message}&rdquo;
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {upload.fileNames.slice(0, 3).map((name, i) => (
                              <span
                                key={i}
                                className="text-xs bg-surface-hover px-2.5 py-1 rounded-lg truncate max-w-[150px]"
                              >
                                {name}
                              </span>
                            ))}
                            {upload.fileNames.length > 3 && (
                              <span className="text-xs bg-surface-hover px-2.5 py-1 rounded-lg font-medium">
                                +{upload.fileNames.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="glass-metallic rounded-2xl p-6 card-glow">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover card-glow">
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                        Email Notifications
                      </p>
                      <p className="text-xs text-muted mt-0.5" style={{ fontFamily: "var(--font-inter)" }}>
                        Get notified when someone shares
                      </p>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover card-glow">
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                        Sound Alerts
                      </p>
                      <p className="text-xs text-muted mt-0.5" style={{ fontFamily: "var(--font-inter)" }}>
                        Play sound on new upload
                      </p>
                    </div>
                    <div className="w-12 h-6 bg-border rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-metallic rounded-2xl p-6 card-glow">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Connections
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: HardDrive,
                      label: "Google Drive",
                      description: "Files storage backend",
                    },
                    {
                      icon: Mail,
                      label: "Resend Email",
                      description: "Notification delivery",
                    },
                    {
                      icon: Database,
                      label: "Vercel KV",
                      description: "Metadata & real-time",
                    },
                  ].map((conn) => (
                    <div
                      key={conn.label}
                      className="p-4 rounded-xl bg-surface-hover flex items-center justify-between card-glow"
                    >
                      <div className="flex items-center gap-3">
                        <conn.icon className="w-5 h-5 text-success" />
                        <div>
                          <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                            {conn.label}
                          </p>
                          <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                            {conn.description}
                          </p>
                        </div>
                      </div>
                      <Check className="w-5 h-5 text-success" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-metallic rounded-2xl p-6 card-glow">
                <h3
                  className="text-lg font-semibold mb-4"
                  style={{ fontFamily: "var(--font-jakarta)" }}
                >
                  Share Link
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={typeof window !== "undefined" ? window.location.origin : ""}
                    readOnly
                    className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm"
                    style={{ fontFamily: "var(--font-inter)" }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                    }}
                    className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors btn-metallic"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <AnimatePresence>
          {selectedUpload && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedUpload(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-xl z-10 rounded-t-3xl">
                  <h3
                    className="text-lg font-semibold flex items-center gap-2"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    <Eye className="w-4 h-4 text-primary" />
                    Upload Details
                  </h3>
                  <button
                    onClick={() => setSelectedUpload(null)}
                    className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="p-4 rounded-xl bg-surface-hover">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)" }}>
                          From
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-jakarta)" }}>
                        {selectedUpload.senderName || "Anonymous"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-surface-hover">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)" }}>
                          Date
                        </span>
                      </div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-jakarta)" }}>
                        {formatDate(selectedUpload.createdAt)}
                      </p>
                    </div>
                  </div>

                  {(selectedUpload.senderPhone || selectedUpload.senderEmail) && (
                    <div className="p-4 rounded-xl bg-surface-hover">
                      <p className="text-xs text-muted uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-inter)" }}>
                        Contact
                      </p>
                      <div className="space-y-1">
                        {selectedUpload.senderPhone && (
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted" />{" "}
                            {selectedUpload.senderPhone}
                          </p>
                        )}
                        {selectedUpload.senderEmail && (
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted" />{" "}
                            {selectedUpload.senderEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedUpload.message && (
                    <div className="p-4 rounded-xl bg-surface-hover">
                      <p className="text-xs text-muted uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-inter)" }}>
                        Message
                      </p>
                      <p className="text-sm italic" style={{ fontFamily: "var(--font-inter)" }}>
                        &ldquo;{selectedUpload.message}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-surface-hover">
                    <p className="text-xs text-muted uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-inter)" }}>
                      Files ({selectedUpload.fileNames.length})
                    </p>
                    <div className="space-y-2">
                      {selectedUpload.fileNames.map((name, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-background group"
                        >
                          <span className="text-sm truncate" style={{ fontFamily: "var(--font-inter)" }}>
                            {name}
                          </span>
                          <a
                            href={selectedUpload.fileWebViewLinks[i]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors opacity-50 group-hover:opacity-100"
                          >
                            <Download className="w-4 h-4 text-primary" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-inter)" }}>
                      Quick Enhance
                    </p>
                    <div className="flex flex-col gap-2">
                      {GEMINI_TOGGLES.map((toggle) => (
                        <button
                          key={toggle.id}
                          onClick={() => toggleGemini(toggle.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                            geminiToggles[toggle.id]
                              ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <toggle.icon
                            className={cn(
                              "w-5 h-5 flex-shrink-0",
                              geminiToggles[toggle.id] ? "text-primary" : "text-muted"
                            )}
                          />
                          <div>
                            <span className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                              {toggle.label}
                            </span>
                            <p className="text-xs text-muted">{toggle.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-3" style={{ fontFamily: "var(--font-inter)" }}>
                      Prompt Presets
                    </p>
                    <div className="flex flex-col gap-2">
                      {PROMPT_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() =>
                            setSelectedPrompt(selectedPrompt === preset.id ? null : preset.id)
                          }
                          className={cn(
                            "text-left p-3 rounded-xl border-2 transition-all",
                            selectedPrompt === preset.id
                              ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                              : "border-border hover:border-primary/30"
                          )}
                        >
                          <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-jakarta)" }}>
                            {preset.label}
                          </p>
                          <p className="text-xs text-muted mt-0.5">{preset.prompt}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}
