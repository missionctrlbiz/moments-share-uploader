"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Camera,
  Video,
  Link as LinkIcon,
  FileUp,
  Send,
  User,
  Phone,
  Mail,
  X,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { cn, SHARE_TYPES, type ShareType, MAX_UPLOAD_SIZE } from "@/lib/utils";
import { playSound, initSounds, type SoundName } from "@/lib/sounds";

interface ShareFormData {
  type: ShareType | null;
  files: File[];
  link: string;
  name: string;
  phone: string;
  email: string;
  message: string;
}

const typeIcons: Record<ShareType, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  video: Video,
  link: LinkIcon,
  file: FileUp,
};

export default function ShareForm({ welcomeMessage }: { welcomeMessage: string }) {
  useEffect(() => {
    initSounds();
  }, []);

  const [formData, setFormData] = useState<ShareFormData>({
    type: null,
    files: [],
    link: "",
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playSfx = useCallback((name: SoundName) => {
    playSound(name);
  }, []);

  const triggerConfetti = useCallback(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const colors = ["#18181b", "#71717a", "#d4d4d8"]; // Monochrome confetti

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleTypeSelect = (type: ShareType) => {
    setErrorMessage(null);
    playSfx("click");
    setFormData((prev) => ({ ...prev, type, files: [], link: "" }));
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      const oversized = files.filter((f) => f.size > MAX_UPLOAD_SIZE);
      if (oversized.length > 0) {
        setErrorMessage(
          `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB limit per file.`
        );
        return;
      }
      setErrorMessage(null);
      setFormData((prev) => ({ ...prev, files: [...prev.files, ...files] }));
      playSfx("click");
    },
    [playSfx]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const oversized = files.filter((f) => f.size > MAX_UPLOAD_SIZE);
    if (oversized.length > 0) {
      setErrorMessage(
        `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB limit per file.`
      );
      return;
    }
    setErrorMessage(null);
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...files] }));
    playSfx("click");
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playSfx("send");
    setIsSending(true);
    setErrorMessage(null);
    setUploadProgress(0);

    const totalSize = formData.files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_UPLOAD_SIZE) {
      setIsSending(false);
      setErrorMessage(
        `Total file size (${(totalSize / (1024 * 1024)).toFixed(1)}MB) exceeds the ${(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB limit.`
      );
      return;
    }

    try {
      const submitData = new FormData();
      if (formData.type) submitData.append("type", formData.type);
      formData.files.forEach((file) => submitData.append("files", file));
      submitData.append("link", formData.link);
      submitData.append("name", formData.name);
      submitData.append("phone", formData.phone);
      submitData.append("email", formData.email);
      submitData.append("message", formData.message);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
            return;
          }
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error || `Server error (${xhr.status})`));
          } catch {
            reject(new Error(`Server error (${xhr.status}). Please try again.`));
          }
        };
        xhr.onerror = () => {
          if (xhr.status === 0) {
            reject(new Error("Could not reach the server. Check your connection."));
          } else {
            reject(new Error("Network error. Please try again."));
          }
        };
        xhr.ontimeout = () => reject(new Error("Request timed out. Files may be too large."));
        xhr.timeout = 120000;
        xhr.open("POST", "/api/upload");
        xhr.send(submitData);
      });

      setIsSending(false);
      setIsSent(true);
      playSfx("success");
      triggerConfetti();
    } catch (err) {
      setIsSending(false);
      playSfx("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  const hasContent = formData.type === "link" ? formData.link.trim().length > 0 : formData.files.length > 0;

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto bg-card text-card-foreground shadow-sm border border-border rounded-xl p-8 flex flex-col items-center justify-center text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-semibold mb-2 tracking-tight"
        >
          Received
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground text-sm max-w-sm mb-8"
        >
          Your {formData.type} was securely sent to Bibi.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => {
            setIsSent(false);
            setFormData({
              type: null,
              files: [],
              link: "",
              name: "",
              phone: "",
              email: "",
              message: "",
            });
          }}
          className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
        >
          Send another
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {welcomeMessage}
        </h1>
        <p className="text-muted-foreground text-sm">
          Securely share your files, photos, or links.
        </p>
      </motion.div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-start gap-3"
        >
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="flex-1 leading-tight">{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="bg-card text-card-foreground shadow-sm border border-border rounded-xl overflow-hidden">
        {/* Step 1: Type Selection */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SHARE_TYPES.map((type) => {
              const Icon = typeIcons[type.id];
              const isSelected = formData.type === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-4 rounded-lg border text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Content (Auto-expands based on Type) */}
        <AnimatePresence mode="wait">
          {formData.type && (
            <motion.div
              key="content-area"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-muted/30"
            >
              <div className="p-6">
                {formData.type === "link" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Paste your link
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, link: e.target.value }))
                      }
                      placeholder="https://..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
                      )}
                    >
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        Click or drag to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Up to {(MAX_UPLOAD_SIZE / (1024 * 1024)).toFixed(0)}MB per file
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={
                        formData.type === "photo"
                          ? "image/*"
                          : formData.type === "video"
                          ? "video/*"
                          : "*/*"
                      }
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {formData.files.length > 0 && (
                      <div className="space-y-2">
                        {formData.files.map((file, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-md bg-background border border-border text-sm"
                          >
                            <span className="truncate max-w-[250px] font-medium">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeFile(i)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Details & Submit (Auto-expands based on Content) */}
        <AnimatePresence mode="wait">
          {hasContent && (
            <motion.div
              key="details-area"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-background"
            >
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium leading-none">
                    From <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Your name"
                      className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="you@example.com"
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none">
                      Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="+1 (555) 000-0000"
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium leading-none">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Add a brief note..."
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    {isSending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Uploading... {uploadProgress}%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>Submit</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
