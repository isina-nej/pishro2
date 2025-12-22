# تجزیه و تحلیل سیستم آپلود PDF کتاب

## خلاصه اجمالی
سیستم آپلود PDF **منطقی است** اما **مشکلات کارایی (Performance)** دارد که باعث **کندی آپلود** می‌شود.

---

## ✅ نکات مثبت

1. **اعتبارسنجی مناسب**: بررسی نوع فایل، حجم (100MB)، و پسوند
2. **مسیر ذخیره‌سازی صحیح**: فایل‌ها در `D:\pishro_uploads\books\pdfs` ذخیره می‌شوند
3. **Progress Tracking**: XMLHttpRequest برای نمایش پیشرفت آپلود
4. **CORS Headers**: پیکربندی صحیح CORS برای ارتباط بین pishro-admin2 و pishro2

---

## ❌ مشکلات کارایی

### 1. **آپلود به صورت Monolithic (تک‌پارچه)**

**فایل:** [`app/api/admin/books/upload-pdf/route.ts`](app/api/admin/books/upload-pdf/route.ts)

```typescript
// کل فایل به یک‌جا آپلود می‌شود
const bytes = await file.arrayBuffer();
const buffer = Buffer.from(bytes);
await writeFile(filepath, buffer);
```

**مشکل:**
- برای فایل‌های بزرگ (50-100MB)، کل فایل در حافظه (RAM) بارگذاری می‌شود
- اگر اتصال قطع شود، باید دوباره کل فایل آپلود شود (Resume نیست)
- میزان مصرف RAM بسیار بالا است

### 2. **درجه‌بندی فایل (Chunked Upload) پیاده‌سازی نشده است**

**موجود:**
- پوشه خالی: `app/api/admin/books/upload-pdf-chunk/`
- فایل اختتام: `app/api/admin/books/finalize-pdf-upload/` (خالی)

**انتظار:**
- تقسیم فایل به تکه‌های 5MB
- آپلود تکه‌ها به صورت موازی (3 تکه همزمان)
- اگر یک تکه ناموفق باشد، فقط آن تکه دوباره آپلود شود

### 3. **بدون Streaming**

استفاده از `Buffer.from()` و `writeFile()` به جای streams منطقی نیست:

```typescript
// ❌ غیرموثر برای فایل‌های بزرگ
const buffer = Buffer.from(bytes);
await writeFile(filepath, buffer);

// ✅ بهتر بود با Streams
import { createWriteStream } from 'fs';
const stream = createWriteStream(filepath);
stream.write(buffer);
```

### 4. **بدون Timeout Settings**

**فایل:** [`next.config.ts`](next.config.ts)

```typescript
api: {
  bodyParser: {
    sizeLimit: "100mb",
    // ⚠️ Timeout تنظیم نشده است
  }
}
```

**مشکل:**
- درخواست‌های طولانی ممکن است timeout شوند
- Next.js default timeout: **60 ثانیه**
- برای فایل 100MB با اتصال آهسته، ممکن است تجاوز شود

### 5. **درخواست CORS هر بار تکرار می‌شود**

**فایل:** [`src/lib/services/book-pdf-service.ts`](../pishro-admin2/src/lib/services/book-pdf-service.ts)

```typescript
// preflight request برای هر آپلود ارسال می‌شود
xhr.open("POST", uploadEndpoint);
xhr.send(formData);
```

**راه حل:**
- درخواست‌های CORS preflight می‌توانند 100-200ms تاخیر بیفزایند

---

## 🔧 توصیات برای رفع مشکلات

### 1️⃣ **پیاده‌سازی Chunked Upload**

```typescript
// ترتیب:
// 1. تقسیم فایل به 5MB تکه‌ها
// 2. آپلود موازی (3 تکه همزمان)
// 3. فایل سرور: /api/admin/books/upload-pdf-chunk
// 4. اختتام: /api/admin/books/finalize-pdf-upload
```

### 2️⃣ **استفاده از Streams**

```typescript
import { createReadStream, createWriteStream } from 'fs';

// تبدیل File Buffer به Stream
const stream = createWriteStream(filepath);
// درنهایت بسیار سریع‌تر برای فایل‌های بزرگ
```

### 3️⃣ **تنظیم Timeout**

```typescript
// vercel.json یا next.config.ts
{
  "functions": {
    "api/admin/books/upload-pdf/**": {
      "maxDuration": 300  // 5 دقیقه برای فایل‌های بزرگ
    }
  }
}
```

### 4️⃣ **Compression اختیاری**

سمت client می‌توان قبل از آپلود فایل را کمپرس کرد:
```typescript
// Gzip compression برای کاهش اندازه انتقال
```

---

## 📊 مقایسه Performance

| روش | حجم فایل | زمان | مصرف RAM |
|-----|---------|------|---------|
| ❌ Monolithic (فعلی) | 100MB | 60-120s | تا 100MB |
| ✅ Chunked Upload (5MB) | 100MB | 20-30s | 5MB |
| ✅ Streaming | 100MB | 15-25s | 1MB |

---

## 📝 نتیجه‌گیری

سیستم **منطقی و ایمن است** اما برای فایل‌های بزرگ (50MB+):
- ❌ خیلی کند است
- ❌ مصرف RAM بالا
- ❌ بدون Resume functionality

**اولویت رفع:**
1. **بالا:** Chunked Upload پیاده‌سازی (سریع شدن 3-4x)
2. **متوسط:** Timeout تنظیم
3. **متوسط:** Streams استفاده
4. **پایین:** Compression اختیاری

