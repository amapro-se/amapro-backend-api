# NestJS 구글 OAuth 인증 API

NestJS 기반 구글 OAuth 로그인 전용 인증 API입니다. 사용자 정보는 Supabase PostgreSQL에 저장됩니다.

## 📋 프로젝트 개요

- **프레임워크**: NestJS
- **인증**: Google OAuth2 + JWT
- **데이터베이스**: Supabase PostgreSQL
- **타입스크립트**: 완전 지원
- **AWS Lambda**: Serverless 배포 지원

## 🚀 주요 기능

- ✅ 구글 OAuth 로그인 (`id_token` 검증)
- ✅ JWT 액세스/리프레시 토큰 발급
- ✅ 사용자 회원가입 및 로그인
- ✅ 보호된 API 엔드포인트
- ✅ Supabase 연동

## 📝 API 엔드포인트

### 인증 관련

- `POST /auth/signup` - 구글 OAuth 회원가입
- `POST /auth/login` - 구글 OAuth 로그인
- `GET /profile` - 인증된 사용자 프로필 조회 (JWT 인증 필요)

### 헬스 체크

- `GET /` - 기본 헬스 체크
- `GET /health` - 상태 확인

## 🛠️ 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
yarn install
\`\`\`

### 2. 환경 변수 설정

\`.env\` 파일을 생성하고 다음 내용을 추가하세요:

\`\`\`env

# Google OAuth

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT

JWT_SECRET=strong-jwt-secret
JWT_ACCESS_EXPIRATION=3600s
JWT_REFRESH_EXPIRATION=7d

# Supabase

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=service-role-key
\`\`\`

### 3. 데이터베이스 스키마 생성

Supabase SQL 편집기에서 다음 스크립트를 실행하세요:

\`\`\`sql
-- users 테이블
CREATE TABLE users (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
provider VARCHAR(20) NOT NULL, -- 'google'
provider_id VARCHAR(100) UNIQUE NOT NULL, -- Google sub
email VARCHAR(255) UNIQUE NOT NULL,
name VARCHAR(100),
picture TEXT,
created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- refresh_tokens 테이블
CREATE TABLE refresh_tokens (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE,
token TEXT UNIQUE NOT NULL,
expires_at TIMESTAMPTZ NOT NULL,
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
\`\`\`

### 4. 로컬 개발 실행

\`\`\`bash

# 개발 모드

yarn start:dev

# 프로덕션 빌드

yarn build

# 프로덕션 실행

yarn start:prod
\`\`\`

## 📚 API 사용 예시

### 회원가입

\`\`\`bash
curl -X POST http://localhost:3000/auth/signup \\
-H "Content-Type: application/json" \\
-d '{
"idToken": "google-id-token-here"
}'
\`\`\`

### 로그인

\`\`\`bash
curl -X POST http://localhost:3000/auth/login \\
-H "Content-Type: application/json" \\
-d '{
"idToken": "google-id-token-here"
}'
\`\`\`

### 보호된 API 접근

\`\`\`bash
curl -X GET http://localhost:3000/profile \\
-H "Authorization: Bearer your-access-token"
\`\`\`

## 🏗️ 프로젝트 구조

\`\`\`
src/
├── auth/
│ ├── dto/
│ │ ├── signup.dto.ts
│ │ └── login.dto.ts
│ ├── strategies/
│ │ └── jwt.strategy.ts
│ ├── guards/
│ │ └── jwt-auth.guard.ts
│ ├── auth.controller.ts
│ ├── auth.service.ts
│ └── auth.module.ts
├── users/
│ ├── users.service.ts
│ └── users.module.ts
├── app.module.ts
├── app.bootstrap.ts
├── main.ts
└── lambda.ts
\`\`\`

## 🔧 배포

### Serverless 배포

\`\`\`bash

# 로컬 테스트

npx serverless offline --stage local

# 개발 환경 배포

serverless deploy --stage dev

# 프로덕션 배포

serverless deploy --stage prod
\`\`\`

### AWS SAM 배포

\`\`\`bash

# 빌드

sam build

# 로컬 테스트

sam local invoke

# 배포

sam deploy
\`\`\`

## 🔐 보안 고려사항

1. **구글 토큰 검증**: `audience`를 `GOOGLE_CLIENT_ID`로 한정
2. **JWT 비밀키**: 강력한 비밀키 사용
3. **Supabase 키**: 서비스 역할 키는 서버 전용
4. **리프레시 토큰**: 데이터베이스 저장 및 주기적 정리

## 📄 라이선스

이 프로젝트는 개인 사이드 프로젝트입니다.

---

**참고**: 환경 변수 설정이 완료되지 않으면 애플리케이션이 시작되지 않습니다.

## 🔗 Submodules 사용법

이 프로젝트는 Git Submodules을 사용합니다:

- `libs/shared-libs` - 프론트엔드/백엔드 공통 라이브러리
- `libs/db-infra` - 데이터베이스 스키마 및 마이그레이션

### 프로젝트 클론 시

```bash
# submodule과 함께 클론
git clone --recurse-submodules https://github.com/your-username/amapro-backend-api.git

# 또는 이미 클론한 경우
git submodule init
git submodule update
```

### Submodule 업데이트

```bash
# shared-libs 업데이트
git submodule update --remote libs/shared-libs

# 모든 submodule 업데이트
git submodule update --remote

# 메인 프로젝트에 반영
git add .
git commit -m "update: submodules 업데이트"
git push
```

### shared-libs 수정 시

```bash
# shared-libs 디렉토리에서 작업
cd libs/shared-libs
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main

# 메인 프로젝트로 돌아와서
cd ../..
git add libs/shared-libs
git commit -m "update: shared-libs 업데이트"
git push
```
```

---

## 🚀 **14단계: 최종 검증**

### 📝 **14-1: 전체 시스템 테스트**
```bash
# 1. 빌드 테스트
yarn build

# 2. 린트 테스트  
yarn lint

# 3. 유닛 테스트 (있다면)
yarn test

# 4. 개발 서버 실행 테스트
yarn start:dev
```

---

## 🎉 **완료!**

### ✅ **달성한 것들:**

1. **📦 Monorepo 구조 완성**
   - shared-libs: 공통 라이브러리
   - db-infra: 데이터베이스 관리
   - amapro-backend-api: 메인 서비스

2. **🔗 Git Submodules 연결**
   - 독립적인 레포지토리 관리
   - 버전 관리 및 협업 체계

3. **🛠️ 코드 리팩토링**
   - 중복 제거
   - 모듈화
   - 재사용성 향상

### 🚀 **다음 단계에서 할 수 있는 것들:**
- 다른 백엔드 서비스 생성 시 shared-libs 재사용
- 프론트엔드에서도 동일한 DTO 사용
- 데이터베이스 스키마 변경 시 db-infra로 관리

**모든 단계를 완료하셨나요?** 추가로 궁금한 점이나 문제가 있으면 언제든 말씀해주세요! 🎯