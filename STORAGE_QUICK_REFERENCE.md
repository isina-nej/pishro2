# فهرست سریع ذخیره سازی پروژه Pishro

## 🎯 خلاصه یک‌خطی

**پروژه 10 سیستم ذخیره سازی دارد: 4 سیستم فایل + 6 سیستم URL string در Database**

---

## 📍 سیستم‌های ذخیره سازی فایل (4 سیستم)

### 1️⃣ کتاب‌ها - PDF
```
📂 مسیر: D:\pishro_uploads\books\pdfs\
📤 آپلود: POST /api/admin/books/upload-pdf
💾 DB: DigitalBook.fileUrl
📊 حجم: تا 100MB
🗑️ حذف: ✅ خودکار
```

### 2️⃣ کتاب‌ها - جلد + صوت
```
📂 مسیر: D:\pishro_uploads\books\covers\ + audio\
📤 آپلود: POST /api/admin/books/upload-cover + upload-audio
💾 DB: DigitalBook.cover + audioUrl
📊 حجم: 5MB (cover) + 500MB (audio)
🗑️ حذف: ✅ خودکار
```

### 3️⃣ ویدیوهای
```
📂 مسیر: D:\pishro_uploads\videos\
📤 آپلود: POST /api/admin/upload-video
💾 DB: Video.url
📊 حجم: تا 256MB
🗑️ حذف: ❌ دستی
```

### 4️⃣ تصاویر
```
📂 مسیر: /var/www/uploads/images\{category}\
📤 آپلود: POST /api/admin/images
💾 DB: Image.filePath + fileUrl
📊 حجم: تا 10MB
🗑️ حذف: ❌ دستی
```

---

## 📊 سیستم‌های URL String (6 مدل)

| مدل | فیلد تصویر | سیستم | وضعیت |
|-----|----------|------|-------|
| **NewsArticle** | `coverImage` | Images API | URL string |
| **Course** | `img` | Images API | URL string |
| **Category** | `coverImage`, `heroImage`, `aboutImage` | Images API | URL string |
| **Lesson** | `thumbnail` | Images API | URL string |
| **Comment** | `userAvatar` | External | URL string |
| **User** | `avatarUrl` | External | URL string |

---

## 🔧 متغیرهای محیطی

### Books & Videos
```env
UPLOAD_BASE_DIR="D:\\pishro_uploads"
```

### Images
```env
UPLOAD_STORAGE_PATH="/var/www/uploads"
UPLOAD_BASE_URL="https://example.com/uploads"
```

---

## 🚨 مشکلات اساسی

| # | مشکل | تأثیر | ترجیح |
|---|------|-------|--------|
| 1 | دو سیستم جداگانه (Books vs Images) | مدیریت پیچیده | 🔴 بالا |
| 2 | بدون حذف خودکار تصاویر | فایل‌های یتیم | 🔴 بالا |
| 3 | بدون حذف خودکار ویدیوهای | فایل‌های یتیم | 🔴 بالا |
| 4 | URL strings بجای Foreign Keys | ردگیری سخت | 🟡 متوسط |

---

## ✅ نقاط قوت

- ✅ کتاب‌ها: حذف خودکار کامل
- ✅ کنفیگ متمرکز برای Books/Videos
- ✅ متغیرهای محیطی قابل تغییر
- ✅ API مدیریت ذخیره سازی

---

## 📄 فایل‌های مهم

| فایل | هدف |
|------|-----|
| `lib/upload-config.ts` | کنفیگ Books/Videos |
| `lib/services/storage-adapter.ts` | کنفیگ Images |
| `app/api/admin/books/[id]/route.ts` | حذف خودکار کتاب |
| `app/api/admin/storage/route.ts` | مدیریت ذخیره |
| `COMPLETE_STORAGE_INVENTORY.md` | فهرست کامل |
| `STORAGE_AUDIT_SUMMARY.md` | خلاصه و توصیه‌ها |

---

## 🎓 قدم بعدی

### آماده‌سازی یکپارچگی (1-2 ساعت)
1. اپدیت `storage-adapter.ts` برای استفاده از `UPLOAD_BASE_DIR`
2. اجرای مایگریشن تصاویر
3. تست کامل

### افزودن حذف خودکار (2 ساعت)
1. DELETE endpoint برای Images
2. DELETE endpoint برای Videos  
3. تست حذف

### بهبود Relations (4-6 ساعت)
1. تغییر String → Foreign Key
2. نوشتن Prisma migration
3. اپدیت endpoints

---

## 📞 دستورات سریع

```bash
# دریافت مسیرهای فعلی
curl GET http://localhost:3000/api/admin/storage

# مایگریشن فایل‌ها (dry-run)
curl POST http://localhost:3000/api/admin/storage \
  -H "Content-Type: application/json" \
  -d '{
    "action": "migrate",
    "fromPath": "/var/www/uploads",
    "toPath": "D:\\pishro_uploads",
    "dryRun": true
  }'
```

