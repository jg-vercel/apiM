import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { store } from "@/lib/store";
import { parseSourceCode } from "@/lib/parser";
import { MockApiEndpoint } from "@/types/api";

export async function GET() {
    const endpoints = store.getAll();
    return NextResponse.json(endpoints);
}

export async function POST(request: NextRequest) {
    try {
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

        return NextResponse.json(endpoint, { status: 201 });
    } catch (error) {
        console.error("Error creating endpoint:", error);
        return NextResponse.json(
            { error: "엔드포인트 생성에 실패했습니다." },
            { status: 500 }
        );
    }
}
