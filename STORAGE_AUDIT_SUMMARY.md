# 🎯 خلاصه و توصیه‌های ذخیره سازی

## 📊 وضعیت فعلی

### ✅ موارد خوب
1. **کتاب‌ها:** سیستم حذف خودکار کامل
   - PDF، جلد و صوت هنگام delete/update حذف می‌شوند
   - مسیرها متمرکز: `D:\pishro_uploads\books\`

2. **کنفیگ متمرکز:** 
   - `lib/upload-config.ts` تمام تنظیمات Books/Videos
   - متغیر محیطی واحد: `UPLOAD_BASE_DIR`

3. **مدیریت ذخیره:**
   - API برای مشاهده مسیرهای فعلی
   - API برای مایگریشن فایل‌ها

### ⚠️ موارد مشکل

#### مشکل 1: دو سیستم ذخیره سازی جداگانه
```
📁 سیستم 1: Books/Videos
   ├─ مسیر: D:\pishro_uploads\
   ├─ متغیر: UPLOAD_BASE_DIR
   └─ مدل‌ها: DigitalBook, Video

📁 سیستم 2: Images
   ├─ مسیر: /var/www/uploads/
   ├─ متغیرها: UPLOAD_STORAGE_PATH, UPLOAD_BASE_URL
   └─ مدل‌های: Image, News, Course, Category, etc.
```

**تأثیر:**
- مدیریت دشوار تر
- مسیرهای متفاوت (Windows vs Linux)
- حل‌های متفاوت برای مسائل

#### مشکل 2: بدون حذف خودکار تصاویر
```
🚨 هنگام delete/update:
   - DigitalBook: ✅ فایل‌ها حذف می‌شوند
   - Image: ❌ فایل‌ها باقی می‌مانند
   - Video: ❌ فایل‌ها باقی می‌مانند
```

**نتیجه:**
- فایل‌های یتیم تجمع می‌یابند
- تلاف فضای دیسک
- مدیریت پیچیده

#### مشکل 3: URL strings بجای Relations
```
🚨 مدل‌های موجود:
   - NewsArticle.coverImage: String (URL)
   - Course.img: String (URL)
   - Category.coverImage: String (URL)
   - Comment.userAvatar: String (URL)
```

**مسائل:**
- بدون foreign key
- نمی‌توان ردگیری کرد که کدام Image استفاده می‌شود
- نمی‌توان cascade delete کرد

#### مشکل 4: فیلدهای تصویری بدون مدیریت مرتبط
```
🚨 نظرات کاربری:
   - Comment.userAvatar (String)
   - نمی‌دانیم Image کجا ذخیره شده

🚨 اعضای تیم:
   - TeamMember.image (String)
   - نمی‌دانیم Image کجا ذخیره شده
```

---

## 🔧 برنامه اصلاح شامل 3 فاز

### فاز 1: یکپارچگی ذخیره سازی (اولویت بالا)
**هدف:** یک سیستم ذخیره سازی واحد برای همه فایل‌ها

**مراحل:**
1. تصمیم: Images را منتقل کنید به `UPLOAD_BASE_DIR` یا Books/Videos را منتقل کنید به `UPLOAD_STORAGE_PATH`
   - توصیه: Images → `UPLOAD_BASE_DIR` (ساده‌تر)

2. اپدیت `lib/services/storage-adapter.ts`:
   ```typescript
   // بدل از:
   const storagePath = process.env.UPLOAD_STORAGE_PATH || "/var/www/uploads";
   
   // به:
   const storagePath = process.env.UPLOAD_BASE_DIR || "D:\\pishro_uploads";
   ```

3. اپدیت `.env`:
   ```env
   # یک متغیر برای همه
   UPLOAD_BASE_DIR="D:\\pishro_uploads"
   # یا (Linux):
   UPLOAD_BASE_DIR="/var/pishro_uploads"
   ```

4. اجرای مایگریشن:
   ```bash
   # Windows PowerShell
   .\scripts\migrate-storage.ps1 -From "/var/www/uploads" -To "D:\pishro_uploads"
   ```

**فوایدی:**
- متغیر محیطی واحد
- مدیریت ساده‌تر
- راه‌حل‌های یکنواخت

---

### فاز 2: حذف خودکار تصاویر (اولویت بالا)
**هدف:** حذف فایل‌های قدیمی هنگام delete/update

**مراحل:**

#### 2.1 Images Model
بروزرسانی `app/api/admin/images/route.ts`:
```typescript
// DELETE endpoint
export async function DELETE(request: Request) {
  const imageId = // extract from request
  
  // پیدا کردن Image
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  
  // حذف فایل
  if (image) {
    await deleteFileFromStorage(image.filePath);
  }
  
  // حذف از DB
  await prisma.image.delete({ where: { id: imageId } });
  
  return Response.json({ success: true });
}
```

#### 2.2 Video Model
بروزرسانی `app/api/admin/videos/route.ts` (اگر موجود نیست، ایجاد کنید):
```typescript
// DELETE endpoint
export async function DELETE(request: Request) {
  const videoId = // extract from request
  
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  
  if (video) {
    // حذف فایل از D:\pishro_uploads\videos\
    await deleteFileFromDisk(video.url);
  }
  
  // حذف از DB (با cascade Lesson‌ها)
  await prisma.video.delete({ where: { id: videoId } });
  
  return Response.json({ success: true });
}
```

#### 2.3 Update Operations
برای تمام مدل‌های دارای تصویر، حذف تصویر قدیم هنگام update:
```typescript
// PATCH endpoint
if (newImageUrl && oldImageUrl && newImageUrl !== oldImageUrl) {
  // حذف تصویر قدیم
  await deleteFileFromStorage(oldImageUrl);
}
```

---

### فاز 3: بهبود Relations (اولویت متوسط)
**هدف:** تغییر String URLs به Foreign Keys برای ردگیری بهتر

**تغییرات Prisma Schema:**

```prisma
// تغییر 1: NewsArticle
model NewsArticle {
  // ...
  coverImage   Image?   @relation(fields: [coverImageId], references: [id], onDelete: SetNull)
  coverImageId String?  @db.ObjectId  // جدید
  // قدیم: coverImage String?  ❌ حذف
}

