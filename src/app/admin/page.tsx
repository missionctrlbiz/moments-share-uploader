"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  MessageSquare,
  User,
  Phone,
  Mail,
  Check,
  X,
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

export default function AdminPage() {
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

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  return (
    <div className={cn("min-h-screen scrollable", isDark ? "dark" : "")}>
      <div className="min-h-screen bg-background scrollable">
        <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-surface/80 backdrop-blur-xl z-40 hidden lg:flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold animated-gradient-text" style={{ fontFamily: "var(--font-jakarta)" }}>
              Moments Admin
            </h1>
            <p className="text-xs text-muted mt-1" style={{ fontFamily: "var(--font-inter)" }}>
              Dashboard by Bibi
            </p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "files", label: "Uploads", icon: FolderOpen },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.id === "files" && unviewedCount > 0 && (
                  <span className="ml-auto bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                    {unviewedCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <button
              onClick={() => setIsDark(!isDark)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover transition-all"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </aside>

        <header className="lg:ml-64 h-16 border-b border-border bg-surface/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize" style={{ fontFamily: "var(--font-jakarta)" }}>
              {activeTab}
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
                className="pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
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
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
              )}
            </button>
          </div>
        </header>

        <main className="lg:ml-64 p-6 scrollable">
          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                {[
                  { label: "Total Uploads", value: stats.totalUploads, icon: HardDrive, color: "primary" },
                  { label: "Photos", value: stats.uploadsByType.photo || 0, icon: Image, color: "success" },
                  { label: "Videos", value: stats.uploadsByType.video || 0, icon: Video, color: "accent" },
                  { label: "Links", value: stats.uploadsByType.link || 0, icon: Link, color: "primary-light" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-metallic rounded-2xl p-5 card-glow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className="w-5 h-5 text-muted" />
                      <TrendingUp className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted mt-1" style={{ fontFamily: "var(--font-inter)" }}>
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="glass-metallic rounded-2xl p-6 card-glow">
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Recent Uploads
                </h3>
                <div className="space-y-3">
                  {stats.recentUploads.map((upload) => {
                    const Icon = typeIcons[upload.type] || FileText;
                    return (
                      <div
                        key={upload.id}
                        onClick={() => setSelectedUpload(upload)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-jakarta)" }}>
                            {upload.senderName || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted truncate" style={{ fontFamily: "var(--font-inter)" }}>
                            {upload.fileNames.length} file{upload.fileNames.length !== 1 ? "s" : ""} · {formatDate(upload.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {upload.message && <MessageSquare className="w-4 h-4 text-muted" />}
                          {!upload.viewed && <div className="w-2 h-2 bg-accent rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {Object.keys(stats.uploadsByDay).length > 0 && (
                <div className="glass-metallic rounded-2xl p-6 card-glow">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
                    Uploads Over Time
                  </h3>
                  <div className="flex items-end gap-1 h-32">
                    {Object.entries(stats.uploadsByDay)
                      .slice(-14)
                      .map(([day, count]) => {
                        const maxCount = Math.max(...Object.values(stats.uploadsByDay));
                        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1">
                            <div
                              className="w-full bg-primary/20 rounded-t-md relative group"
                              style={{ height: `${height}%`, minHeight: count > 0 ? "8px" : "2px" }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {count} uploads
                              </div>
                            </div>
                            <span className="text-[10px] text-muted" style={{ fontFamily: "var(--font-inter)" }}>
                              {day.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
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
                        !upload.viewed && "border-l-4 border-accent"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-jakarta)" }}>
                              {upload.senderName || "Anonymous"}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                              {upload.type}
                            </span>
                            {!upload.viewed && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mb-2" style={{ fontFamily: "var(--font-inter)" }}>
                            {formatDate(upload.createdAt)} · {upload.fileNames.length} file{upload.fileNames.length !== 1 ? "s" : ""}
                            {upload.totalSize > 0 && ` · ${formatFileSize(upload.totalSize)}`}
                          </p>
                          {upload.message && (
                            <p className="text-sm text-foreground/80 line-clamp-2" style={{ fontFamily: "var(--font-inter)" }}>
                              &ldquo;{upload.message}&rdquo;
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {upload.fileNames.slice(0, 3).map((name, i) => (
                              <span key={i} className="text-xs bg-surface-hover px-2 py-1 rounded-md truncate max-w-[150px]">
                                {name}
                              </span>
                            ))}
                            {upload.fileNames.length > 3 && (
                              <span className="text-xs bg-surface-hover px-2 py-1 rounded-md">
                                +{upload.fileNames.length - 3} more
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
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover">
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Email Notifications</p>
                      <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>Get notified when someone shares</p>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover">
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Sound Alerts</p>
                      <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>Play sound on new upload</p>
                    </div>
                    <div className="w-12 h-6 bg-border rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-metallic rounded-2xl p-6 card-glow">
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Connections
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-surface-hover flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Google Drive</p>
                        <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>Files storage backend</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Resend Email</p>
                        <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>Notification delivery</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>Vercel KV</p>
                        <p className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>Metadata & real-time</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-success" />
                  </div>
                </div>
              </div>

              <div className="glass-metallic rounded-2xl p-6 card-glow">
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-jakarta)" }}>
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
                    className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors btn-metallic"
                    style={{ fontFamily: "var(--font-jakarta)" }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {selectedUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm scrollable">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
                <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-jakarta)" }}>
                  Upload Details
                </h3>
                <button
                  onClick={() => setSelectedUpload(null)}
                  className="p-2 rounded-lg hover:bg-surface-hover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-surface-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-muted" />
                      <span className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>From</span>
                    </div>
                    <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {selectedUpload.senderName || "Anonymous"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-hover">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted" />
                      <span className="text-xs text-muted" style={{ fontFamily: "var(--font-inter)" }}>Date</span>
                    </div>
                    <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
                      {formatDate(selectedUpload.createdAt)}
                    </p>
                  </div>
                </div>

                {(selectedUpload.senderPhone || selectedUpload.senderEmail) && (
                  <div className="p-4 rounded-xl bg-surface-hover">
                    <p className="text-xs text-muted mb-2" style={{ fontFamily: "var(--font-inter)" }}>Contact</p>
                    <div className="space-y-1">
                      {selectedUpload.senderPhone && (
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted" /> {selectedUpload.senderPhone}
                        </p>
                      )}
                      {selectedUpload.senderEmail && (
                        <p className="text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted" /> {selectedUpload.senderEmail}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedUpload.message && (
                  <div className="p-4 rounded-xl bg-surface-hover">
                    <p className="text-xs text-muted mb-2" style={{ fontFamily: "var(--font-inter)" }}>Message</p>
                    <p className="text-sm" style={{ fontFamily: "var(--font-inter)" }}>
                      &ldquo;{selectedUpload.message}&rdquo;
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-surface-hover">
                  <p className="text-xs text-muted mb-2" style={{ fontFamily: "var(--font-inter)" }}>
                    Files ({selectedUpload.fileNames.length})
                  </p>
                  <div className="space-y-2">
                    {selectedUpload.fileNames.map((name, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background">
                        <span className="text-sm truncate" style={{ fontFamily: "var(--font-inter)" }}>{name}</span>
                        <a
                          href={selectedUpload.fileWebViewLinks[i]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-surface-hover"
                        >
                          <Download className="w-4 h-4 text-muted" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted mb-3 uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)" }}>
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
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <toggle.icon className={cn("w-5 h-5 flex-shrink-0", geminiToggles[toggle.id] ? "text-primary" : "text-muted")} />
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
                  <p className="text-xs text-muted mb-3 uppercase tracking-wider" style={{ fontFamily: "var(--font-inter)" }}>
                    Prompt Presets
                  </p>
                  <div className="flex flex-col gap-2">
                    {PROMPT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPrompt(selectedPrompt === preset.id ? null : preset.id)}
                        className={cn(
                          "text-left p-3 rounded-xl border-2 transition-all",
                          selectedPrompt === preset.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-jakarta)" }}>
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
      </div>
    </div>
  );
}

function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
      <path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  );
}
