"use client";

import { useState, useRef } from "react";

interface Props {
    onClose: () => void;
    onImported: () => void;
}

export default function ImportModal({ onClose, onImported }: Props) {
    const [mode, setMode] = useState<"paste" | "file">("paste");
    const [jsonText, setJsonText] = useState("");
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        created: number;
        errors: string[];
    } | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setJsonText(content);
            setError("");
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!jsonText.trim()) {
            setError("JSON 데이터를 입력해주세요.");
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonText.trim());
        } catch {
            setError("올바른 JSON 형식이 아닙니다.");
            return;
        }

        setImporting(true);
        setError("");
        setResult(null);

        try {
            const res = await fetch("/api/endpoints/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsed),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({
                    success: true,
                    created: data.created,
                    errors: data.errors || [],
                });
                onImported();
            } else {
                setError(data.error || "가져오기에 실패했습니다.");
            }
        } catch {
            setError("서버 오류가 발생했습니다.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: "560px" }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold">📥 설정 가져오기</h2>
                        <p className="text-sm text-[var(--color-dark-300)] mt-1">
                            저장된 API 설정을 불러옵니다
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="tab-group mb-4">
                    <button
                        className={`tab-item ${mode === "paste" ? "active" : ""}`}
                        onClick={() => setMode("paste")}
                    >
                        📋 붙여넣기
                    </button>
                    <button
                        className={`tab-item ${mode === "file" ? "active" : ""}`}
                        onClick={() => setMode("file")}
                    >
                        📁 파일 업로드
                    </button>
                </div>

                {mode === "file" && (
                    <div className="mb-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-8 border-2 border-dashed border-[var(--color-dark-500)] rounded-xl hover:border-[var(--color-accent-blue)] transition-colors text-center cursor-pointer"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-dark-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p className="text-sm text-[var(--color-dark-300)]">
                                클릭하여 JSON 파일을 선택하세요
                            </p>
                            <p className="text-xs text-[var(--color-dark-400)] mt-1">
                                .json 파일만 지원
                            </p>
                        </button>
                    </div>
                )}

                {/* JSON Text Area (both modes) */}
                <div className="mb-4">
                    <label className="text-xs uppercase tracking-wider text-[var(--color-dark-300)] mb-2 block font-medium">
                        {mode === "paste" ? "JSON 데이터 붙여넣기" : "파일 내용 미리보기"}
                    </label>
                    <textarea
                        value={jsonText}
                        onChange={(e) => {
                            setJsonText(e.target.value);
                            setError("");
                            setResult(null);
                        }}
                        className="textarea-dark font-mono text-xs"
                        style={{ minHeight: "200px" }}
                        placeholder={`{
  "version": "1.0",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/example",
      "fields": [...]
    }
  ]
}`}
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "var(--color-accent-red)",
                    }}>
                        ❌ {error}
                    </div>
                )}

                {/* Success */}
                {result?.success && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid rgba(34, 197, 94, 0.2)",
                        color: "var(--color-accent-green)",
                    }}>
                        ✅ {result.created}개의 API가 성공적으로 등록되었습니다!
                        {result.errors.length > 0 && (
                            <div className="mt-2 text-xs text-[var(--color-dark-300)]">
                                ⚠️ 오류: {result.errors.join(", ")}
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button onClick={onClose} className="btn-secondary">
                        {result?.success ? "닫기" : "취소"}
                    </button>
                    {!result?.success && (
                        <button
                            onClick={handleImport}
                            disabled={importing || !jsonText.trim()}
                            className="btn-primary"
                            style={{ opacity: importing || !jsonText.trim() ? 0.5 : 1 }}
                        >
                            {importing ? (
                                <>
                                    <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                                    가져오는 중...
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    가져오기
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
