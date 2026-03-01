# 빠른 시작 가이드

## 현재 완료된 작업 ✅

### 백엔드
- ✅ Express 서버 (PostgreSQL + SQLite 자동 선택)
- ✅ Netlify Functions 호환 래퍼 작성
- ✅ 모든 API 엔드포인트 구현
  - 교직원 관리 (CRUD)
  - 연차 관리 (신청, 승인, 거부)
  - 알림 시스템
  - 관리자 비밀번호 초기화
- ✅ SQLite 데이터베이스 자동 초기화
- ✅ 관리자 계정 자동 시드 (admin/admin1234)

### 프론트엔드
- ✅ React + Vite 빌드 (dist/ 생성)
- ✅ Tailwind CSS 구성
- ✅ 모든 UI 컴포넌트 준비

### 배포 설정
- ✅ Netlify 함수 번들링 설정 (netlify.toml)
- ✅ 환경 변수 매핑 (.env.example)
- ✅ .gitignore 업데이트 (로컬 DB 제외)

## 다음 3단계

### 1️⃣ GitHub에 푸시 (5분)
```bash
cd c:\cocobebe

# 모든 변경사항 확인
git status

# 커밋 및 푸시
git add .
git commit -m "Complete Postgres/SQLite backend and Netlify setup"
git push origin main
```

### 2️⃣ Netlify 연결 (10분)
1. https://app.netlify.com 방문
2. "New site from Git" 클릭
3. GitHub 저장소 선택 (cocobebe)
4. Build settings: 자동 감지됨
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
5. Deploy 클릭

### 3️⃣ 환결 변수 설정 (선택사항, 2분)
Site Settings → Build & deploy → Environment → Edit variables

**SQLite 사용 (권장, 설정 불필요):**
- 아무것도 설정하지 않으면 자동으로 SQLite 사용

**Supabase(PostgreSQL) 사용:**
1. https://supabase.com 에서 프로젝트 생성
2. 다음 환경변수 추가:
   ```
   DATABASE_URL = postgresql://user:password@host/database
   DB_SSL = true
   ```
3. Deploy 트리거 (redeploy)

## 로컬 테스트

### 서버 시작
```bash
npm run start
```

### 별도 터미널에서 API 테스트
```bash
# 데이터베이스 연결 확인
curl http://localhost:3000/api/db-test

# 교직원 목록
curl http://localhost:3000/api/teachers

# 관리자 계정 업데이트 (필요시)
curl -X POST http://localhost:3000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","password":"admin1234"}'
```

## 로그인 정보
- **기본 관리자**: admin / admin1234
- 프론트엔드에서 이름/비밀번호로 로그인
- 관리자만 교직원 추가/삭제 가능

## 문제 해결

### 배포 후 502 에러
1. Netlify 대시보드 → Functions → 로그 확인
2. 로컬에서 `npm run start` 후 `/api/db-test` 테스트
3. DATABASE_URL 환경변수 확인

### SQLite vs PostgreSQL 선택
- 환경변수 DATABASE_URL 있음 → PostgreSQL
- 없음 → SQLite (cocobebe.db)

### 로컬 데이터베이스 초기화
```bash
rm cocobebe.db
npm run start  # 자동으로 재생성 및 관리자 시드
```

## API 엔드포인트

### 교직원 관리
- `GET /api/teachers` - 전체 목록
- `POST /api/teachers` - 추가 (관리자만)
- `PATCH /api/teachers/:id` - 수정
- `DELETE /api/teachers/:id` - 삭제
- `POST /api/teachers/:id/reset-password` - 비밀번호 초기화

### 연차 관리
- `GET /api/leave-requests` - 전체 요청
- `POST /api/leave-requests` - 신청
- `PATCH /api/leave-requests/:id` - 승인/거부
- `DELETE /api/leave-requests/:id` - 삭제

### 알림
- `GET /api/notifications/:userId` - 조회
- `PATCH /api/notifications/:id` - 읽음 표시
- `DELETE /api/notifications/:userId` - 삭제

## 주요 파일

- `server.ts` - 백엔드 (Express + DB 로직)
- `netlify/functions/server.ts` - 서버리스 래퍼
- `netlify.toml` - 배포 설정
- `src/App.tsx` - 프론트엔드 진입점
- `DEPLOYMENT.md` - 상세 배포 가이드

---

질문이나 문제가 있으면 언제든지 물어보세요! 🚀
