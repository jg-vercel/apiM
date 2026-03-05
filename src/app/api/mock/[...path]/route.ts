import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateResponse } from "@/lib/generator";
import { HttpMethod } from "@/types/api";

async function handleMock(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const mockPath = "/api/mock/" + path.join("/");
    const method = request.method as HttpMethod;

    const endpoint = store.findByPath(method, mockPath);

    if (!endpoint) {
        return NextResponse.json(
            {
                error: "등록된 Mock API를 찾을 수 없습니다.",
                path: mockPath,
                method,
            },
            { status: 404 }
        );
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

    return NextResponse.json(data, {
        status: endpoint.statusCode,
        headers: {
            "X-Mock-Api": "true",
            "X-Mock-Endpoint-Id": endpoint.id,
        },
    });
}

export const GET = handleMock;
export const POST = handleMock;
export const PUT = handleMock;
export const DELETE = handleMock;
export const PATCH = handleMock;
