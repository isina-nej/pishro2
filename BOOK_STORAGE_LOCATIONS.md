# 📂 مسیرهای ذخیره‌سازی کتاب‌ها

## 🎯 خلاصه سریع

### 1️⃣ فایل‌های فیزیکی (Disk Storage)
```
💾 مسیر: D:\pishro_uploads\
├── books/
│   ├── pdfs/              (فایل‌های PDF)
│   ├── covers/            (تصویرهای جلد)
│   └── audio/             (فایل‌های صوتی)
└── videos/                (فایل‌های ویدیو)
```

### 2️⃣ اطلاعات کتاب (Database)
```
🗄️ MongoDB
├── Server: mongodb://localhost:27017
├── Database: pishro
└── Collection: digitalbook
```

### 3️⃣ URLs درون Database
```
🌐 ذخیره شده به صورت:
   /api/uploads/books/pdfs/book_123456.pdf
   /api/uploads/books/covers/cover_123456.png
   /api/uploads/books/audio/audio_123456.mp3
```

---

## 📊 جزئیات مسیرها

### PDF کتاب‌ها
```
📍 فایل فیزیکی:
   D:\pishro_uploads\books\pdfs\book_1766154421546_8rrygyqtas.pdf

📍 URL در Database:
   /api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf

📍 لینک کامل:
   http://localhost:3000/api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf
```

### تصویرهای جلد (Cover)
```
📍 فایل فیزیکی:
   D:\pishro_uploads\books\covers\cover_1766154416638_qre59opbljo.png

📍 URL در Database:
   /api/uploads/books/covers/cover_1766154416638_qre59opbljo.png

📍 لینک کامل:
   http://localhost:3000/api/uploads/books/covers/cover_1766154416638_qre59opbljo.png
```

### فایل‌های صوتی (Audio)
```
📍 فایل فیزیکی:
   D:\pishro_uploads\books\audio\audio_1766154421546_abc123.mp3

📍 URL در Database:
   /api/uploads/books/audio/audio_1766154421546_abc123.mp3

📍 لینک کامل:
   http://localhost:3000/api/uploads/books/audio/audio_1766154421546_abc123.mp3
```

### ویدیوهای درسی (Videos)
```
📍 فایل فیزیکی:
   D:\pishro_uploads\videos\video_1766154421546_xyz789.mp4

📍 URL در Database:
   /api/uploads/videos/video_1766154421546_xyz789.mp4

📍 لینک کامل:
   http://localhost:3000/api/uploads/videos/video_1766154421546_xyz789.mp4
```

---

## 🔧 پیکربندی

### متغیر محیطی
```env
# در pishro2/.env
UPLOAD_BASE_DIR="D:\pishro_uploads"
```

**پیش‌فرض:** اگر تعریف نشده، خودکار `D:\pishro_uploads` استفاده می‌شود

### تغییر مسیر ذخیره‌سازی
اگر می‌خواهید فایل‌ها در جای دیگری ذخیره شوند:

```env
# در pishro2/.env
UPLOAD_BASE_DIR="E:\my_uploads"
# یا:
UPLOAD_BASE_DIR="/mnt/storage/pishro"
```

**نتیجه:** تمام مسیرها خودکار تغییر می‌یابند!

---

## 🔄 فرآیند کامل آپلود و ذخیره

### 1️⃣ کاربر فایل را آپلود می‌کند
```
User Browser (pishro-admin2:3001)
    ↓
uploadBookPdf(file)
    ↓
POST http://localhost:3000/api/admin/books/upload-pdf
```

### 2️⃣ Server فایل را دریافت و ذخیره می‌کند
```
pishro2 Server (3000)
    ↓
POST /api/admin/books/upload-pdf
    ↓
ensureUploadDirExists("D:\pishro_uploads\books\pdfs")
    ↓
writeFile("D:\pishro_uploads\books\pdfs\book_123456.pdf", buffer)
    ↓
generateFileUrl("pdf", "book_123456.pdf")
    ↓
return { fileUrl: "/api/uploads/books/pdfs/book_123456.pdf" }
```

### 3️⃣ Client دریافت می‌کند و در Database ذخیره می‌کند
```
pishro-admin2 Client
    ↓
setFormData({ fileUrl: "/api/uploads/books/pdfs/book_123456.pdf" })
    ↓
POST http://localhost:3000/api/admin/books
    ↓
{
  title: "Book Title",
  fileUrl: "/api/uploads/books/pdfs/book_123456.pdf",
  cover: "/api/uploads/books/covers/cover_123456.png",
  audioUrl: "/api/uploads/books/audio/audio_123456.mp3"
}
```

