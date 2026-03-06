"use client";

import { useState, useEffect, useCallback } from "react";
import { MockApiEndpoint, HttpMethod, SourceType, FieldDefinition, WrapperField } from "@/types/api";
import EndpointList from "@/components/EndpointList";
import CreateEndpointModal from "@/components/CreateEndpointModal";
import PreviewPanel from "@/components/PreviewPanel";
import ImportModal from "@/components/ImportModal";
import ManualModal from "@/components/ManualModal";
import PromptModal from "@/components/PromptModal";

const STORAGE_KEY = "mock-api-endpoints";

function saveToStorage(endpoints: MockApiEndpoint[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(endpoints));
  } catch {
    // sessionStorage 쓰기 실패 무시
  }
}

export default function Home() {
  const [endpoints, setEndpoints] = useState<MockApiEndpoint[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<MockApiEndpoint | null>(null);
  const [previewEndpoint, setPreviewEndpoint] = useState<MockApiEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // null=미표시, []=전체삭제, [...ids]=선택삭제
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string[] | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportClipboard = async () => {
    try {
      const res = await fetch("/api/endpoints/export");
      const data = await res.json();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      showToast(`${data.endpoints.length}개 API 설정이 클립보드에 복사되었습니다`);
    } catch {
      showToast("클립보드 복사에 실패했습니다", "error");
    }
  };

  const handleExportFile = async () => {
    try {
      const res = await fetch("/api/endpoints/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mock-api-config-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`${data.endpoints.length}개 API 설정이 파일로 저장되었습니다`);
    } catch {
      showToast("파일 저장에 실패했습니다", "error");
    }
  };

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await fetch("/api/endpoints");
      const data = await res.json();
      setEndpoints(data);
      saveToStorage(data);
    } catch (error) {
      console.error("Failed to fetch endpoints:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드: sessionStorage 우선, 없으면 서버에서 fetch
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: MockApiEndpoint[] = JSON.parse(stored);
        if (parsed.length > 0) {
          setEndpoints(parsed);
          setLoading(false);
          // 서버 세션 복구 (백그라운드)
          fetch("/api/endpoints/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoints: parsed }),
          });
          return;
        }
      }
    } catch {
      // 파싱 실패 시 서버에서 fetch
    }
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleCreate = async (data: {
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
  }) => {
    try {
      const res = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const newEndpoint: MockApiEndpoint = await res.json();
        const updated = [newEndpoint, ...endpoints];
        setEndpoints(updated);
        saveToStorage(updated);
        setShowCreate(false);
      }
    } catch (error) {
      console.error("Failed to create endpoint:", error);
    }
  };

  const handleUpdate = async (id: string, data: Partial<MockApiEndpoint>) => {
    try {
      const res = await fetch(`/api/endpoints/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const updatedEndpoint: MockApiEndpoint = await res.json();
        const updated = endpoints.map((ep) => ep.id === id ? updatedEndpoint : ep);
        setEndpoints(updated);
        saveToStorage(updated);
        setEditingEndpoint(null);
      }
    } catch (error) {
      console.error("Failed to update endpoint:", error);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await fetch(`/api/endpoints/${deleteTargetId}`, { method: "DELETE" });
      const updated = endpoints.filter((ep) => ep.id !== deleteTargetId);
      setEndpoints(updated);
      saveToStorage(updated);
      if (previewEndpoint?.id === deleteTargetId) setPreviewEndpoint(null);
    } catch (error) {
      console.error("Failed to delete endpoint:", error);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/endpoints/${id}/toggle`, { method: "PATCH" });
      if (res.ok) {
        const toggled: MockApiEndpoint = await res.json();
        const updated = endpoints.map((ep) => ep.id === id ? toggled : ep);
        setEndpoints(updated);
        saveToStorage(updated);
      }
    } catch (error) {
      console.error("Failed to toggle endpoint:", error);
    }
  };

  // ids=[] → 전체 삭제, ids=[...] → 선택 삭제
  const handleBulkDelete = (ids: string[]) => {
    setBulkDeleteTarget(ids);
  };

  const confirmBulkDelete = async () => {
    if (bulkDeleteTarget === null) return;
    try {
      const body = bulkDeleteTarget.length > 0
        ? { ids: bulkDeleteTarget }
        : {};
      await fetch("/api/endpoints", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = bulkDeleteTarget.length > 0
        ? endpoints.filter((ep) => !bulkDeleteTarget.includes(ep.id))
        : [];
      setEndpoints(updated);
      saveToStorage(updated);
      if (previewEndpoint && (bulkDeleteTarget.length === 0 || bulkDeleteTarget.includes(previewEndpoint.id))) {
        setPreviewEndpoint(null);
      }
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    } finally {
      setBulkDeleteTarget(null);
    }
  };

  const deleteTarget = deleteTargetId
    ? endpoints.find((ep) => ep.id === deleteTargetId)
    : null;

  return (
    <div className="min-h-screen bg-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-dark-600)]" style={{ background: "rgba(10, 11, 15, 0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-accent-purple)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Mock API Studio</h1>
              <p className="text-xs text-[var(--color-dark-300)]">더미 API 생성기 · 응답을 즉시 만들어 테스트하세요</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Import 프롬프트 */}
            <button
              onClick={() => setShowPrompt(true)}
              className="btn-secondary"
              title="Import 프롬프트 보기"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              프롬프트
            </button>

            {/* 매뉴얼 */}
            <button
              onClick={() => setShowManual(true)}
              className="btn-secondary"
              title="사용 매뉴얼"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              매뉴얼
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] text-xs text-[var(--color-dark-300)]">
              <span className="status-dot active"></span>
              <span>{endpoints.filter(e => e.enabled).length}개 활성</span>
              <span className="mx-1 text-[var(--color-dark-500)]">|</span>
              <span>{endpoints.length}개 전체</span>
            </div>

            {/* 가져오기 */}
            <button
              onClick={() => setShowImport(true)}
              className="btn-icon"
              title="설정 가져오기"
              style={{ width: 36, height: 36 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>

            {/* 내보내기 드롭다운 */}
            <div className="relative group">
              <button
                className="btn-icon"
                title="설정 내보내기"
                style={{ width: 36, height: 36 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[var(--color-dark-500)] py-1 hidden group-hover:block" style={{ background: "var(--color-dark-700)", zIndex: 60 }}>
                <button
                  onClick={handleExportClipboard}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-dark-600)] transition-colors flex items-center gap-2"
                >
                  📋 클립보드에 복사
                </button>
                <button
                  onClick={handleExportFile}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-dark-600)] transition-colors flex items-center gap-2"
                >
                  💾 파일로 저장
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingEndpoint(null);
                setShowCreate(true);
              }}
              className="btn-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              새 API 생성
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-6" style={{ minHeight: "calc(100vh - 100px)" }}>
          {/* Left: Endpoint List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <EndpointList
                endpoints={endpoints}
                onEdit={(ep) => {
                  setEditingEndpoint(ep);
                  setShowCreate(true);
                }}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                onToggle={handleToggle}
                onPreview={setPreviewEndpoint}
                selectedId={previewEndpoint?.id}
              />
            )}
          </div>

          {/* Right: Preview Panel */}
          {previewEndpoint && (
            <div className="w-[480px] shrink-0 hidden lg:block">
              <PreviewPanel endpoint={previewEndpoint} />
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showCreate && (
        <CreateEndpointModal
          endpoint={editingEndpoint}
          onClose={() => {
            setShowCreate(false);
            setEditingEndpoint(null);
          }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {/* Delete Confirmation Modal (단건) */}
      {deleteTargetId && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteTargetId(null)}
          style={{ zIndex: 100 }}
        >
          <div
            className="glass-card p-6 max-w-[400px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeIn 0.15s ease-out" }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(239, 68, 68, 0.12)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold mb-1">API 삭제</h3>
                <p className="text-sm text-[var(--color-dark-300)]">
                  이 API를 삭제하시겠습니까?
                </p>
                {deleteTarget && (
                  <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                    <code className="text-xs text-[var(--color-accent-cyan)] font-mono">
                      {deleteTarget.method} {deleteTarget.path}
                    </code>
                  </div>
                )}
                <p className="text-xs text-[var(--color-dark-400)] mt-2">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  background: "var(--color-accent-red)",
                  color: "white",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteTarget !== null && (
        <div
          className="modal-overlay"
          onClick={() => setBulkDeleteTarget(null)}
          style={{ zIndex: 100 }}
        >
          <div
            className="glass-card p-6 max-w-[400px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "fadeIn 0.15s ease-out" }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(239, 68, 68, 0.12)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold mb-1">일괄 삭제</h3>
                <p className="text-sm text-[var(--color-dark-300)]">
                  {bulkDeleteTarget.length === 0
                    ? `전체 ${endpoints.length}개 API를 모두 삭제하시겠습니까?`
                    : `선택한 ${bulkDeleteTarget.length}개 API를 삭제하시겠습니까?`}
                </p>
                <p className="text-xs text-[var(--color-dark-400)] mt-2">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setBulkDeleteTarget(null)}
                className="btn-secondary"
              >
                취소
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  background: "var(--color-accent-red)",
                  color: "white",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {bulkDeleteTarget.length === 0 ? "전체 삭제" : `${bulkDeleteTarget.length}개 삭제`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => fetchEndpoints()}
        />
      )}

      {/* Manual Modal */}
      {showManual && (
        <ManualModal onClose={() => setShowManual(false)} />
      )}

      {/* Prompt Modal */}
      {showPrompt && (
        <PromptModal onClose={() => setShowPrompt(false)} />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2"
          style={{
            zIndex: 200,
            animation: "fadeIn 0.2s ease-out",
            background: toast.type === "success"
              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))"
              : "linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))",
            color: "white",
            backdropFilter: "blur(10px)",
          }}
        >
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </div>
  );
}
