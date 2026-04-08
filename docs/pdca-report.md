# 차량 부품 쇼핑몰 — PDCA 개발 보고서

> 최종 업데이트: 2026-04-08

---

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 광일통상 차량 부품 쇼핑몰 |
| 기술 스택 | Next.js 16 · TypeScript · Tailwind CSS · Firebase · Vercel |
| 목표 | Flutter 앱에서 웹 전환, B2B/B2C 차량 부품 판매 |
| 배포 | Vercel (GitHub 자동 배포) |

---

## 구현 완료 기능

### Phase 1 — 기반 구축
- Next.js 16 프로젝트 초기화, TypeScript 타입 정의
- Firebase (Auth · Firestore · Storage) 초기화
- 등급별 가격 유틸리티 (`individual`, `business_a/b/c`)

### Phase 2 — 인증
- 로그인 / 회원가입 페이지
- 사용자 유형: `individual` / `business` / `admin`
- 사업자 가입 → `pending` 상태, 관리자 승인 후 `active`
- Pending 안내 페이지

### Phase 3 — 카탈로그
- 상품 목록 / 상품 상세 페이지
- 카테고리 브라우징 (대/소분류)
- 브랜드 목록 (수입차 / 국산차 / OEM 구분)
- VIN(차대번호) 조회 — NHTSA API + 공공데이터포털 병행 (한국 차량 지원)
- 헤더 네비게이션 (데스크탑 드롭다운 + 모바일 햄버거 메뉴)

### Phase 4 — 주문 시스템 ✅ (2026-04-08 추가)
- **장바구니** (`/cart`)
  - localStorage 연동, 수량 조절, 삭제
  - 헤더 장바구니 아이콘 + 담긴 수량 배지
  - 제품 상세에서 수량 선택 후 "장바구니 담기" / "바로 구매"
- **주문 접수** (`/checkout`)
  - 배송지 · 받는 분 · 요청사항 입력
  - 결제 방식: 주문 접수 후 담당자가 연락하여 결제 안내
  - Firestore `orders` 컬렉션에 저장
- **내 주문 현황** (`/my-orders`)
  - 로그인 사용자의 주문 목록 (최신순)
  - 주문 상태 실시간 확인 (접수 → 처리중 → 배송중 → 완료 → 취소)
  - 주문 항목 상세 펼치기/접기

### Phase 5 — 관리자 기능
- 상품 등록 / 목록 관리 (활성화 · 숨김 · 삭제)
- 카테고리 관리
- 브랜드 관리
- 사업자 승인 (pending → approved)
- 사이트 설정 (회사명 · 주소 · 전화번호 · 오시는 길)
- **주문 관리** (`/admin/orders`) ✅ (2026-04-08 추가)
  - 전체 주문 목록 (상태별 필터)
  - 미처리 주문 건수 표시
  - 주문 상세 (`/admin/orders/[id]`)
  - 주문 상태 변경: `주문접수 → 처리중 → 배송중 → 완료 / 취소`

---

## Firestore 데이터 구조

### `orders` 컬렉션 (신규)
```
orders/{orderId}
  userId, userName, userPhone, userEmail
  userType, businessGrade, businessName
  items: [ { productId, productName, imageUrl, price, quantity } ]
  recipientName, recipientPhone, shippingAddress, note
  totalAmount, status, createdAt, updatedAt
```

### 필요한 Firestore 인덱스
- `orders` 컬렉션: `userId ASC + createdAt DESC`
  → `/my-orders` 최초 접속 시 콘솔에 생성 링크 표시됨, 클릭으로 자동 생성

---

## 결제 방식

현재: **주문 접수형** — 고객이 주문서 제출 → 담당자가 전화/메시지로 연락 후 결제 안내

추후 선택 가능한 방향:
- PG사 연동 (토스페이먼츠, 카카오페이 등)
- 계좌이체 안내 자동화

---

## 현재 미구현 / 향후 과제

| 항목 | 비고 |
|---|---|
| 실결제(PG) 연동 | 담당자와 결제 방향 확정 후 진행 |
| 주문 알림 (이메일/SMS) | 새 주문 접수 시 담당자에게 알림 |
| 재고 자동 차감 | 주문 확정 시 stock 필드 감소 |
| 검색 기능 | 상품명/모델 검색 |
