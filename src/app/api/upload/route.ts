import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { saveUpload } from "@/lib/kv";
import type { UploadMetadata } from "@/lib/db-schema";

export const runtime = "nodejs";
export const maxBodySize = "10mb";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get("type") as string;
    const senderName = (formData.get("name") as string) || "Anonymous";
    const senderPhone = (formData.get("phone") as string) || "";
    const senderEmail = (formData.get("email") as string) || "";
    const message = (formData.get("message") as string) || "";
    const link = (formData.get("link") as string) || "";
    const files = (formData.getAll("files") as File[]).filter((f) => f.size > 0);

    if (!files.length && !link) {
      return NextResponse.json(
        { error: "No files or link provided" },
        { status: 400 }
      );
    }

    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    const uploadedFiles: { name: string; url: string; downloadUrl: string; size: number }[] = [];

    for (const file of files) {
      const blob = await put(file.name, file, { access: "public" });
      uploadedFiles.push({
        name: file.name,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        size: file.size,
      });
    }

    if (link && type === "link") {
      uploadedFiles.push({
        name: `link-${Date.now()}.txt`,
        url: link,
        downloadUrl: link,
        size: 0,
      });
    }

    const metadata: UploadMetadata = {
      id: uploadId,
      type: (type as UploadMetadata["type"]) || "file",
      senderName,
      senderPhone,
      senderEmail,
      message,
      fileNames: uploadedFiles.map((f) => f.name),
      fileIds: uploadedFiles.map((f) => f.url),
      fileWebViewLinks: uploadedFiles.map((f) => f.downloadUrl),
      folderId: "vercel-blob",
      folderPath: `blob/${type}`,
      totalSize,
      createdAt: new Date().toISOString(),
      viewed: false,
    };

    try {
      await saveUpload(metadata);
    } catch (kvError) {
      console.error("KV save error:", kvError);
    }

    try {
      const { sendUploadNotification, sendThankYou } = await import(
        "@/lib/notifications"
      );
      const notificationData = {
        type,
        senderName,
        senderPhone,
        senderEmail,
        message,
        fileCount: uploadedFiles.length,
        fileNames: uploadedFiles.map((f) => f.name),
        timestamp: new Date().toISOString(),
      };
      await sendUploadNotification(notificationData);
      if (senderEmail) {
        await sendThankYou(notificationData);
      }
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    return NextResponse.json({
      success: true,
      uploadId,
      files: uploadedFiles,
      message: "Files uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
