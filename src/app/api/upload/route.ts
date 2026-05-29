import { NextRequest, NextResponse } from "next/server";
import { createFolderIfNotExists, uploadFileToDrive } from "@/lib/google-drive";
import { saveUpload } from "@/lib/kv";
import type { UploadMetadata } from "@/lib/db-schema";

export const runtime = "nodejs";
export const maxBodySize = "100mb";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get("type") as string;
    const name = (formData.get("name") as string) || "Anonymous";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const message = (formData.get("message") as string) || "";
    const link = (formData.get("link") as string) || "";

    const today = new Date();
    const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const typeFolder = type || "other";

    const parentFolder = await createFolderIfNotExists(dateFolder);
    const uploadFolder = await createFolderIfNotExists(typeFolder, parentFolder);

    const uploadedFiles: { id: string; name: string; webViewLink: string }[] =
      [];

    const files = formData.getAll("files") as File[];
    for (const file of files) {
      if (file.size > 0) {
        const result = await uploadFileToDrive(file, uploadFolder);
        uploadedFiles.push(result);
      }
    }

    if (link && type === "link") {
      const linkText = new Blob([link], { type: "text/plain" });
      const linkFile = new File([linkText], `link-${Date.now()}.txt`, {
        type: "text/plain",
      });
      const result = await uploadFileToDrive(linkFile, uploadFolder);
      uploadedFiles.push(result);
    }

    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    const metadata: UploadMetadata = {
      id: uploadId,
      type: (type as UploadMetadata["type"]) || "file",
      senderName: name,
      senderPhone: phone,
      senderEmail: email,
      message,
      fileNames: uploadedFiles.map((f) => f.name),
      fileIds: uploadedFiles.map((f) => f.id),
      fileWebViewLinks: uploadedFiles.map((f) => f.webViewLink),
      folderId: uploadFolder,
      folderPath: `${dateFolder}/${typeFolder}`,
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
      const { sendUploadNotification, sendThankYou } = await import("@/lib/notifications");
      const notificationData = {
        type,
        senderName: name,
        senderPhone: phone,
        senderEmail: email,
        message,
        fileCount: uploadedFiles.length,
        fileNames: uploadedFiles.map((f) => f.name),
        timestamp: new Date().toISOString(),
      };
      await sendUploadNotification(notificationData);
      if (email) {
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
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
