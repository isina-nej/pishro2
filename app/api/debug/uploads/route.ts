import { NextRequest } from "next/server";
import { readdir } from "fs/promises";
import { join } from "path";

export async function GET(req: NextRequest) {
  try {
    const uploadDirs = [
      { name: "pdfs", path: join(process.cwd(), "public", "uploads", "books", "pdfs") },
      { name: "covers", path: join(process.cwd(), "public", "uploads", "books", "covers") },
      { name: "audio", path: join(process.cwd(), "public", "uploads", "books", "audio") },
    ];

    const result: Record<string, any> = {
      cwd: process.cwd(),
      dirs: {},
    };

    for (const dir of uploadDirs) {
      try {
        const files = await readdir(dir.path);
        result.dirs[dir.name] = {
          path: dir.path,
          files: files.filter(f => f !== '.gitkeep'),
          count: files.filter(f => f !== '.gitkeep').length,
        };
      } catch (err: any) {
        result.dirs[dir.name] = {
          path: dir.path,
          error: err.message,
        };
      }
    }

    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error("Debug error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
