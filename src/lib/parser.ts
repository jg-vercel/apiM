import { FieldDefinition, FieldType, FieldRule, WrapperField } from "@/types/api";

/**
 * 파싱 결과 (래퍼 + 아이템 구조 감지 포함)
 */
export interface ParseResult {
    fields: FieldDefinition[];
    // 래퍼 응답 감지 시 추가 정보
    hasWrapper: boolean;
    wrapperFields: WrapperField[];
    itemsFieldName: string;
    itemFields: FieldDefinition[];
}

/**
 * TypeScript Type 코드를 파싱하여 FieldDefinition 배열로 변환
 * 여러 interface/type을 지원하고, 타입 참조를 해석합니다.
 */
export function parseTypeScript(code: string): ParseResult {
    // 모든 interface/type 추출
    const interfaces = extractAllInterfaces(code);

    if (interfaces.size === 0) {
        return { fields: [], hasWrapper: false, wrapperFields: [], itemsFieldName: "items", itemFields: [] };
    }

    // 래퍼 패턴 감지 (Response가 items 배열 + 페이지 메타데이터를 포함하는 경우)
    const wrapperInfo = detectWrapperPattern(interfaces);

    if (wrapperInfo) {
        return wrapperInfo;
    }

    // 래퍼가 없는 경우: 첫 번째 interface의 필드를 반환
    const firstInterface = Array.from(interfaces.values())[0];
    const fields = resolveFields(firstInterface, interfaces);

    return { fields, hasWrapper: false, wrapperFields: [], itemsFieldName: "items", itemFields: [] };
}

/**
 * 코드에서 모든 interface/type을 추출하여 Map에 저장
 */
