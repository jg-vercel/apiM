"use client";

import { useState } from "react";
import {
    MockApiEndpoint,
    HttpMethod,
    SourceType,
    FieldDefinition,
    RuleType,
    FieldRule,
    WrapperField,
} from "@/types/api";

interface Props {
    endpoint: MockApiEndpoint | null;
    onClose: () => void;
    onCreate: (data: {
        method: HttpMethod;
        path: string;
        description: string;
        sourceType: SourceType;
        sourceCode: string;
        fields: FieldDefinition[];
        responseTemplate: string;
        isArray: boolean;
        arrayCount: number;
        statusCode: number;
        useWrapper: boolean;
        wrapperFields: WrapperField[];
        itemsFieldName: string;
    }) => void;
    onUpdate: (id: string, data: Partial<MockApiEndpoint>) => void;
}

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH"];

const SOURCE_TYPES: { value: SourceType; label: string; placeholder: string }[] = [
    {
        value: "typescript",
        label: "TypeScript Type",
        placeholder: `// 단일 인터페이스
interface CctvInfo {
  cctv_id: string;
  name: string;
  location: string;
  status: number;
  reg_date: string;
  is_active: boolean;
}

// 또는 래퍼 응답 구조 (자동 감지)
interface OperationApiResponse {
  items: OperationApiItem[];
  page: number;
  last: number;
  rows: number;
  total: number;
}

interface OperationApiItem {
  SITATN: string;
  VEHICLES: string; // JSON 문자열
  OPNM: string;
}`,
    },
    {
        value: "java",
        label: "Java Class",
        placeholder: `public class CctvInfo {
  private String cctvId;
  private String name;
  private String location;
  private Integer status;
  private LocalDate regDate;
  private Boolean isActive;
}`,
    },
    {
        value: "ddl",
        label: "DDL (SQL)",
        placeholder: `CREATE TABLE cctv_info (
  cctv_id VARCHAR(50),
  name VARCHAR(100),
  location VARCHAR(200),
  status INT,
  reg_date DATE,
  is_active BOOLEAN
)`,
    },
    {
        value: "manual",
        label: "수동 등록",
        placeholder: "",
    },
];

const RULE_TYPES: { value: RuleType; label: string }[] = [
    { value: "static", label: "고정값" },
    { value: "increment", label: "자동 증가" },
    { value: "random_int", label: "랜덤 정수" },
    { value: "random_float", label: "랜덤 실수" },
    { value: "random_text", label: "랜덤 텍스트" },
    { value: "date", label: "날짜" },
    { value: "datetime", label: "날짜시간" },
    { value: "uuid", label: "UUID" },
    { value: "email", label: "이메일" },
    { value: "phone", label: "전화번호" },
    { value: "pick", label: "선택 목록" },
    { value: "template", label: "템플릿" },
];

const FIELD_TYPES = [
    "string", "number", "integer", "float", "boolean",
    "date", "datetime", "text", "uuid", "email", "url", "phone",
    "json_string",
];

const WRAPPER_FIELD_TYPES: { value: WrapperField["type"]; label: string }[] = [
    { value: "itemsArray", label: "아이템 배열" },
    { value: "page", label: "현재 페이지" },
    { value: "total", label: "전체 건수" },
    { value: "rows", label: "페이지 크기" },
    { value: "last", label: "마지막 페이지" },
    { value: "static", label: "고정값" },
];

