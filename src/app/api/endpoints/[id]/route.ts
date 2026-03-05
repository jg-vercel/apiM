import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { parseSourceCode } from "@/lib/parser";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const endpoint = store.get(id);
    if (!endpoint) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(endpoint);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // 소스 코드가 변경되었으면 다시 파싱
        if (body.sourceCode && body.sourceType && body.sourceType !== "manual") {
            const result = parseSourceCode(body.sourceType, body.sourceCode);
            body.fields = result.fields;
        }

        const updated = store.update(id, body);
        if (!updated) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json(updated);
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
    const deleted = store.delete(id);
    if (!deleted) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
}
