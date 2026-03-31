# PDCA Design - 차량 부품 판매 웹사이트 설계서

> 문서 유형: Design (설계서)
> 작성일: 2026-03-24
> 최종 수정: 2026-03-31
> 프로젝트: 차량 부품 판매 웹사이트 v1.5.0

---

## 1. 시스템 아키텍처

### 1-1. 전체 구조
```
┌─────────────────────────────────────────────────────┐
│              Next.js 16 (App Router)                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │  app/    │  │ context/  │  │      lib/         │  │
│  │ (Pages)  │  │  (State)  │  │ (Actions/Utils)  │  │
│  └──────────┘  └───────────┘  └────────┬─────────┘  │
└─────────────────────────────────────────┼────────────┘
                                          │
                    ┌─────────────────────┼──────────┐
                    │         Firebase               │
                    │  ┌─────────┐  ┌────────────┐   │
                    │  │Firestore│  │    Auth     │   │
                    │  │  (DB)   │  │  (이메일)   │   │
                    │  └─────────┘  └────────────┘   │
                    │  ┌─────────┐                   │
                    │  │ Storage │                   │
                    │  │(이미지) │                   │
                    │  └─────────┘                   │
                    └────────────────────────────────┘
                    ┌────────────────────────────────┐
                    │       외부 서비스               │
                    │  VIN Decode API (NHTSA 등)      │
                    └────────────────────────────────┘
```

### 1-2. 디렉토리 구조
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx            # 로그인
│   │   └── signup/page.tsx           # 회원가입 (개인/사업자)
│   ├── about/page.tsx                # 회사 소개
│   ├── location/page.tsx             # 오시는 길
│   ├── categories/
│   │   ├── page.tsx                  # 카테고리 목록
│   │   └── [id]/page.tsx             # 카테고리별 상품 목록
│   ├── products/
│   │   ├── page.tsx                  # 전체 상품 목록
│   │   └── [id]/page.tsx             # 상품 상세
│   ├── brands/
│   │   ├── page.tsx                  # 브랜드 목록 (카테고리별 카드 그리드)
│   │   └── [name]/page.tsx           # 브랜드별 상품
│   ├── pending/page.tsx              # 사업자 승인 대기
│   ├── vin/page.tsx                  # VIN 조회
│   ├── admin/
│   │   ├── page.tsx                  # 관리자 대시보드 (6개 메뉴)
│   │   ├── products/
│   │   │   ├── page.tsx              # 상품 목록 (검색, 숨기기, 삭제)
│   │   │   └── new/page.tsx          # 상품 등록
│   │   ├── categories/page.tsx       # 카테고리 관리
│   │   ├── brands/page.tsx           # 브랜드 관리 (카테고리+이미지+수정)
│   │   ├── users/page.tsx            # 사업자 승인
│   │   └── settings/page.tsx         # 사이트 설정
│   ├── layout.tsx
│   ├── page.tsx                      # 홈 (동적 브랜드 섹션)
│   └── globals.css
├── components/layout/
│   ├── Header.tsx                    # 회사소개·오시는 길 메뉴 포함
│   └── Footer.tsx                    # 회사소개·오시는 길 링크 포함
├── context/AuthContext.tsx
├── lib/
│   ├── firebase.ts
│   ├── authActions.ts
│   └── priceUtils.ts
└── types/index.ts                    # BrandCategory 타입 포함
```

---

## 2. 데이터 모델

### 2-1. Firestore 컬렉션 구조

#### `users/{userId}`
```
{
  uid: string
  email: string
  name: string
  phone: string
  userType: string         # "individual" | "business" | "admin"
  status: string           # "active" | "pending" | "rejected"
  businessGrade: string?   # "a" | "b" | "c"
  businessName: string?
  businessNumber: string?
  createdAt: timestamp
  approvedAt: timestamp?
  approvedBy: string?
}
```

#### `categories/{categoryId}`
```
{
  id: string
  name: string
  parentId: string | null
  order: number
  imageUrl: string?
  createdAt: timestamp
}
```

#### `products/{productId}`
```
{
  id: string
  name: string
  description: string
  categoryId: string
  brand: string?
  imageUrls: string[]
  stock: number
  compatibleVehicles: string[]
  prices: {
    individual: number
    business_a: number
    business_b: number
    business_c: number
  }
  isActive: boolean
  isBest: boolean
  isNew: boolean
  createdAt: timestamp
  createdBy: string
}
```

#### `brands/{brandId}`
```
{
  id: string
  name: string
  category: string    # "import" | "domestic" | "oem"
  imageUrl: string?   # Firebase Storage URL 또는 외부 이미지 URL
  createdAt: timestamp
}
```

#### `siteConfig/main`
```
{
  companyName: string
  companyIntro: string
  companyAddress: string
  companyPhone: string
  businessHours: string
  businessNumber: string
  mapEmbedUrl: string       # 네이버 지도 퍼가기 iframe src
  naverMapUrl: string       # 네이버 지도 공유 URL
  kakaoMapUrl: string       # 카카오맵 공유 URL
  drivingInfo: string       # 자가용 안내
  transitInfo: string       # 대중교통 안내
  parkingInfo: string       # 주차 안내
}
```

#### `pendingBusinesses/{docId}`
```
{
  userId: string
  businessName: string
  businessNumber: string
  applicantName: string
  phone: string
  createdAt: timestamp
  status: string           # "pending" | "approved" | "rejected"
}
```

---

## 3. TypeScript 타입 정의

```ts
// types/index.ts

