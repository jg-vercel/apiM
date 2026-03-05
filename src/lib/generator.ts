import { FieldDefinition, FieldRule, WrapperField } from "@/types/api";
import { v4 as uuidv4 } from "uuid";

// 카운터 (increment용)
const counters: Record<string, number> = {};

function getCounter(key: string): number {
    if (!counters[key]) counters[key] = 0;
    counters[key]++;
    return counters[key];
}

export function resetCounters() {
    for (const key in counters) {
        delete counters[key];
    }
}

/**
 * 랜덤 정수 생성
 */
function randomInt(min: number = 1, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 랜덤 실수 생성
 */
function randomFloat(min: number = 0, max: number = 100): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * 랜덤 텍스트 생성
 */
function randomText(): string {
    const words = [
        "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf",
        "hotel", "india", "juliet", "kilo", "lima", "mike", "november",
        "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform",
        "victor", "whiskey", "xray", "yankee", "zulu",
        "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
        "수원", "성남", "고양", "용인", "창원", "청주", "천안", "전주",
    ];
    const count = randomInt(2, 4);
    return Array.from({ length: count }, () => words[randomInt(0, words.length - 1)]).join(" ");
}

/**
 * 날짜 생성
 */
function generateDate(format?: string): string {
    const now = new Date();
    const offset = randomInt(-365, 365);
    const date = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    if (format === "YYYY-MM-DDTHH:mm:ss" || format === "datetime") {
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    }

    return `${yyyy}-${mm}-${dd}`;
}

/**
 * 이메일 생성
 */
function generateEmail(): string {
    const names = ["user", "admin", "test", "dev", "hello", "info", "support"];
    const domains = ["example.com", "test.com", "mock.dev", "dummy.io"];
    return `${names[randomInt(0, names.length - 1)]}${randomInt(1, 999)}@${domains[randomInt(0, domains.length - 1)]}`;
}

/**
 * 전화번호 생성
 */
function generatePhone(): string {
    return `010-${String(randomInt(1000, 9999))}-${String(randomInt(1000, 9999))}`;
}

/**
 * 규칙에 따라 값 생성
 */
export function generateValue(fieldName: string, rule: FieldRule): unknown {
    switch (rule.type) {
        case "static":
            return rule.template || "";

        case "increment":
            return (rule.min || 0) + getCounter(fieldName) - 1;

        case "random_int":
            return randomInt(rule.min, rule.max);

        case "random_float":
            return randomFloat(rule.min, rule.max);

        case "random_text":
            return randomText();

        case "date":
            return generateDate(rule.format || "YYYY-MM-DD");

        case "datetime":
            return generateDate(rule.format || "YYYY-MM-DDTHH:mm:ss");

        case "uuid":
            return uuidv4();

        case "email":
            return generateEmail();

        case "phone":
            return generatePhone();

        case "pick":
            if (rule.options && rule.options.length > 0) {
                const picked = rule.options[randomInt(0, rule.options.length - 1)];
                if (picked === "true") return true;
                if (picked === "false") return false;
                if (!isNaN(Number(picked))) return Number(picked);
                return picked;
            }
            return null;

        case "template":
            return processTemplate(fieldName, rule.template || "");

        default:
            return randomText();
    }
}

/**
 * JSON 문자열 필드 생성 - 샘플이 있으면 구조를 유지하며 값만 랜덤 생성
 */
function generateJsonString(jsonSample?: string): string {
    if (jsonSample && jsonSample.trim()) {
        try {
            const sample = JSON.parse(jsonSample);
            const result = randomizeJsonValue(sample);
            return JSON.stringify(result);
        } catch {
            // 파싱 실패 시 기본 생성
        }
    }

    // 기본 랜덤 JSON
    const templates = [
        JSON.stringify({ id: randomInt(1, 100), name: randomText() }),
        JSON.stringify([{ key: randomText(), value: randomInt(1, 100) }]),
        JSON.stringify({ type: randomText(), status: randomInt(0, 3) }),
    ];
    return templates[randomInt(0, templates.length - 1)];
}

/**
 * JSON 값을 재귀적으로 분석하여 같은 타입/패턴의 랜덤 값으로 교체
 */
function randomizeJsonValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return null;
    }

    if (Array.isArray(value)) {
        // 배열: 원본과 비슷한 개수(1~원본 길이)로 생성
        const count = value.length > 0 ? randomInt(1, Math.max(value.length, 2)) : 0;
        if (value.length === 0) return [];
        // 첫 번째 요소를 샘플로 사용
        return Array.from({ length: count }, () => randomizeJsonValue(value[0]));
    }

    if (typeof value === "object" && value !== null) {
        // 오브젝트: 각 필드를 재귀적으로 랜덤화
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            result[key] = randomizeJsonField(key, val);
        }
        return result;
    }

    // 원시값
    return randomizePrimitive(value);
}

