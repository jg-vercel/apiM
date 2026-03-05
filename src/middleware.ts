import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 내부 라우트는 그대로 통과
    if (
        pathname === "/" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/endpoints") ||
        pathname.startsWith("/api/mock") ||
        pathname.startsWith("/manual") ||
        pathname.match(/\.\w+$/) // 정적 파일 (.ico, .png, .css, .js 등)
    ) {
        return NextResponse.next();
    }

    // 나머지 모든 경로는 Mock 핸들러로 리라이트 (경로는 헤더로 전달)
    const url = request.nextUrl.clone();
    url.pathname = "/api/mock";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-mock-path", pathname);

    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
