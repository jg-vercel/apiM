import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { generateResponse } from "@/lib/generator";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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

    return NextResponse.json(data, { status: endpoint.statusCode });
}
