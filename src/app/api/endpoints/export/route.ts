import { NextResponse } from "next/server";
import { store } from "@/lib/store";

/**
 * GET: 전체 설정 내보내기 (JSON)
 */
export async function GET() {
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

    return NextResponse.json(exportData);
}
