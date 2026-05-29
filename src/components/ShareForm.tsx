"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Camera,
  Video,
  Link,
  FileUp,
  ArrowRight,
  ArrowLeft,
  Send,
  User,
  Phone,
  Mail,
  X,
  Upload,
  PartyPopper,
} from "lucide-react";
import { cn, SHARE_TYPES, type ShareType } from "@/lib/utils";
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

const STEPS = ["type", "content", "details", "send"] as const;

const typeIcons: Record<ShareType, React.ComponentType<{ className?: string }>> = {
  photo: Camera,
  video: Video,
  link: Link,
  file: FileUp,
};

export default function ShareForm({ welcomeMessage }: { welcomeMessage: string }) {
  useState(() => initSounds());
  const [step, setStep] = useState(0);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playSfx = useCallback((name: SoundName) => {
    playSound(name);
  }, []);

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#6366f1", "#f472b6", "#10b981", "#f59e0b", "#8b5cf6"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
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
    playSfx("click");
    setFormData((prev) => ({ ...prev, type }));
    setStep(1);
  };

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      setFormData((prev) => ({ ...prev, files: [...prev.files, ...files] }));
      playSfx("click");
    },
    [playSfx]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...files] }));
    playSfx("click");
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    playSfx("send");
    setIsSending(true);

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
          if (xhr.status === 200) resolve();
          else reject(new Error("Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.open("POST", "/api/upload");
        xhr.send(submitData);
      });

      setIsSending(false);
      setIsSent(true);
      playSfx("success");
      triggerConfetti();
    } catch {
      setIsSending(false);
      alert("Something went wrong. Please try again.");
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return formData.type !== null;
      case 1:
        return formData.type === "link"
          ? formData.link.trim() !== ""
          : formData.files.length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center py-12 px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
        >
          <PartyPopper className="w-10 h-10 text-success" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          Thanks for sharing! 🎉
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-muted max-w-sm"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Your {formData.type} has been received. Bibi will see it shortly!
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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
            setStep(0);
          }}
          className="mt-8 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          Share Something Else
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3 gradient-text"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          {welcomeMessage}
        </h1>
        <p
          className="text-muted text-sm sm:text-base"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Share a moment, a memory, or just say hi.
        </p>
      </motion.div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: i === step ? 1.2 : 1,
                backgroundColor:
                  i <= step ? "var(--primary)" : "var(--border)",
              }}
              className="w-2 h-2 rounded-full"
            />
          </div>
        ))}
      </div>

      <motion.div
        layout
        className="glass rounded-2xl p-6 sm:p-8 shadow-xl"
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                What are you sharing?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {SHARE_TYPES.map((type) => {
                  const Icon = typeIcons[type.id];
                  return (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTypeSelect(type.id)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all",
                        formData.type === type.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-surface-hover"
                      )}
                    >
                      <Icon className="w-8 h-8 text-primary" />
                      <span
                        className="font-medium text-sm"
                        style={{ fontFamily: "var(--font-jakarta)" }}
                      >
                        {type.label}
                      </span>
                      <span
                        className="text-xs text-muted"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {type.description}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 1 && formData.type === "link" && (
            <motion.div
              key="link"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Paste your link
              </h3>
              <input
                type="url"
                value={formData.link}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, link: e.target.value }))
                }
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                style={{ fontFamily: "var(--font-inter)" }}
                autoFocus
              />
            </motion.div>
          )}

          {step === 1 && formData.type !== "link" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Drop your {formData.type === "photo" ? "photos" : formData.type === "video" ? "videos" : "files"} here
              </h3>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted" />
                <p
                  className="text-sm text-muted"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Drag & drop or tap to browse
                </p>
                <p
                  className="text-xs text-muted/60 mt-1"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {formData.type === "photo" && "JPG, PNG, WEBP up to 50MB"}
                  {formData.type === "video" && "MP4, MOV up to 100MB"}
                  {formData.type === "file" && "Any file up to 100MB"}
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
                <div className="mt-4 space-y-2">
                  {formData.files.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-surface-hover"
                    >
                      <span
                        className="text-sm truncate max-w-[200px]"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(i)}
                        className="p-1 rounded-full hover:bg-border transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Who&apos;s sharing? <span className="text-muted text-sm font-normal">(optional)</span>
              </h3>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Email address"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  style={{ fontFamily: "var(--font-inter)" }}
                />
              </div>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Add a message for Bibi..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="send"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-4"
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Ready to send?
              </h3>
              <div className="space-y-2 text-sm text-left mb-6" style={{ fontFamily: "var(--font-inter)" }}>
                <div className="flex justify-between p-3 rounded-lg bg-surface-hover">
                  <span className="text-muted">Type</span>
                  <span className="font-medium capitalize">{formData.type}</span>
                </div>
                {formData.type !== "link" && (
                  <div className="flex justify-between p-3 rounded-lg bg-surface-hover">
                    <span className="text-muted">Files</span>
                    <span className="font-medium">{formData.files.length}</span>
                  </div>
                )}
                {formData.type === "link" && (
                  <div className="flex justify-between p-3 rounded-lg bg-surface-hover">
                    <span className="text-muted">Link</span>
                    <span className="font-medium truncate max-w-[200px]">{formData.link}</span>
                  </div>
                )}
                {formData.name && (
                  <div className="flex justify-between p-3 rounded-lg bg-surface-hover">
                    <span className="text-muted">From</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                )}
                {formData.message && (
                  <div className="p-3 rounded-lg bg-surface-hover">
                    <span className="text-muted block mb-1">Message</span>
                    <span className="text-sm">{formData.message}</span>
                  </div>
                )}
              </div>
              {isSending && (
                <div className="mb-4">
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p
                    className="text-xs text-muted mt-2"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-6 pt-4 border-t border-border/50">
          {step > 0 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playSfx("click");
                setStep(step - 1);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted hover:text-foreground transition-colors"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </motion.button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <motion.button
              whileHover={{ scale: canProceed() ? 1.02 : 1 }}
              whileTap={{ scale: canProceed() ? 0.98 : 1 }}
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all",
                canProceed()
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "bg-border text-muted cursor-not-allowed"
              )}
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isSending}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-jakarta)" }}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to Bibi
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