export type BrandCategory = 'import' | 'domestic' | 'oem';

export interface Brand {
  id: string;
  name: string;
  category: BrandCategory;   // 외제차 정품 / 국산차 정품 / OEM
  imageUrl?: string;          // 브랜드 카드 이미지
  createdAt: Date;
}
```

---

## 4. 사용자 등급별 가격 표시 로직

```ts
function getPrice(prices, userType, grade?) {
  if (userType === 'business') {
    return prices[`business_${grade}`] ?? prices.individual;
  }
  return prices.individual;
}
```

---

## 5. 인증 흐름 설계

### 5-1. 개인 회원가입
```
이름/이메일/비밀번호/비밀번호확인/전화번호 입력
→ Firebase Auth 생성
→ Firestore users 문서 생성 (status: "active")
→ 홈 화면
```

### 5-2. 사업자 회원가입
```
개인 정보 + 상호명 + 사업자번호 입력
→ Firebase Auth 생성
→ Firestore users 문서 생성 (status: "pending")
→ pendingBusinesses 문서 생성
→ 승인 대기 화면
    ↓ (담당자가 관리자 페이지에서 등급 지정 후 승인)
→ users.status: "active", businessGrade: "a"|"b"|"c" 설정
```

### 5-3. 라우터 리다이렉트 로직
```
/ → 로그인됨 + active → 홈 접근 가능
  → 로그인됨 + pending → /pending
  → 비로그인 → 홈 (로그인/회원가입 버튼 표시)
