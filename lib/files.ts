import path from "node:path";
import fs from "node:fs/promises";
import { nanoid } from "nanoid";

const MAX_BYTES = 5 * 1024 * 1024;

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

export async function saveImageFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있어요.");
  if (file.size > MAX_BYTES) throw new Error("사진 한 장은 5MB 이하만 가능합니다.");
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const extRaw = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = extRaw || "jpg";
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
