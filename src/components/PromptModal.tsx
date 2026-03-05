"use client";

import React, { useState } from "react";

const PROMPT_TEXT = `이 프로젝트의 API 엔드포인트를 분석하여, Mock API Generator에 import할 수 있는 JSON 데이터를 생성해줘.

## 분석 대상
- API 라우트/컨트롤러 파일 (예: route.ts, controller.java, views.py 등)
- API 요청/응답에 사용되는 타입/인터페이스/DTO/Entity
- API 호출 코드 (fetch, axios, httpClient 등)
- Swagger/OpenAPI 명세가 있다면 그것도 참고

## 생성해야 할 JSON 형식

반드시 아래 형식을 지켜서 JSON을 생성해줘. 올바른 JSON이어야 하며, 코드블록 안에 넣어서 제공해줘.

\`\`\`json
{
  "version": "1.0",
  "endpoints": [
    {
      "method": "GET | POST | PUT | DELETE | PATCH",
      "path": "/api/경로",
      "description": "API 설명 (한글)",
      "sourceType": "typescript",
      "sourceCode": "원본 타입/인터페이스 코드 (있을 경우)",
      "fields": [
        {
          "name": "필드명",
          "type": "필드타입",
          "rule": {
            "type": "규칙타입",
            기타 규칙 속성
          },
          "children": []
        }
      ],
      "responseTemplate": "",
      "isArray": true,
      "arrayCount": 10,
      "statusCode": 200,
      "useWrapper": false,
      "wrapperFields": [],
      "itemsFieldName": "items"
    }
  ]
}
\`\`\`

## 필드 타입 (type) - 반드시 아래 중 하나를 사용
- \`"string"\` - 문자열
- \`"number"\` - 숫자
- \`"boolean"\` - 참/거짓
- \`"date"\` - 날짜 (YYYY-MM-DD)
- \`"datetime"\` - 날짜시간 (YYYY-MM-DDTHH:mm:ss)
- \`"integer"\` - 정수
- \`"float"\` - 실수
- \`"text"\` - 긴 텍스트
- \`"uuid"\` - UUID
- \`"email"\` - 이메일
- \`"url"\` - URL
- \`"phone"\` - 전화번호
- \`"array"\` - 배열 (children에 하위 필드 정의)
- \`"object"\` - 객체 (children에 하위 필드 정의)
- \`"json_string"\` - JSON 문자열 (문자열이지만 내부가 JSON 구조)

## 규칙 타입 (rule.type) - 반드시 아래 중 하나를 사용
- \`"static"\` - 고정값. \`rule.template\`에 고정값 지정
  - 예: \`{ "type": "static", "template": "ACTIVE" }\`
- \`"increment"\` - 자동 증가. \`rule.min\`에 시작값 지정
  - 예: \`{ "type": "increment", "min": 1 }\`
- \`"random_int"\` - 랜덤 정수. \`rule.min\`, \`rule.max\` 지정
  - 예: \`{ "type": "random_int", "min": 1, "max": 1000 }\`
- \`"random_float"\` - 랜덤 실수. \`rule.min\`, \`rule.max\` 지정
  - 예: \`{ "type": "random_float", "min": 0, "max": 100 }\`
- \`"random_text"\` - 랜덤 텍스트
  - 예: \`{ "type": "random_text" }\`
- \`"date"\` - 날짜 생성. \`rule.format\` 지정
  - 예: \`{ "type": "date", "format": "YYYY-MM-DD" }\`
- \`"datetime"\` - 날짜시간 생성. \`rule.format\` 지정
  - 예: \`{ "type": "datetime", "format": "YYYY-MM-DDTHH:mm:ss" }\`
- \`"uuid"\` - UUID 생성
  - 예: \`{ "type": "uuid" }\`
- \`"email"\` - 이메일 생성
  - 예: \`{ "type": "email" }\`
- \`"phone"\` - 전화번호 생성
  - 예: \`{ "type": "phone" }\`
- \`"pick"\` - 목록에서 랜덤 선택. \`rule.options\`에 선택지 배열 지정
  - 예: \`{ "type": "pick", "options": ["ACTIVE", "INACTIVE", "PENDING"] }\`
  - boolean의 경우: \`{ "type": "pick", "options": ["true", "false"] }\`
- \`"template"\` - 패턴 기반 생성. \`rule.template\`에 대괄호 규칙 사용
  - 대괄호 내 숫자: 해당 자릿수 범위의 랜덤 정수로 치환
    - 예: \`{ "type": "template", "template": "CAM_[001]" }\` → "CAM_482"
  - 대괄호 내 날짜: 랜덤 날짜로 치환
    - 예: \`{ "type": "template", "template": "[2025-01-01]" }\` → "2025-08-22"
  - 대괄호 내 키워드: increment, uuid, email, phone, text, random 사용 가능
    - 예: \`{ "type": "template", "template": "USER_[increment]" }\` → "USER_1", "USER_2"...
  - 대괄호 내 콤마 구분 선택지: 랜덤 선택
    - 예: \`{ "type": "template", "template": "Status: [활성, 비활성, 대기]" }\` → "Status: 활성"

## 중첩 구조 (object, array) 사용법
object나 array 타입의 경우 \`children\` 배열에 하위 필드를 정의:

\`\`\`json
{
  "name": "address",
  "type": "object",
  "rule": { "type": "static" },
  "children": [
    { "name": "city", "type": "string", "rule": { "type": "pick", "options": ["서울", "부산", "대구"] } },
    { "name": "zipCode", "type": "string", "rule": { "type": "template", "template": "[10000]-[100]" } }
  ]
}
\`\`\`

\`\`\`json
{
  "name": "tags",
  "type": "array",
  "rule": { "type": "random_int", "min": 1, "max": 3 },
  "children": [
    { "name": "id", "type": "integer", "rule": { "type": "increment", "min": 1 } },
    { "name": "label", "type": "string", "rule": { "type": "random_text" } }
  ]
}
\`\`\`

## json_string 타입 사용법
응답 필드 중 값이 JSON을 문자열로 담고 있는 경우 \`json_string\` 타입 사용.
\`rule.jsonSample\`에 샘플 JSON 문자열을 넣으면 구조를 유지하면서 값만 랜덤으로 생성:

\`\`\`json
{
  "name": "metadata",
  "type": "json_string",
  "rule": {
    "type": "template",
    "template": "{}",
    "jsonSample": "{\\"resolution\\":\\"1920x1080\\",\\"fps\\":30,\\"codec\\":\\"H.264\\"}"
  }
}
\`\`\`

## 래퍼(Wrapper) 응답 사용법
페이지네이션이 있는 API의 경우 \`useWrapper: true\`로 설정:

\`\`\`json
{
  "method": "GET",
  "path": "/api/users",
  "description": "사용자 목록 (페이지네이션)",
  "useWrapper": true,
  "isArray": true,
  "arrayCount": 10,
  "itemsFieldName": "data",
  "wrapperFields": [
    { "name": "data", "type": "itemsArray" },
    { "name": "page", "type": "page", "value": 1 },
    { "name": "totalCount", "type": "total" },
    { "name": "pageSize", "type": "rows" },
    { "name": "lastPage", "type": "last" },
    { "name": "success", "type": "static", "value": true }
  ],
  "fields": [
    { "name": "id", "type": "integer", "rule": { "type": "increment", "min": 1 } },
    { "name": "name", "type": "string", "rule": { "type": "random_text" } }
  ]
}
\`\`\`

래퍼 필드의 type 종류:
- \`"itemsArray"\` - 아이템 배열이 들어갈 위치
- \`"page"\` - 현재 페이지 번호 (value로 기본값 지정)
- \`"total"\` - 전체 아이템 수 (자동 계산)
- \`"rows"\` - 페이지당 아이템 수 (arrayCount와 동일)
- \`"last"\` - 마지막 페이지 (자동 계산)
- \`"static"\` - 고정값 (value에 값 지정)

## 분석 및 생성 규칙

1. **path는 \`/api/\`으로 시작**해야 합니다
   - 원본이 \`/api/v1/users\`이면 → \`/api/users\`로 변환
   - 원본이 \`/cameras/list\`이면 → \`/api/cameras/list\`로 변환

2. **필드명은 실제 API 응답의 필드명**을 그대로 사용하세요

3. **규칙을 필드명과 데이터 특성에 맞게 추론**해주세요:
   - id, xxx_id → \`increment\`
   - email → \`email\`
   - phone, tel → \`phone\`
   - created_at, updated_at → \`datetime\`
   - status, type, category 같은 enum → \`pick\` + 실제 사용되는 값들
   - name → \`random_text\`
   - latitude, longitude → \`random_float\` (적절한 범위)
   - boolean 필드 → \`pick\` with ["true", "false"]
   - URL → \`template\` with \`"http://example.com/[10000]"\`

4. **페이지네이션 응답**이면 \`useWrapper: true\`를 사용하고, 응답 구조에 맞는 wrapperFields를 구성해주세요

5. **가능한 한 많은 API 엔드포인트**를 포함해주세요

6. **sourceType은 \`"manual"\`**로 설정해주세요

7. **sourceCode에는 원본 타입/인터페이스 코드**가 있으면 넣어주세요, 없으면 빈 문자열

8. **responseTemplate은 빈 문자열**로 두세요 (fields 기반으로 생성됨)

9. **arrayCount는 보통 5~10** 사이의 적절한 수를 지정해주세요

## 출력
- 분석한 API 목록을 간단히 설명하고
- 위 형식에 맞는 완전한 JSON을 코드블록으로 제공해줘
- JSON은 반드시 파싱 가능한 올바른 JSON이어야 해
- JSON 내 문자열에 줄바꿈이나 특수문자가 있으면 반드시 이스케이프 처리해줘`;

