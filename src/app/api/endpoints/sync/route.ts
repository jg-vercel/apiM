import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";
import { MockApiEndpoint } from "@/types/api";

/**
 * POST: 브라우저 sessionStorage → 서버 세션 동기화
 * 서버 재시작(HMR 포함) 시 클라이언트 로컬 데이터로 서버 상태를 복구합니다.
 * ID를 그대로 보존하여 mock 라우팅이 즉시 작동하도록 합니다.
 */
export async function POST(request: NextRequest) {
    try {
        const sessionId = await getSessionId();
        const store = sessionManager.getStore(sessionId);
        const body = await request.json();

        if (!body.endpoints || !Array.isArray(body.endpoints)) {
            return NextResponse.json(
                { error: "올바른 형식이 아닙니다." },
                { status: 400 }
            );
        }

        store.deleteAll();
        for (const ep of body.endpoints as MockApiEndpoint[]) {
            if (ep.id && ep.path) {
                store.create(ep);
            }
        }

        const response = NextResponse.json({
            success: true,
            synced: body.endpoints.length,
        });
        setSessionCookie(response, sessionId);
        return response;
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "동기화에 실패했습니다." },
            { status: 500 }
        );
    }
}
