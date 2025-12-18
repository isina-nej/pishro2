import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  ErrorCodes,
} from "@/lib/api-response";

interface RouteParams {
  params: Promise<{
    id: string;
    type: "pdf" | "cover" | "audio";
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id, type } = await params;

    console.log(`[Download] Request: id=${id}, type=${type}`);

    // Validate book exists
    const book = await prisma.digitalBook.findUnique({
      where: { id },
    });

    if (!book) {
      console.error(`[Download] Book not found: ${id}`);
      return errorResponse("کتاب یافت نشد", ErrorCodes.NOT_FOUND);
    }

    let fileUrl: string | null = null;

    // Determine which file to download
    switch (type) {
      case "pdf":
        fileUrl = book.fileUrl;
        break;
      case "cover":
        fileUrl = book.cover;
        break;
      case "audio":
        fileUrl = book.audioUrl;
        break;
      default:
        console.error(`[Download] Invalid type: ${type}`);
        return errorResponse("نوع فایل معتبر نیست", ErrorCodes.VALIDATION_ERROR);
    }

    console.log(`[Download] File URL: ${fileUrl}`);

    if (!fileUrl) {
      console.error(`[Download] File URL is empty for type: ${type}`);
      return errorResponse(
        "این فایل برای این کتاب موجود نیست",
        ErrorCodes.NOT_FOUND
      );
    }

    // Increment downloads count
    try {
      await prisma.digitalBook.update({
        where: { id },
        data: { downloads: { increment: 1 } },
      });
      console.log(`[Download] Downloads count incremented for: ${id}`);
    } catch (updateErr) {
      console.error(`[Download] Error updating download count:`, updateErr);
    }

    // Redirect to file (whether local or external)
    console.log(`[Download] Redirecting to: ${fileUrl}`);
    
    const response = new Response(null, {
      status: 302,
      headers: {
        "Location": fileUrl,
      },
    });
    return response;
    
  } catch (error) {
    console.error("[Download] General error:", error);
    return errorResponse(
      "خطایی در دانلود فایل رخ داد",
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
