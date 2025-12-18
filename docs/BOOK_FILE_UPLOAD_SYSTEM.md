مستندات سیستم آپلود و دانلود فایل‌های کتاب
==========================================

## بررسی کلی

این سیستم امکان آپلود و دانلود سه نوع فایل برای کتاب‌های دیجیتالی را فراهم می‌کند:
1. **کاور کتاب** (تصویر - JPG, PNG, WebP)
2. **صوت کتاب** (فایل صوتی - MP3, WAV, OGG, M4A و غیره)
3. **PDF کتاب** (فایل PDF - موجود)

---

## معمارسازی (Architecture)

### 1. سرور (Main App - pishro2)

#### آپلود API Endpoints

**کاور کتاب:**
```
POST /api/admin/books/upload-cover
- Content-Type: multipart/form-data
- Field: cover (File)
- Max Size: 5MB
- Allowed Types: image/jpeg, image/png, image/webp
- Storage Path: public/uploads/book-covers/
```

**صوت کتاب:**
```
POST /api/admin/books/upload-audio
- Content-Type: multipart/form-data
- Field: audio (File)
- Max Size: 500MB
- Allowed Types: audio/mpeg, audio/wav, audio/ogg, audio/webm, audio/m4a
- Storage Path: public/uploads/book-audio/
```

**Response Format:**
```json
{
  "success": true,
  "message": "فایل با موفقیت آپلود شد",
  "data": {
    "fileName": "cover_1234567890_abc123.jpg",
    "fileUrl": "/uploads/book-covers/cover_1234567890_abc123.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-01T12:00:00Z"
  }
}
```

#### دانلود API Endpoint

```
GET /api/library/[id]/download/[type]
```

پارامترها:
- `id`: شناسه کتاب
- `type`: نوع فایل (pdf | cover | audio)

**مثال:**
```
GET /api/library/65abc123def456/download/pdf
GET /api/library/65abc123def456/download/cover
GET /api/library/65abc123def456/download/audio
```

**Response:**
- فایل به صورت مستقیم دانلود می‌شود
- Content-Type مناسب با نوع فایل تنظیم می‌شود
- تعداد دانلود‌ها در دیتابیس افزایش می‌یابد

---

### 2. پنل ادمین (Admin Panel - pishro-admin2)

#### Services

**book-cover-service.ts:**
```typescript
uploadBookCover(file: File): Promise<UploadCoverResponse>
deleteBookCover(fileUrl: string): Promise<void>
```

**book-audio-service.ts:**
```typescript
uploadBookAudio(file: File): Promise<UploadAudioResponse>
deleteBookAudio(fileUrl: string): Promise<void>
```

#### Components

**BookForm.tsx** - فرم ایجاد/ویرایش کتاب:
- Upload button برای کاور
- Upload button برای صوت
- نمایش نام فایل آپلود شده
- امکان حذف فایل‌های آپلود شده
- نمایش URL فایل‌های موجود

---

## جریان کار (Workflow)

### آپلود فایل

1. **کاربر ادمین** فایل را انتخاب می‌کند
2. **BookForm** تابع `uploadBookCover` یا `uploadBookAudio` را فراخوانی می‌کند
3. **Service** فایل را اعتبارسنجی و نام فایل را تولید می‌کند:
   - Timestamp: `Date.now()`
   - Random String: برای جلوگیری از تضاد نام‌ها
   - مثال: `cover_1704110400000_abc123.jpg`
4. **API Server** فایل را ذخیره می‌کند:
   - کاور: `public/uploads/book-covers/`
   - صوت: `public/uploads/book-audio/`
5. **URL** برگردانده می‌شود:
   - `/uploads/book-covers/cover_1704110400000_abc123.jpg`
6. **Form** URL را در فیلد `cover` یا `audioUrl` ذخیره می‌کند
7. **Database** هنگام ذخیره کتاب، URL ذخیره می‌شود

### دانلود فایل

1. **کاربر** روی لینک دانلود کلیک می‌کند
2. **Browser** درخواست به `GET /api/library/[id]/download/[type]` ارسال می‌کند
3. **API Server**:
   - کتاب را جستجو می‌کند
   - URL فایل را بر اساس نوع (`pdf`، `cover`، `audio`) می‌یابد
   - فایل را از `public` folder می‌خواند
   - تعداد دانلود‌ها را افزایش می‌دهد
   - فایل را با Content-Type مناسب برمی‌گرداند
