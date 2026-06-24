import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

async function ensureUploadDir(subfolder: string = "") {
  const uploadDir = path.join(process.cwd(), "public/uploads", subfolder);
  await mkdir(uploadDir, { recursive: true });
  return uploadDir;
}

export async function uploadFile(file: File, subfolder: string = ""): Promise<string> {
  if (!file) throw new Error("No file provided");

  const uploadDir = await ensureUploadDir(subfolder);
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
  const filename = `${uniqueSuffix}-${cleanFileName}`;
  
  const filePath = path.join(uploadDir, filename);

  await writeFile(filePath, buffer);

  return subfolder ? `/uploads/${subfolder}/${filename}` : `/uploads/${filename}`;
}

export async function uploadImage(file: File, subfolder: string = ""): Promise<string> {
  if (!file) throw new Error("No file provided");

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Only images (JPG, PNG, WebP) are allowed.");
  }

  return await uploadFile(file, subfolder);
}

export async function deleteFile(fileUrl: string) {
  try {
    if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;

    const filePath = path.join(process.cwd(), "public", fileUrl);
    
    await unlink(filePath);
  } catch {
    console.error("Failed to delete file:", fileUrl);
  }
}