function extractAllInterfaces(code: string): Map<string, string> {
    const interfaces = new Map<string, string>();

    // 전체 코드에서 중첩 중괄호를 처리하여 interface 추출
    const interfaceRegex = /(?:interface|type)\s+(\w+)\s*(?:=\s*)?\{/g;
    let match;

    while ((match = interfaceRegex.exec(code)) !== null) {
        const name = match[1];
        const startIdx = match.index + match[0].length;
        let depth = 1;
        let endIdx = startIdx;

        for (let i = startIdx; i < code.length && depth > 0; i++) {
            if (code[i] === "{") depth++;
            if (code[i] === "}") depth--;
            endIdx = i;
        }

        const body = code.substring(startIdx, endIdx);
        interfaces.set(name, body);
    }

    return interfaces;
}

/**
 * 래퍼 패턴 감지: items 배열 + 페이지 메타데이터(page, total, rows 등)
 */
function detectWrapperPattern(interfaces: Map<string, string>): ParseResult | null {
    for (const [, body] of interfaces) {
        const lines = body.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//"));
        const fieldDefs: Array<{ name: string; tsType: string; comment: string }> = [];

        for (const line of lines) {
            // name: type; // comment 형태
            const m = line.match(/^(\w+)\??\s*:\s*(.+?)\s*;?\s*(?:\/\/\s*(.*))?$/);
            if (!m) continue;
            fieldDefs.push({ name: m[1], tsType: m[2].trim(), comment: m[3]?.trim() || "" });
        }

        // items 배열 필드 탐지
        const arrayFields = fieldDefs.filter((f) => {
            const lower = f.tsType.toLowerCase();
            return lower.endsWith("[]") || lower.startsWith("array<");
        });

        // 페이지 메타데이터 필드 탐지
        const paginationNames = new Set(["page", "last", "rows", "total", "totalcount", "totalpage", "pagesize", "currentpage", "lastpage", "totalpages", "size", "limit", "offset"]);
        const paginationFields = fieldDefs.filter((f) =>
            paginationNames.has(f.name.toLowerCase())
        );

        // items 배열이 있고, 페이지네이션 필드가 2개 이상이면 래퍼로 인식
        if (arrayFields.length >= 1 && paginationFields.length >= 2) {
            const itemsField = arrayFields[0];
            const itemsFieldName = itemsField.name;

            // 배열 요소 타입명 추출
            let itemTypeName = "";
            const tsType = itemsField.tsType;
            if (tsType.endsWith("[]")) {
                itemTypeName = tsType.slice(0, -2).trim();
            } else {
                const arrMatch = tsType.match(/Array<\s*(\w+)\s*>/);
                if (arrMatch) itemTypeName = arrMatch[1];
            }

            // 아이템 타입의 필드를 해석
            let itemFields: FieldDefinition[] = [];
            if (itemTypeName && interfaces.has(itemTypeName)) {
                itemFields = resolveFields(interfaces.get(itemTypeName)!, interfaces);
            }

            // 래퍼 필드 생성
            const wrapperFields: WrapperField[] = [];
            for (const f of fieldDefs) {
                if (f.name === itemsFieldName) {
                    wrapperFields.push({ name: f.name, type: "itemsArray" });
                } else if (f.name.toLowerCase() === "page") {
                    wrapperFields.push({ name: f.name, type: "page", value: 1 });
                } else if (f.name.toLowerCase() === "total" || f.name.toLowerCase() === "totalcount") {
                    wrapperFields.push({ name: f.name, type: "total" });
                } else if (f.name.toLowerCase() === "rows" || f.name.toLowerCase() === "pagesize" || f.name.toLowerCase() === "size" || f.name.toLowerCase() === "limit") {
                    wrapperFields.push({ name: f.name, type: "rows" });
                } else if (f.name.toLowerCase() === "last" || f.name.toLowerCase() === "lastpage" || f.name.toLowerCase() === "totalpages") {
                    wrapperFields.push({ name: f.name, type: "last" });
                } else {
                    // 기타 필드는 static
                    const fieldType = mapTsType(f.tsType);
                    wrapperFields.push({ name: f.name, type: "static", value: inferStaticValue(f.name, fieldType) });
                }
            }

            return {
                fields: itemFields,
                hasWrapper: true,
                wrapperFields,
                itemsFieldName,
                itemFields,
            };
        }
    }

    return null;
}

/**
 * 정적값 추론
 */
function inferStaticValue(name: string, type: FieldType): string | number {
    if (type === "number" || type === "integer") return 0;
    if (type === "boolean") return 0;
    return "";
}

/**
 * interface body + 다른 interfaces를 참조하여 FieldDefinition[] 해석
 */
function resolveFields(body: string, interfaces: Map<string, string>): FieldDefinition[] {
    const fields: FieldDefinition[] = [];
    const lines = body.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//"));

    for (const line of lines) {
        const m = line.match(/^(\w+)\??\s*:\s*(.+?)\s*;?\s*(?:\/\/\s*(.*))?$/);
        if (!m) continue;

        const [, name, rawType, comment] = m;
        const tsType = rawType.trim();

        // 주석에 "JSON 문자열"이 포함되어 있으면 json_string 타입으로
        const isJsonString = comment && (comment.includes("JSON") || comment.includes("json"));

        if (isJsonString) {
            fields.push({
                name,
                type: "json_string",
                rule: { type: "template", template: "{}" },
            });
            continue;
        }

        // 배열 타입인 경우 (SomeType[] 또는 Array<SomeType>)
        if (tsType.endsWith("[]") || tsType.startsWith("Array<")) {
            let elementType = "";
            if (tsType.endsWith("[]")) {
                elementType = tsType.slice(0, -2).trim();
            } else {
                const arrMatch = tsType.match(/Array<\s*(.+)\s*>/);
                if (arrMatch) elementType = arrMatch[1].trim();
            }

            // 참조 타입인지 확인
            if (elementType && interfaces.has(elementType)) {
                const childFields = resolveFields(interfaces.get(elementType)!, interfaces);
                fields.push({
                    name,
                    type: "array",
                    rule: { type: "random_int", min: 1, max: 3 },
                    children: childFields,
                });
            } else {
                const fieldType = mapTsType(elementType || "string");
                fields.push({
                    name,
                    type: "array",
                    rule: inferRule(name, fieldType),
                });
            }
            continue;
        }

        // 다른 interface를 참조하는 경우 (object)
        if (interfaces.has(tsType)) {
            const childFields = resolveFields(interfaces.get(tsType)!, interfaces);
            fields.push({
                name,
                type: "object",
                rule: { type: "static" },
                children: childFields,
            });
            continue;
        }

        const fieldType = mapTsType(tsType);
        fields.push({
            name,
            type: fieldType,
            rule: inferRule(name, fieldType),
        });
    }

    return fields;
}

function mapTsType(tsType: string): FieldType {
    const lower = tsType.toLowerCase().replace(/\s/g, "");
    if (lower === "string") return "string";
    if (lower === "number") return "number";
    if (lower === "boolean") return "boolean";
    if (lower === "date") return "date";
    if (lower.endsWith("[]") || lower.startsWith("array<")) return "array";
    return "string";
}

/**
 * Java Class 코드를 파싱하여 FieldDefinition 배열로 변환
 */
export function parseJavaClass(code: string): ParseResult {
    const fields: FieldDefinition[] = [];

    // private Type name; 패턴 매칭
    const fieldRegex = /(?:private|public|protected)\s+(\w+(?:<[^>]+>)?)\s+(\w+)\s*;/g;
    let match;

    while ((match = fieldRegex.exec(code)) !== null) {
        const [, javaType, name] = match;
        const fieldType = mapJavaType(javaType);
        fields.push({
            name,
            type: fieldType,
            rule: inferRule(name, fieldType),
        });
    }

    return { fields, hasWrapper: false, wrapperFields: [], itemsFieldName: "items", itemFields: [] };
}

function mapJavaType(javaType: string): FieldType {
    const lower = javaType.toLowerCase();
    if (["string", "char", "character"].includes(lower)) return "string";
    if (["int", "integer", "long", "short", "byte"].includes(lower)) return "integer";
    if (["float", "double", "bigdecimal"].includes(lower)) return "float";
    if (["boolean"].includes(lower)) return "boolean";
    if (["date", "localdate"].includes(lower)) return "date";
    if (["localdatetime", "datetime", "timestamp", "zoneddatetime"].includes(lower)) return "datetime";
    if (lower.startsWith("list<") || lower.startsWith("set<")) return "array";
    return "string";
}

/**
 * DDL(CREATE TABLE) 코드를 파싱하여 FieldDefinition 배열로 변환
 */
export function parseDDL(code: string): ParseResult {
    const fields: FieldDefinition[] = [];

    // CREATE TABLE 내부 컬럼 추출
    const tableMatch = code.match(/CREATE\s+TABLE\s+\w+\s*\((.+)\)/i);
    if (!tableMatch) return { fields, hasWrapper: false, wrapperFields: [], itemsFieldName: "items", itemFields: [] };

    const body = tableMatch[1];
    const lines = body.split(",").map((l) => l.trim()).filter((l) => l && !l.toUpperCase().startsWith("PRIMARY") && !l.toUpperCase().startsWith("FOREIGN") && !l.toUpperCase().startsWith("CONSTRAINT") && !l.toUpperCase().startsWith("INDEX") && !l.toUpperCase().startsWith("UNIQUE") && !l.toUpperCase().startsWith("KEY"));

    for (const line of lines) {
        const match = line.match(/^(\w+)\s+(\w+(?:\([^)]*\))?)/i);
        if (!match) continue;

        const [, name, sqlType] = match;
        const fieldType = mapSqlType(sqlType);
        fields.push({
            name,
            type: fieldType,
            rule: inferRule(name, fieldType),
        });
    }

    return { fields, hasWrapper: false, wrapperFields: [], itemsFieldName: "items", itemFields: [] };
}

