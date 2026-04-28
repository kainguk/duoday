import path from "node:path";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { uploadDir } from "@/lib/files";

export const runtime = "nodejs";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export async function GET(_req: NextRequest, { params }: { params: { name: string } }) {
  const name = params.name;
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    return new NextResponse("bad request", { status: 400 });
  }

  const abs = path.join(uploadDir(), name);
  try {
    const bin = await fs.readFile(abs);
    const ext = (name.split(".").pop() || "").toLowerCase();
    const type = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(bin, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("not found", { status: 404 });
  }
}
