# Chronicles of Fate — AI 텍스트 RPG

Gemini API를 활용한 Next.js 텍스트 RPG 게임입니다.

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어 GEMINI_API_KEY에 실제 키 입력

# 3. 개발 서버 실행
npm run dev
# → http://localhost:3000 접속
```

## Vercel 배포

### 방법 1 — Vercel CLI (터미널)

```bash
npm install -g vercel
vercel
# 질문에 엔터로 기본값 선택
```

### 방법 2 — GitHub 연동 (권장)

1. 이 프로젝트를 GitHub에 push
2. [vercel.com](https://vercel.com) 접속 → **Add New Project**
3. GitHub 저장소 선택 → Import
4. **Environment Variables** 항목에서 추가:
   - Key: `GEMINI_API_KEY`
   - Value: `AIza...` (실제 키)
5. **Deploy** 클릭

배포 완료 후 `https://프로젝트명.vercel.app` 주소로 서비스됩니다.

## 구조

```
src/
  app/
    page.js          # 게임 UI (클라이언트)
    page.module.css  # 스타일
    layout.js        # HTML 레이아웃 + 폰트
    api/
      gemini/
        route.js     # Gemini API 프록시 (서버, API 키 숨김)
```

## 환경변수

| 변수명 | 설명 |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio에서 발급한 Gemini API 키 |
