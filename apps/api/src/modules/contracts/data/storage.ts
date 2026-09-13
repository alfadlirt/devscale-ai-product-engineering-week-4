import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadsDir = path.resolve(
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
);

export function getUploadsDir() {
  return uploadsDir;
}

export async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true });
}

export async function saveContractPdf(
  contractId: string,
  file: File,
): Promise<string> {
  await ensureUploadsDir();
  const filePath = path.join(uploadsDir, `${contractId}.pdf`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return filePath;
}
