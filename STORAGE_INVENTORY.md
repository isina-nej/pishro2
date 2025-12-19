# 📋 تمام جاهای ذخیره‌سازی فایل‌ها در پروژه

## 🔴 **مسئلۀ موجود:**
سیستم ذخیره‌سازی **متناسب** نیست! سه سیستم متفاوت استفاده می‌شود:
1. **Books** → Local filesystem (D:\pishro_uploads) ✅ **Centralized**
2. **Images** → storage-adapter (UPLOAD_STORAGE_PATH) ⚠️ **Different path**
3. **Videos** → Local filesystem (D:\pishro_uploads) ✅ **Centralized** 
4. **News** → محتوای text است، فقط اگر image داشته باشه...

---

## 📁 **لیست کامل فایل‌های ذخیره‌شده:**

### **1. کتاب‌های دیجیتالی (Books)**
```
📍 مسیر: D:\pishro_uploads\books\
├── pdfs/          → فایل‌های PDF کتاب
├── covers/        → تصاویر جلد کتاب
└── audio/         → فایل‌های صوتی کتاب
```
**API Endpoints:**
- POST `/api/admin/books/upload-pdf`
- POST `/api/admin/books/upload-cover`
- POST `/api/admin/books/upload-audio`
- DELETE `/api/admin/books/[id]` (حذف تمام فایل‌ها)

**Config:** `lib/upload-config.ts`

---

### **2. تصاویر (Images)** ⚠️ DIFFERENT
```
📍 مسیر: /var/www/uploads/ (یا UPLOAD_STORAGE_PATH)
└── images/
    ├── THUMBNAIL/      → تصاویر thumbnail
    ├── HEADER/         → تصاویر header
    ├── CARD/           → تصاویر کارت
    ├── BANNER/         → تصاویر بنر
    ├── AVATAR/         → آواتارهای کاربر
    ├── LOGO/           → لوگو‌ها
    ├── ICON/           → آیکون‌ها
    ├── GALLERY/        → تصاویر گالری
    ├── PRODUCT/        → تصاویر محصول
    └── OTHER/          → دیگر تصاویر
```
**API Endpoints:**
- GET `/api/admin/images`
- POST `/api/admin/images` (Upload)
- DELETE `/api/admin/images/[id]` (حذف)

**Config:** 
- `lib/services/image-service.ts`
- `lib/services/storage-adapter.ts`

**Environment:**
```env
UPLOAD_STORAGE_PATH="/var/www/uploads"
UPLOAD_BASE_URL="https://www.pishrosarmaye.com/uploads"
```

---

### **3. ویدیو‌ها (Videos)**
```
📍 مسیر: D:\pishro_uploads\videos\
└── *.mp4, *.mov, *.avi, *.mkv, *.webm
```
**API Endpoints:**
- POST `/api/admin/upload-video`

**Config:** `lib/upload-config.ts`

---

### **4. اخبار (News)**
```
📍 فایل‌ها: اگر تصویر داشته باشند:
   - featured image → از Images API استفاده می‌کند
   - inline images → ... چک کن!
```
**API Endpoints:**
- GET `/api/admin/news`
- POST `/api/admin/news`
- PATCH `/api/admin/news/[id]`
- DELETE `/api/admin/news/[id]`

**Database Model:** `prisma/schema.prisma` (News article)

---

### **5. دیگر بخش‌های احتمالی:**
| مورد | جنس | API | ذخیره‌سازی |
|------|-----|-----|----------|
| **Courses** | عکس cover + | POST `/api/admin/courses` | ❓ چک کن |
| **Lessons** | ویدیو/عکس | POST `/api/admin/lessons` | ❓ چک کن |
| **Comments** | avatar/images | POST `/api/admin/comments` | ❓ چک کن |
| **User Profiles** | avatar | POST `/api/admin/users` | ❓ چک کن |
| **Quizzes** | images | POST `/api/admin/quizzes` | ❓ چک کن |

---

## 🚨 **مشکل‌ها:**

1. **دو سیستم مختلف:**
   - Books & Videos: `D:\pishro_uploads` (Local)
   - Images: `/var/www/uploads` (storage-adapter)
   
2. **Path inconsistency:**
   - Books PDF: `BOOKS_UPLOAD_PATHS.pdfs.dir`
   - Images: `IMAGES_FOLDER = "images"`

3. **News images:**
   - نمی‌دونم News از کجا تصویر می‌گیره!
   - احتمالا از Images API یا inline upload

---

## ✅ **پیشنهاد:**

باید **یک سیستم centralized** داشتیم:

```typescript
// یک کنفیگ برای همه:
export const STORAGE_PATHS = {
  books: {
    pdfs: "books/pdfs",
    covers: "books/covers",
    audio: "books/audio"
  },
  images: {
    thumbnails: "images/thumbnails",
    headers: "images/headers",
    avatars: "images/avatars",
    // ...
  },
  videos: "videos",
  courses: "courses",
  lessons: "lessons"
}
```

---

## 📝 **برای ادامه کار:**

بیایید:
1. بررسی کنیم News دقیق چطور تصویر می‌گیره
2. بررسی کنیم Courses, Lessons از کجا تصویر می‌گیرند
3. یک سیستم **unified** بسازیم
4. تمام endpoints رو **یکسان** کنیم
