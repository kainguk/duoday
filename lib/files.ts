import path from "node:path";
import fs from "node:fs/promises";
import { nanoid } from "nanoid";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

export async function saveImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있어요.");
  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    throw new Error("지원하지 않는 이미지 형식이에요. JPG, PNG, WEBP, GIF, AVIF 파일만 업로드해 주세요.");
  }
  if (file.size > MAX_BYTES) throw new Error("사진 한 장은 5MB 이하만 가능합니다.");
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const fname = `${nanoid(12)}.${ext}`;
  await fs.writeFile(path.join(dir, fname), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fname}`;
}

export async function unlinkUpload(publicPath: string | null | undefined) {
  if (!publicPath) return;
  const fname = publicPath.split("/").pop();
  if (!fname) return;
  try {
    await fs.unlink(path.join(uploadDir(), fname));
  } catch {
    /* ignore */
  }
}