/admin/* → admin이 아니면 / 리다이렉트
```

---

## 6. 페이지별 설계

### 6-1. 홈 (/)
```
[Hero Section]
  - 풀스크린 배경 이미지 (고급차, Unsplash)
  - 다크 그라디언트 오버레이
  - 메인 카피: "국산 · 수입차 부품 전문"
  - 서브: "정품 · OEM · 애프터마켓"
  - CTA: 전체상품 보기 / VIN 조회

[브랜드 섹션 — Firebase 동적]
  - 외제차 정품 섹션: category="import" 브랜드
  - 국산차 정품 섹션: category="domestic" 브랜드
  - OEM 섹션: category="oem" 브랜드
  - 각 카드: imageUrl 배경 + 브랜드명 오버레이 + 클릭 시 /brands/{name}
  - 미등록 시 관리자 안내 메시지

[Features] VIN 조회 / 사업자 등급 할인 / 정품·OEM·애프터마켓

[Best Products] isBest=true 상품 가로 스크롤
[New Products]  isNew=true 상품 가로 스크롤
[사업자 배너]   배경 이미지 + 회원가입 CTA
[Company Intro] siteConfig에서 불러옴 (기본값 포함)
```

### 6-2. 브랜드 탭 (/brands)
```
[카테고리별 섹션]
  - 외제차 정품 / 국산차 정품 / OEM 섹션
  - 각 섹션: 카테고리 배지 + 브랜드 수 표시
  - 그리드: grid-cols-2 sm:3 md:4 lg:5
  - 카드: block + aspect-[3/2] (3:2 비율 고정)
    - imageUrl 있으면 배경 사진 + zoom 호버
    - 없으면 카테고리별 다크 그라디언트 fallback
    - 카테고리 배지 (좌상단) + 브랜드명 (좌하단)
    - 호버 시 → 화살표 (우상단)
  - 클릭 시 /brands/{encodedName}
```

### 6-3. 회사 소개 (/about)
```
[Hero] 회사명, 슬로건
[소개 카드] 소개글, 연락처, 영업시간, 주소, 오시는 길 링크
[특징 6개] 정품/OEM/애프터, 도소매, 빠른공급, VIN, 사업자할인, 품질보증
[CTA] 전체상품 보기 / 오시는 길
```

### 6-4. 오시는 길 (/location)
```
[Hero] 회사명, 주소
[지도] mapEmbedUrl → iframe (미등록 시 플레이스홀더)
[지도 버튼] 네이버 지도 / 카카오맵
[연락처·영업시간] 2컬럼 카드
[교통 안내] 대중교통 / 자가용 / 주차
```

### 6-5. 어드민 브랜드 관리 (/admin/brands)
```
[상단 액션]
  - ⚡ OEM 기본 브랜드 등록 버튼
    (PHC Valeo, DRB, 평화오일씰공업, DYG 일괄 등록)

[브랜드 추가 폼]
  - 브랜드명 입력
  - 카테고리 선택 (외제차 정품 / 국산차 정품 / OEM)
  - 이미지 URL 입력 또는 파일 업로드 (Firebase Storage)

[브랜드 목록 — 카테고리별]
  - 외제차 정품 / 국산차 정품 / OEM 섹션별로 표시
  - 각 행: 이미지 썸네일, 브랜드명, 카테고리 배지, 수정/삭제
  - 수정: 모달에서 브랜드명·카테고리·이미지 변경
```

### 6-6. 어드민 상품 목록 (/admin/products)
```
[상단] 총 상품 수 + 상품 등록 버튼
[검색] 상품명 또는 브랜드명으로 실시간 필터
[상품 행]
  - 이미지 썸네일
  - 브랜드명 (파란색), 상품명, 개인가, 재고
  - 베스트/신상품/비활성 배지
  - 숨기기/활성화 토글 버튼
  - 삭제 버튼 (confirm 팝업 후 처리)
```

---

## 7. UI 공통 규칙

### 7-1. 색상 팔레트
| 용도 | 값 |
|------|-----|
| 메인 배경 (히어로) | `#0f172a` ~ `#1e3a5f` |
| 강조색 | `blue-500` (#3b82f6) |
| 카드 배경 | `white` |
| 보조 텍스트 | `slate-500` |
| 외제차 배지 | `bg-blue-100 text-blue-700` |
| 국산차 배지 | `bg-green-100 text-green-700` |
| OEM 배지 | `bg-amber-100 text-amber-700` |

### 7-2. 입력 필드 스타일
- `bg-white`, `text-black`, `placeholder-gray-400`
- `focus:ring-2 focus:ring-blue-500`

### 7-3. 브랜드 카드 규칙
- `block` + `aspect-[3/2]` — 그리드 폭에 맞춰 3:2 비율 자동 조정
- `overflow-hidden rounded-2xl` + `transition-transform group-hover:scale-110`
- 이미지 없을 때 카테고리별 fallback gradient

### 7-4. 헤더 메뉴 구성
```
[로고] [브랜드▼] [전체상품] [부품 카테고리▼] [VIN 조회] [회사소개] [오시는 길]
                                                          [로그인/회원가입 or 로그아웃]
```

### 7-5. 푸터 링크
```
전체상품 / 카테고리 / 브랜드 / VIN 조회 / 회사소개 / 오시는 길
```

---

## 8. VIN 조회 설계

### 8-1. API 전략
| 대상 | API | 비고 |
|------|-----|------|
| 미국/글로벌 차량 | NHTSA vPIC API (무료) | https://vpic.nhtsa.dot.gov/api |
| 국내 차량 | 공공데이터포털 자동차 API | 검토 필요 |

### 8-2. 조회 흐름
```
VIN 입력 (17자리) → NHTSA API 호출
→ 차량 정보 표시 (제조사, 모델, 연도)
→ compatibleVehicles 필드에 해당 모델 포함된 상품만 필터링
→ 필터된 부품 목록 표시
```

---

## 9. 의존성

| 패키지 | 용도 |
|--------|------|
| next | 프레임워크 |
| firebase | Auth / Firestore / Storage |
| tailwindcss | 스타일링 |
| typescript | 타입 안전성 |
