export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type SourceType = "typescript" | "java" | "ddl" | "manual";

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "integer"
  | "float"
  | "text"
  | "uuid"
  | "email"
  | "url"
  | "phone"
  | "array"
  | "object"
  | "json_string";

export type RuleType =
  | "static"       // 고정값
  | "increment"    // 자동 증가
  | "random_int"   // 랜덤 정수
  | "random_float" // 랜덤 실수
  | "random_text"  // 랜덤 텍스트
  | "date"         // 날짜 생성
  | "datetime"     // 날짜시간 생성
  | "uuid"         // UUID 생성
  | "email"        // 이메일 생성
  | "phone"        // 전화번호 생성
  | "pick"         // 목록에서 선택
  | "template";    // 템플릿 (대괄호 규칙)

export interface FieldRule {
  type: RuleType;
  prefix?: string;       // template에서 고정 접두사
  min?: number;          // 숫자 범위 최소
  max?: number;          // 숫자 범위 최대
  format?: string;       // 날짜 포맷 등
  options?: string[];    // pick 목록
  template?: string;     // 템플릿 문자열 (예: "cctv_[increment]")
  jsonSample?: string;   // json_string 타입: 샘플 JSON (구조 유지하며 값만 랜덤 생성)
}

export interface FieldDefinition {
  name: string;
  type: FieldType;
  rule: FieldRule;
  children?: FieldDefinition[]; // object/array 타입 내부 필드
}

export interface WrapperField {
  name: string;
  type: "static" | "itemsArray" | "page" | "total" | "rows" | "last";
  value?: string | number;
}

export interface MockApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;           // 예: /api/mock/cameras
  description: string;
  sourceType: SourceType;
  sourceCode: string;      // 원본 코드 (TS Type, Java Class, DDL 등)
  fields: FieldDefinition[];
  responseTemplate: string; // JSON 템플릿 (대괄호 규칙 포함)
  isArray: boolean;         // 배열 응답 여부
  arrayCount: number;       // 배열 개수
  statusCode: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  useWrapper: boolean;              // 래퍼 응답 사용 여부 (pagination 등)
  wrapperFields: WrapperField[];    // 래퍼 필드 구성
  itemsFieldName: string;           // items 배열의 필드명 (기본: "items")
}

export interface MockApiStore {
  endpoints: MockApiEndpoint[];
}
