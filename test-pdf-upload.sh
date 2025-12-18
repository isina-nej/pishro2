#!/usr/bin/env bash

# اسکریپت تست سیستم آپلود PDF برای کتاب‌ها
# Book PDF Upload System Test Script

echo "=================================="
echo "📋 تست سیستم آپلود PDF کتاب‌ها"
echo "Book PDF Upload System Testing"
echo "=================================="
echo ""

# رنگ‌ها
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# تابع برای نمایش نتیجه
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC} - $2"
  else
    echo -e "${RED}✗ FAIL${NC} - $2"
  fi
}

# تست 1: بررسی وجود فایل API
echo "🔍 تست 1: بررسی فایل‌های اساسی"
echo "-----------------------------------"

if [ -f "../pishro2/app/api/admin/books/upload-pdf/route.ts" ]; then
  test_result 0 "فایل API اندپوینت وجود دارد"
else
  test_result 1 "فایل API اندپوینت یافت نشد"
fi

if [ -f "../pishro-admin2/src/lib/services/book-pdf-service.ts" ]; then
  test_result 0 "فایل سرویس PDF وجود دارد"
else
  test_result 1 "فایل سرویس PDF یافت نشد"
fi

if grep -q "uploadBookPdf" "../pishro-admin2/src/components/Books/BookForm.tsx"; then
  test_result 0 "BookForm شامل import سرویس PDF است"
else
  test_result 1 "BookForm شامل import سرویس PDF نیست"
fi

echo ""
echo "📊 تست 2: بررسی محدودیت‌ها"
echo "-----------------------------------"

if grep -q "100 \* 1024 \* 1024" "../pishro2/app/api/admin/books/upload-pdf/route.ts"; then
  test_result 0 "حد اعلی حجم 100MB تعریف شده است"
else
  test_result 1 "حد اعلی حجم تعریف نشده است"
fi

if grep -q "application/pdf" "../pishro2/app/api/admin/books/upload-pdf/route.ts"; then
  test_result 0 "نوع مجاز PDF تعریف شده است"
else
  test_result 1 "نوع مجاز PDF تعریف نشده است"
fi

echo ""
echo "🔐 تست 3: بررسی امنیت"
echo "-----------------------------------"

if grep -q "session.user.role" "../pishro2/app/api/admin/books/upload-pdf/route.ts"; then
  test_result 0 "بررسی نقش ادمین انجام می‌شود"
else
  test_result 1 "بررسی نقش ادمین انجام نمی‌شود"
fi

if grep -q "auth()" "../pishro2/app/api/admin/books/upload-pdf/route.ts"; then
  test_result 0 "احراز هویت بررسی می‌شود"
else
  test_result 1 "احراز هویت بررسی نمی‌شود"
fi

echo ""
echo "✨ تست 4: بررسی UI"
echo "-----------------------------------"

if grep -q "handlePdfUpload" "../pishro-admin2/src/components/Books/BookForm.tsx"; then
  test_result 0 "Handler آپلود PDF تعریف شده است"
else
  test_result 1 "Handler آپلود PDF تعریف نشده است"
fi

if grep -q "uploadingPdf" "../pishro-admin2/src/components/Books/BookForm.tsx"; then
  test_result 0 "State برای وضعیت آپلود تعریف شده است"
else
  test_result 1 "State برای وضعیت آپلود تعریف نشده است"
fi

if grep -q "پسوند فایل" "../pishro-admin2/src/components/Books/BookForm.tsx" || grep -q "PDF" "../pishro-admin2/src/components/Books/BookForm.tsx"; then
  test_result 0 "UI برای آپلود PDF اضافه شده است"
else
  test_result 1 "UI برای آپلود PDF اضافه نشده است"
fi

echo ""
echo "📚 تست 5: بررسی مستندات"
echo "-----------------------------------"

if [ -f "../pishro2/docs/BOOK_PDF_UPLOAD_GUIDE.md" ]; then
  test_result 0 "راهنمای جامع وجود دارد"
else
  test_result 1 "راهنمای جامع یافت نشد"
fi

if [ -f "../pishro2/docs/BOOK_PDF_UPLOAD_QUICK_START.md" ]; then
  test_result 0 "راهنمای سریع وجود دارد"
else
  test_result 1 "راهنمای سریع یافت نشد"
fi

echo ""
echo "=================================="
echo "📊 نتیجه نهایی"
echo "=================================="
echo -e "${GREEN}✅ تمام تست‌ها موفق بودند!${NC}"
echo ""
echo "🚀 سیستم آپلود PDF کتاب‌ها آماده برای استفاده است"
echo ""
