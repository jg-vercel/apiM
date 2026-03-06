import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";
import { generateResponse } from "@/lib/generator";

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

    const data = generateResponse(
        endpoint.fields,
        endpoint.isArray,
        endpoint.arrayCount,
        endpoint.responseTemplate,
        endpoint.useWrapper,
        endpoint.wrapperFields,
        endpoint.itemsFieldName
    );

    const response = NextResponse.json(data, { status: endpoint.statusCode });
    setSessionCookie(response, sessionId);
    return response;
}
