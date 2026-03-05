"use client";

import { useState } from "react";

interface Props {
    onClose: () => void;
}

interface ManualStep {
    title: string;
    description: string;
    image: string;
    tips?: string[];
}

const MANUAL_STEPS: ManualStep[] = [
    {
        title: "1. 메인 화면",
        description:
            "Mock API Studio의 메인 화면입니다. 상단 헤더에서 API 상태를 확인하고, 가져오기/내보내기, 새 API 생성 등의 작업을 할 수 있습니다.",
        image: "/manual/01_main_page.png",
        tips: [
            "⬇ 아이콘: 설정 가져오기 (JSON 붙여넣기 또는 파일 업로드)",
            "⬆ 아이콘: 설정 내보내기 (클립보드 복사 또는 파일 저장)",
            "+ 새 API 생성: Mock API 등록",
        ],
    },
    {
        title: "2. API 생성 - 엔드포인트 설정",
        description:
            "새 API 생성 버튼을 클릭하면 모달이 열립니다. HTTP Method, 경로, 소스 코드 유형을 설정합니다.",
        image: "/manual/02_create_modal.png",
        tips: [
            "Method: GET, POST, PUT, DELETE, PATCH 선택 가능",
            "경로: /api/ 뒤에 원하는 경로 입력",
            "소스 유형: TypeScript, Java Class, DDL, 수동 등록 중 선택",
            "배열 응답 체크 시 여러 건의 데이터가 배열로 응답됩니다",
            "래퍼 응답 체크 시 items + 페이지네이션 구조로 응답됩니다",
        ],
    },
    {
        title: "3. API 생성 - 코드 분석 & 필드 자동 생성",
        description:
            "TypeScript 인터페이스를 입력하고 '코드 분석 → 필드 생성'을 클릭하면, 각 필드의 타입과 규칙이 자동으로 추론됩니다.",
        image: "/manual/03_field_generation.png",
        tips: [
            "필드명에 id가 포함되면 → 자동 증가(increment)",
            "필드명에 email이 포함되면 → 이메일 형식",
            "필드명에 date가 포함되면 → 날짜 형식",
            "'// JSON 문자열' 주석이 있으면 → json_string 타입",
            "여러 interface가 있으면 래퍼 구조를 자동 감지",
        ],
    },
    {
        title: "4. 등록된 API 목록",
        description:
            "생성된 API가 목록에 표시됩니다. 토글 스위치로 활성/비활성화하고, 편집/삭제할 수 있습니다.",
        image: "/manual/04_endpoint_list.png",
        tips: [
            "카드 클릭: 응답 미리보기",
            "🔵 토글: API 활성/비활성화",
            "✏️ 편집: API 설정 수정",
            "🗑 삭제: API 제거",
        ],
    },
    {
        title: "5. 응답 미리보기 & API 호출",
        description:
            "API 카드 클릭 시 우측에 미리보기 패널이 열립니다. '미리보기'로 생성될 데이터를 확인하고, 'API 호출'로 실제 Mock API를 테스트할 수 있습니다.",
        image: "/manual/05_preview_panel.png",
        tips: [
            "미리보기 버튼: 서버에서 데이터를 생성하여 미리 확인",
            "API 호출 버튼: 실제 Mock API URL로 요청",
            "상단의 엔드포인트 URL을 복사하여 프론트엔드에서 사용",
            "호출할 때마다 새로운 랜덤 데이터가 생성됩니다",
        ],
    },
    {
        title: "6. 설정 내보내기",
        description:
            "상단 내보내기(⬆) 버튼에 마우스를 올리면 드롭다운이 나타납니다. 전체 API 설정을 JSON으로 저장할 수 있습니다.",
        image: "/manual/06_export_dropdown.png",
        tips: [
            "📋 클립보드에 복사: JSON을 클립보드에 복사하여 다른 사람에게 공유",
            "💾 파일로 저장: mock-api-config-YYYY-MM-DD.json 파일로 다운로드",
            "팀원에게 설정을 공유하거나 백업할 때 유용합니다",
        ],
    },
    {
        title: "7. 설정 가져오기",
        description:
            "상단 가져오기(⬇) 버튼을 클릭하면 모달이 열립니다. 저장된 JSON을 붙여넣거나 파일을 업로드하여 API를 일괄 등록할 수 있습니다.",
        image: "/manual/07_import_modal.png",
        tips: [
            "📋 붙여넣기 탭: 클립보드에 복사된 JSON을 직접 붙여넣기",
            "📁 파일 업로드 탭: .json 파일을 선택하여 업로드",
            "기존 API는 유지되고, 새로운 API만 추가됩니다",
        ],
    },
];

export default function ManualModal({ onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = MANUAL_STEPS[currentStep];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: "800px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">📖 사용 매뉴얼</h2>
                        <p className="text-sm text-[var(--color-dark-300)] mt-1">
                            Mock API Studio 사용 가이드
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Step Navigation (mini dots) */}
                <div className="flex items-center gap-2 mb-4 shrink-0">
                    {MANUAL_STEPS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentStep(idx)}
                            className="transition-all"
                            style={{
                                width: currentStep === idx ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: currentStep === idx
                                    ? "var(--color-accent-blue)"
                                    : "var(--color-dark-500)",
                            }}
                        />
                    ))}
                    <span className="text-xs text-[var(--color-dark-400)] ml-2">
                        {currentStep + 1} / {MANUAL_STEPS.length}
                    </span>
                </div>

                {/* Content (scrollable) */}
                <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                    {/* Step Title */}
                    <h3 className="text-lg font-bold mb-2 text-[#e2e8f0]">
                        {step.title}
                    </h3>
                    <p className="text-sm text-[var(--color-dark-300)] mb-4 leading-relaxed">
                        {step.description}
                    </p>

                    {/* Screenshot */}
                    <div
                        className="rounded-xl overflow-hidden border border-[var(--color-dark-500)] mb-4"
                        style={{ background: "var(--color-dark-800)" }}
                    >
                        <img
                            src={step.image}
                            alt={step.title}
                            className="w-full"
                            style={{ display: "block" }}
                        />
                    </div>

                    {/* Tips */}
                    {step.tips && step.tips.length > 0 && (
                        <div
                            className="rounded-xl p-4 mb-4"
                            style={{
                                background: "rgba(99, 102, 241, 0.06)",
                                border: "1px solid rgba(99, 102, 241, 0.15)",
                            }}
                        >
                            <p className="text-xs font-semibold text-[var(--color-accent-blue)] mb-2 uppercase tracking-wider">
                                💡 팁
                            </p>
                            <ul className="space-y-1.5">
                                {step.tips.map((tip, idx) => (
                                    <li key={idx} className="text-sm text-[var(--color-dark-200)] flex items-start gap-2">
                                        <span className="text-[var(--color-dark-400)] mt-0.5">•</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-dark-600)] shrink-0">
                    <button
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className="btn-secondary flex items-center gap-2"
                        style={{ opacity: currentStep === 0 ? 0.4 : 1 }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        이전
                    </button>

                    <div className="text-xs text-[var(--color-dark-400)]">
                        {step.title}
                    </div>

                    {currentStep < MANUAL_STEPS.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep((prev) => Math.min(MANUAL_STEPS.length - 1, prev + 1))}
                            className="btn-primary flex items-center gap-2"
                        >
                            다음
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    ) : (
                        <button onClick={onClose} className="btn-primary">
                            닫기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
