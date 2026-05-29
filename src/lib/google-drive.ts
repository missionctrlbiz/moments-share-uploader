import { google } from "googleapis";
import { Readable } from "stream";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || "";
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "";
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export async function createFolderIfNotExists(
  folderName: string,
  parentFolderId: string = GOOGLE_DRIVE_FOLDER_ID
): Promise<string> {
  const drive = getDrive();

  const existing = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: "files(id, name)",
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });

  return folder.data.id!;
}

export async function uploadFileToDrive(
  file: File,
  folderId: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const drive = getDrive();

  const buffer = Buffer.from(await file.arrayBuffer());

  const response = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      }),
    },
    fields: "id, name, webViewLink",
  });

  await drive.permissions.create({
    fileId: response.data.id!,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  const webViewLink = `https://drive.google.com/file/d/${response.data.id}/view`;

  return {
    id: response.data.id!,
    name: response.data.name!,
    webViewLink,
  };
}

export async function getFilesFromFolder(folderId: string) {
  const drive = getDrive();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType, size, createdTime, webViewLink, thumbnailLink)",
    orderBy: "createdTime desc",
    pageSize: 50,
  });

  return response.data.files || [];
}

export async function getAllUploads() {
  const drive = getDrive();

  const response = await drive.files.list({
    q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
    fields: "files(id, name, mimeType, size, createdTime, webViewLink, thumbnailLink)",
    orderBy: "createdTime desc",
    pageSize: 100,
  });

  return response.data.files || [];
}

export async function getFolderContents() {
  const drive = getDrive();

  const folders = await drive.files.list({
    q: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name, createdTime)",
    orderBy: "name",
  });

  const results = [];

  for (const folder of folders.data.files || []) {
    const files = await getFilesFromFolder(folder.id!);
    results.push({
      ...folder,
      files,
      fileCount: files.length,
    });
  }

  return results;
}
