import { kv as createKv } from "@vercel/kv";
import type { UploadMetadata, DashboardStats } from "./db-schema";

const UPLOAD_PREFIX = "upload:";
const UPLOAD_LIST = "uploads:list";
const STATS_CACHE = "stats:cache";

function getKv() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.warn("[KV] Not configured — KV_REST_API_URL or KV_REST_API_TOKEN missing");
    return null;
  }
  try {
    return createKv;
  } catch (err) {
    console.error("[KV] Failed to initialize:", err);
    return null;
  }
}

export async function checkKvConnection(): Promise<{ connected: boolean; error?: string; info?: string }> {
  if (!process.env.KV_REST_API_URL) {
    return { connected: false, error: "KV_REST_API_URL not set" };
  }
  if (!process.env.KV_REST_API_TOKEN) {
    return { connected: false, error: "KV_REST_API_TOKEN not set" };
  }
  try {
    const kv = getKv();
    if (!kv) return { connected: false, error: "KV client initialization failed" };
    await kv.ping();
    const count = await kv.llen(UPLOAD_LIST);
    return { connected: true, info: `Connected. ${count} uploads stored.` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, error: message };
  }
}

export async function saveUpload(metadata: UploadMetadata): Promise<void> {
  const kv = getKv();
  if (!kv) {
    console.warn(
      `[KV] saveUpload skipped — KV not configured. Upload ${metadata.id} NOT persisted.`
    );
    return;
  }

  const pipeline = kv.pipeline();
  pipeline.hset(`${UPLOAD_PREFIX}${metadata.id}`, {
    id: metadata.id,
    type: metadata.type,
    senderName: metadata.senderName,
    senderPhone: metadata.senderPhone,
    senderEmail: metadata.senderEmail,
    message: metadata.message,
    fileNames: JSON.stringify(metadata.fileNames),
    fileIds: JSON.stringify(metadata.fileIds),
    fileWebViewLinks: JSON.stringify(metadata.fileWebViewLinks),
    folderId: metadata.folderId,
    folderPath: metadata.folderPath,
    totalSize: String(metadata.totalSize),
    createdAt: metadata.createdAt,
    viewed: "false",
  });
  pipeline.lpush(UPLOAD_LIST, metadata.id);
  await pipeline.exec();
  console.log(`[KV] Saved upload ${metadata.id}`);
}

export async function getUpload(id: string): Promise<UploadMetadata | null> {
  const kv = getKv();
  if (!kv) return null;

  const data = await kv.hgetall<Record<string, string>>(`${UPLOAD_PREFIX}${id}`);
  if (!data || Object.keys(data).length === 0) return null;
  return parseUpload(data);
}

export async function getRecentUploads(limit = 50): Promise<UploadMetadata[]> {
  const kv = getKv();
  if (!kv) return [];

  const ids = await kv.lrange(UPLOAD_LIST, 0, limit - 1);
  if (!ids || ids.length === 0) return [];

  const uploads: UploadMetadata[] = [];
  for (const id of ids) {
    const data = await kv.hgetall<Record<string, string>>(`${UPLOAD_PREFIX}${id}`);
    if (data && Object.keys(data).length > 0) {
      uploads.push(parseUpload(data));
    }
  }
  return uploads;
}

export async function getUploadCount(): Promise<number> {
  const kv = getKv();
  if (!kv) return 0;
  return (await kv.llen(UPLOAD_LIST)) || 0;
}

export async function markAsViewed(id: string): Promise<void> {
  const kv = getKv();
  if (!kv) return;
  await kv.hset(`${UPLOAD_PREFIX}${id}`, { viewed: "true" });
}

export async function getUnviewedCount(): Promise<number> {
  const uploads = await getRecentUploads(200);
  return uploads.filter((u) => !u.viewed).length;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const kv = getKv();
  if (!kv) {
    return { totalUploads: 0, totalFiles: 0, uploadsByType: {}, uploadsByDay: {}, recentUploads: [] };
  }

  const cached = await kv.get<DashboardStats>(STATS_CACHE);
  if (cached) return cached;

  const uploads = await getRecentUploads(500);

  const uploadsByType: Record<string, number> = {};
  const uploadsByDay: Record<string, number> = {};
  let totalFiles = 0;

  for (const upload of uploads) {
    uploadsByType[upload.type] = (uploadsByType[upload.type] || 0) + 1;
    totalFiles += upload.fileNames.length;
    const day = upload.createdAt.split("T")[0];
    uploadsByDay[day] = (uploadsByDay[day] || 0) + 1;
  }

  const stats: DashboardStats = {
    totalUploads: uploads.length,
    totalFiles,
    uploadsByType,
    uploadsByDay,
    recentUploads: uploads.slice(0, 10),
  };

  await kv.set(STATS_CACHE, stats, { ex: 60 });
  return stats;
}

export async function deleteUpload(id: string): Promise<void> {
  const kv = getKv();
  if (!kv) return;

  const pipeline = kv.pipeline();
  pipeline.del(`${UPLOAD_PREFIX}${id}`);
  pipeline.lrem(UPLOAD_LIST, 0, id);
  await pipeline.exec();
}

function parseUpload(data: Record<string, string>): UploadMetadata {
  return {
    id: data.id || "",
    type: (data.type as UploadMetadata["type"]) || "file",
    senderName: data.senderName || "",
    senderPhone: data.senderPhone || "",
    senderEmail: data.senderEmail || "",
    message: data.message || "",
    fileNames: tryParseJSON(data.fileNames, []),
    fileIds: tryParseJSON(data.fileIds, []),
    fileWebViewLinks: tryParseJSON(data.fileWebViewLinks, []),
    folderId: data.folderId || "",
    folderPath: data.folderPath || "",
    totalSize: Number(data.totalSize) || 0,
    createdAt: data.createdAt || new Date().toISOString(),
    viewed: data.viewed === "true",
  };
}

function tryParseJSON<T>(value: string | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
