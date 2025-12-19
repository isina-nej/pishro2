# 🔧 اصلاحات انجام شده برای خطای DATABASE_ERROR

## مشکل
```
POST http://localhost:3000/api/admin/books 500 (Internal Server Error)
{status: 'error', message: 'Error creating book', code: 'DATABASE_ERROR'}
```

## دلایل مشکل

### 1. ❌ URL Upload غیرصحیح
**مسئله:** 
```env
NEXT_PUBLIC_FILE_UPLOAD_URL="http://localhost:3001"  # admin port
```

**حل:**
```env
NEXT_PUBLIC_FILE_UPLOAD_URL="http://localhost:3000"  # main app port
```

**فایل:** `pishro-admin2/.env`

---

### 2. ❌ API Download URLs غیر موجود
**مسئله:** `upload-config.ts` داشت:
```typescript
pdfs: { url: "/api/downloads/books/pdfs" },  // ❌ Doesn't exist
covers: { url: "/api/downloads/books/covers" },  // ❌ Doesn't exist
audio: { url: "/api/downloads/books/audio" },  // ❌ Doesn't exist
videos: { url: "/api/downloads/videos" },  // ❌ Doesn't exist
```

**حل:** تغییر به درست endpoint:
```typescript
pdfs: { url: "/api/uploads/books/pdfs" },  // ✅ Correct
covers: { url: "/api/uploads/books/covers" },  // ✅ Correct
audio: { url: "/api/uploads/books/audio" },  // ✅ Correct
videos: { url: "/api/uploads/videos" },  // ✅ Correct
```

**فایل:** `pishro2/lib/upload-config.ts`

---

### 3. ❌ API Uploads Endpoint غیر صحیح
**مسئله:** `/api/uploads/[...path]/route.ts` داشت:
```typescript
const sharedUploadsDir = join(
  process.cwd(),
  "..",
  "pishro-admin2",
  "public",
  "uploads"  // ❌ غلط مسیر
);
```

**حل:** استفاده از `UPLOAD_BASE_DIR`:
```typescript
let uploadBaseDir = process.env.UPLOAD_BASE_DIR || join("D:", "pishro_uploads");
uploadBaseDir = resolve(uploadBaseDir);  // ✅ درست
```

**فایل:** `pishro2/app/api/uploads/[...path]/route.ts`

---

### 4. ❌ Invalid tagIds
**مسئله:** `tagIds` ممکن است invalid ObjectIds باشند و Database error ایجاد کنند.

**حل:** Validation قبل از create:
```typescript
// MongoDB ObjectId is a 24-character hex string
const validTagIds = tagIds.filter((id) => {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
});
```

**فایل:** `pishro2/app/api/admin/books/route.ts`

---

## 📝 خلاصه تغییرات

| فایل | تغییر | وضعیت |
|------|-------|--------|
| `pishro-admin2/.env` | Fix UPLOAD URL port (3001 → 3000) | ✅ |
| `pishro2/lib/upload-config.ts` | Fix API URLs (downloads → uploads) | ✅ |
| `pishro2/app/api/uploads/[...path]/route.ts` | Use UPLOAD_BASE_DIR | ✅ |
| `pishro2/app/api/admin/books/route.ts` | Validate tagIds + Better logging | ✅ |

---

## 🧪 تست کردن

### 1. ابتدا MongoDB را شروع کنید
```bash
# Windows - به صورت service
mongod

# یا Docker
docker run -d -p 27017:27017 mongo
```

### 2. پروژه‌ها را شروع کنید
```bash
# Terminal 1: pishro2 (main app)
cd d:\project\pishro\pishro2
npm run dev

# Terminal 2: pishro-admin2 (admin panel)
cd d:\project\pishro\pishro-admin2
npm run dev
```

### 3. بروید به admin panel
```
http://localhost:3001/books
```

### 4. یک کتاب جدید اضافه کنید
- Title: Test Book
- Slug: test-book
- Author: Test Author
- Description: Test description
- Category: Any category
- Upload PDF, Cover, Audio
- Submit

### 5. بررسی logs
```bash
# در Terminal pishro2 ببینید:
[Server logs showing successful book creation]
```

---

## 🐛 اگر مشکل هنوز ادامه دارد

### Check 1: MongoDB Connection
```bash
# بررسی connection
mongosh mongodb://localhost:27017/pishro
> show collections
```

### Check 2: Logs
```bash
# بررسی دقیق errors
npm run dev  # اجازه دهید logs تا انجام برسند
```

### Check 3: Network
```bash
# بررسی port ها
netstat -ano | findstr 3000  # pishro2
netstat -ano | findstr 3001  # pishro-admin2
```

---

## 🎉 اگر موفق شد

✅ فایل‌های PDF/Cover/Audio آپلود می‌شوند  
✅ کتاب در Database ذخیره می‌شود  
✅ URLs صحیح ذخیره می‌شوند  
✅ فایل‌ها از `/api/uploads` قابل دسترسی هستند  

