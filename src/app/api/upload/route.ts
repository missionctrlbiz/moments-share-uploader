import { NextRequest, NextResponse } from "next/server";
import { createFolderIfNotExists, uploadFileToDrive } from "@/lib/google-drive";
import { saveUpload, checkKvConnection } from "@/lib/kv";
import type { UploadMetadata } from "@/lib/db-schema";

export const runtime = "nodejs";
export const maxBodySize = "100mb";

export async function POST(request: NextRequest) {
  let uploadId = "";
  let driveError: string | null = null;

  try {
    const formData = await request.formData();
    const type = formData.get("type") as string;
    const name = (formData.get("name") as string) || "Anonymous";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const message = (formData.get("message") as string) || "";
    const link = (formData.get("link") as string) || "";
    const files = (formData.getAll("files") as File[]).filter((f) => f.size > 0);

    if (files.length === 0 && !link) {
      return NextResponse.json(
        { error: "No files or link provided" },
        { status: 400 }
      );
    }

    uploadId = `upl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);

    const today = new Date();
    const dateFolder = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const typeFolder = (type || "file").toLowerCase();

    const uploadedFiles: { id: string; name: string; webViewLink: string }[] = [];

    try {
      const parentFolder = await createFolderIfNotExists(dateFolder);
      const uploadFolder = await createFolderIfNotExists(typeFolder, parentFolder);

      for (const file of files) {
        const result = await uploadFileToDrive(file, uploadFolder);
        uploadedFiles.push(result);
      }

      if (link && type === "link") {
        const linkText = new Blob([link], { type: "text/plain" });
        const linkFile = new File([linkText], `link-${Date.now()}.txt`, {
          type: "text/plain",
        });
        const result = await uploadFileToDrive(linkFile, uploadFolder);
        uploadedFiles.push(result);
      }
    } catch (err) {
      driveError = err instanceof Error ? err.message : "Drive upload failed";
      console.error("Drive upload error (saving metadata anyway):", driveError);
    }

    const fileNames =
      uploadedFiles.length > 0
        ? uploadedFiles.map((f) => f.name)
        : files.map((f) => f.name);
    const fileIds = uploadedFiles.map((f) => f.id);
    const fileWebViewLinks = uploadedFiles.map((f) => f.webViewLink);

    const metadata: UploadMetadata = {
      id: uploadId,
      type: (type as UploadMetadata["type"]) || "file",
      senderName: name,
      senderPhone: phone,
      senderEmail: email,
      message,
      fileNames,
      fileIds,
      fileWebViewLinks,
      folderId: uploadedFiles.length > 0 ? `${dateFolder}/${typeFolder}` : "",
      folderPath: uploadedFiles.length > 0 ? `${dateFolder}/${typeFolder}` : "",
      totalSize,
      createdAt: new Date().toISOString(),
      viewed: false,
    };

    let kvSaved = false;
    try {
      await saveUpload(metadata);
      kvSaved = true;
    } catch (kvError) {
      console.error("KV save error:", kvError);
    }

    try {
      const { sendUploadNotification, sendThankYou } = await import(
        "@/lib/notifications"
      );
      const notificationData = {
        type,
        senderName: name,
        senderPhone: phone,
        senderEmail: email,
        message,
        fileCount: uploadedFiles.length || files.length,
        fileNames:
          uploadedFiles.length > 0
            ? uploadedFiles.map((f) => f.name)
            : files.map((f) => f.name),
        timestamp: new Date().toISOString(),
      };
      await sendUploadNotification(notificationData);
      if (email) {
        await sendThankYou(notificationData);
      }
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    const responseMessage = driveError
      ? kvSaved
        ? "Your submission was recorded successfully. File upload is pending — Bibi will check manually."
        : "Your submission was received but storage is temporarily unavailable. Please try again later."
      : "Files uploaded successfully";

    return NextResponse.json({
      success: true,
      uploadId,
      files: uploadedFiles,
      driveError: driveError || null,
      kvSaved,
      message: responseMessage,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