/**
 * 필드명을 힌트로 활용하여 더 정확한 랜덤 값 생성
 */
function randomizeJsonField(key: string, value: unknown): unknown {
    if (value === null || value === undefined) {
        return null;
    }

    const keyLower = key.toLowerCase();

    // 위경도 (LTD, LNGT, lat, lng, latitude, longitude)
    if (keyLower === "ltd" || keyLower === "lat" || keyLower === "latitude") {
        if (typeof value === "number") {
            // 한국 위도 범위 기반 (33~39)
            const base = Math.floor(value as number);
            return base + Math.round(Math.random() * 1000000) / 10000000;
        }
        return null;
    }
    if (keyLower === "lngt" || keyLower === "lng" || keyLower === "longitude") {
        if (typeof value === "number") {
            // 한국 경도 범위 기반 (124~132)
            const base = Math.floor(value as number);
            return base + Math.round(Math.random() * 1000000) / 10000000;
        }
        return null;
    }

    // 순수 숫자 문자열 (VIDEO 등)
    if (typeof value === "string" && /^\d{4,}$/.test(value)) {
        const digits = value.length;
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        return String(randomInt(min, max));
    }

    // UUID/hex 패턴 (순수 숫자가 아닌 경우만)
    if (typeof value === "string" && /^[0-9a-f]{5,}$/i.test(value) && /[a-f]/i.test(value)) {
        return randomHex(value.length);
    }

    // RTSP URL
    if (typeof value === "string" && value.startsWith("rtsp://")) {
        return randomizeUrl(value, "rtsp");
    }

    // HTTP URL
    if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
        return randomizeUrl(value, "http");
    }
    // 괄호로 감싼 코드 패턴 (C7), (4202), (101) 등 - 이름 패턴보다 우선
    if (typeof value === "string" && /^\([A-Z]*\d+\)$/.test(value)) {
        const inner = value.slice(1, -1);
        const prefix = inner.replace(/\d+/g, "");
        const numPart = inner.replace(/\D/g, "");
        const digits = numPart.length;
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        return `(${prefix}${randomInt(min, max)})`;
    }

    // 번호/코드
    if (keyLower.includes("mno") || keyLower.includes("no")) {
        if (typeof value === "string" && /^\d+$/.test(value)) {
            return String(randomInt(100, 999));
        }
    }

    // 이름 (NM 으로 끝나는 키)
    if (keyLower.endsWith("nm") || keyLower.endsWith("name")) {
        if (typeof value === "string") {
            return randomizeNameString(value);
        }
    }

    // 일반 재귀 처리
    return randomizeJsonValue(value);
}

/**
 * 원시값을 같은 타입의 랜덤 값으로 교체
 */
