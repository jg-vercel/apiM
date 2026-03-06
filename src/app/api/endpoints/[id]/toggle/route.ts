import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";

export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const sessionId = await getSessionId();
    const store = sessionManager.getStore(sessionId);
    const updated = store.toggleEnabled(id);
    if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const response = NextResponse.json(updated);
    setSessionCookie(response, sessionId);
    return response;
}
