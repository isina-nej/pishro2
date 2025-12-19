# 📥 چگونه دانلود فایل‌های کتاب کار می‌کند؟

## 🎯 خلاصه سریع

```
کاربر کلیک → /api/library/{id}/download/{type}
          → Database query
          → Increment downloads
          → Redirect 302
          → /api/uploads/books/{type}/{filename}
          → Read file from disk
          → Return file with Content-Type
          → Browser downloads
```

---

## 📊 جزئیات مرحله‌به‌مرحله

### 1️⃣ کاربر درخواست دانلود می‌کند

```typescript
// در: components/library/BookDetail.tsx
const handleDownload = async (type: "pdf" | "cover" | "audio") => {
  const response = await fetch(`/api/library/${bookId}/download/${type}`);
  // ...
};
```

**درخواست:**
```
GET /api/library/abc123def456/download/pdf
```

---

### 2️⃣ Server درخواست را دریافت می‌کند

**فایل:** `app/api/library/[id]/download/[type]/route.ts`

```typescript
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id, type } = await params;
  
  console.log(`[Download] Request: id=${id}, type=${type}`);
  // → [Download] Request: id=abc123def456, type=pdf
}
```

---

### 3️⃣ پیدا کردن کتاب در Database

```typescript
const book = await prisma.digitalBook.findUnique({
  where: { id },
});

// book = {
//   id: "abc123def456",
//   title: "کتاب نمونه",
//   fileUrl: "/api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf",
//   cover: "/api/uploads/books/covers/cover_1766154416638_qre59opbljo.png",
//   audioUrl: "/api/uploads/books/audio/audio_1766154421546_abc.mp3",
//   downloads: 50,
//   ...
// }

if (!book) {
  return errorResponse("کتاب یافت نشد", ErrorCodes.NOT_FOUND);
}
```

---

### 4️⃣ استخراج URL فایل مناسب

```typescript
let fileUrl: string | null = null;

switch (type) {
  case "pdf":
    fileUrl = book.fileUrl;
    // fileUrl = "/api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf"
    break;
  case "cover":
    fileUrl = book.cover;
    // fileUrl = "/api/uploads/books/covers/cover_1766154416638_qre59opbljo.png"
    break;
  case "audio":
    fileUrl = book.audioUrl;
    // fileUrl = "/api/uploads/books/audio/audio_1766154421546_abc.mp3"
    break;
}

if (!fileUrl) {
  return errorResponse(
    "این فایل برای این کتاب موجود نیست",
    ErrorCodes.NOT_FOUND
  );
}
```

---

### 5️⃣ بروزرسانی تعداد دانلودها

```typescript
await prisma.digitalBook.update({
  where: { id },
  data: { downloads: { increment: 1 } },
});

// downloads: 50 → 51
// ✅ Database بروزرسانی شد

console.log(`[Download] Downloads count incremented for: ${id}`);
```

---

### 6️⃣ ارسال Redirect Response (302)

```typescript
console.log(`[Download] Redirecting to: ${fileUrl}`);
// → [Download] Redirecting to: /api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf

const response = new Response(null, {
  status: 302,  // ← Temporary Redirect
  headers: {
    "Location": fileUrl,  // ← جایی که برسد
  },
});
return response;
```

**Response:**
```
HTTP/1.1 302 Found
Location: /api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf
```

**کاربر (Browser) اتوماتیک دنبال redirect می‌کند:**
```
GET /api/uploads/books/pdfs/book_1766154421546_8rrygyqtas.pdf
```

---

### 7️⃣ دریافت فایل از `/api/uploads`

**فایل:** `app/api/uploads/[...path]/route.ts`

```typescript
export async function GET(req: NextRequest, { params }) {
  const { path } = await params;
  const filePath = path.join("/");
  // filePath = "books/pdfs/book_1766154421546_8rrygyqtas.pdf"
}
```

---

### 8️⃣ تعیین مسیر فیزیکی

```typescript
let uploadBaseDir = process.env.UPLOAD_BASE_DIR || join("D:", "pishro_uploads");
uploadBaseDir = resolve(uploadBaseDir);
// uploadBaseDir = "D:\pishro_uploads"

const fullPath = join(uploadBaseDir, filePath);
// fullPath = "D:\pishro_uploads\books\pdfs\book_1766154421546_8rrygyqtas.pdf"
```

---

### 9️⃣ بررسی امنیتی

```typescript
// Security: prevent directory traversal
if (filePath.includes("..") || filePath.startsWith("/")) {
  return new NextResponse("Forbidden", { status: 403 });
}

// Verify the file is within the uploads directory
if (!fullPath.startsWith(uploadBaseDir)) {
  console.warn(`Security: attempted path traversal: ${fullPath}`);
  return new NextResponse("Not Found", { status: 404 });
}

// Check if file exists
if (!existsSync(fullPath)) {
  console.warn(`File not found: ${fullPath}`);
  return new NextResponse("Not Found", { status: 404 });
}

// ✅ تمام بررسی‌های امنیتی انجام شد
```