interface PromptModalProps {
    onClose: () => void;
}

export default function PromptModal({ onClose }: PromptModalProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(PROMPT_TEXT);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // fallback
            const textarea = document.createElement("textarea");
            textarea.value = PROMPT_TEXT;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    // Simple markdown-like rendering
    const renderPreview = () => {
        const lines = PROMPT_TEXT.split("\n");
        const elements: React.ReactElement[] = [];
        let inCodeBlock = false;
        let codeBuffer: string[] = [];
        let codeBlockIndex = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Code block toggle
            if (line.startsWith("```")) {
                if (inCodeBlock) {
                    elements.push(
                        <pre
                            key={`code-${codeBlockIndex}`}
                            style={{
                                background: "rgba(0, 0, 0, 0.4)",
                                border: "1px solid var(--color-dark-500)",
                                borderRadius: 8,
                                padding: "12px 16px",
                                fontSize: 12,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                overflowX: "auto",
                                margin: "8px 0 16px",
                                lineHeight: 1.6,
                                color: "var(--color-dark-200)",
                            }}
                        >
                            <code>{codeBuffer.join("\n")}</code>
                        </pre>
                    );
                    codeBuffer = [];
                    codeBlockIndex++;
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                continue;
            }

            if (inCodeBlock) {
                codeBuffer.push(line);
                continue;
            }

            // Headings
            if (line.startsWith("## ")) {
                elements.push(
                    <h2
                        key={i}
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "var(--color-accent-cyan)",
                            marginTop: 24,
                            marginBottom: 8,
                            paddingBottom: 6,
                            borderBottom: "1px solid var(--color-dark-600)",
                        }}
                    >
                        {line.slice(3)}
                    </h2>
                );
                continue;
            }

            // List items
            if (line.startsWith("- ") || line.startsWith("  - ")) {
                const indent = line.startsWith("    - ") ? 32 : line.startsWith("  - ") ? 16 : 0;
                const content = line.replace(/^[\s]*-\s/, "");
                elements.push(
                    <div
                        key={i}
                        style={{
                            paddingLeft: indent + 12,
                            position: "relative",
                            marginBottom: 4,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: "var(--color-dark-200)",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: indent,
                                color: "var(--color-accent-purple)",
                                fontWeight: 700,
                            }}
                        >
                            •
                        </span>
                        {renderInlineCode(content)}
                    </div>
                );
                continue;
            }

            // Numbered list
            const numMatch = line.match(/^(\d+)\.\s\*\*(.*?)\*\*(.*)$/);
            if (numMatch) {
                elements.push(
                    <div
                        key={i}
                        style={{
                            paddingLeft: 20,
                            position: "relative",
                            marginBottom: 6,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: "var(--color-dark-200)",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: 0,
                                color: "var(--color-accent-blue)",
                                fontWeight: 700,
                                fontSize: 12,
                            }}
                        >
                            {numMatch[1]}.
                        </span>
                        <strong style={{ color: "var(--color-dark-100)" }}>{numMatch[2]}</strong>
                        {renderInlineCode(numMatch[3])}
                    </div>
                );
                continue;
            }

            const numPlain = line.match(/^(\d+)\.\s(.*)$/);
            if (numPlain) {
                elements.push(
                    <div
                        key={i}
                        style={{
                            paddingLeft: 20,
                            position: "relative",
                            marginBottom: 6,
                            fontSize: 13,
                            lineHeight: 1.7,
                            color: "var(--color-dark-200)",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: 0,
                                color: "var(--color-accent-blue)",
                                fontWeight: 700,
                                fontSize: 12,
                            }}
                        >
                            {numPlain[1]}.
                        </span>
                        {renderInlineCode(numPlain[2])}
                    </div>
                );
                continue;
            }

            // Empty line
            if (line.trim() === "") {
                elements.push(<div key={i} style={{ height: 8 }} />);
                continue;
            }

            // Normal paragraph
            elements.push(
                <p
                    key={i}
                    style={{
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "var(--color-dark-200)",
                        marginBottom: 4,
                    }}
                >
                    {renderInlineCode(line)}
                </p>
            );
        }

        return elements;
    };

    const renderInlineCode = (text: string) => {
        const parts = text.split(/(`[^`]+`)/);
        return parts.map((part, idx) => {
            if (part.startsWith("`") && part.endsWith("`")) {
                return (
                    <code
                        key={idx}
                        style={{
                            background: "rgba(139, 92, 246, 0.15)",
                            color: "var(--color-accent-purple)",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}
                    >
                        {part.slice(1, -1)}
                    </code>
                );
            }
            // bold
            const boldParts = part.split(/(\*\*[^*]+\*\*)/);
            return boldParts.map((bp, bIdx) => {
                if (bp.startsWith("**") && bp.endsWith("**")) {
                    return (
                        <strong key={`${idx}-${bIdx}`} style={{ color: "var(--color-dark-100)" }}>
                            {bp.slice(2, -2)}
                        </strong>
                    );
                }
                // → arrow styling
                return bp.replace(/→/g, " → ");
            });
        });
    };

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{ zIndex: 100 }}
        >
            <div
                className="glass-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "min(900px, 92vw)",
                    maxHeight: "88vh",
                    display: "flex",
                    flexDirection: "column",
                    animation: "fadeIn 0.2s ease-out",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "20px 24px 16px",
                        borderBottom: "1px solid var(--color-dark-600)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Import 프롬프트</h2>
                            <p style={{ fontSize: 12, color: "var(--color-dark-300)", marginTop: 2 }}>
                                다른 프로젝트의 AI에게 보내서 import용 JSON을 생성하세요
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                            onClick={handleCopy}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                background: copied
                                    ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))"
                                    : "linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))",
                                color: "white",
                            }}
                        >
                            {copied ? (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    복사됨!
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    프롬프트 복사
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="btn-icon"
                            style={{ width: 36, height: 36 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        padding: "0 24px",
                        display: "flex",
                        gap: 0,
                        borderBottom: "1px solid var(--color-dark-600)",
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={() => setActiveTab("preview")}
                        style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            color: activeTab === "preview" ? "var(--color-accent-cyan)" : "var(--color-dark-400)",
                            borderBottom: activeTab === "preview" ? "2px solid var(--color-accent-cyan)" : "2px solid transparent",
                            transition: "all 0.2s",
                        }}
                    >
                        📖 가독성 보기
                    </button>
                    <button
                        onClick={() => setActiveTab("raw")}
                        style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            color: activeTab === "raw" ? "var(--color-accent-cyan)" : "var(--color-dark-400)",
                            borderBottom: activeTab === "raw" ? "2px solid var(--color-accent-cyan)" : "2px solid transparent",
                            transition: "all 0.2s",
                        }}
                    >
                        📝 원본 텍스트
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: 24,
                    }}
                >
                    {activeTab === "preview" ? (
                        <div>{renderPreview()}</div>
                    ) : (
                        <pre
                            style={{
                                background: "rgba(0, 0, 0, 0.3)",
                                border: "1px solid var(--color-dark-500)",
                                borderRadius: 12,
                                padding: 20,
                                fontSize: 12,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                lineHeight: 1.7,
                                color: "var(--color-dark-200)",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                overflowX: "auto",
                            }}
                        >
                            {PROMPT_TEXT}
                        </pre>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "14px 24px",
                        borderTop: "1px solid var(--color-dark-600)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexShrink: 0,
                    }}
                >
                    <p style={{ fontSize: 12, color: "var(--color-dark-400)" }}>
                        💡 이 프롬프트를 분석할 프로젝트의 AI에게 전달하면, import용 JSON이 생성됩니다
                    </p>
                    <button
                        onClick={handleCopy}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 20px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: copied
                                ? "rgba(34, 197, 94, 0.15)"
                                : "linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple))",
                            color: copied ? "var(--color-accent-green)" : "white",
                        }}
                    >
                        {copied ? (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                클립보드에 복사됨!
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                클립보드에 복사
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