export default function CreateEndpointModal({ endpoint, onClose, onCreate, onUpdate }: Props) {
    const isEdit = !!endpoint;

    const [activeTab, setActiveTab] = useState<"source" | "fields" | "template" | "wrapper">("source");
    const [method, setMethod] = useState<HttpMethod>(endpoint?.method || "GET");
    const [path, setPath] = useState(endpoint?.path || "/api/mock/");
    const [description, setDescription] = useState(endpoint?.description || "");
    const [sourceType, setSourceType] = useState<SourceType>(endpoint?.sourceType || "typescript");
    const [sourceCode, setSourceCode] = useState(endpoint?.sourceCode || "");
    const [fields, setFields] = useState<FieldDefinition[]>(endpoint?.fields || []);
    const [responseTemplate, setResponseTemplate] = useState(endpoint?.responseTemplate || "");
    const [isArray, setIsArray] = useState(endpoint?.isArray ?? false);
    const [arrayCount, setArrayCount] = useState(endpoint?.arrayCount || 5);
    const [statusCode, setStatusCode] = useState(endpoint?.statusCode || 200);
    const [parsing, setParsing] = useState(false);

    // 래퍼 응답 관련 상태
    const [useWrapper, setUseWrapper] = useState(endpoint?.useWrapper ?? false);
    const [wrapperFields, setWrapperFields] = useState<WrapperField[]>(
        endpoint?.wrapperFields || []
    );
    const [itemsFieldName, setItemsFieldName] = useState(endpoint?.itemsFieldName || "items");

    // 소스 코드 파싱
    const handleParse = async () => {
        if (!sourceCode.trim() || sourceType === "manual") return;

        setParsing(true);
        try {
            const res = await fetch("/api/endpoints/parse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceType, sourceCode }),
            });
            const data = await res.json();
            if (data.fields) {
                setFields(data.fields);
                setActiveTab("fields");

                // 래퍼 구조가 감지된 경우 자동 설정
                if (data.hasWrapper) {
                    setUseWrapper(true);
                    setWrapperFields(data.wrapperFields || []);
                    setItemsFieldName(data.itemsFieldName || "items");
                    setIsArray(true);
                }
            }
        } catch (error) {
            console.error("Parse failed:", error);
        } finally {
            setParsing(false);
        }
    };

    // 필드 추가
    const addField = () => {
        setFields([
            ...fields,
            {
                name: "",
                type: "string",
                rule: { type: "random_text" },
            },
        ]);
    };

    // 필드 제거
    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    // 필드 업데이트
    const updateField = (index: number, updates: Partial<FieldDefinition>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
        setFields(newFields);
    };

    // 필드 규칙 업데이트
    const updateFieldRule = (index: number, ruleUpdates: Partial<FieldRule>) => {
        const newFields = [...fields];
        newFields[index] = {
            ...newFields[index],
            rule: { ...newFields[index].rule, ...ruleUpdates },
        };
        setFields(newFields);
    };

    // 래퍼 필드 추가
    const addWrapperField = () => {
        setWrapperFields([...wrapperFields, { name: "", type: "static", value: "" }]);
    };

    // 래퍼 필드 제거
    const removeWrapperField = (index: number) => {
        setWrapperFields(wrapperFields.filter((_, i) => i !== index));
    };

    // 래퍼 필드 업데이트
    const updateWrapperField = (index: number, updates: Partial<WrapperField>) => {
        const newFields = [...wrapperFields];
        newFields[index] = { ...newFields[index], ...updates };
        setWrapperFields(newFields);
    };

    // 제출
    const handleSubmit = () => {
        if (!path.trim()) {
            alert("API 경로를 입력해주세요.");
            return;
        }

        const data = {
            method,
            path,
            description,
            sourceType,
            sourceCode,
            fields,
            responseTemplate,
            isArray,
            arrayCount,
            statusCode,
            useWrapper,
            wrapperFields,
            itemsFieldName,
        };

        if (isEdit && endpoint) {
            onUpdate(endpoint.id, data);
        } else {
            onCreate(data);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-dark-600)]">
                    <div>
                        <h2 className="text-lg font-bold">
                            {isEdit ? "API 편집" : "새 Mock API 생성"}
                        </h2>
                        <p className="text-xs text-[var(--color-dark-300)] mt-1">
                            API 엔드포인트를 설정하고 응답 데이터를 구성하세요
                        </p>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* API Endpoint Config */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--color-dark-300)] uppercase tracking-wider">
                            엔드포인트 설정
                        </h3>
                        <div className="flex gap-3">
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                                className="select-dark"
                                style={{ width: "140px", flexShrink: 0 }}
                            >
                                {HTTP_METHODS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="input-dark font-mono text-sm"
                                placeholder="/api/mock/your-endpoint"
                            />
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="input-dark"
                                placeholder="API 설명 (선택사항)"
                            />
                            <select
                                value={statusCode}
                                onChange={(e) => setStatusCode(Number(e.target.value))}
                                className="select-dark"
                                style={{ width: "140px", flexShrink: 0 }}
                            >
                                <option value={200}>200 OK</option>
                                <option value={201}>201 Created</option>
                                <option value={204}>204 No Content</option>
                                <option value={400}>400 Bad Request</option>
                                <option value={401}>401 Unauthorized</option>
                                <option value={403}>403 Forbidden</option>
                                <option value={404}>404 Not Found</option>
                                <option value={500}>500 Internal Server Error</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isArray}
                                    onChange={(e) => setIsArray(e.target.checked)}
                                    className="accent-[var(--color-accent-blue)]"
                                />
                                <span className="text-sm">배열 응답</span>
                            </label>
                            {isArray && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-[var(--color-dark-300)]">개수:</span>
                                    <input
                                        type="number"
                                        value={arrayCount}
                                        onChange={(e) => setArrayCount(Number(e.target.value))}
                                        className="input-dark"
                                        style={{ width: "80px" }}
                                        min={1}
                                        max={100}
                                    />
                                </div>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useWrapper}
                                    onChange={(e) => {
                                        setUseWrapper(e.target.checked);
                                        if (e.target.checked && wrapperFields.length === 0) {
                                            // 기본 래퍼 필드 추가
                                            setWrapperFields([
                                                { name: "items", type: "itemsArray" },
                                                { name: "page", type: "page", value: 1 },
                                                { name: "last", type: "last" },
                                                { name: "rows", type: "rows" },
                                                { name: "total", type: "total" },
                                            ]);
                                            setItemsFieldName("items");
                                            setIsArray(true);
                                        }
                                    }}
                                    className="accent-[var(--color-accent-purple)]"
                                />
                                <span className="text-sm">래퍼 응답</span>
                                <span className="text-[10px] text-[var(--color-dark-400)]">(페이지네이션)</span>
                            </label>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tab-group">
                        <button
                            className={`tab-item ${activeTab === "source" ? "active" : ""}`}
                            onClick={() => setActiveTab("source")}
                        >
                            소스 코드
                        </button>
                        <button
                            className={`tab-item ${activeTab === "fields" ? "active" : ""}`}
                            onClick={() => setActiveTab("fields")}
                        >
                            필드 설정 ({fields.length})
                        </button>
                        <button
                            className={`tab-item ${activeTab === "template" ? "active" : ""}`}
                            onClick={() => setActiveTab("template")}
                        >
                            JSON 템플릿
                        </button>
                        {useWrapper && (
                            <button
                                className={`tab-item ${activeTab === "wrapper" ? "active" : ""}`}
                                onClick={() => setActiveTab("wrapper")}
                            >
                                <span className="flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="3" y1="9" x2="21" y2="9" />
                                        <line x1="3" y1="15" x2="21" y2="15" />
                                    </svg>
                                    래퍼 설정 ({wrapperFields.length})
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Tab Content */}
                    {activeTab === "source" && (
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                {SOURCE_TYPES.map((st) => (
                                    <button
                                        key={st.value}
                                        onClick={() => setSourceType(st.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${sourceType === st.value
                                            ? "bg-[var(--color-accent-blue)] border-[var(--color-accent-blue)] text-white"
                                            : "bg-[var(--color-dark-700)] border-[var(--color-dark-500)] text-[var(--color-dark-300)] hover:text-white hover:border-[var(--color-dark-400)]"
                                            }`}
                                    >
                                        {st.label}
                                    </button>
                                ))}
                            </div>

                            {sourceType !== "manual" && (
                                <>
                                    <textarea
                                        value={sourceCode}
                                        onChange={(e) => setSourceCode(e.target.value)}
                                        className="textarea-dark"
                                        style={{ minHeight: "200px" }}
                                        placeholder={
                                            SOURCE_TYPES.find((st) => st.value === sourceType)?.placeholder || ""
                                        }
                                    />
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleParse}
                                            disabled={parsing || !sourceCode.trim()}
                                            className="btn-primary"
                                        >
                                            {parsing && <span className="spinner" style={{ width: 14, height: 14 }}></span>}
                                            코드 분석 → 필드 생성
                                        </button>
                                        {sourceType === "typescript" && (
                                            <span className="text-[10px] text-[var(--color-dark-400)]">
                                                💡 래퍼 응답 구조 (items + page/total 등)를 자동 감지합니다
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}

                            {sourceType === "manual" && (
                                <div className="text-sm text-[var(--color-dark-300)] p-4 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                                    <p className="mb-2">📝 수동 모드에서는 &ldquo;필드 설정&rdquo; 탭에서 직접 필드를 추가하거나,</p>
                                    <p>&ldquo;JSON 템플릿&rdquo; 탭에서 대괄호 규칙을 사용한 JSON을 작성할 수 있습니다.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "fields" && (
                        <div className="space-y-3">
                            {fields.map((field, index) => (
                                <FieldEditor
                                    key={index}
                                    field={field}
                                    index={index}
                                    onUpdate={updateField}
                                    onUpdateRule={updateFieldRule}
                                    onRemove={removeField}
                                />
                            ))}

                            <button onClick={addField} className="btn-secondary w-full justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                필드 추가
                            </button>
                        </div>
                    )}

                    {activeTab === "template" && (
                        <div className="space-y-4">
                            <div className="text-sm text-[var(--color-dark-300)] p-4 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                                <p className="font-semibold mb-2 text-[#e2e8f0]">🔄 대괄호 규칙 가이드</p>
                                <ul className="space-y-1 text-xs leading-relaxed">
                                    <li><code className="text-[var(--color-accent-cyan)]">[1]</code> → 1자리 랜덤 숫자 (0~9)</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[100]</code> → 3자리 랜덤 숫자 (100~999)</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[2026-01-10]</code> → 랜덤 날짜 생성</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[uuid]</code> → UUID 생성</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[email]</code> → 이메일 생성</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[phone]</code> → 전화번호 생성</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[increment]</code> → 자동 증가</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[text]</code> → 랜덤 텍스트</li>
                                    <li><code className="text-[var(--color-accent-cyan)]">[옵션1,옵션2,옵션3]</code> → 목록에서 랜덤 선택</li>
                                </ul>
                            </div>

                            <textarea
                                value={responseTemplate}
                                onChange={(e) => setResponseTemplate(e.target.value)}
                                className="textarea-dark"
                                style={{ minHeight: "240px" }}
                                placeholder={`{
  "cctv_id": "cctv_[1]",
  "name": "[text]",
  "status": "[활성,비활성,점검중]",
  "reg_date": "[2026-01-10]",
  "ip_address": "192.168.[100].[100]"
}`}
                            />
                        </div>
                    )}

                    {activeTab === "wrapper" && useWrapper && (
                        <div className="space-y-4">
                            <div className="text-sm text-[var(--color-dark-300)] p-4 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                                <p className="font-semibold mb-2 text-[#e2e8f0]">📦 래퍼 응답 설정</p>
                                <p className="text-xs leading-relaxed mb-2">
                                    페이지네이션 등의 메타데이터와 함께 아이템 배열을 감싸는 응답 구조를 설정합니다.
                                </p>
                                <pre className="text-xs text-[var(--color-accent-cyan)] bg-[var(--color-dark-800)] p-3 rounded-lg mt-2">
                                    {`{
  "items": [...],  // 아이템 배열
  "page": 1,       // 현재 페이지
  "last": 10,      // 마지막 페이지
  "rows": 5,       // 페이지 크기
  "total": 50      // 전체 건수
}`}
                                </pre>
                            </div>

                            {/* Items 필드명 설정 */}
                            <div>
                                <label className="text-[10px] uppercase tracking-wider text-[var(--color-dark-300)] mb-1 block">
                                    아이템 배열 필드명
                                </label>
                                <input
                                    type="text"
                                    value={itemsFieldName}
                                    onChange={(e) => {
                                        setItemsFieldName(e.target.value);
                                        // wrapperFields에서 itemsArray 타입의 name도 업데이트
                                        setWrapperFields(wrapperFields.map(wf =>
                                            wf.type === "itemsArray" ? { ...wf, name: e.target.value } : wf
                                        ));
                                    }}
                                    className="input-dark font-mono text-sm"
                                    placeholder="items"
                                />
                            </div>

                            {/* 래퍼 필드 목록 */}
                            <div className="space-y-2">
                                {wrapperFields.map((wf, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-3 items-center p-3 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]"
                                    >
                                        <div className="flex-1">
                                            <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">필드명</label>
                                            <input
                                                type="text"
                                                value={wf.name}
                                                onChange={(e) => updateWrapperField(index, { name: e.target.value })}
                                                className="input-dark font-mono text-sm"
                                                placeholder="field_name"
                                            />
                                        </div>
                                        <div style={{ width: "150px" }}>
                                            <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">타입</label>
                                            <select
                                                value={wf.type}
                                                onChange={(e) => updateWrapperField(index, { type: e.target.value as WrapperField["type"] })}
                                                className="select-dark text-sm"
                                            >
                                                {WRAPPER_FIELD_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {(wf.type === "static" || wf.type === "page") && (
                                            <div style={{ width: "100px" }}>
                                                <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">값</label>
                                                <input
                                                    type="text"
                                                    value={wf.value ?? ""}
                                                    onChange={(e) => {
                                                        const val = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                                                        updateWrapperField(index, { value: val });
                                                    }}
                                                    className="input-dark text-sm"
                                                    placeholder="값"
                                                />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeWrapperField(index)}
                                            className="btn-icon mt-5 hover:!text-[var(--color-accent-red)]"
                                            title="삭제"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button onClick={addWrapperField} className="btn-secondary w-full justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                래퍼 필드 추가
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--color-dark-600)]">
                    <button onClick={onClose} className="btn-secondary">
                        취소
                    </button>
                    <button onClick={handleSubmit} className="btn-primary">
                        {isEdit ? "업데이트" : "생성"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Field Editor Sub-component
function FieldEditor({
    field,
    index,
    onUpdate,
    onUpdateRule,
    onRemove,
}: {
    field: FieldDefinition;
    index: number;
    onUpdate: (index: number, updates: Partial<FieldDefinition>) => void;
    onUpdateRule: (index: number, ruleUpdates: Partial<FieldRule>) => void;
    onRemove: (index: number) => void;
}) {
    return (
        <div className="p-4 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] space-y-3">
            <div className="flex gap-3 items-start">
                {/* Field Name */}
                <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-dark-300)] mb-1 block">
                        필드명
                    </label>
                    <input
                        type="text"
                        value={field.name}
                        onChange={(e) => onUpdate(index, { name: e.target.value })}
                        className="input-dark font-mono text-sm"
                        placeholder="field_name"
                    />
                </div>

                {/* Field Type */}
                <div style={{ width: "130px" }}>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-dark-300)] mb-1 block">
                        타입
                    </label>
                    <select
                        value={field.type}
                        onChange={(e) => onUpdate(index, { type: e.target.value as FieldDefinition["type"] })}
                        className="select-dark text-sm"
                    >
                        {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                {/* Rule Type */}
                <div style={{ width: "150px" }}>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-dark-300)] mb-1 block">
                        규칙
                    </label>
                    <select
                        value={field.rule.type}
                        onChange={(e) => onUpdateRule(index, { type: e.target.value as RuleType })}
                        className="select-dark text-sm"
                    >
                        {RULE_TYPES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                </div>

                {/* Remove */}
                <button
                    onClick={() => onRemove(index)}
                    className="btn-icon mt-5 hover:!text-[var(--color-accent-red)]"
                    title="삭제"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Rule Options */}
            <RuleOptions field={field} index={index} onUpdateRule={onUpdateRule} />

            {/* JSON Sample for json_string type */}
            {field.type === "json_string" && (
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--color-dark-300)] mb-1 block">
                        📋 샘플 JSON (구조 유지, 값만 랜덤 생성)
                    </label>
                    <textarea
                        value={field.rule.jsonSample || ""}
                        onChange={(e) => onUpdateRule(index, { jsonSample: e.target.value })}
                        className="textarea-dark font-mono text-xs"
                        style={{ minHeight: "100px" }}
                        placeholder={`[{"LTD": 36.9888, "LNGT": 126.8251, "OPTNM": "(C1)", "VIDEO": "133343070468", ...}]`}
                    />
                    <p className="text-[10px] text-[var(--color-dark-400)] mt-1">
                        💡 실제 데이터를 붙여넣기 하면, 같은 구조로 랜덤 데이터를 생성합니다
                    </p>
                </div>
            )}
        </div>
    );
}

// Rule Options Sub-component
function RuleOptions({
    field,
    index,
    onUpdateRule,
}: {
    field: FieldDefinition;
    index: number;
    onUpdateRule: (index: number, ruleUpdates: Partial<FieldRule>) => void;
}) {
    const { rule } = field;

    switch (rule.type) {
        case "static":
            return (
                <input
                    type="text"
                    value={rule.template || ""}
                    onChange={(e) => onUpdateRule(index, { template: e.target.value })}
                    className="input-dark text-sm"
                    placeholder="고정값 입력"
                />
            );

        case "increment":
            return (
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">시작값</label>
                        <input
                            type="number"
                            value={rule.min ?? 1}
                            onChange={(e) => onUpdateRule(index, { min: Number(e.target.value) })}
                            className="input-dark text-sm"
                        />
                    </div>
                </div>
            );

        case "random_int":
        case "random_float":
            return (
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">최소</label>
                        <input
                            type="number"
                            value={rule.min ?? 0}
                            onChange={(e) => onUpdateRule(index, { min: Number(e.target.value) })}
                            className="input-dark text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">최대</label>
                        <input
                            type="number"
                            value={rule.max ?? 1000}
                            onChange={(e) => onUpdateRule(index, { max: Number(e.target.value) })}
                            className="input-dark text-sm"
                        />
                    </div>
                </div>
            );

        case "date":
        case "datetime":
            return (
                <div>
                    <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">날짜 포맷</label>
                    <input
                        type="text"
                        value={rule.format || (rule.type === "datetime" ? "YYYY-MM-DDTHH:mm:ss" : "YYYY-MM-DD")}
                        onChange={(e) => onUpdateRule(index, { format: e.target.value })}
                        className="input-dark text-sm"
                        placeholder="YYYY-MM-DD"
                    />
                </div>
            );

        case "pick":
            return (
                <div>
                    <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">
                        선택 목록 (콤마로 구분)
                    </label>
                    <input
                        type="text"
                        value={(rule.options || []).join(", ")}
                        onChange={(e) =>
                            onUpdateRule(index, {
                                options: e.target.value.split(",").map((s) => s.trim()),
                            })
                        }
                        className="input-dark text-sm"
                        placeholder="옵션1, 옵션2, 옵션3"
                    />
                </div>
            );

        case "template":
            return (
                <div>
                    <label className="text-[10px] text-[var(--color-dark-300)] mb-1 block">
                        템플릿 (대괄호 안이 재생성됨)
                    </label>
                    <input
                        type="text"
                        value={rule.template || ""}
                        onChange={(e) => onUpdateRule(index, { template: e.target.value })}
                        className="input-dark font-mono text-sm"
                        placeholder='cctv_[1] 또는 [2026-01-10]'
                    />
                </div>
            );

        default:
            return null;
    }
}
