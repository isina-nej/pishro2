سریع‌شروع: سیستم آپلود و دانلود کتاب
====================================

## 📋 خلاصه

- ✅ آپلود کاور (JPG, PNG, WebP - حداکثر 5MB)
- ✅ آپلود صوت (MP3, WAV, OGG, M4A - حداکثر 500MB)
- ✅ دانلود فایل‌ها از سرور
- ✅ محاسبه خودکار تعداد دانلود‌ها

---

## 🚀 شروع کار

### 1️⃣ در پنل ادمین

```
پیشرو ادمین > کتاب‌ها > افزودن کتاب جدید
```

### 2️⃣ فرم کتاب

1. **تصویر جلد**: کلیک روی ناحیه بارگذاری
   - انتخاب تصویر (JPG, PNG یا WebP)
   - سایز: کمتر از 5MB

2. **فایل صوتی**: کلیک روی ناحیه بارگذاری
   - انتخاب فایل صوتی (MP3, WAV و غیره)
   - سایز: کمتر از 500MB

3. **کلیک "ذخیره"**: فایل‌ها و اطلاعات ذخیره می‌شوند

---

## 📁 ساختار پوشه‌ها

```
pishro2/
├── public/
│   └── uploads/
│       ├── book-covers/      # کاور کتاب‌ها
│       ├── book-audio/       # صوت کتاب‌ها
│       ├── avatars/          # آواتار کاربران
│       └── ...
└── app/api/
    ├── admin/books/
    │   ├── upload-cover/     # API آپلود کاور
    │   ├── upload-audio/     # API آپلود صوت
    │   └── upload-pdf/       # API آپلود PDF
    └── library/
        ├── route.ts          # دریافت لیست کتاب‌ها
        └── [id]/
            ├── route.ts      # دریافت یک کتاب
            └── download/[type]/  # دانلود فایل
```

---

## 🔗 API Endpoints

### آپلود کاور
```
POST /api/admin/books/upload-cover
Content-Type: multipart/form-data

body: {
  cover: File (image/jpeg, image/png, image/webp)
}

response: {
  fileName: "cover_1234567890_abc.jpg"
  fileUrl: "/uploads/book-covers/cover_1234567890_abc.jpg"
  fileSize: 1024000
  mimeType: "image/jpeg"
}
```

### آپلود صوت
```
POST /api/admin/books/upload-audio
Content-Type: multipart/form-data

body: {
  audio: File (audio/mpeg, audio/wav, audio/ogg, ...)
}

response: {
  fileName: "audio_1234567890_abc.mp3"
  fileUrl: "/uploads/book-audio/audio_1234567890_abc.mp3"
  fileSize: 50000000
  mimeType: "audio/mpeg"
}
```

### دانلود فایل
```
GET /api/library/{bookId}/download/{type}

type: "pdf" | "cover" | "audio"

examples:
- /api/library/65abc123/download/pdf
- /api/library/65abc123/download/cover
- /api/library/65abc123/download/audio

response: فایل به صورت مستقیم دانلود می‌شود
```

---

## 💻 کد‌های نمونه

### استفاده از Service برای آپلود

```typescript
import { uploadBookCover } from "@/lib/services/book-cover-service";
import { uploadBookAudio } from "@/lib/services/book-audio-service";

// آپلود کاور
const result = await uploadBookCover(file);
console.log(result.fileUrl); // "/uploads/book-covers/cover_xxx.jpg"

// آپلود صوت
const result = await uploadBookAudio(file);
console.log(result.fileUrl); // "/uploads/book-audio/audio_xxx.mp3"
```

### دانلود فایل

```typescript
// در صفحه نمایش کتاب
const downloadFile = (bookId, type) => {
  const link = document.createElement('a');
  link.href = `/api/library/${bookId}/download/${type}`;
  link.click();
};

// استفاده
downloadFile('65abc123', 'pdf');    // دانلود PDF
downloadFile('65abc123', 'cover');  // دانلود کاور
downloadFile('65abc123', 'audio');  // دانلود صوت
```

---

## ⚠️ خطاهای رایج

| خطا | علت | حل |
|-----|-----|-----|
| "فقط فایل‌های تصویری مجاز" | نوع فایل اشتباه | فقط JPG/PNG بارگذاری کنید |
| "حجم فایل بیش از حد است" | فایل بزرگ است | فایل کاور: <5MB، صوت: <500MB |
| "شما دسترسی ندارید" | کاربر ادمین نیست | فقط ادمین‌ها می‌توانند آپلود کنند |
| "خطا در خواندن فایل" | فایل حذف شد | دوباره فایل را آپلود کنید |

---

## 📊 اطلاعات Database

فایل‌های آپلود شده در `DigitalBook` ذخیره می‌شوند:

```prisma
model DigitalBook {
  cover      String?     // "/uploads/book-covers/cover_xxx.jpg"
  fileUrl    String?     // "/uploads/book-pdf/file_xxx.pdf"
  audioUrl   String?     // "/uploads/book-audio/audio_xxx.mp3"
  downloads  Int         // تعداد دانلود‌ها
  views      Int         // تعداد بازدیدها
}
```

---

## 🔒 قوانین امنیتی

✅ نوع فایل بررسی می‌شود  
✅ حجم فایل محدود است  
✅ فقط ادمین‌ها می‌توانند آپلود کنند  
✅ فایل‌های قدیمی خودکار حذف نمی‌شوند (نیاز به پاک‌سازی دستی)  

---

## 📞 تماس و کمک

اگر مشکلی دارید:
1. فایل‌های موجود در `/docs` را بخوانید
2. [BOOK_FILE_UPLOAD_SYSTEM.md](./BOOK_FILE_UPLOAD_SYSTEM.md) را مطالعه کنید
3. کد‌های service و routes را بررسی کنید

---

آخرین بروزرسانی: 2024-12-18