function randomizePrimitive(value: unknown): unknown {
    if (typeof value === "number") {
        if (Number.isInteger(value)) {
            const digits = String(Math.abs(value as number)).length;
            const min = digits <= 1 ? 0 : Math.pow(10, digits - 1);
            const max = Math.pow(10, digits) - 1;
            return randomInt(min, max);
        }
        // 실수
        const intPart = Math.floor(value as number);
        return intPart + Math.round(Math.random() * 10000000) / 10000000;
    }

    if (typeof value === "boolean") {
        return Math.random() > 0.5;
    }

    if (typeof value === "string") {
        // 괄호로 감싼 코드 (C1), (4202) 등
        const codeMatch = value.match(/^\(([A-Z]*\d+)\)$/);
        if (codeMatch) {
            const prefix = codeMatch[1].replace(/\d+/g, "");
            const numPart = codeMatch[1].replace(/\D/g, "");
            const digits = numPart.length;
            const min = Math.pow(10, digits - 1);
            const max = Math.pow(10, digits) - 1;
            return `(${prefix}${randomInt(min, max)})`;
        }

        // 대괄호 모델명 [01B7103]
        const bracketMatch = value.match(/\[([^\]]+)\]/);
        if (bracketMatch) {
            const inner = bracketMatch[1];
            const randomized = inner.replace(/\d/g, () => String(randomInt(0, 9)));
            return value.replace(/\[[^\]]+\]/, `[${randomized}]`);
        }

        // 날짜 형식
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const now = new Date();
            const offset = randomInt(-365, 365);
            const date = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, "0");
            const dd = String(date.getDate()).padStart(2, "0");
            if (value.includes("T") || value.includes(" ")) {
                const hh = String(date.getHours()).padStart(2, "0");
                const mi = String(date.getMinutes()).padStart(2, "0");
                const ss = String(date.getSeconds()).padStart(2, "0");
                return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
            }
            return `${yyyy}-${mm}-${dd}`;
        }

        // 짧은 문자열 → 랜덤 텍스트
        return randomText();
    }

    return value;
}

/**
 * 16진수 랜덤 문자열 생성
 */
function randomHex(length: number): string {
    const chars = "0123456789abcdef";
    return Array.from({ length }, () => chars[randomInt(0, 15)]).join("");
}

/**
 * URL 패턴을 유지하면서 숫자/경로 부분만 랜덤으로 변경
 */
function randomizeUrl(url: string, protocol: string): string {
    // IP 부분의 마지막 옥텟과 포트/경로의 숫자만 변경
    return url.replace(/\d+/g, (match) => {
        const num = parseInt(match);
        if (num > 255) {
            // 포트나 큰 숫자는 비슷한 자릿수로
            const digits = match.length;
            return String(randomInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1));
        }
        // IP 옥텟은 범위 유지
        if (num <= 255 && num > 0) {
            return String(randomInt(1, 254));
        }
        return match;
    });
}

/**
 * 이름 문자열 랜덤화 (한글 + 모델 코드 패턴 유지)
 */
function randomizeNameString(value: string): string {
    // 한글 이름 + [코드] 패턴
    const bracketMatch = value.match(/^(.+?)(\s*\[[^\]]+\])$/);
    if (bracketMatch) {
        const namePart = bracketMatch[1].trim();
        const codePart = bracketMatch[2];
        const randomizedCode = codePart.replace(/\d/g, () => String(randomInt(0, 9)));
        const vehicleNames = ["K5", "카운티", "스타렉스", "소나타", "K9", "기갑수색차량2형", "지휘차량", "렉스턴"];
        const randomName = vehicleNames[randomInt(0, vehicleNames.length - 1)];
        return `${randomName} ${randomizedCode.trim()}`;
    }
    return randomText();
}

/**
 * 템플릿 문자열 처리 - 대괄호 내부만 재생성
 * 예: "cctv_[1]" -> "cctv_42"
 * 예: "[2026-01-10]" -> "2025-08-22"
 */
export function processTemplate(fieldName: string, template: string): string {
    return template.replace(/\[([^\]]*)\]/g, (_match, inner: string) => {
        const trimmed = inner.trim();

        // 숫자인 경우 -> 랜덤 정수 (해당 숫자의 자릿수 범위)
        if (/^\d+$/.test(trimmed)) {
            const digits = trimmed.length;
            const min = digits === 1 ? 0 : Math.pow(10, digits - 1);
            const max = Math.pow(10, digits) - 1;
            return String(randomInt(min, max));
        }

        // 날짜 형식인 경우 -> 날짜 생성
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return generateDate("YYYY-MM-DD");
        }

        // 날짜시간 형식인 경우
        if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
            return generateDate("YYYY-MM-DDTHH:mm:ss");
        }

        // increment
        if (trimmed === "increment" || trimmed === "seq") {
            return String(getCounter(fieldName));
        }

        // uuid
        if (trimmed === "uuid") {
            return uuidv4();
        }

        // email
        if (trimmed === "email") {
            return generateEmail();
        }

        // phone
        if (trimmed === "phone") {
            return generatePhone();
        }

        // random text
        if (trimmed === "text" || trimmed === "random") {
            return randomText();
        }

        // 콤마로 구분된 선택지
        if (trimmed.includes(",")) {
            const options = trimmed.split(",").map((o) => o.trim());
            return options[randomInt(0, options.length - 1)];
        }

        // 기본: 랜덤 텍스트
        return randomText();
    });
}

