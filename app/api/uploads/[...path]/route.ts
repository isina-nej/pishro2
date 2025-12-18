import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Serve uploaded files from the shared admin folder
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join("/");

    // Security: prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Path to the shared admin uploads folder
    const sharedUploadsDir = join(
      process.cwd(),
      "..",
      "pishro-admin2",
      "public",
      "uploads"
    );
    const fullPath = join(sharedUploadsDir, filePath);

    // Verify the file exists and is within the uploads directory
    if (!fullPath.startsWith(sharedUploadsDir)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (!existsSync(fullPath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = await readFile(fullPath);

    // Determine MIME type based on file extension
    const ext = filePath.split(".").pop()?.toLowerCase();
    let mimeType = "application/octet-stream";

    switch (ext) {
      case "jpg":
      case "jpeg":
        mimeType = "image/jpeg";
        break;
      case "png":
        mimeType = "image/png";
        break;
      case "webp":
        mimeType = "image/webp";
        break;
      case "gif":
        mimeType = "image/gif";
        break;
      case "pdf":
        mimeType = "application/pdf";
        break;
      case "mp3":
        mimeType = "audio/mpeg";
        break;
      case "wav":
        mimeType = "audio/wav";
        break;
      case "m4a":
        mimeType = "audio/mp4";
        break;
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File serving error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
