import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024; // 4MB — Vercel Hobby plan serverless limit

export const WELCOME_MESSAGES = [
  "Hello, I'm Bibi. Nice to meet you.",
  "Hey there! Welcome to my little corner of the internet.",
  "Hi! I'm Bibi. So glad you stopped by.",
  "Welcome! Let's capture this moment together.",
  "Hey! Bibi here. Thanks for sharing this moment with me.",
  "Hello! It's great to meet you. What do you have for me?",
  "Welcome aboard! Let's make this moment last.",
  "Hi there! I'm Bibi — let's share something amazing.",
  "Hey! So happy you're here. What would you like to share?",
  "Hello, friend! Welcome to Moments by Bibi.",
];

export const SHARE_TYPES = [
  { id: "photo", label: "Photo", icon: "camera", description: "Share a photo" },
  { id: "video", label: "Video", icon: "video", description: "Share a video" },
  { id: "link", label: "Link", icon: "link", description: "Share a link" },
  { id: "file", label: "File", icon: "file", description: "Share any file" },
] as const;

export type ShareType = (typeof SHARE_TYPES)[number]["id"];

export function getWelcomeMessage(): string {
  const index = Math.floor(Math.random() * WELCOME_MESSAGES.length);
  return WELCOME_MESSAGES[index];
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
