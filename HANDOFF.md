# HANDOFF.md — 핸드오프 프로토콜

> ⚠️ **이 구분선(===) 위의 규칙 영역은 절대 수정 금지.**
> AI는 아래 `인수인계 내용` 영역만 업데이트한다.

---

## 핸드오프 규칙

### 언제 핸드오프를 작성하는가?
- 사용자가 **"핸드오프 해"** 라고 지시하면 즉시 작업을 멈추고 핸드오프를 작성한다.
- AI가 스스로 판단해서 핸드오프를 작성하지 않는다. **반드시 사용자 지시가 있어야 한다.**

### 핸드오프 작성 절차
1. 현재 작업을 **안전한 상태까지 마무리**한다. (컴파일 에러가 없는 상태)
2. `git add → commit → push` 수행한다.
3. 아래 `인수인계 내용` 영역을 업데이트한다.
4. HANDOFF.md도 함께 커밋한다.

### 인수인계 받는 절차
1. `git pull`로 최신 코드를 받는다.
2. 이 파일의 `인수인계 내용`을 읽는다.
3. 언급된 파일들을 직접 열어 코드를 한 번 읽는다.
4. 이해한 내용을 바탕으로 **브랜치를 새로 파서** 작업을 이어간다.

### 작성 원칙
- **간결하게.** 소설 쓰지 말고, 핵심만 적는다.
- **파일 경로는 정확하게.** 수정한 파일 목록은 풀 경로로 적는다.
- **미완료 작업은 솔직하게.** 하다 만 것, 시도했지만 안 된 것을 숨기지 않는다.

---

### ⚠️ 이 선 아래만 수정할 것 ===================================================

---

## 인수인계 내용

### 작성 정보
- **작성자:** CC (Claude Code)
- **작성 시각:** 2026-03-14
- **브랜치:** feature/ag-layout-polish
- **마지막 커밋:** [CC] feat+style: ProcessRepo 통합 그리드 레이아웃 재설계 및 템플릿 썸네일 업로드 구현

---

### 최근 작업 내용 (2026-03-14)

#### 1. ProcessRepo 전면 재설계
- 예시/사용자 템플릿을 **5열 통합 그리드**로 통합 (`repeat(5, 1fr)`)
- 카드 구조: 이미지 영역 80px + 이름 영역 20px = 100px, 카드 외부에 "템플릿으로 사용하기" 버튼(20px) 분리
- 예시 템플릿 1개만 표시 (첫 번째 isDefault), 이름 `OO공장`으로 고정 표시
- 예시(navy 배경) / 사용자(white 배경) 시각 구분
- "예시" 뱃지: 아이콘 영역 상단 절대 배치, 수평 중앙 정렬
- **수정 파일**: `ProcessRepo.jsx`, `ProcessRepo.style.js`

#### 2. 사용자 템플릿 썸네일 이미지 업로드
- 카드 호버 시 우측 하단에 📷 버튼 등장 (사용자 템플릿만)
- Firebase Storage 업로드 후 React Query 캐시 직접 패치(`setQueryData`)로 즉시 반영
- `uploadTemplateImage` 함수: `Dashboard.api.js`에 구현됨
- **⚠️ CORS 미해결**: Firebase Storage에 CORS 규칙이 아직 설정되지 않음. `gsutil cors set` 필요
  ```bash
  # Cloud Shell에서 실행 필요
  cat > cors.json << 'EOF'
  [{"origin":["http://localhost:3000"],"method":["GET","POST","PUT","DELETE"],"maxAgeSeconds":3600}]
  EOF
  gsutil cors set cors.json gs://builder-process-repo.firebasestorage.app
  ```

#### 3. CreateProjectSheet 공통 컴포넌트 추출
- `src/components/common/CreateProjectSheet.jsx` 신규 생성
- ProcessRepo, Checklist 양쪽에서 재사용
- `preselectedTemplateId` prop으로 템플릿 미리 선택 가능
- 현장 생성 완료 후 → 체크리스트로 이동 (`navigate('/checklist', {state: {selectedProjectId}})`)

#### 4. Dashboard 드롭다운 NaN 버그 수정
- Firestore ID는 문자열인데 `Number()` 변환 적용해서 NaN 발생하던 것 수정
- `Dashboard.jsx` line: `setSelectedProjectId(e.target.value)` (Number() 제거)

---

---

### 프로젝트 개요 (처음 받는 AI를 위한 요약)
BPR(Builder Process Repo)은 건설 현장 소장이 공정을 관리하는 모바일 웹앱이다.
핵심 개념: 대공정(마당타설, 기초공사 등) > 소공정(세부 작업 단위). 소공정 상태는 대기→진행→마무리→완료로 순환한다.

> ⚠️ **백엔드가 Firebase Firestore로 전환됨** (AG 작업). Spring Boot 백엔드는 현재 미사용.
> 모든 `*.api.js`가 Firestore SDK를 직접 호출한다. `utils/firebaseConfig.js` 참고.

**스택:**
- Frontend: React 18 + Vite, Emotion(CSS-in-JS), TanStack React-Query, Zustand
- DB/Auth: Firebase Firestore + Firebase Auth (JWT 방식 → Firebase로 교체됨)

---

### 프로젝트 구조

```
bpr-frontend/src/
  pages/
    Dashboard/     — 대시보드 (오늘 할 일 + 진척도)
    Checklist/     — 체크리스트 (무한스크롤 소공정 목록 + 대공정 네비)
    Report/        — 일지 (오늘 공정 담기 + 메모 + 삭제 + PDF/복사)
    Directory/     — 연락처 (AG 신규 추가)
    Login/         — 로그인
  components/
    common/StatsSection  — 진척도/진행도/공정편차 3링 통계 다크박스
    layout/TopBar        — 인사말 + 로그아웃 (날짜/요일 제거됨)
    layout/BottomNav     — 하단 탭 네비
  hooks/useWeather.js    — 주소 기반 날씨 (기상청 API)
  store/authStore.js     — Zustand 인증 상태 (Firebase uid)
  utils/firebaseConfig.js — Firebase 초기화 (db export)
  styles/theme.js        — 색상/폰트/radius 테마 변수
```

