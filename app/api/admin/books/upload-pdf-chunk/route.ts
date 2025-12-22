/**
 * Admin Books PDF Upload Chunk API
 * POST /api/admin/books/upload-pdf-chunk - Upload a chunk of PDF file
 * 
 * تقسیم فایل‌های بزرگ به تکه‌های 5MB برای آپلود سریع‌تر
 * ذخیره Temporary در session storage تا finalize شود
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";
import { constants } from "fs";
import {
  successResponse,
  validationError,
  errorResponse,
  ErrorCodes,
} from "@/lib/api-response";
import {
  BOOKS_UPLOAD_PATHS,
  ensureUploadDirExists,
} from "@/lib/upload-config";

// تنظیمات برای درخواست‌های بزرگ
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ["application/pdf"];
const ALLOWED_EXTENSIONS = ["pdf"];

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
  try {
    const formData = await req.formData();
    
    // استخراج اطلاعات از درخواست
    const chunk = formData.get("chunk") as File | null;
    const chunkIndex = formData.get("chunkIndex") as string | null;
    const totalChunks = formData.get("totalChunks") as string | null;
    const fileId = formData.get("fileId") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileSize = formData.get("fileSize") as string | null;

    // اعتبارسنجی
    if (!chunk || !chunkIndex || !totalChunks || !fileId) {
      return validationError(
        { chunk: "اطلاعات ناقص" },
        "تمام فیلدهای الزامی را ارسال کنید"
      );
    }

    const chunkIndexNum = parseInt(chunkIndex);
    const totalChunksNum = parseInt(totalChunks);
    const fileSizeNum = parseInt(fileSize || "0");

    console.log(`📦 Chunk upload: ${chunkIndexNum + 1}/${totalChunksNum} (${(chunk.size / (1024 * 1024)).toFixed(2)}MB)`);

    // اعتبارسنجی اندازه‌ی کل فایل
    if (fileSizeNum > MAX_FILE_SIZE) {
      console.error("File too large:", fileSizeNum);
      return validationError(
        { fileSize: "حجم فایل نباید بیشتر از 100 مگابایت باشد" },
        "حجم فایل نباید بیشتر از 100 مگابایت باشد"
      );
    }

    // اعتبارسنجی نوع فایل
    if (!ALLOWED_TYPES.includes(chunk.type)) {
      console.error("Invalid file type:", chunk.type);
      return validationError(
        { chunk: "فقط فایل‌های PDF مجاز هستند" },
        "فقط فرمت PDF مجاز است"
      );
    }

    // بررسی پسوند فایل
    if (fileName) {
      const extension = fileName.split(".").pop()?.toLowerCase();
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        console.error("Invalid file extension:", extension);
        return validationError(
          { fileName: "پسوند فایل معتبر نیست" },
          "پسوند فایل باید .pdf باشد"
        );
      }
    }

    // تبدیل chunk به buffer
    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ایجاد دایرکتوری موقتی
    try {
      await ensureUploadDirExists(TEMP_UPLOAD_DIR);
    } catch (err) {
      console.error("Error creating temp directory:", err);
      // ادامه می‌دهیم، ممکن است دایرکتوری وجود داشته باشد
    }

    // مسیر فایل موقتی
    const tempChunkPath = join(TEMP_UPLOAD_DIR, `${fileId}.chunk.${chunkIndexNum}`);

    console.log("Writing chunk to disk:", tempChunkPath);
    // ذخیره‌سازی تکه
    try {
      await writeFile(tempChunkPath, buffer);
      console.log(`✅ Chunk ${chunkIndexNum + 1} saved`);
    } catch (err) {
      console.error("Error writing chunk:", err);
      throw err;
    }

    const response = successResponse(
      {
        fileId,
        chunkIndex: chunkIndexNum,
        totalChunks: totalChunksNum,
        chunkSize: buffer.length,
        progress: Math.round(((chunkIndexNum + 1) / totalChunksNum) * 100),
        uploadedAt: new Date().toISOString(),
      },
      `تکه ${chunkIndexNum + 1} از ${totalChunksNum} با موفقیت آپلود شد`
    );
    
    // Add CORS headers to response
    for (const [key, value] of Object.entries(corsHeaders(req))) {
      response.headers.set(key, value);
    }
    return response;
  } catch (error) {
    console.error("Error uploading chunk:", error);
    const response = errorResponse(
      "خطا در آپلود تکه فایل: " + (error instanceof Error ? error.message : String(error)),
      ErrorCodes.INTERNAL_ERROR
    );
    
    // Add CORS headers to error response
    for (const [key, value] of Object.entries(corsHeaders(new NextRequest(new URL("http://localhost"))))) {
      response.headers.set(key, value);
    }
    return response;
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb", // هر تکه حداکثر 10MB
    },
  },
};
