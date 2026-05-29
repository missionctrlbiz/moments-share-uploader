import { NextRequest, NextResponse } from "next/server";
import { saveUpload } from "@/lib/kv";
import type { UploadMetadata } from "@/lib/db-schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const type: string = body.type || "file";
    const senderName: string = body.senderName || body.name || "Anonymous";
    const senderPhone: string = body.senderPhone || body.phone || "";
    const senderEmail: string = body.senderEmail || body.email || "";
    const message: string = body.message || "";
    const files: { name: string; url: string; downloadUrl: string; size?: number }[] =
      body.files || [];

    if (!files.length) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

    const metadata: UploadMetadata = {
      id: uploadId,
      type: type as UploadMetadata["type"],
      senderName,
      senderPhone,
      senderEmail,
      message,
      fileNames: files.map((f) => f.name),
      fileIds: files.map((f) => f.url),
      fileWebViewLinks: files.map((f) => f.downloadUrl),
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
        fileCount: files.length,
        fileNames: files.map((f) => f.name),
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
      files,
      message: "Files uploaded successfully",
    });
  } catch (error) {
    console.error("Upload metadata error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to save upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
