import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { sessionManager } from "@/lib/store";
import { getSessionId, setSessionCookie } from "@/lib/session";
import { parseSourceCode } from "@/lib/parser";
import { MockApiEndpoint } from "@/types/api";

export async function GET() {
    const sessionId = await getSessionId();
    const store = sessionManager.getStore(sessionId);
    const endpoints = store.getAll();
    const response = NextResponse.json(endpoints);
    setSessionCookie(response, sessionId);
    return response;
}

export async function POST(request: NextRequest) {
    try {
        const sessionId = await getSessionId();
        const store = sessionManager.getStore(sessionId);
        const body = await request.json();

        const {
            method = "GET",
            path,
            description = "",
            sourceType = "manual",
            sourceCode = "",
            fields = [],
            responseTemplate = "",
            isArray = false,
            arrayCount = 5,
            statusCode = 200,
            useWrapper = false,
            wrapperFields = [],
            itemsFieldName = "items",
        } = body;

        if (!path) {
            return NextResponse.json(
                { error: "API 경로를 입력해주세요." },
                { status: 400 }
            );
        }

        // 소스 코드가 있으면 파싱
        let parsedFields = fields;
        if (sourceCode && sourceType !== "manual") {
            const result = parseSourceCode(sourceType, sourceCode);
            parsedFields = result.fields;
        }

        const endpoint: MockApiEndpoint = {
            id: uuidv4(),
            method,
            path: path.startsWith("/") ? path : `/${path}`,
            description,
            sourceType,
            sourceCode,
            fields: parsedFields,
            responseTemplate,
            isArray,
            arrayCount,
            statusCode,
            enabled: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            useWrapper,
            wrapperFields,
            itemsFieldName,
        };

        store.create(endpoint);

        const response = NextResponse.json(endpoint, { status: 201 });
        setSessionCookie(response, sessionId);
        return response;
    } catch (error) {
        console.error("Error creating endpoint:", error);
        return NextResponse.json(
            { error: "엔드포인트 생성에 실패했습니다." },
            { status: 500 }
        );
    }
}

/**
 * DELETE: 일괄 삭제
 * body: { ids?: string[] } — ids가 없으면 전체 삭제
 */
export async function DELETE(request: NextRequest) {
    try {
        const sessionId = await getSessionId();
        const store = sessionManager.getStore(sessionId);

        let deletedCount = 0;

        try {
            const body = await request.json();
            if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
                // 선택 삭제
                deletedCount = store.deleteMany(body.ids);
            } else {
                // 전체 삭제
                deletedCount = store.deleteAll();
            }
        } catch {
            // body가 없으면 전체 삭제
            deletedCount = store.deleteAll();
        }

        const response = NextResponse.json({
            success: true,
            deleted: deletedCount,
        });
        setSessionCookie(response, sessionId);
        return response;
    } catch (error) {
        console.error("Error deleting endpoints:", error);
        return NextResponse.json(
            { error: "삭제에 실패했습니다." },
            { status: 500 }
        );
    }
}