/**
 * 필드 정의 배열로부터 단일 레코드 생성
 */
export function generateRecord(fields: FieldDefinition[]): Record<string, unknown> {
    const record: Record<string, unknown> = {};

    for (const field of fields) {
        if (field.type === "json_string") {
            record[field.name] = generateJsonString(field.rule.jsonSample);
        } else if (field.type === "object" && field.children) {
            record[field.name] = generateRecord(field.children);
        } else if (field.type === "array" && field.children) {
            const count = randomInt(1, 3);
            record[field.name] = Array.from({ length: count }, () => generateRecord(field.children!));
        } else {
            record[field.name] = generateValue(field.name, field.rule);
        }
    }

    return record;
}

/**
 * JSON 템플릿 문자열에서 대괄호 부분을 재생성
 */
export function generateFromTemplate(template: string): unknown {
    try {
        // 대괄호 안의 내용을 처리하면서 JSON 파싱
        const processed = template.replace(/\[([^\]]*)\]/g, (_match, inner: string) => {
            const result = processTemplate("_template", `[${inner}]`);
            return result;
        });

        return JSON.parse(processed);
    } catch {
        // JSON 파싱 실패 시 원본 반환
        return template;
    }
}

/**
 * 엔드포인트 설정에 따라 응답 데이터 생성
 */
export function generateResponse(
    fields: FieldDefinition[],
    isArray: boolean,
    arrayCount: number,
    responseTemplate?: string,
    useWrapper?: boolean,
    wrapperFields?: WrapperField[],
    itemsFieldName?: string
): unknown {
    resetCounters();

    // 템플릿이 있으면 템플릿 기반 생성
    if (responseTemplate && responseTemplate.trim()) {
        if (useWrapper && wrapperFields && wrapperFields.length > 0) {
            const items = Array.from({ length: arrayCount || 5 }, () => generateFromTemplate(responseTemplate));
            return buildWrapperResponse(items, arrayCount, wrapperFields, itemsFieldName || "items");
        }
        if (isArray) {
            return Array.from({ length: arrayCount || 5 }, () => generateFromTemplate(responseTemplate));
        }
        return generateFromTemplate(responseTemplate);
    }

    // 래퍼 응답 생성
    if (useWrapper && wrapperFields && wrapperFields.length > 0) {
        const items = Array.from({ length: arrayCount || 5 }, () => generateRecord(fields));
        return buildWrapperResponse(items, arrayCount, wrapperFields, itemsFieldName || "items");
    }

    // 필드 정의 기반 생성
    if (isArray) {
        return Array.from({ length: arrayCount || 5 }, () => generateRecord(fields));
    }
    return generateRecord(fields);
}

/**
 * 래퍼 응답 생성 (페이지네이션 메타데이터 포함)
 */
function buildWrapperResponse(
    items: unknown[],
    arrayCount: number,
    wrapperFields: WrapperField[],
    itemsFieldName: string
): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const count = arrayCount || items.length;
    const totalItems = randomInt(count, count * 10);
    const rows = count;
    const totalPages = Math.ceil(totalItems / rows);

    for (const wf of wrapperFields) {
        switch (wf.type) {
            case "itemsArray":
                result[wf.name] = items;
                break;
            case "page":
                result[wf.name] = wf.value ?? 1;
                break;
            case "total":
                result[wf.name] = totalItems;
                break;
            case "rows":
                result[wf.name] = rows;
                break;
            case "last":
                result[wf.name] = totalPages;
                break;
            case "static":
                result[wf.name] = wf.value ?? "";
                break;
            default:
                result[wf.name] = wf.value ?? "";
        }
    }

    // itemsFieldName이 wrapperFields에 없는 경우 fallback
    if (!(itemsFieldName in result)) {
        result[itemsFieldName] = items;
    }

    return result;
}