// تغییر 2: Course
model Course {
  // ...
  img   Image?   @relation(fields: [imgId], references: [id], onDelete: SetNull)
  imgId String?  @db.ObjectId  // جدید
  // قدیم: img String?  ❌ حذف
}

// تغییر 3: Category
model Category {
  // ...
  coverImage   Image?   @relation(fields: [coverImageId], references: [id], onDelete: SetNull)
  coverImageId String?  @db.ObjectId
  
  heroImage   Image?   @relation(fields: [heroImageId], references: [id], onDelete: SetNull)
  heroImageId String?  @db.ObjectId
  
  aboutImage   Image?   @relation(fields: [aboutImageId], references: [id], onDelete: SetNull)
  aboutImageId String?  @db.ObjectId
}

// تغییر 4: Image model
model Image {
  // ...
  newsArticles NewsArticle[] @relation()
  courses      Course[]      @relation()
  categories   Category[]    @relation()
}
```

**دستور Migration:**
```bash
npx prisma migrate dev --name unified_storage_system
npx prisma db push  # اگر از Mongodb استفاده می‌کنید
```

---

## 📈 جدول اولویت‌های اصلاح

| اولویت | عنوان | تأثیر | پیچیدگی | زمان |
|--------|-------|-------|---------|------|
| 🔴 بالا | یکپارچگی ذخیره سازی | بسیار زیاد | متوسط | 2-3 ساعت |
| 🔴 بالا | حذف خودکار Images | بسیار زیاد | کم | 1-2 ساعت |
| 🔴 بالا | حذف خودکار Videos | بسیار زیاد | کم | 1 ساعت |
| 🟡 متوسط | بهبود Relations | زیاد | زیاد | 4-6 ساعت |
| 🟢 پایین | مدیریت Avatar کاربران | متوسط | کم | 1 ساعت |

---

## 🚀 برنامه اجرا

### روز 1: یکپارچگی و حذف خودکار (اولویت بالا)
```
1. اپدیت storage-adapter.ts
2. اضافه کردن DELETE endpoints برای Images و Videos
3. اضافه کردن حذف خودکار در PATCH endpoints
4. تست کامل
⏱️ زمان تخمینی: 4-5 ساعت
```

### روز 2: بهبود Relations (اگر لازم است)
```
1. تغییر Prisma schema
2. نوشتن migration
3. اپدیت تمام endpoints
4. تست کامل
⏱️ زمان تخمینی: 4-6 ساعت
```

---

## ✅ فهرست کنترل

### بخش 1: یکپارچگی ذخیره سازی
- [ ] تصمیم: کدام سیستم استفاده شود (D:\pishro_uploads یا /var/www/uploads)
- [ ] اپدیت storage-adapter.ts
- [ ] اپدیت image-service.ts
- [ ] تست آپلود تصاویر
- [ ] اجرای مایگریشن
- [ ] حذف متغیرهای قدیم از .env

### بخش 2: حذف خودکار Images
- [ ] ایجاد DELETE endpoint برای Images
- [ ] تست حذف
- [ ] اپدیت تمام PATCH endpoints برای حذف قدیم

### بخش 3: حذف خودکار Videos
- [ ] ایجاد DELETE endpoint برای Videos
- [ ] اضافه کردن حذف خودکار به Lesson delete
- [ ] تست حذف

### بخش 4: حذف خودکار تصاویر دیگر
- [ ] Category images
- [ ] News covers
- [ ] Course images
- [ ] TeamMember images
- [ ] MobileScrollerStep images

### بخش 5: بهبود Relations (اختیاری)
- [ ] تغییر Prisma schema
- [ ] نوشتن migration
- [ ] اپدیت endpoints برای استفاده از ImageId
- [ ] تست کامل

---

## 📊 گزارش خلاصه

**تاریخ:** `[تاریخ کنونی]`
**وضعیت:** ✅ Audit کامل شده

### یافته‌های اصلی
1. ✅ 10 سیستم ذخیره سازی شناسایی شده
2. ⚠️ 2 سیستم جداگانه برای Books/Videos و Images
3. ❌ بدون حذف خودکار برای Videos و Images
4. ❌ بدون Foreign Keys برای مدل‌های دارای تصویر

### توصیات اولویت‌دار
1. **فاز 1:** یکپارچگی + حذف خودکار (3-5 ساعت)
2. **فاز 2:** بهبود Relations (4-6 ساعت)
3. **فاز 3:** مدیریت بهتر Assets (پیوسته)

### انتظار می‌رود
- سیستم ذخیره سازی یکپارچه و قابل مدیریت
- هیچ فایل یتیم تجمع نخورد
- مدیریت خودکار و ایمن‌تر

