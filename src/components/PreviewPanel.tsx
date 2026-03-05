"use client";

import { useState, useCallback } from "react";
import { MockApiEndpoint } from "@/types/api";

interface Props {
    endpoint: MockApiEndpoint;
}

export default function PreviewPanel({ endpoint }: Props) {
    const [previewData, setPreviewData] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testResult, setTestResult] = useState<{
        status: number;
        data: string;
        time: number;
    } | null>(null);

    const generatePreview = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/endpoints/${endpoint.id}/preview`);
            const data = await res.json();
            setPreviewData(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error("Preview failed:", error);
            setPreviewData("미리보기 생성에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [endpoint.id]);

    const testEndpoint = useCallback(async () => {
        setLoading(true);
        const startTime = Date.now();
        try {
            const res = await fetch(endpoint.path, {
                method: endpoint.method,
                headers: endpoint.method !== "GET" ? { "Content-Type": "application/json" } : undefined,
                body: endpoint.method !== "GET" ? JSON.stringify({}) : undefined,
            });
            const data = await res.json();
            const elapsed = Date.now() - startTime;
            setTestResult({
                status: res.status,
                data: JSON.stringify(data, null, 2),
                time: elapsed,
            });
            setPreviewData(JSON.stringify(data, null, 2));
        } catch (error) {
            const elapsed = Date.now() - startTime;
            setTestResult({
                status: 0,
                data: `요청 실패: ${error}`,
                time: elapsed,
            });
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    const copyToClipboard = async () => {
        if (!previewData) return;
        await navigator.clipboard.writeText(previewData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyEndpointUrl = async () => {
        const fullUrl = `${window.location.origin}${endpoint.path}`;
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const methodColors: Record<string, string> = {
        GET: "#34d399",
        POST: "#60a5fa",
        PUT: "#fbbf24",
        DELETE: "#f87171",
        PATCH: "#a78bfa",
    };

    return (
        <div className="sticky top-[84px] space-y-4">
            {/* Endpoint Info Card */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-3">
                    <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: methodColors[endpoint.method] }}
                    ></span>
                    <h3 className="text-sm font-semibold">엔드포인트 정보</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                        <span
                            className="font-mono text-xs font-bold px-2 py-1 rounded"
                            style={{
                                color: methodColors[endpoint.method],
                                background: `${methodColors[endpoint.method]}15`,
                            }}
                        >
                            {endpoint.method}
                        </span>
                        <code className="text-sm text-[#e2e8f0] font-mono truncate flex-1">
                            {endpoint.path}
                        </code>
                        <button
                            className="btn-icon"
                            onClick={copyEndpointUrl}
                            title="URL 복사"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                        </button>
                    </div>

                    {endpoint.description && (
                        <p className="text-xs text-[var(--color-dark-300)]">
                            {endpoint.description}
                        </p>
                    )}

                    <div className="flex gap-2 flex-wrap text-xs">
                        <span className="rule-tag rule-tag-auto">
                            {endpoint.fields.length}개 필드
                        </span>
                        {endpoint.isArray && (
                            <span className="rule-tag rule-tag-manual">
                                배열 [{endpoint.arrayCount}]
                            </span>
                        )}
                        <span className="rule-tag" style={{
                            background: "rgba(139, 92, 246, 0.12)",
                            color: "var(--color-accent-purple)",
                            border: "1px solid rgba(139, 92, 246, 0.2)",
                        }}>
                            {endpoint.statusCode}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={generatePreview}
                    disabled={loading}
                    className="btn-primary flex-1 justify-center"
                >
                    {loading ? (
                        <span className="spinner" style={{ width: 14, height: 14 }}></span>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    )}
                    미리보기
                </button>
                <button
                    onClick={testEndpoint}
                    disabled={loading || !endpoint.enabled}
                    className="btn-secondary flex-1 justify-center"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    API 호출
                </button>
            </div>

            {/* Test Result Info */}
            {testResult && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs" style={{
                    background: testResult.status >= 200 && testResult.status < 300
                        ? "rgba(16, 185, 129, 0.08)"
                        : "rgba(239, 68, 68, 0.08)",
                    border: `1px solid ${testResult.status >= 200 && testResult.status < 300
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(239, 68, 68, 0.2)"}`,
                }}>
                    <span
                        className="font-mono font-bold"
                        style={{
                            color: testResult.status >= 200 && testResult.status < 300
                                ? "var(--color-accent-green)"
                                : "var(--color-accent-red)",
                        }}
                    >
                        {testResult.status || "ERR"}
                    </span>
                    <span className="text-[var(--color-dark-300)]">
                        {testResult.time}ms
                    </span>
                </div>
            )}

            {/* Preview Data */}
            {previewData && (
                <div className="code-preview">
                    <div className="code-preview-header">
                        <span className="text-xs font-medium text-[var(--color-dark-300)]">
                            응답 데이터
                        </span>
                        <button
                            onClick={copyToClipboard}
                            className="btn-icon"
                            title="복사"
                        >
                            {copied ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <pre className="code-preview-body text-[var(--color-accent-cyan)]">
                        {previewData}
                    </pre>
                </div>
            )}

            {!previewData && (
                <div className="glass-card p-8 text-center">
                    <p className="text-sm text-[var(--color-dark-300)]">
                        &ldquo;미리보기&rdquo; 또는 &ldquo;API 호출&rdquo;을 클릭하여<br />
                        응답 데이터를 확인하세요
                    </p>
                </div>
            )}
        </div>
    );
}
