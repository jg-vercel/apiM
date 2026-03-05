import { NextRequest, NextResponse } from "next/server";
import { parseSourceCode } from "@/lib/parser";

export async function POST(request: NextRequest) {
    try {
        const { sourceType, sourceCode } = await request.json();

        if (!sourceCode) {
            return NextResponse.json(
                { error: "소스 코드를 입력해주세요." },
                { status: 400 }
            );
        }

        const result = parseSourceCode(sourceType, sourceCode);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Parse error:", error);
        return NextResponse.json(
            { error: "파싱에 실패했습니다." },
            { status: 500 }
        );
    }
}