function mapSqlType(sqlType: string): FieldType {
    const lower = sqlType.toLowerCase().replace(/\(.*\)/, "");
    if (["varchar", "char", "text", "clob", "nvarchar", "nchar", "ntext"].includes(lower)) return "string";
    if (["int", "integer", "bigint", "smallint", "tinyint", "serial", "bigserial"].includes(lower)) return "integer";
    if (["float", "double", "decimal", "numeric", "real", "number"].includes(lower)) return "float";
    if (["boolean", "bool", "bit"].includes(lower)) return "boolean";
    if (["date"].includes(lower)) return "date";
    if (["datetime", "timestamp", "timestamptz"].includes(lower)) return "datetime";
    return "string";
}

/**
 * 필드명과 타입에 따라 적절한 규칙 추론
 */
function inferRule(name: string, type: FieldType): FieldRule {
    const lower = name.toLowerCase();

    // ID 관련
    if (lower === "id" || lower.endsWith("_id") || lower.endsWith("Id")) {
        return { type: "increment", min: 1, max: 10000 };
    }

    // 이메일
    if (lower.includes("email") || lower.includes("mail")) {
        return { type: "email" };
    }

    // 전화번호
    if (lower.includes("phone") || lower.includes("tel") || lower.includes("mobile")) {
        return { type: "phone" };
    }

    // 날짜
    if (lower.includes("date") || lower.includes("_at") || lower.includes("time") || lower.includes("created") || lower.includes("updated")) {
        if (type === "datetime" || lower.includes("time")) {
            return { type: "datetime", format: "YYYY-MM-DDTHH:mm:ss" };
        }
        return { type: "date", format: "YYYY-MM-DD" };
    }

    // UUID
    if (lower.includes("uuid") || lower.includes("guid")) {
        return { type: "uuid" };
    }

    // URL
    if (lower.includes("url") || lower.includes("link") || lower.includes("href")) {
        return { type: "random_text" };
    }

    // 타입 기반 기본 규칙
    switch (type) {
        case "integer":
            return { type: "random_int", min: 1, max: 1000 };
        case "float":
        case "number":
            return { type: "random_float", min: 0, max: 100 };
        case "boolean":
            return { type: "pick", options: ["true", "false"] };
        case "date":
            return { type: "date", format: "YYYY-MM-DD" };
        case "datetime":
            return { type: "datetime", format: "YYYY-MM-DDTHH:mm:ss" };
        default:
            return { type: "random_text" };
    }
}

/**
 * 소스 코드를 파싱하여 ParseResult 반환
 */
export function parseSourceCode(sourceType: string, code: string): ParseResult {
    switch (sourceType) {
        case "typescript":
            return parseTypeScript(code);
        case "java":
            return parseJavaClass(code);
        case "ddl":
            return parseDDL(code);
        default:
            return { fields: [], hasWrapper: false, wrapperFields: [], itemsFieldName: "items", itemFields: [] };
    }
}
