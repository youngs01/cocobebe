# 배포 및 설정 가이드

## 현재 상태
✅ 프론트엔드 빌드 완료 (dist/)
✅ SQLite 데이터베이스 초기화 (cocobebe.db)
✅ 관리자 계정 생성 (admin/admin1234)
✅ Express 서버 설정 완료
✅ Netlify Functions 래퍼 생성

## 로컬 테스트

### 서버 시작
```bash
npm run start
```

### API 엔드포인트 테스트
```bash
# 데이터베이스 연결 확인
curl http://localhost:3000/api/db-test

# 교직원 목록 조회
curl http://localhost:3000/api/teachers

# 관리자 계정 재설정 (필요시)
curl -X POST http://localhost:3000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","password":"admin1234"}'
```

## Netlify 배포 단계

### 1. GitHub에 푸시
```bash
git add .
git commit -m "Complete Postgres/SQLite backend setup"
git push origin main
```

### 2. Netlify Site 연결
- https://app.netlify.com 에서 GitHub 저장소 연결
- Site name 설정 (예: cocobebe-app)

### 3. 환경 변수 설정 (Netlify 대시보드)

**선택 A: SQLite 사용 (추천 - 가장 간단함)**
- 환경 변수를 설정하지 않음
- 자동으로 SQLite 사용 (cocobebe.db)
- 배포 후 /api/admin으로 관리자 계정 재설정 가능

**선택 B: Supabase (PostgreSQL) 사용**

1. Supabase 에서 프로젝트 생성 (https://supabase.com)
   - Database → Connection string 복사 (URI format)
   
2. Netlify Site Settings → Environment variables 에 추가:
   ```
   DATABASE_URL = postgresql://user:password@host/database
   DB_SSL = true
   ADMIN_NAME = admin
   ADMIN_PASSWORD = admin1234
   ```

3. 배포 후:
   ```bash
   curl -X POST https://your-site.netlify.app/api/admin \
     -H "Content-Type: application/json" \
     -d '{"name":"admin","password":"admin1234"}'
   ```

## API 엔드포인트

### 인증
- 로그인: 프론트엔드에서 교직원 이름/비밀번호로 `teachers` GET 조회
- 관리자 비밀번호 초기화: `POST /api/admin`

### 교직원 관리
- `GET /api/teachers` - 전체 교직원 목록
- `POST /api/teachers` - 교직원 추가 (관리자만)
- `PATCH /api/teachers/:id` - 교직원 정보 수정
- `DELETE /api/teachers/:id` - 교직원 삭제
- `POST /api/teachers/:id/reset-password` - 비밀번호 초기화

### 연차 관리
- `GET /api/leave-requests` - 전체 연차 요청
- `POST /api/leave-requests` - 연차 신청
- `PATCH /api/leave-requests/:id` - 연차 승인/거부
- `DELETE /api/leave-requests/:id` - 연차 요청 삭제

### 알림
- `GET /api/notifications/:userId` - 사용자 알림
- `PATCH /api/notifications/:id` - 알림 읽음 표시
- `DELETE /api/notifications/:userId` - 알림 삭제

## 문제 해결

### 배포 후 502 Bad Gateway
- Netlify 대시보드에서 함수 로그 확인
- DATABASE_URL이 올바르게 설정되었는지 확인
- 로컬에서 `npm run start` 후 API 엔드포인트 정상 작동하는지 확인

### SQLite vs PostgreSQL 자동 선택
- `DATABASE_URL` 환경 변수가 설정되면 PostgreSQL 사용
- 설정되지 않으면 SQLite 사용 (cocobebe.db)

### 데이터 마이그레이션
- SQLite에서 수동으로 데이터 추출 후 PostgreSQL에 삽입
- 또는 `/api/teachers` 등 엔드포인트로 수동 추가

## 다음 단계

1. [선택사항] Supabase 가입 및 데이터베이스 생성
2. GitHub에 최종 코드 푸시
3. Netlify에서 배포 확인
4. 프론트엔드에서 /api/teachers 호출 및 로그인 테스트
