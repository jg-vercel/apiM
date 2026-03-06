import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";
import { parseSourceCode } from "@/lib/parser";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sessionId = await getSessionId();
    const store = sessionManager.getStore(sessionId);
    const endpoint = store.get(id);
    if (!endpoint) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const response = NextResponse.json(endpoint);
    setSessionCookie(response, sessionId);
    return response;
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sessionId = await getSessionId();
    const store = sessionManager.getStore(sessionId);
    try {
        const body = await request.json();

        if (body.sourceCode && body.sourceType && body.sourceType !== "manual") {
            const result = parseSourceCode(body.sourceType, body.sourceCode);
            body.fields = result.fields;
        }

        const updated = store.update(id, body);
        if (!updated) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const response = NextResponse.json(updated);
        setSessionCookie(response, sessionId);
        return response;
    } catch (error) {
        console.error("Error updating endpoint:", error);
        return NextResponse.json(
            { error: "업데이트에 실패했습니다." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sessionId = await getSessionId();
    const store = sessionManager.getStore(sessionId);
    const deleted = store.delete(id);
    if (!deleted) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const response = NextResponse.json({ success: true });
    setSessionCookie(response, sessionId);
    return response;
}
