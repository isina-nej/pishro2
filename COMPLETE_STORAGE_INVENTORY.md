# 📦 پروژه Pishro - فهرست کامل ذخیره سازی فایل‌ها

## خلاصه
این مستند تمام جاهایی را که پروژه Pishro فایل‌ها را ذخیره می‌کند، مستند می‌کند.

---

## 📊 نمای کلی سیستم‌های ذخیره سازی

| سیستم | نوع فایل | مکان ذخیره | مقدار | وضعیت |
|-------|---------|-----------|------|-------|
| **BOOKS & VIDEOS** | PDF, Audio, Video | `D:\pishro_uploads\` | 4 نوع | ✅ متمرکز |
| **IMAGES** | JPG, PNG, WebP, SVG | `/var/www/uploads/` | 10 دسته | ⚠️ جداگانه |
| **NEWS** | درون DB + URL تصویر | MongoDB | موارد نیاز | ⚠️ URL string |
| **COURSES** | درون DB + URL تصویر | MongoDB | موارد نیاز | ⚠️ URL string |
| **DATABASE** | تمام داده‌ها | MongoDB | کاملاً | ✅ متمرکز |

---

## 🎯 سیستم 1: کتاب‌ها و ویدیوهای (BOOKS & VIDEOS)

### 📍 مکان ذخیره
```
D:\pishro_uploads\
├── books\
│   ├── pdfs\           (فایل‌های PDF کتاب‌ها)
│   ├── covers\         (تصویر جلد کتاب)
│   └── audio\          (فایل‌های صوتی)
└── videos\             (فایل‌های ویدیو)
```

### ⚙️ پیکربندی
- **فایل کنفیگ:** `lib/upload-config.ts`
- **متغیر محیطی:** `UPLOAD_BASE_DIR="D:\\pishro_uploads"`
- **مقدار پیش‌فرض:** `D:\pishro_uploads` (اگر env تعریف نشده)

### 📤 اندپوینت‌های آپلود

#### کتاب‌ها - PDF
- **اندپوینت:** `POST /api/admin/books/upload-pdf`
- **فایل:** `app/api/admin/books/upload-pdf/route.ts`
- **مقدار بیشینه:** 100MB
- **نوع MIME:** `application/pdf`
- **نام فایل:** `book_${timestamp}_${random}.pdf`
- **مسیر:** `books/pdfs/`
- **ذخیره در DB:** `DigitalBook.fileUrl` (به صورت URL)

#### کتاب‌ها - جلد
- **اندپوینت:** `POST /api/admin/books/upload-cover`
- **فایل:** `app/api/admin/books/upload-cover/route.ts`
- **مقدار بیشینه:** 5MB
- **انواع:** JPG, PNG, WebP
- **مسیر:** `books/covers/`
- **ذخیره در DB:** `DigitalBook.cover` (به صورت URL)

#### کتاب‌ها - صوت
- **اندپوینت:** `POST /api/admin/books/upload-audio`
- **فایل:** `app/api/admin/books/upload-audio/route.ts`
- **مقدار بیشینه:** 500MB
- **انواع:** MP3, WAV, OGG, WebM, AAC, M4A
- **مسیر:** `books/audio/`
- **ذخیره در DB:** `DigitalBook.audioUrl` (به صورت URL)

#### ویدیوهای
- **اندپوینت:** `POST /api/admin/upload-video`
- **فایل:** `app/api/admin/upload-video/route.ts`
- **مقدار بیشینه:** 256MB
- **انواع:** MP4, MOV, AVI, MKV, WebM
- **مسیر:** `videos/`
- **ذخیره در DB:** `Video.url` (به صورت URL)

### 🗑️ حذف خودکار فایل‌ها

#### هنگام حذف کتاب
- **اندپوینت:** `DELETE /api/admin/books/[id]`
- **فایل:** `app/api/admin/books/[id]/route.ts`
- **عملیات:**
  1. استخراج URL‌های فایل از `DigitalBook`
  2. تبدیل URL به مسیر فایل
  3. حذف PDF، جلد و صوت فیزیکی
  4. حذف رکورد از DB

#### هنگام ویرایش کتاب
- **اندپوینت:** `PATCH /api/admin/books/[id]`
- **فایل:** `app/api/admin/books/[id]/route.ts`
- **عملیات:**
  1. اگر PDF جدید آپلود شد: حذف PDF قدیمی
  2. اگر جلد جدید آپلود شد: حذف جلد قدیمی
  3. اگر صوت جدید آپلود شد: حذف صوت قدیمی
  4. بروزرسانی رکورد DB

### 📋 توابع کمکی
- `ensureUploadDirExists()` - ایجاد خودکار دایرکتوری‌های نقص
- `getFilePathFromUrl(url)` - تبدیل URL به مسیر فایل
- `generateFileUrl(type, filename)` - ایجاد URL از نام فایل
- `deleteFileFromDisk(url)` - حذف فایل فیزیکی

---

## 🖼️ سیستم 2: تصویرها (IMAGES)

### 📍 مکان ذخیره
```
/var/www/uploads/
└── images/
    ├── thumbnail/      (نقوشِ بند)
    ├── header/         (تصویرهای هدر)
    ├── card/           (تصویرهای کارت)
    ├── banner/         (بنرها)
    ├── avatar/         (آواتارها)
    ├── logo/           (لوگوها)
    ├── icon/           (آیکون‌ها)
    ├── gallery/        (تصویرهای گالری)
    ├── product/        (تصویرهای محصول)
    └── other/          (سایر)
