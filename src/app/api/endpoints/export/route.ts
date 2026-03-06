import { NextResponse } from "next/server";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";

/**
 * GET: 전체 설정 내보내기 (JSON)
 */
export async function GET() {
    const sessionId = await getSessionId();
    const store = sessionManager.getStore(sessionId);
    const endpoints = store.getAll();

    const exportData = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        endpoints: endpoints.map((ep) => ({
            method: ep.method,
            path: ep.path,
            description: ep.description,
            sourceType: ep.sourceType,
            sourceCode: ep.sourceCode,
            fields: ep.fields,
            responseTemplate: ep.responseTemplate,
            isArray: ep.isArray,
            arrayCount: ep.arrayCount,
            statusCode: ep.statusCode,
            useWrapper: ep.useWrapper,
            wrapperFields: ep.wrapperFields,
            itemsFieldName: ep.itemsFieldName,
        })),
    };

    const response = NextResponse.json(exportData);
    setSessionCookie(response, sessionId);
    return response;
}