---

### Firestore 데이터 구조

```
projects/{projectId}
  .name, .address, .startDate, .endDate, .ownerId

projects/{projectId}/major_processes/{majorId}
  .name, .displayOrder, .createdAt

projects/{projectId}/minor_processes/{minorId}
  .majorId, .name, .status (WAITING|IN_PROGRESS|TOUCH_UP|DONE)
  .isToday, .memo, .displayOrder, .createdAt

projects/{projectId}/reports/{reportId}
  .reportDate (YYYY-MM-DD), .weather, .authorName
  .additionalMemo, .createdAt

projects/{projectId}/reports/{reportId}/items/{itemId}
  .minorProcessId, .nameSnapshot, .statusSnapshot, .memoSnapshot

templates/{templateId}
  /template_major_processes/{}/template_minor_processes/{}
```

---

### 현재 구현 완료 목록

#### 대시보드 (`Dashboard.jsx` + `Dashboard.style.js`)
- DateBlock(날짜/요일) + WeatherGroup(현재날씨·강수·내일날씨 3카드) — 2:7 가로 비율
- 오늘 할 일 목록: 상태순환(★) · 메모(✎) · 일지담기/제거 토글(📝/✅) · 오늘할일해제(★)
- 현장 선택 드롭다운, 대시보드↔체크리스트 캐시 양방향 동기화

#### 체크리스트 (`Checklist.jsx` — AG 개편, 무한스크롤)
- 대공정 네비게이션 탭 (좌측 또는 상단)
- 소공정 무한스크롤 목록
- 상태순환·오늘할일·메모(✎)·일지담기/제거 토글(📝/✅) 버튼 (대시보드와 동일한 UX 적용)
- 현장 생성/수정/삭제, 대공정/소공정 추가/삭제

#### 일지 (`Report.jsx` + `Report.api.js`)
- 📝 버튼 → Upsert 방식 (오늘 report 있으면 item 추가, 없으면 신규 생성) -> 대시보드/체크리스트에서 담기/빼기 토글 지원
- 동일 소공정 중복 추가 방지 (`where('minorProcessId', '==', ...)`)
- 현장 성과(진척도 통계 링박스) 컴포넌트는 UI 간소화를 위해 제거됨
- 일지 사진 첨부 로컬 UI 추가 (1:1 비율 3칸 그리드, X버튼으로 삭제 기능)
- 공정 항목별 메모 토글(✎) + 저장 (대시보드/체크리스트의 원본 메모와 독립 분리 적용)
- 공정 항목 삭제(✕)
- 대시보드/체크리스트/일지 전역 상태(Status) 실시간 동기화 복원 (어디서 수정하든 동일한 상태 업데이트 발생)
- 이전 보고서 바텀시트, PDF 내보내기, 글복사

#### 연락처 (`Directory/` — AG 신규)
- 작업 이어받으면 Directory.jsx 직접 읽어볼 것

---

### 아직 안 한 일 / 이어서 해야 할 일

1. **⚠️ Firebase Storage CORS 설정** — 썸네일 업로드 기능이 CORS 오류로 막혀있음. gsutil로 버킷에 CORS 규칙 추가 필요 (위 내용 참고).

2. **소공정 드래그 정렬** — `@dnd-kit/core` 또는 `react-beautiful-dnd` 검토 필요. Firestore `displayOrder` 필드는 이미 있음.

3. **공정 저장소 디폴트 템플릿** — 시스템 기본 템플릿 Firestore에 시드 필요. SeedPage.jsx/seedTemplates.js 파일이 있으나 미사용.

4. **체크리스트 → 공정저장소 내보내기** — 미구현.

5. **일지 사진 첨부** — `photos` state는 있으나 Firebase Storage 업로드 미구현. 로컬 미리보기만 됨. (CORS 해결 후 같이 작업 가능)

6. **디자인 껍데기 반영** — Google Stitch 디자인 기반으로 각 페이지 스타일 교체 예정.

---

### 주의사항 / 반드시 알아야 할 것

1. **Firebase 전환**: `axiosConfig.js` 삭제됨. `utils/firebaseConfig.js`에서 `db` import해서 사용.

2. **날씨**: `useWeather(address)` — 주소 없으면 null. 체크리스트는 `tomorrow`, 대시보드는 `weather`.

3. **cycleStatus 사이드이펙트**: 소공정 상태 변경 시 오늘 report items의 `statusSnapshot`도 자동 갱신됨 (`Checklist.api.js` 참고).

4. **memoSnapshot vs memo**: 일지 item의 메모 필드는 `memoSnapshot`. 소공정의 메모 필드는 `memo`. 혼용하지 말 것.

5. **createReport는 Upsert**: 오늘 날짜 report가 이미 있으면 item만 추가. 새 report를 만들지 않는다.

6. **React-Query 캐시 키**:
   - `['projects']` — 현장 목록
   - `['checklist', projectId]` — 체크리스트
   - `['dashboard', projectId]` — 오늘 할 일
   - `['reports', projectId]` — 일지 목록
   - `['report-today', projectId]` — 오늘 일지

7. **Emotion 스타일**: `S.컴포넌트명`. 각 페이지 폴더의 `*.style.js`. `theme.js` 변수 필수 활용.

8. **실행**: 프론트만 `bpr-frontend/`에서 `npm run dev`. 백엔드 불필요 (Firebase 직접 연결).
