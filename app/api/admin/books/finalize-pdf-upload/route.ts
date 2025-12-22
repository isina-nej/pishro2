/**
 * Admin Books PDF Finalize Upload API
 * POST /api/admin/books/finalize-pdf-upload - Finalize chunked upload and merge chunks
 * 
 * تکه‌های آپلود شده را ترکیب می‌کند و نام‌گذاری نهایی را انجام می‌دهد
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink, rm } from "fs/promises";
import { join } from "path";
import {
  successResponse,
  validationError,
  errorResponse,
  ErrorCodes,
} from "@/lib/api-response";
import {
  BOOKS_UPLOAD_PATHS,
  generateFileUrl,
} from "@/lib/upload-config";
import { readdirSync } from "fs";

// مسیر موقتی برای ذخیره‌سازی تکه‌ها
const TEMP_UPLOAD_DIR = join(BOOKS_UPLOAD_PATHS.pdfs.dir, "temp");

// CORS headers
function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "https://admin.pishrosarmaye.com",
    "https://www.pishrosarmaye.com",
    "https://pishrosarmaye.com",
  ];
  
  const isOriginAllowed = allowedOrigins.includes(origin);
  
  return {
    "Access-Control-Allow-Origin": isOriginAllowed ? origin : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": isOriginAllowed ? "true" : "false",
  };
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  let fileId: string | null = null;

  try {
    const body = await req.json();
    
    fileId = body.fileId as string;
    const totalChunks = body.totalChunks as number;
    const fileName = body.fileName as string;
    const fileSize = body.fileSize as number;

    // اعتبارسنجی
    if (!fileId || !totalChunks || !fileName) {
      return validationError(
        { fileId: "اطلاعات ناقص" },
        "تمام فیلدهای الزامی را ارسال کنید"
      );
    }

    console.log(`🔗 Finalizing upload: ${fileId}, ${totalChunks} chunks, size: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`);

    // خواندن و ترکیب تمام تکه‌ها
    const buffers: Buffer[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = join(TEMP_UPLOAD_DIR, `${fileId}.chunk.${i}`);
      
      try {
        console.log(`📖 Reading chunk ${i + 1}/${totalChunks}...`);
        const chunkBuffer = await readFile(chunkPath);
        buffers.push(chunkBuffer);
        
        // حذف تکه پس از خواندن
        try {
          await unlink(chunkPath);
        } catch (err) {
          console.warn(`⚠️  Could not delete chunk file: ${chunkPath}`, err);
        }
      } catch (err) {
        console.error(`❌ Error reading chunk ${i}: ${chunkPath}`, err);
        throw new Error(`تکه ${i + 1} یافت نشد`);
      }
    }

    // ترکیب تمام تکه‌ها در یک فایل
    const finalBuffer = Buffer.concat(buffers);
    console.log(`✅ All chunks merged: ${(finalBuffer.length / (1024 * 1024)).toFixed(2)}MB`);

    // بررسی کنترل‌مجموع اندازه
    if (fileSize && Math.abs(finalBuffer.length - fileSize) > 1000) {
      console.warn(`⚠️  Size mismatch: expected ${fileSize}, got ${finalBuffer.length}`);
    }

    // ایجاد نام منحصر به فرد برای فایل نهایی
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const finalFileName = `book_${timestamp}_${randomString}.pdf`;

    // مسیر فایل نهایی
    const uploadDir = BOOKS_UPLOAD_PATHS.pdfs.dir;
    const finalFilePath = join(uploadDir, finalFileName);

    console.log("Writing final file to disk:", finalFilePath);
    // ذخیره‌سازی فایل نهایی
    try {
      await writeFile(finalFilePath, finalBuffer);
      console.log("✅ Final file written successfully");
    } catch (err) {
      console.error("Error writing final file:", err);
      throw err;
    }

    // URL نسبی فایل
    const pdfUrl = generateFileUrl("pdf", finalFileName);

    console.log("Upload finalized successfully:", { pdfUrl, fileName });
    
    const response = successResponse(
      {
        fileName,
        fileUrl: pdfUrl,
        fileSize: finalBuffer.length,
        mimeType: "application/pdf",
        uploadedAt: new Date().toISOString(),
        chunksCount: totalChunks,
      },
      "فایل PDF با موفقیت آپلود و ترکیب شد"
    );
    
    // Add CORS headers to response
    for (const [key, value] of Object.entries(corsHeaders(req))) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error("Error finalizing upload:", error);

    // تمیز کردن فایل‌های موقتی در صورت خرابی
    if (fileId) {
      try {
        // تلاش برای حذف فایل‌های موقتی
        const tempFiles = readdirSync(TEMP_UPLOAD_DIR).filter((f) =>
          f.startsWith(`${fileId}.chunk.`)
        );
        for (const tempFile of tempFiles) {
          const tempPath = join(TEMP_UPLOAD_DIR, tempFile);
          console.log(`🗑️  Cleaning up temp file: ${tempPath}`);
          try {
            await unlink(tempPath);
          } catch (err) {
            console.warn(`⚠️  Could not delete temp file: ${tempPath}`, err);
          }
        }
      } catch (err) {
        console.warn("⚠️  Error cleaning up temp files:", err);
      }
    }

    const response = errorResponse(
      "خطا در اختتام آپلود: " + (error instanceof Error ? error.message : String(error)),
      ErrorCodes.INTERNAL_ERROR
    );
    
    // Add CORS headers to error response
    for (const [key, value] of Object.entries(corsHeaders(req))) {
      response.headers.set(key, value);
    }
    return response;
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb", // صرفاً برای JSON metadata
    },
  },
};
