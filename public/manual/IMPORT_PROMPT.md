# 🔧 Mock API Generator - 프로젝트 분석 프롬프트

> 다른 프로젝트에서 AI(Gemini, Cursor, Copilot 등)에게 이 프롬프트를 보내면,  
> 해당 프로젝트의 API를 분석하여 Mock API Generator에 import할 수 있는 JSON을 생성해줍니다.

---

## 사용법

1. 분석하고 싶은 프로젝트를 에디터에서 엽니다
2. 아래 프롬프트를 해당 프로젝트의 AI 어시스턴트에게 전달합니다
3. 생성된 JSON을 복사합니다
4. Mock API Generator (`http://localhost:3000`)에서 **Import** 버튼 → JSON 붙여넣기 → 가져오기

---

## 프롬프트

````
이 프로젝트의 API 엔드포인트를 분석하여, Mock API Generator에 import할 수 있는 JSON 데이터를 생성해줘.

## 분석 대상
- API 라우트/컨트롤러 파일 (예: route.ts, controller.java, views.py 등)
- API 요청/응답에 사용되는 타입/인터페이스/DTO/Entity
- API 호출 코드 (fetch, axios, httpClient 등)
- Swagger/OpenAPI 명세가 있다면 그것도 참고

## 생성해야 할 JSON 형식

반드시 아래 형식을 지켜서 JSON을 생성해줘. 올바른 JSON이어야 하며, 코드블록 안에 넣어서 제공해줘.

```json
{
  "version": "1.0",
  "endpoints": [
    {
      "method": "GET | POST | PUT | DELETE | PATCH",
      "path": "/api/mock/경로",
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
```

## 필드 타입 (type) - 반드시 아래 중 하나를 사용
- `"string"` - 문자열
- `"number"` - 숫자
- `"boolean"` - 참/거짓
- `"date"` - 날짜 (YYYY-MM-DD)
- `"datetime"` - 날짜시간 (YYYY-MM-DDTHH:mm:ss)
- `"integer"` - 정수
- `"float"` - 실수
- `"text"` - 긴 텍스트
- `"uuid"` - UUID
- `"email"` - 이메일
- `"url"` - URL
- `"phone"` - 전화번호
- `"array"` - 배열 (children에 하위 필드 정의)
- `"object"` - 객체 (children에 하위 필드 정의)
- `"json_string"` - JSON 문자열 (문자열이지만 내부가 JSON 구조)

## 규칙 타입 (rule.type) - 반드시 아래 중 하나를 사용
- `"static"` - 고정값. `rule.template`에 고정값 지정
  - 예: `{ "type": "static", "template": "ACTIVE" }`
- `"increment"` - 자동 증가. `rule.min`에 시작값 지정
  - 예: `{ "type": "increment", "min": 1 }`
- `"random_int"` - 랜덤 정수. `rule.min`, `rule.max` 지정
  - 예: `{ "type": "random_int", "min": 1, "max": 1000 }`
- `"random_float"` - 랜덤 실수. `rule.min`, `rule.max` 지정
  - 예: `{ "type": "random_float", "min": 0, "max": 100 }`
- `"random_text"` - 랜덤 텍스트
  - 예: `{ "type": "random_text" }`
- `"date"` - 날짜 생성. `rule.format` 지정
  - 예: `{ "type": "date", "format": "YYYY-MM-DD" }`
- `"datetime"` - 날짜시간 생성. `rule.format` 지정
  - 예: `{ "type": "datetime", "format": "YYYY-MM-DDTHH:mm:ss" }`
- `"uuid"` - UUID 생성
  - 예: `{ "type": "uuid" }`
- `"email"` - 이메일 생성
  - 예: `{ "type": "email" }`
- `"phone"` - 전화번호 생성
  - 예: `{ "type": "phone" }`
- `"pick"` - 목록에서 랜덤 선택. `rule.options`에 선택지 배열 지정
  - 예: `{ "type": "pick", "options": ["ACTIVE", "INACTIVE", "PENDING"] }`
  - boolean의 경우: `{ "type": "pick", "options": ["true", "false"] }`
- `"template"` - 패턴 기반 생성. `rule.template`에 대괄호 규칙 사용
  - 대괄호 내 숫자: 해당 자릿수 범위의 랜덤 정수로 치환
    - 예: `{ "type": "template", "template": "CAM_[001]" }` → "CAM_482"
  - 대괄호 내 날짜: 랜덤 날짜로 치환
    - 예: `{ "type": "template", "template": "[2025-01-01]" }` → "2025-08-22"
  - 대괄호 내 키워드: increment, uuid, email, phone, text, random 사용 가능
    - 예: `{ "type": "template", "template": "USER_[increment]" }` → "USER_1", "USER_2"...
  - 대괄호 내 콤마 구분 선택지: 랜덤 선택
    - 예: `{ "type": "template", "template": "Status: [활성, 비활성, 대기]" }` → "Status: 활성"

## 중첩 구조 (object, array) 사용법
object나 array 타입의 경우 `children` 배열에 하위 필드를 정의:

```json
{
  "name": "address",
  "type": "object",
  "rule": { "type": "static" },
  "children": [
    { "name": "city", "type": "string", "rule": { "type": "pick", "options": ["서울", "부산", "대구"] } },
    { "name": "zipCode", "type": "string", "rule": { "type": "template", "template": "[10000]-[100]" } }
  ]
}
```

