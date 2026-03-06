import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";
import { MockApiEndpoint } from "@/types/api";

/**
 * POST: 설정 가져오기 (JSON 데이터로 엔드포인트 일괄 등록)
 */
export async function POST(request: NextRequest) {
    try {
        const sessionId = await getSessionId();
        const store = sessionManager.getStore(sessionId);
        const body = await request.json();

        if (!body.endpoints || !Array.isArray(body.endpoints)) {
            return NextResponse.json(
                { error: "올바른 형식이 아닙니다. 'endpoints' 배열이 필요합니다." },
                { status: 400 }
            );
        }

        const created: MockApiEndpoint[] = [];
        const errors: string[] = [];

        for (const epData of body.endpoints) {
            try {
                if (!epData.path) {
                    errors.push(`경로가 없는 엔드포인트가 있습니다.`);
                    continue;
                }

                const endpoint: MockApiEndpoint = {
                    id: uuidv4(),
                    method: epData.method || "GET",
                    path: epData.path.startsWith("/") ? epData.path : `/${epData.path}`,
                    description: epData.description || "",
                    sourceType: epData.sourceType || "manual",
                    sourceCode: epData.sourceCode || "",
                    fields: epData.fields || [],
                    responseTemplate: epData.responseTemplate || "",
                    isArray: epData.isArray ?? false,
                    arrayCount: epData.arrayCount || 5,
                    statusCode: epData.statusCode || 200,
                    enabled: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    useWrapper: epData.useWrapper ?? false,
                    wrapperFields: epData.wrapperFields || [],
                    itemsFieldName: epData.itemsFieldName || "items",
                };

                store.create(endpoint);
                created.push(endpoint);
            } catch {
                errors.push(`${epData.path}: 등록 실패`);
            }
        }

        const response = NextResponse.json({
            success: true,
            created: created.length,
            errors,
            endpoints: created,
        });
        setSessionCookie(response, sessionId);
        return response;
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json(
            { error: "가져오기에 실패했습니다. JSON 형식을 확인해주세요." },
            { status: 500 }
        );
    }
}
