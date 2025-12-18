/**
 * Admin Books PDF Upload API
 * POST /api/admin/books/upload-pdf - Upload a PDF file for a digital book
 */

import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  successResponse,
  validationError,
  errorResponse,
  ErrorCodes,
} from "@/lib/api-response";

// تنظیمات مجاز برای آپلود PDF کتاب
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ["application/pdf"];
const ALLOWED_EXTENSIONS = ["pdf"];

export async function POST(req: NextRequest) {
  try {
    // Note: Auth is handled by the admin panel - this endpoint receives already-authenticated requests

    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    console.log("PDF upload request received:", { fileName: file?.name, fileSize: file?.size });

    if (!file) {
      return validationError(
        { pdf: "فایل PDF الزامی است" },
        "فایل PDF الزامی است"
      );
    }

    // بررسی نوع فایل
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error("Invalid file type:", file.type);
      return validationError(
        { pdf: "فقط فایل‌های PDF مجاز هستند" },
        "فقط فرمت PDF مجاز است"
      );
    }

    // بررسی حجم فایل
    if (file.size > MAX_FILE_SIZE) {
      console.error("File too large:", file.size);
      return validationError(
        { pdf: "حجم فایل نباید بیشتر از 100 مگابایت باشد" },
        "حجم فایل نباید بیشتر از 100 مگابایت باشد"
      );
    }

    // بررسی پسوند فایل
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      console.error("Invalid file extension:", extension);
      return validationError(
        { pdf: "پسوند فایل معتبر نیست" },
        "پسوند فایل باید .pdf باشد"
      );
    }

    // تبدیل فایل به buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ایجاد نام منحصر به فرد برای فایل
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `book_${timestamp}_${randomString}.pdf`;

    // مسیر ذخیره فایل
    const uploadDir = join(process.cwd(), "public", "uploads", "books", "pdfs");
    const filepath = join(uploadDir, filename);

    console.log("Creating upload directory:", uploadDir);
    // ایجاد دایرکتوری اگر وجود ندارد
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log("Upload directory created successfully");
    } catch (err) {
      console.error("Error creating directory:", err);
      throw err;
    }

    console.log("Writing file to disk:", filepath);
    // ذخیره فایل
    try {
      await writeFile(filepath, buffer);
      console.log("File written successfully");
    } catch (err) {
      console.error("Error writing file:", err);
      throw err;
    }

    // URL نسبی فایل
    const pdfUrl = `/uploads/books/pdfs/${filename}`;

    console.log("Upload successful:", { pdfUrl, fileName: file.name });
    return successResponse(
      {
        fileName: file.name,
        fileUrl: pdfUrl,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      },
      "فایل PDF با موفقیت آپلود شد"
    );
  } catch (error) {
    console.error("Error uploading PDF:", error);
    return errorResponse(
      "خطا در آپلود فایل PDF: " + (error instanceof Error ? error.message : String(error)),
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
