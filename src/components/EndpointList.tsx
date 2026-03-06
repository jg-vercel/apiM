"use client";

import { useState } from "react";
import { MockApiEndpoint } from "@/types/api";

interface Props {
    endpoints: MockApiEndpoint[];
    onEdit: (endpoint: MockApiEndpoint) => void;
    onDelete: (id: string) => void;
    onBulkDelete: (ids: string[]) => void;
    onToggle: (id: string) => void;
    onPreview: (endpoint: MockApiEndpoint) => void;
    selectedId?: string;
}

const methodStyles: Record<string, string> = {
    GET: "method-get",
    POST: "method-post",
    PUT: "method-put",
    DELETE: "method-delete",
    PATCH: "method-patch",
};

const sourceLabels: Record<string, string> = {
    typescript: "TypeScript",
    java: "Java Class",
    ddl: "DDL",
    manual: "수동",
};

export default function EndpointList({
    endpoints,
    onEdit,
    onDelete,
    onBulkDelete,
    onToggle,
    onPreview,
    selectedId,
}: Props) {
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const allChecked = endpoints.length > 0 && checkedIds.size === endpoints.length;
    const someChecked = checkedIds.size > 0;

    const toggleCheck = (id: string) => {
        setCheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allChecked) {
            setCheckedIds(new Set());
        } else {
            setCheckedIds(new Set(endpoints.map((ep) => ep.id)));
        }
    };

    const handleBulkDeleteSelected = () => {
        onBulkDelete(Array.from(checkedIds));
        setCheckedIds(new Set());
    };

    const handleDeleteAll = () => {
        onBulkDelete([]);
        setCheckedIds(new Set());
    };

    if (endpoints.length === 0) {
        return (
            <div className="empty-state glass-card">
                <div className="empty-state-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">아직 등록된 API가 없습니다</h3>
                <p className="text-sm text-[var(--color-dark-300)] max-w-sm">
                    &ldquo;새 API 생성&rdquo; 버튼을 클릭하여 첫 번째 Mock API를 만들어보세요.
                    TypeScript, Java, DDL 코드로 자동 생성하거나 수동으로 등록할 수 있습니다.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* 전체 선택 체크박스 */}
                    <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={toggleAll}
                            className="w-4 h-4 rounded accent-[var(--color-accent-blue)] cursor-pointer"
                        />
                    </label>
                    <h2 className="text-sm font-semibold text-[var(--color-dark-300)] uppercase tracking-wider">
                        등록된 API 목록
                    </h2>
                    <span className="text-xs text-[var(--color-dark-400)]">
                        {endpoints.length}개
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {someChecked && (
                        <button
                            onClick={handleBulkDeleteSelected}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: "rgba(239, 68, 68, 0.12)",
                                color: "var(--color-accent-red)",
                                border: "1px solid rgba(239, 68, 68, 0.25)",
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            {checkedIds.size}개 선택 삭제
                        </button>
                    )}
                    {!someChecked && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                                background: "rgba(239, 68, 68, 0.08)",
                                color: "var(--color-dark-300)",
                                border: "1px solid rgba(239, 68, 68, 0.15)",
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            전체 삭제
                        </button>
                    )}
                </div>
            </div>

            {endpoints.map((endpoint) => (
                <div
                    key={endpoint.id}
                    className={`glass-card glass-card-hover p-4 cursor-pointer transition-all duration-200 ${selectedId === endpoint.id
                        ? "border-[var(--color-accent-blue)] glow-blue"
                        : ""
                        }`}
                    onClick={() => onPreview(endpoint)}
                >
                    <div className="flex items-start justify-between gap-4">
                        {/* Checkbox */}
                        <div className="flex items-center pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={checkedIds.has(endpoint.id)}
                                onChange={() => toggleCheck(endpoint.id)}
                                className="w-4 h-4 rounded accent-[var(--color-accent-blue)] cursor-pointer"
                            />
                        </div>

                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`method-badge ${methodStyles[endpoint.method]}`}>
                                    {endpoint.method}
                                </span>
                                <span className="font-mono text-sm font-medium text-[#e2e8f0] truncate">
                                    {endpoint.path}
                                </span>
                                <span className={`status-dot ${endpoint.enabled ? "active" : "inactive"}`}></span>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                                {endpoint.description && (
                                    <span className="text-xs text-[var(--color-dark-300)] truncate max-w-[300px]">
                                        {endpoint.description}
                                    </span>
                                )}
                                <span className="rule-tag rule-tag-auto">
                                    {sourceLabels[endpoint.sourceType]}
                                </span>
                                {endpoint.isArray && (
                                    <span className="rule-tag rule-tag-manual">
                                        배열 [{endpoint.arrayCount}]
                                    </span>
                                )}
                                {endpoint.useWrapper && (
                                    <span className="rule-tag" style={{
                                        background: "rgba(139, 92, 246, 0.12)",
                                        color: "var(--color-accent-purple)",
                                        border: "1px solid rgba(139, 92, 246, 0.2)",
                                    }}>
                                        래퍼
                                    </span>
                                )}
                                <span className="text-[10px] text-[var(--color-dark-400)]">
                                    {endpoint.fields.length}개 필드
                                </span>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {/* Toggle */}
                            <button
                                className={`toggle-switch ${endpoint.enabled ? "active" : ""}`}
                                onClick={() => onToggle(endpoint.id)}
                                title={endpoint.enabled ? "비활성화" : "활성화"}
                            />

                            {/* Edit */}
                            <button
                                className="btn-icon"
                                onClick={() => onEdit(endpoint)}
                                title="편집"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                            </button>

                            {/* Delete */}
                            <button
                                className="btn-icon hover:!text-[var(--color-accent-red)]"
                                onClick={(e) => { e.stopPropagation(); onDelete(endpoint.id); }}
                                title="삭제"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