```json
{
  "name": "tags",
  "type": "array",
  "rule": { "type": "random_int", "min": 1, "max": 3 },
  "children": [
    { "name": "id", "type": "integer", "rule": { "type": "increment", "min": 1 } },
    { "name": "label", "type": "string", "rule": { "type": "random_text" } }
  ]
}
```

## json_string 타입 사용법
응답 필드 중 값이 JSON을 문자열로 담고 있는 경우 `json_string` 타입 사용.
`rule.jsonSample`에 샘플 JSON 문자열을 넣으면 구조를 유지하면서 값만 랜덤으로 생성:

```json
{
  "name": "metadata",
  "type": "json_string",
  "rule": {
    "type": "template",
    "template": "{}",
    "jsonSample": "{\"resolution\":\"1920x1080\",\"fps\":30,\"codec\":\"H.264\"}"
  }
}
```

## 래퍼(Wrapper) 응답 사용법
페이지네이션이 있는 API의 경우 `useWrapper: true`로 설정:

```json
{
  "method": "GET",
  "path": "/api/mock/users",
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
```

래퍼 필드의 type 종류:
- `"itemsArray"` - 아이템 배열이 들어갈 위치
- `"page"` - 현재 페이지 번호 (value로 기본값 지정)
- `"total"` - 전체 아이템 수 (자동 계산)
- `"rows"` - 페이지당 아이템 수 (arrayCount와 동일)
- `"last"` - 마지막 페이지 (자동 계산)
- `"static"` - 고정값 (value에 값 지정)

## 분석 및 생성 규칙

1. **path는 `/api/mock/`으로 시작**해야 합니다
   - 원본이 `/api/v1/users`이면 → `/api/mock/users`로 변환
   - 원본이 `/cameras/list`이면 → `/api/mock/cameras/list`로 변환

2. **필드명은 실제 API 응답의 필드명**을 그대로 사용하세요

3. **규칙을 필드명과 데이터 특성에 맞게 추론**해주세요:
   - id, xxx_id → `increment`
   - email → `email`
   - phone, tel → `phone`
   - created_at, updated_at → `datetime`
   - status, type, category 같은 enum → `pick` + 실제 사용되는 값들
   - name → `random_text`
   - latitude, longitude → `random_float` (적절한 범위)
   - boolean 필드 → `pick` with ["true", "false"]
   - URL → `template` with `"http://example.com/[10000]"`

4. **페이지네이션 응답**이면 `useWrapper: true`를 사용하고, 응답 구조에 맞는 wrapperFields를 구성해주세요

5. **가능한 한 많은 API 엔드포인트**를 포함해주세요

6. **sourceType은 `"manual"`**로 설정해주세요

7. **sourceCode에는 원본 타입/인터페이스 코드**가 있으면 넣어주세요, 없으면 빈 문자열

8. **responseTemplate은 빈 문자열**로 두세요 (fields 기반으로 생성됨)

9. **arrayCount는 보통 5~10** 사이의 적절한 수를 지정해주세요

## 출력
- 분석한 API 목록을 간단히 설명하고
- 위 형식에 맞는 완전한 JSON을 코드블록으로 제공해줘
- JSON은 반드시 파싱 가능한 올바른 JSON이어야 해
- JSON 내 문자열에 줄바꿈이나 특수문자가 있으면 반드시 이스케이프 처리해줘
````

---

## 사용 예시

### 예시 1: Next.js 프로젝트 분석 결과

```json
{
  "version": "1.0",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/mock/cameras",
      "description": "CCTV 카메라 목록 조회",
      "sourceType": "manual",
      "sourceCode": "",
      "fields": [
        { "name": "cameraId", "type": "integer", "rule": { "type": "increment", "min": 1 } },
        { "name": "cameraName", "type": "string", "rule": { "type": "template", "template": "CAM_[001]" } },
        { "name": "location", "type": "string", "rule": { "type": "pick", "options": ["서울시청", "강남역", "여의도공원", "광화문"] } },
        { "name": "status", "type": "string", "rule": { "type": "pick", "options": ["ACTIVE", "INACTIVE", "MAINTENANCE"] } },
        { "name": "latitude", "type": "float", "rule": { "type": "random_float", "min": 33.0, "max": 38.0 } },
        { "name": "longitude", "type": "float", "rule": { "type": "random_float", "min": 124.0, "max": 132.0 } },
        { "name": "installedAt", "type": "date", "rule": { "type": "date", "format": "YYYY-MM-DD" } },
        { "name": "isOnline", "type": "boolean", "rule": { "type": "pick", "options": ["true", "false"] } }
      ],
      "responseTemplate": "",
      "isArray": true,
      "arrayCount": 10,
      "statusCode": 200,
      "useWrapper": true,
      "wrapperFields": [
        { "name": "data", "type": "itemsArray" },
        { "name": "page", "type": "page", "value": 1 },
        { "name": "total", "type": "total" },
        { "name": "rows", "type": "rows" }
      ],
      "itemsFieldName": "data"
    },
    {
      "method": "POST",
      "path": "/api/mock/cameras",
      "description": "카메라 등록",
      "sourceType": "manual",
      "sourceCode": "",
      "fields": [
        { "name": "id", "type": "integer", "rule": { "type": "increment", "min": 1 } },
        { "name": "success", "type": "boolean", "rule": { "type": "static", "template": "true" } },
        { "name": "message", "type": "string", "rule": { "type": "static", "template": "등록이 완료되었습니다." } }
      ],
      "responseTemplate": "",
      "isArray": false,
      "arrayCount": 1,
      "statusCode": 201,
      "useWrapper": false,
      "wrapperFields": [],
      "itemsFieldName": "items"
    }
  ]
}
```
