/**
 * Admin Books PDF Upload API
 * POST /api/admin/books/upload-pdf - Upload a PDF file for a digital book
 */

import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/auth";
import {
  successResponse,
  unauthorizedResponse,
  validationError,
  errorResponse,
  ErrorCodes,
  forbiddenResponse,
} from "@/lib/api-response";

// تنظیمات مجاز برای آپلود PDF کتاب
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ["application/pdf"];
const ALLOWED_EXTENSIONS = ["pdf"];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // بررسی احراز هویت و نقش ادمین
    if (!session?.user) {
      return unauthorizedResponse("لطفاً وارد حساب کاربری خود شوید");
    }

    if (session.user.role !== "ADMIN") {
      return forbiddenResponse("دسترسی غیرمجاز - فقط ادمین");
    }

    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return validationError(
        { pdf: "فایل PDF الزامی است" },
        "فایل PDF الزامی است"
      );
    }

    // بررسی نوع فایل
    if (!ALLOWED_TYPES.includes(file.type)) {
      return validationError(
        { pdf: "فقط فایل‌های PDF مجاز هستند" },
        "فقط فرمت PDF مجاز است"
      );
    }

    // بررسی حجم فایل
    if (file.size > MAX_FILE_SIZE) {
      return validationError(
        { pdf: "حجم فایل نباید بیشتر از 100 مگابایت باشد" },
        "حجم فایل نباید بیشتر از 100 مگابایت باشد"
      );
    }

    // بررسی پسوند فایل
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
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

    // ایجاد دایرکتوری اگر وجود ندارد
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
    }

    // ذخیره فایل
    await writeFile(filepath, buffer);

    // URL نسبی فایل
    const pdfUrl = `/uploads/books/pdfs/${filename}`;

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
      "خطا در آپلود فایل PDF",
      ErrorCodes.INTERNAL_ERROR
    );
  }
}