---

### 🔟 خواندن فایل از دیسک

```typescript
const fileBuffer = await readFile(fullPath);
// fileBuffer = <Buffer data of PDF file>

console.log(`File read: ${fullPath}, size: ${fileBuffer.length} bytes`);
```

---

### 1️⃣1️⃣ تعیین MIME Type

```typescript
const ext = filePath.split(".").pop()?.toLowerCase();
// ext = "pdf"

let mimeType = "application/octet-stream";

switch (ext) {
  case "pdf":
    mimeType = "application/pdf";
    break;
  case "mp3":
    mimeType = "audio/mpeg";
    break;
  case "png":
  case "jpg":
  case "jpeg":
  case "webp":
  case "gif":
    mimeType = "image/..." // مناسب
    break;
  // ...
}

// mimeType = "application/pdf"
```

---

### 1️⃣2️⃣ ارسال فایل به کاربر

```typescript
return new NextResponse(fileBuffer, {
  headers: {
    "Content-Type": mimeType,
    // "Content-Type": "application/pdf"
    
    "Cache-Control": "public, max-age=31536000, immutable",
    // Browser می‌تواند کش کند برای 1 سال
  },
});
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Length: 354819
Cache-Control: public, max-age=31536000, immutable

[Binary PDF data...]
```

---

### 1️⃣3️⃣ Browser دانلود را شروع می‌کند

```javascript
// Browser خودکار:
// 1. فایل را دریافت می‌کند
// 2. نام فایل را استخراج می‌کند (اگر Content-Disposition باشد)
// 3. فایل را دانلود می‌کند
```

---

## 📈 جریان کامل (Timeline)

```
┌─────────────────────────────────────────────────────────────┐
│ کاربر کلیک دانلود (BookDetail.tsx)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /api/library/abc123/download/pdf                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ [Download Route]                                            │
│ 1. Query Database: SELECT * FROM digitalbook WHERE id=...   │
│ 2. Extract: fileUrl = /api/uploads/books/pdfs/...          │
│ 3. UPDATE: downloads = downloads + 1                        │
│ 4. Return 302 Redirect to fileUrl                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /api/uploads/books/pdfs/book_123456.pdf                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ [Uploads Route]                                             │
│ 1. Construct path: D:\pishro_uploads\books\pdfs\book_...    │
│ 2. Security checks: ✓ in bounds ✓ exists ✓ allowed         │
│ 3. Read file from disk: readFile(fullPath)                 │
│ 4. Determine MIME type: application/pdf                     │
│ 5. Return file with headers                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ HTTP 200 OK                                                 │
│ Content-Type: application/pdf                              │
│ [Binary file data...]                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser دانلود شروع می‌کند                                 │
│ فایل: book_123456.pdf                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 خلاصه مسیرهای استفاده شده

| مرحله | فایل/مسیر | نوع |
|-------|----------|-----|
| 1️⃣ UI Click | `components/library/BookDetail.tsx` | Client |
| 2️⃣ First Request | `GET /api/library/[id]/download/[type]` | Server |
| 3️⃣ Database | MongoDB (localhost:27017/pishro) | Database |
| 4️⃣ Redirect | HTTP 302 Location Header | Server |
| 5️⃣ Second Request | `GET /api/uploads/books/[type]/[filename]` | Server |
| 6️⃣ Disk | `D:\pishro_uploads\books\[type]\[file]` | Filesystem |
| 7️⃣ Response | Binary file + MIME type | Server |
| 8️⃣ Download | Browser download dialog | Client |

---

## 🔒 امنیت

✅ **حفاظت از Directory Traversal:**
```typescript
// ❌ نمی‌توانید به:
GET /api/uploads/../../../sensitive_file
// → Blocked: filePath.includes("..")

// ❌ نمی‌توانید به:
GET /api/uploads///etc/passwd
// → Blocked: filePath.startsWith("/")
```

✅ **محدودیت به UPLOAD_BASE_DIR:**
```typescript
if (!fullPath.startsWith(uploadBaseDir)) {
  // ❌ فایل خارج از uploadBaseDir است
  return new NextResponse("Not Found", { status: 404 });
}
```

✅ **بررسی وجود فایل:**
```typescript
if (!existsSync(fullPath)) {
  // ❌ فایل وجود ندارد
  return new NextResponse("Not Found", { status: 404 });
}
```

---

## 🎯 خلاصه نهایی

| بخش | توضیح |
|-----|-------|
| **درخواست اول** | `/api/library/{id}/download/{type}` |
| **فعل‌آوری‌ها:** | Query DB + Update counter + Redirect |
| **درخواست دوم** | `/api/uploads/books/{type}/{filename}` |
| **فعل‌آوری‌ها:** | Read file from disk + Set MIME type |
| **نتیجه** | فایل دانلود می‌شود |
| **مسیر فیزیکی** | `D:\pishro_uploads\books\{type}\{file}` |