### 4️⃣ Server ذخیره در MongoDB
```
prisma.digitalBook.create({
  fileUrl: "/api/uploads/books/pdfs/book_123456.pdf",
  cover: "/api/uploads/books/covers/cover_123456.png",
  audioUrl: "/api/uploads/books/audio/audio_123456.mp3"
})
    ↓
✅ در MongoDB ذخیره شد
```

### 5️⃣ دسترسی به فایل‌ها
```
GET http://localhost:3000/api/uploads/books/pdfs/book_123456.pdf
    ↓
/api/uploads/[...path]/route.ts
    ↓
readFile("D:\pishro_uploads\books\pdfs\book_123456.pdf")
    ↓
✅ فایل دانلود می‌شود
```

---

## 📋 نمونه کتاب ذخیره شده

### در Database (MongoDB)
```json
{
  "_id": "ObjectId(...)",
  "title": "پرداخت - گیگا الکترونیک",
  "slug": "pardakht-giga",
  "author": "نویسنده",
  "description": "توضیحات",
  "cover": "/api/uploads/books/covers/cover_1766154416638_qre59opbljo.png",
  "fileUrl": "/api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf",
  "audioUrl": "/api/uploads/books/audio/audio_1766154421546_abc.mp3",
  "category": "تکنولوژی",
  "year": 2025,
  "createdAt": "2025-12-19T14:27:01.547Z",
  ...
}
```

### در Disk
```
D:\pishro_uploads\
├── books\
│   ├── pdfs\
│   │   └── book_1766154421546_8rrygyqtas.pdf
│   ├── covers\
│   │   └── cover_1766154416638_qre59opbljo.png
│   └── audio\
│       └── audio_1766154421546_abc.mp3
```

---

## ✅ مزایا این ساختار

✅ **persistence:** فایل‌ها بیرون پروژه ذخیره می‌شوند (اگر پروژه حذف شود، فایل‌ها سالم می‌مانند)

✅ **قابل انتقال:** فقط `UPLOAD_BASE_DIR` را تغییر دهید، همه‌چیز منتقل می‌شود

✅ **سازماندهی:** هر نوع فایل در پوشه‌ی جداگانه

✅ **کنترل دسترسی:** از طریق API endpoints، نه مستقیم

✅ **Security:** مسیرهای حساس از کاربر مخفی است

---

## 🗑️ حذف خودکار

### هنگام حذف کتاب
```
DELETE /api/admin/books/123
    ↓
1. پیدا کردن کتاب در Database
2. استخراج fileUrl, cover, audioUrl
3. تبدیل URLs به مسیرهای فیزیکی
4. حذف فایل‌ها از D:\pishro_uploads\
5. حذف رکورد از Database
    ↓
✅ کتاب و تمام فایل‌های آن حذف می‌شوند
```

### هنگام ویرایش کتاب
```
PATCH /api/admin/books/123
    ↓
اگر PDF جدید آپلود شد:
  1. حذف PDF قدیم
  2. ذخیره PDF جدید
    
اگر Cover جدید آپلود شد:
  1. حذف Cover قدیم
  2. ذخیره Cover جدید
```

---

## 📞 فایل‌های مهم

| فایل | توضیح |
|------|-------|
| `lib/upload-config.ts` | تعریف مسیرها و URLs |
| `app/api/admin/books/upload-pdf/route.ts` | آپلود PDF |
| `app/api/admin/books/upload-cover/route.ts` | آپلود Cover |
| `app/api/admin/books/upload-audio/route.ts` | آپلود Audio |
| `app/api/uploads/[...path]/route.ts` | دسترسی به فایل‌ها |
| `app/api/admin/books/[id]/route.ts` | حذف/ویرایش |
| `.env` | تعریف `UPLOAD_BASE_DIR` |

---

## 🎯 خلاصه نهایی

| موضوع | جایگاه |
|-------|--------|
| **فایل‌های فیزیکی** | `D:\pishro_uploads\` |
| **اطلاعات متادیتا** | MongoDB (localhost:27017) |
| **URLs** | ذخیره شده در Database |
| **دسترسی** | از طریق `/api/uploads/...` |
| **تغییر مسیر** | فقط `UPLOAD_BASE_DIR` در `.env` |

