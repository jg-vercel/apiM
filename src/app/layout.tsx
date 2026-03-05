import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock API Studio — 더미 API 생성기",
  description:
    "TypeScript, Java, DDL 코드로 즉시 더미 API를 생성하세요. 대괄호 규칙으로 동적 데이터를 쉽게 만들 수 있습니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
