import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isLocalhostOrigin(origin: string): boolean {
    return (
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("https://localhost") ||
        origin.startsWith("https://127.0.0.1")
    );
}

function setCorsHeaders(response: NextResponse, origin: string): void {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const origin = request.headers.get("origin");
    const isLocalhost = origin !== null && isLocalhostOrigin(origin);

    // Preflight OPTIONS 요청: 바로 204 반환
    if (request.method === "OPTIONS" && isLocalhost) {
        const response = new NextResponse(null, { status: 204 });
        setCorsHeaders(response, origin!);
        return response;
    }

    let response: NextResponse;

    // 내부 라우트는 그대로 통과
    if (
        pathname === "/" ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/endpoints") ||
        pathname.startsWith("/api/mock") ||
        pathname.startsWith("/manual") ||
        pathname.match(/\.\w+$/) // 정적 파일 (.ico, .png, .css, .js 등)
    ) {
        response = NextResponse.next();
    } else {
        // 나머지 모든 경로는 Mock 핸들러로 리라이트 (경로는 헤더로 전달)
        const url = request.nextUrl.clone();
        url.pathname = "/api/mock";

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-mock-path", pathname);

        response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    if (isLocalhost) {
        setCorsHeaders(response, origin!);
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
