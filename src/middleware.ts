import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 내부 라우트는 그대로 통과
    if (
        pathname === "/" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/endpoints") ||
        pathname.startsWith("/api/_mock") ||
        pathname.startsWith("/manual") ||
        pathname.match(/\.\w+$/) // 정적 파일 (.ico, .png, .css, .js 등)
    ) {
        return NextResponse.next();
    }

    // 나머지 모든 경로는 Mock 핸들러로 리라이트
    const url = request.nextUrl.clone();
    url.pathname = "/api/_mock";
    url.searchParams.set("_mockPath", pathname);
    return NextResponse.rewrite(url);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
