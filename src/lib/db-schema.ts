export interface UploadMetadata {
  id: string;
  type: "photo" | "video" | "link" | "file";
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  message: string;
  fileNames: string[];
  fileIds: string[];
  fileWebViewLinks: string[];
  folderId: string;
  folderPath: string;
  totalSize: number;
  createdAt: string;
  viewed: boolean;
}

export interface DashboardStats {
  totalUploads: number;
  totalFiles: number;
  uploadsByType: Record<string, number>;
  uploadsByDay: Record<string, number>;
  recentUploads: UploadMetadata[];
}
