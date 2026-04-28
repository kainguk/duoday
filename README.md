# DuoDay 💗

> 매일의 질문과 데이트 기록을 함께 쌓고, 한 권의 책으로 남기는 커플 콘텐츠 서비스
> (스위트북 과제 데모 — Next.js + SQLite + Docker, 외부 의존 없는 단독 서비스)

## 빠른 실행

```bash
docker compose up --build
# → http://localhost:3000
```

최초 실행 시 `migrate` + `seed` 가 자동으로 실행되어 데모 커플/질문/지난 14일치 질문/7개의 데이트 기록이 채워집니다.
DB와 업로드 사진은 Docker 볼륨(`duoday-db`, `duoday-uploads`)에 보관됩니다.

로컬 개발:
```bash
npm install
npm run migrate && npm run seed
npm run dev
```

## Sweetbook 연동 (선택)

Sweetbook으로 주문을 직접 전송하려면 환경 변수를 설정하세요. 기본적으로 이 프로젝트는 외부 API에 의존하지 않고 독립적으로 동작합니다.

```
SWEETBOOK_ENABLED=true
SWEETBOOK_API_URL=https://api.sweetbook.com/v1/orders
SWEETBOOK_API_KEY=your_api_key_here
# 또는
# SWEETBOOK_API_TOKEN=your_bearer_token_here
```

주문 상세 페이지에서 `Sweetbook 전송` 버튼이 활성화됩니다.

환경 변수 설정 예시는 `.env.example`을 참고하세요.

## 기술 스택
- Next.js 14 (App Router, standalone build) · React 18 · TypeScript
- SQLite (`better-sqlite3`) · Tailwind CSS
- `jszip` (Lv3 ZIP 익스포트), `zod` (입력 검증), `nanoid`
- 외부 API/계정/인쇄 SDK **없음** — 단독으로 동작

## 주요 기능

### 콘텐츠 (서비스의 주인공)
1. **오늘의 질문 (Daily Q&A)** — 하루 1개의 질문이 라운드로빈으로 자동 배정. 두 파트너가 각자 답변 작성/수정, 서로의 답변 공유. 지난 7일 히스토리 표시.
2. **데이트 기록 타임라인**
   - **타임라인 UI**: 날짜 내림차순, **연도/월 단위로 그룹**, 좌측 레일 + 날짜 도트로 “우리의 기록 타임라인”처럼 시각화
   - **기록 수정**: 제목·날짜·장소·내용·감정 태그·사진을 모두 수정 가능 (`/dates/[id]/edit`)
   - **사진 첨부 & 썸네일**: 한 기록에 여러 장 업로드, 목록은 대표 이미지 썸네일, 사진이 없으면 placeholder
   - **감정 태그**: `행복 / 설렘 / 평온 / 특별함 / 아쉬움` (목록·상세에서 배지로 표시)
   - **베스트 순간**: ⭐ BEST 배지, 베스트만 모아보는 필터 + 감정 태그 필터
3. **상세/삭제** — `/dates/[id]` 갤러리 + 수정/삭제 액션
4. **간단 통계 대시보드** (`/dashboard`)
   - 전체 기록 수 · 베스트 기록 수 · 월별 기록 수 (가로 막대) · 감정 태그 분포 · 가장 많이 사용된 감정

### 책 만들기 (콘텐츠를 활용한 부가 기능)
5. **책 주문 (Lv2)**
   - 표지 색상/제목/기간/포함 콘텐츠/메모를 지정해 주문 생성
   - **주문 상태 머신**: `pending → processing → completed`, `cancelled` 추가
     · `completed`/`cancelled`는 종료 상태로 되돌아갈 수 없음
     · 현재 상태에서 가능한 액션 버튼만 노출 (서버 측에서도 `canTransition` 검증)
6. **책 미리보기** (`/book/preview`) — 주문 전에 **표지 / 데이트 내지 / 질문 답변 모음 / 마지막 페이지** 구조로 실제 책처럼 미리보기. 표지에는 서비스명 · 책 제목 · 커플 이름 · 기간 · 총 기록 수가 표시되고, 내지에는 날짜·제목·사진·내용·감정 태그가 포함됩니다.
7. **ZIP 익스포트 (Lv3)** — `/api/export/[id]` 가 `order.json` + `content/questions.json` + `content/dates.json` + `content/photos/<dateId>/...` + `README.txt` 를 한 번에 패키징해 다운로드.

## 구현 범위 (Lv1 / Lv2 / Lv3)

| Lv | 항목 | 구현 |
|---|---|---|
| **Lv1** | 콘텐츠 서비스 | 오늘의 질문 답변 공유, 데이트 기록 CRUD, 타임라인 UI, 사진 업로드/썸네일, 감정 태그, 베스트 표시, 통계 대시보드 |
| **Lv2** | 책 주문 흐름 | 주문 생성/조회/상세, 표지·기간·포함 콘텐츠 선택, **상태 머신**(pending→processing→completed, cancelled), 책 미리보기 |
| **Lv3** | 데이터 패키징 | 주문 1건을 인쇄 파트너에게 넘길 ZIP 익스포트(JSON 매니페스트 + 사진 원본 + README) |

## 디렉터리

```
app/
  api/{answers,dates,dates/[id],orders,orders/[id],export/[id]}/route.ts
  dates/{page.tsx,new/page.tsx,[id]/page.tsx,[id]/edit/page.tsx}
  book/{page.tsx,new/page.tsx,preview/page.tsx,[id]/page.tsx}
  today/page.tsx · dashboard/page.tsx · page.tsx · layout.tsx · globals.css
components/{AnswerForm,DateForm,BookForm,OrderActions,DeleteDateButton,Badges,StatusChip,Placeholder}.tsx
lib/{db,repo,emotions,files,utils}.ts
scripts/{migrate,seed}.ts
Dockerfile · docker-compose.yml · docker-entrypoint.sh
```

## 데이터 모델 (요지)
- `couples` (싱글 데모 커플)
- `questions`, `daily_questions`, `answers`
- `date_logs` (date, place, title, feeling, **emotion_tag**, **is_best**, photo_path[legacy], updated_at)
- `date_photos` (한 기록에 여러 장)
- `book_orders` (status CHECK in pending/processing/completed/**cancelled**)

기존 v1 DB도 그대로 동작 — `lib/db.ts` 의 `migrate()` 가 누락 컬럼을 자동 ALTER 합니다.

## 제약/주의
- 결제·배송·외부 인쇄 API·로그인은 **구현하지 않음** (과제 조건)
- 사진 업로드는 장당 5MB 제한, `public/uploads`(혹은 `UPLOAD_DIR` 볼륨)에 저장
- 모바일에서도 헤더/필터/버튼이 겹치지 않도록 반응형으로 정리

## AI 사용 고지
- 본 데모는 ChatGPT(코드 생성/검토)와 사용자의 협업으로 작성되었습니다.
- 모델이 제안한 코드를 사람이 검토·수정한 뒤 커밋했으며, 데이터/사진/이름은 모두 가상입니다.
