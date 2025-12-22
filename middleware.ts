import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * لیست دامنه‌های مجاز برای CORS
 * شامل محیط توسعه (localhost) و پروداکشن (vercel)
 */
const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://pishro-admin.vercel.app",
  "https://pishro-0.vercel.app",
  "https://178.239.147.136:3001",
  "http://178.239.147.136:3001",
  "https://admin.pishrosarmaye.com",
  "http://admin.pishrosarmaye.com",
  "https://pishrosarmaye.com",
  "http://pishrosarmaye.com",
  "https://www.pishrosarmaye.com",
  "http://www.pishrosarmaye.com",
  "https://teh-1.s3.poshtiban.com",
];

/**
 * بررسی می‌کند که آیا origin درخواست در لیست مجاز است یا نه
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.some(
    (allowed) => origin === allowed || origin.startsWith(allowed)
  );
}

/**
 * افزودن هدرهای CORS به response
 */
function addCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
  }
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // Handle preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(response, origin);
  }

  // Handle API routes with CORS
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    return addCorsHeaders(response, origin);
  }

  // اگر مسیر دقیقا برابر /profile بود، به /profile/acc ریدایرکت کن
  if (pathname === "/profile") {
    const url = req.nextUrl.clone();
    url.pathname = "/profile/acc";
    const response = NextResponse.redirect(url);
    return addCorsHeaders(response, origin);
  }

  // برای بقیه requestها، CORS headers اضافه کن
  const response = NextResponse.next();
  return addCorsHeaders(response, origin);
}

// مشخص کردن matcher برای اعمال middleware
export const config = {
  matcher: [
    "/profile/:path*",
    "/api/:path*", // تمام API routes
  ],
  // Increase timeout for large file uploads
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

// Configure timeout for upload endpoints
export function withTimeout(handler: any) {
  return async (req: NextRequest, context: any) => {
    const pathname = req.nextUrl.pathname;
    
    // برای API های آپلود، timeout بزرگتر
    if (pathname.includes("/upload")) {
      // این timeout برای development است
      // برای production از vercel.json استفاده می‌شود
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve(new NextResponse("Request Timeout", { status: 408 }));
        }, 5 * 60 * 1000); // 5 دقیقه
        
        Promise.resolve(handler(req, context))
          .then((response) => {
            clearTimeout(timer);
            resolve(response);
          })
          .catch((error) => {
            clearTimeout(timer);
            resolve(new NextResponse("Internal Server Error", { status: 500 }));
          });
      });
    }
    
    return handler(req, context);
  };
};