4. **Browser** فایل را دانلود می‌کند

---

## Database Schema

```prisma
model DigitalBook {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  title       String
  slug        String   @unique
  author      String
  description String
  
  // File URLs
  cover       String?      // کاور کتاب (تصویر)
  fileUrl     String?      // فایل PDF
  audioUrl    String?      // فایل صوتی
  
  // Other fields...
  downloads   Int      @default(0)  // تعداد دانلود‌ها
  views       Int      @default(0)  // تعداد بازدیدها
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## خطاهای ممکن و راه‌حل

### خطا: "فقط فایل‌های تصویری مجاز است"
- **علت**: نوع فایل صحیح نیست
- **راه‌حل**: فقط JPG, PNG یا WebP بارگذاری کنید

### خطا: "حجم فایل بیش از حد است"
- **علت**: فایل بزرگتر از حد مجاز است
- **حداقل برای کاور**: 5MB
- **حداقل برای صوت**: 500MB

### خطا: "خطا در خواندن فایل"
- **علت**: فایل از سرور حذف شده یا مسیر صحیح نیست
- **راه‌حل**: دوباره فایل را آپلود کنید

### خطا: "شما دسترسی لازم برای این عملیات را ندارید"
- **علت**: کاربر ادمین نیست
- **راه‌حل**: فقط ادمین‌ها می‌توانند فایل‌ها را آپلود کنند

---

## استفاده در Frontend (نمونه کد)

### آپلود کاور:
```typescript
import { uploadBookCover } from "@/lib/services/book-cover-service";

const handleCoverUpload = async (file: File) => {
  try {
    const result = await uploadBookCover(file);
    console.log("کاور آپلود شد:", result.fileUrl);
    // result.fileUrl را در form ذخیره کنید
  } catch (error) {
    console.error("خطا:", error.message);
  }
};
```

### آپلود صوت:
```typescript
import { uploadBookAudio } from "@/lib/services/book-audio-service";

const handleAudioUpload = async (file: File) => {
  try {
    const result = await uploadBookAudio(file);
    console.log("صوت آپلود شد:", result.fileUrl);
    // result.fileUrl را در form ذخیره کنید
  } catch (error) {
    console.error("خطا:", error.message);
  }
};
```

### دانلود فایل:
```typescript
// دانلود PDF
const downloadPDF = (bookId: string) => {
  window.location.href = `/api/library/${bookId}/download/pdf`;
};

// دانلود کاور
const downloadCover = (bookId: string) => {
  window.location.href = `/api/library/${bookId}/download/cover`;
};

// دانلود صوت
const downloadAudio = (bookId: string) => {
  window.location.href = `/api/library/${bookId}/download/audio`;
};
```

---

## فایل‌های مهم

### Server (pishro2):
- `app/api/admin/books/upload-cover/route.ts` - API آپلود کاور
- `app/api/admin/books/upload-audio/route.ts` - API آپلود صوت
- `app/api/library/[id]/download/[type]/route.ts` - API دانلود

### Admin (pishro-admin2):
- `src/lib/services/book-cover-service.ts` - سرویس کاور
- `src/lib/services/book-audio-service.ts` - سرویس صوت
- `src/components/Books/BookForm.tsx` - فرم کتاب

### Prisma:
- `prisma/schema.prisma` - مدل DigitalBook

---

## نکات امنیتی

✅ **بررسی نوع فایل**: فقط نوع‌های مجاز دریافت می‌شوند  
✅ **بررسی حجم فایل**: حد بالایی برای اندازه فایل  
✅ **بررسی دسترسی**: فقط ادمین‌ها می‌توانند آپلود کنند  
✅ **نام فایل منحصر به فرد**: Timestamp + Random string  
✅ **فایل‌های ایستا**: در پوشه `public` ذخیره می‌شوند  

---

## بهتری‌های آینده

- [ ] حذف فایل‌های قدیمی هنگام بروزرسانی
- [ ] فشرده‌سازی تصاویر کاور خودکار
- [ ] ویدیو پیش‌نمایش برای صوت‌ها
- [ ] آپلود موازی چند فایل
- [ ] Virus scanning برای فایل‌های آپلود شده
- [ ] CDN integration برای دانلود سریع‌تر
