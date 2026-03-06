import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "mock-api-session-id";

/**
 * 요청에서 세션 ID를 추출합니다.
 * 세션 ID가 없으면 새로 생성합니다.
 */
export async function getSessionId(): Promise<string> {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
        sessionId = uuidv4();
    }

    return sessionId;
}

/**
 * NextRequest에서 세션 ID를 추출합니다 (미들웨어/라우트 핸들러용).
 */
export function getSessionIdFromRequest(request: NextRequest): string {
    return request.cookies.get(SESSION_COOKIE_NAME)?.value || "";
}

/**
 * 응답에 세션 ID 쿠키를 설정합니다.
 */
export function setSessionCookie(response: Response, sessionId: string): Response {
    response.headers.append(
        "Set-Cookie",
        `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`
    );
    return response;
}

export { SESSION_COOKIE_NAME };