```

### ⚙️ پیکربندی
- **فایل کنفیگ:** `lib/services/storage-adapter.ts`
- **فایل سرویس:** `lib/services/image-service.ts`
- **متغیرهای محیطی:**
  - `UPLOAD_STORAGE_PATH="/var/www/uploads"` (مسیر ذخیره سازی)
  - `UPLOAD_BASE_URL="https://example.com/uploads"` (URL پایه)

### 📤 اندپوینت‌های آپلود

#### تصویرها - عمومی
- **اندپوینت:** `POST /api/admin/images`
- **فایل:** `app/api/admin/images/route.ts`
- **مقدار بیشینه:** 10MB
- **انواع:** JPEG, PNG, GIF, WebP, SVG
- **مسیر:** `images/{category.toLowerCase()}/`
- **پارامترها:**
  - `category`: THUMBNAIL, HEADER, CARD, BANNER, AVATAR, LOGO, ICON, GALLERY, PRODUCT, OTHER
- **بازگشت:** `{ id, filePath, fileUrl }`

### 📋 توابع کمکی (storage-adapter.ts)
- `getStorageConfig()` - خواندن کنفیگ از env
- `saveFileToStorage(file, relPath)` - ذخیره فایل
- `deleteFileFromStorage(filePath)` - حذف فایل

---

## 📰 سیستم 3: مقالات خبری (NEWS)

### 📊 مدل Database
```typescript
model NewsArticle {
  id          String    @id @default(auto())
  title       String
  slug        String    @unique
  excerpt     String
  content     String
  coverImage  String?        // ✨ فقط URL string - بدون فایل
  author      String?
  category    String
  tags        String[]
  published   Boolean   @default(false)
  publishedAt DateTime?
  views       Int       @default(0)
  featured    Boolean   @default(false)
  readingTime Int?
  likes       Int       @default(0)
  createdAt   DateTime  @default(now())
}
```

### 📤 اندپوینت‌های ایجاد/ویرایش

#### ایجاد مقاله
- **اندپوینت:** `POST /api/admin/news`
- **فایل:** `app/api/admin/news/route.ts`
- **درخواست:**
  ```json
  {
    "title": "عنوان",
    "content": "محتوا",
    "coverImage": "https://example.com/image.jpg",  // ✨ URL string
    "category": "تکنولوژی",
    "tags": ["تگ1", "تگ2"]
  }
  ```
- **ذخیره:** `coverImage` به صورت URL دقیق در دیتابیس ذخیره می‌شود

#### ویرایش مقاله
- **اندپوینت:** `PATCH /api/admin/news/[id]`
- **فایل:** `app/api/admin/news/[id]/route.ts`
- **عملیات:** نرمالایز URL با `normalizeImageUrl()`
  - استخراج URL اصلی از Next.js optimization URLs
  - ذخیره URL نرمالایز شده

#### حذف مقاله
- **اندپوینت:** `DELETE /api/admin/news/[id]`
- **فایل:** `app/api/admin/news/[id]/route.ts`
- **عملیات:** فقط حذف رکورد DB
- **توضیح:** ⚠️ تصویر حذف نمی‌شود (زیرا URL خارجی است یا توسط Images API مدیریت می‌شود)

### 📋 فرآیند ذخیره سازی
1. کاربر تصویر را از طریق UI آپلود می‌کند
2. تصویر در `Images API` ذخیره می‌شود
3. API URL تصویر را برمی‌گرداند
4. URL در `NewsArticle.coverImage` (String field) ذخیره می‌شود
5. هیچ فایل مستقل برای News ذخیره نمی‌شود

---

## 📚 سیستم 4: دوره‌ها (COURSES)

### 📊 مدل Database
```typescript
model Course {
  id              String   @id @default(auto())
  subject         String
  price           Int
  img             String?        // ✨ فقط URL string - بدون فایل
  rating          Float?
  description     String?
  discountPercent Int?
  time            String?
  students        Int?
  videosCount     Int?
  introVideoUrl   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @default(now())
  // ... سایر فیلدها
}
```

### 📤 اندپوینت‌های ایجاد/ویرایش

#### ایجاد دوره
- **اندپوینت:** `POST /api/admin/courses`
- **فایل:** `app/api/admin/courses/route.ts`
- **درخواست:**
  ```json
  {
    "subject": "نام دوره",
    "price": 50000,
    "img": "https://example.com/course.jpg",  // ✨ URL string
    "description": "توضیح"
  }
  ```

#### ویرایش دوره
- **اندپوینت:** `PATCH /api/admin/courses/[id]`
- **فایل:** `app/api/admin/courses/[id]/route.ts`
- **عملیات:** نرمالایز URL با `normalizeImageUrl()`

#### حذف دوره
- **اندپوینت:** `DELETE /api/admin/courses/[id]`
- **فایل:** `app/api/admin/courses/[id]/route.ts`
- **عملیات:** فقط حذف رکورد DB و دروس و فایل‌های مرتبط

### 📋 فرآیند ذخیره سازی
1. کاربر تصویر را از طریق UI آپلود می‌کند
2. تصویر در `Images API` ذخیره می‌شود
3. API URL تصویر را برمی‌گرداند
4. URL در `Course.img` (String field) ذخیره می‌شود
5. هیچ فایل مستقل برای Course ذخیره نمی‌شود

---

## 📖 سیستم 5: درس‌ها (LESSONS)

### 📊 مدل Database
```typescript
model Lesson {
  id          String  @id @default(auto())
  course      Course  @relation("CourseLessons")
  courseId    String
  title       String
  description String?
  video       Video?  @relation("VideoLessons")  // ✨ تصویر ویدیو
  videoId     String?
  videoUrl    String?     // مسیر قدیمی برای سازگاری
  thumbnail   String?     // تصویر کوچک (اختیاری)
  duration    String?
  order       Int     @default(0)
  published   Boolean @default(true)
  views       Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Video {
  id        String   @id @default(auto())
  url       String   // ✨ URL ویدیو
  title     String?
  duration  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lessons   Lesson[] @relation("VideoLessons")
}
```

### 📤 اندپوینت‌های ایجاد/ویرایش

#### ایجاد درس
- **اندپوینت:** `POST /api/admin/courses/[courseId]/lessons`
- **درخواست:**
  ```json
  {
    "title": "عنوان درس",
    "description": "توضیح",
    "videoId": "ID ویدیو موجود",
    "thumbnail": "https://example.com/thumb.jpg"  // اختیاری
  }
  ```

#### ویدیو‌ها
- **اندپوینت:** `POST /api/admin/upload-video`
- **ذخیره:** `Video.url` (URL string)
- **مسیر فیزیکی:** `D:\pishro_uploads\videos\`

### 📋 فرآیند ذخیره سازی
1. ویدیو از طریق `upload-video` آپلود می‌شود
2. ویدیو در `D:\pishro_uploads\videos\` ذخیره می‌شود
3. URL در `Video.url` ذخیره می‌شود
4. Lesson با reference به Video ایجاد می‌شود
5. Thumbnail (اگر موجود) به صورت URL ذخیره می‌شود

---

## 📝 سیستم 6: نظرات (COMMENTS)

### 📊 مدل Database
```typescript
model Comment {
  id String @id @default(auto())
  user   User?   @relation("UserComments")
  userId String?
  userName    String?
  userAvatar  String?  // ✨ فقط URL string
  userRole    UserRoleType?
  userCompany String?
  text   String
  rating Int?
  // ... سایر فیلدها
}
```

### 📋 توضیح
- `userAvatar` به صورت **URL string** ذخیره می‌شود
- هیچ فایل مستقل برای نظرات ذخیره نمی‌شود
- اگر کاربر avatar دارد، از `User.avatarUrl` استفاده می‌شود

---

## 🎯 سیستم 7: دسته‌بندی‌ها (CATEGORIES)

### 📊 مدل Database
```typescript
model Category {
  id          String  @id @default(auto())
  title       String
  slug        String  @unique
  description String?
  icon        String?            // ✨ URL icon
  coverImage  String?            // ✨ URL تصویر جلد
  heroImage   String?            // ✨ URL تصویر قهرمان
  aboutImage  String?            // ✨ URL تصویر بخش درباره
  color       String?
  // ... سایر فیلدها
}
```

### 📤 اندپوینت‌های ایجاد/ویرایش

#### ایجاد دسته
- **اندپوینت:** `POST /api/admin/categories`
- **فایل:** `app/api/admin/categories/route.ts`
- **درخواست:**
  ```json
  {
    "title": "عنوان دسته",
    "slug": "slug",
    "icon": "https://example.com/icon.svg",
    "coverImage": "https://example.com/cover.jpg",
    "heroImage": "https://example.com/hero.jpg",
    "aboutImage": "https://example.com/about.jpg"
  }
  ```

#### ویرایش دسته
- **اندپوینت:** `PATCH /api/admin/categories/[id]`
- **فایل:** `app/api/admin/categories/[id]/route.ts`
- **عملیات:** نرمالایز تمام URL‌های تصویری

### 📋 فرآیند ذخیره سازی
- تمام تصاویر به صورت **URL string** ذخیره می‌شوند
- توسط Images API آپلود می‌شوند
- هیچ فایل مستقل برای Category ذخیره نمی‌شود

---

## 📊 سیستم 8: کاربران (USERS)

### 📊 مدل Database
```typescript
model User {
  id            String   @id @default(auto())
  phone         String   @unique
  firstName     String?
  lastName      String?
  email         String?
  avatarUrl     String?  // ✨ فقط URL string
  // ... سایر فیلدها
}
```

### 📋 توضیح
- `avatarUrl` به صورت **URL string** ذخیره می‌شود
- معمولاً توسط Users API آپلود می‌شود
- هیچ فایل مستقل برای User ذخیره نمی‌شود

---

## 🎓 سیستم 9: تصاویر (IMAGE MODEL)

### 📊 مدل Database
```typescript
model Image {
  id String @id @default(auto())
  title       String?
  description String?
  alt         String?
  uploadedBy   User   @relation("UserImages")
  uploadedById String
  fileName String      // نام فایل اصلی
  filePath String      // مسیر نسبی (/images/avatar/...)
  fileSize Int
  mimeType String      // image/jpeg, image/png, ...
  width    Int?
  height   Int?
  category ImageCategory @default(OTHER)
  tags String[] @default([])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 📤 اندپوینت‌های آپلود

#### آپلود تصویر
- **اندپوینت:** `POST /api/admin/images`
- **فایل:** `app/api/admin/images/route.ts`
- **مقدار بیشینه:** 10MB
- **انواع:** JPG, PNG, GIF, WebP, SVG
- **پارامترها:**
  - `category`: دسته تصویر
  - `title`, `description`, `alt`: فیلدهای اختیاری
- **بازگشت:**
  ```json
  {
    "id": "image-id",
    "filePath": "/images/avatar/image_timestamp.jpg",
    "fileUrl": "https://example.com/uploads/images/avatar/image_timestamp.jpg"
  }
  ```

### 📋 فرآیند ذخیره سازی
1. فایل در `/var/www/uploads/images/{category}/` ذخیره می‌شود
2. رکورد `Image` در MongoDB ایجاد می‌شود
3. `filePath` و `fileUrl` برگردانده می‌شوند
4. فیلدهای مدل‌های دیگر (News, Course, etc.) به URL اشاره می‌کنند

---

## 📦 سیستم 10: فایل‌های متفرقه

### Mobile Scroller Steps
- **فایل:** `app/api/admin/mobile-scroller-steps/route.ts`
- **تصاویر:**
  - `imageUrl`: URL string
  - `coverImageUrl`: URL string
- **ذخیره:** URL strings - بدون فایل مستقل

### Team Members
- **فایل:** `app/api/admin/team-members/route.ts`
- **تصاویر:**
  - `image`: URL string
- **ذخیره:** URL strings - بدون فایل مستقل

### Tags
- **فیلدهای تصویری:** هیچ

### FAQs
- **فیلدهای تصویری:** هیچ

### Quizzes
- **فیلدهای تصویری:** هیچ

### Investment Plans / Models
- **فیلدهای تصویری:** هیچ

---

## 🔍 جدول خلاصه ذخیره سازی

| مدل | نوع ذخیره | مکان | حذف خودکار | توضیح |
|-----|----------|------|-----------|-------|
| **DigitalBook** | فایل (PDF/Audio) | `D:\pishro_uploads\books\` | ✅ | حذف خودکار هنگام delete/update |
| **Video** | فایل | `D:\pishro_uploads\videos\` | ❌ | فقط URL delete می‌شود |
| **Image** | فایل | `/var/www/uploads/images\` | ❌ | مدیریت الگو Images API |
| **NewsArticle** | URL string | MongoDB | ❌ | تصویر توسط Images API |
| **Course** | URL string | MongoDB | ❌ | تصویر توسط Images API |
| **Lesson** | URL string | MongoDB | ❌ | تصویر توسط Video یا Images API |
| **Comment** | URL string | MongoDB | ❌ | Avatar URL خارجی |
| **Category** | URL string | MongoDB | ❌ | تصاویر توسط Images API |
| **User** | URL string | MongoDB | ❌ | Avatar URL خارجی |
| **MobileScrollerStep** | URL string | MongoDB | ❌ | تصاویر توسط Images API |
| **TeamMember** | URL string | MongoDB | ❌ | تصویر توسط Images API |

---

## ⚠️ مشکلات و توصیه‌ها

### 🔴 مشکل 1: سیستم‌های ذخیره سازی جداگانه
- **وضعیت:** دو سیستم متفاوت برای Books/Videos و Images
- **مشکل:** 
  - Books/Videos در `D:\pishro_uploads` (Windows path)
  - Images در `/var/www/uploads` (Linux path)
  - متغیرهای محیطی مختلف
- **توصیه:** متحد کردن هر دو سیستم به یک سیستم واحد

### 🟡 مشکل 2: بدون حذف خودکار فایل‌های تصویری
- **وضعیت:** Video و Image مدل‌ها حذف خودکار ندارند
- **مشکل:** هنگام delete یا update، فایل‌های قدیمی در دیسک باقی می‌مانند
- **توصیه:** افزودن حذف خودکار برای Images و Videos

### 🟡 مشکل 3: URL strings بجای مدل‌های واقعی
- **وضعیت:** News, Course, Category و... از URL strings استفاده می‌کنند
- **مشکل:** 
  - فیلدهای URL مرتبط نیستند (no foreign key)
  - اگر Image حذف شود، ارجاع شکسته می‌شود
  - دشوار برای مدیریت تغییرات URL
- **توصیه:** تغییر به foreign keys برای Image model

### 🟢 نقاط قوت
- ✅ PDF/Audio/Video books: حذف خودکار کامل
- ✅ کنفیگ متمرکز برای Books/Videos
- ✅ متغیرهای محیطی قابل تغییر
- ✅ دایرکتوری‌های خودکار

---

## 📋 API مدیریت ذخیره سازی

### دریافت مسیرهای فعلی
```
GET /api/admin/storage
```

**پاسخ:**
```json
{
  "books": {
    "pdfs": "/D:/pishro_uploads/books/pdfs",
    "covers": "/D:/pishro_uploads/books/covers",
    "audio": "/D:/pishro_uploads/books/audio"
  },
  "videos": "/D:/pishro_uploads/videos",
  "images": "/var/www/uploads/images",
  "environment": {
    "UPLOAD_BASE_DIR": "D:\\pishro_uploads",
    "UPLOAD_STORAGE_PATH": "/var/www/uploads",
    "UPLOAD_BASE_URL": "https://example.com/uploads"
  }
}
```

### مایگریشن فایل‌ها
```
POST /api/admin/storage
```

**درخواست:**
```json
{
  "action": "migrate",
  "fromPath": "D:\\pishro_uploads",
  "toPath": "E:\\new_uploads",
  "dryRun": true
}
```

---

## 🚀 توصیه‌های بهتر سازی

### مرحله 1: یکپارچگی ذخیره سازی
```bash
# تغییر UPLOAD_BASE_DIR در .env
UPLOAD_BASE_DIR="E:\\pishro_uploads"  # مسیر جدید

# اجرای مایگریشن
POST /api/admin/storage
{
  "action": "migrate",
  "fromPath": "D:\\pishro_uploads",
  "toPath": "E:\\pishro_uploads"
}
```

### مرحله 2: حذف خودکار تصاویر
- اضافه کردن حذف خودکار برای `Images` model
- اضافه کردن حذف خودکار برای `Video` model

### مرحله 3: بهبود ارجاعات
- تغییر `coverImage` (String) به `coverImageId` (Foreign Key)
- اضافه کردن `relations` برای ردگیری بهتر

---

## 📞 مرجع سریع

| عملیات | فایل | کلید |
|--------|------|-----|
| کنفیگ Books/Videos | `lib/upload-config.ts` | `UPLOAD_BASE_DIR` |
| کنفیگ Images | `lib/services/storage-adapter.ts` | `UPLOAD_STORAGE_PATH`, `UPLOAD_BASE_URL` |
| آپلود PDF | `app/api/admin/books/upload-pdf/route.ts` | `POST` |
| آپلود جلد | `app/api/admin/books/upload-cover/route.ts` | `POST` |
| آپلود صوت | `app/api/admin/books/upload-audio/route.ts` | `POST` |
| آپلود ویدیو | `app/api/admin/upload-video/route.ts` | `POST` |
| آپلود تصویر | `app/api/admin/images/route.ts` | `POST` |
| حذف کتاب | `app/api/admin/books/[id]/route.ts` | `DELETE` |
| مدیریت ذخیره | `app/api/admin/storage/route.ts` | `GET/POST` |

