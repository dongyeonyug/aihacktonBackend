# 교수 스타일 챗봇 API

강의자료 기반 교수 스타일 맞춤형 챗봇 API (Render 배포용)

## 기술 스택

- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **LLM**: Groq (openai/gpt-oss-120b)
- **배포**: Render

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:
```
GROQ_API_KEY=your_groq_api_key
PORT=3000
```

### 3. Firebase 서비스 계정 키 배치

`serviceAccountKey.json` 파일을 프로젝트 루트에 두세요.
(Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성)

### 4. 서버 실행

```bash
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## API 사용법

### POST /api/chat

사용자 질문에 답변 생성

**요청 예시:**
```json
{
  "question": "CNN이 뭐에요?",
  "styleOptions": {
    "tone": "친절한",
    "formality": "반말",
    "emphasis": "예시 위주"
  }
}
```

**응답 예시:**
```json
{
  "answer": "CNN은 합성곱 신경망(Convolutional Neural Network)이야...",
  "sources": [
    {
      "file": "3주차_딥러닝_기초.pdf",
      "topics": ["딥러닝", "CNN"]
    }
  ]
}
```

**styleOptions 필드 (모두 선택사항):**
- `tone`: 어조 (예: "친절한", "엄격한", "격려하는")
- `formality`: 격식 (예: "존댓말", "반말")
- `emphasis`: 강조점 (예: "예시 위주", "개념 설명", "비교 분석")

### GET /api/health

서버 상태 체크

## Render 배포 가이드

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

**⚠️ 주의: serviceAccountKey.json은 절대 푸시하지 말 것!**
(.gitignore에 이미 포함되어 있음)

### 2. Render 프로젝트 생성

1. [render.com](https://render.com) 접속 및 로그인
2. "New +" → "Web Service" 클릭
3. GitHub 저장소 연결
4. 설정:
   - **Name**: chatbot-api (또는 원하는 이름)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. 환경변수 설정 (Render 대시보드)

**Environment 탭에서 추가:**

1. **GROQ_API_KEY**
   - Value: `your_groq_api_key`

2. **FIREBASE_SERVICE_ACCOUNT_BASE64**
   - Value: serviceAccountKey.json을 base64로 인코딩한 문자열
   
   **인코딩 방법 (터미널):**
   ```bash
   # Mac/Linux
   base64 -i serviceAccountKey.json | tr -d '\n'
   
   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
   ```
   
   출력된 긴 문자열 전체를 복사해서 Render 환경변수에 붙여넣기

### 4. 배포

"Create Web Service" 클릭하면 자동으로 배포 시작.
몇 분 후 `https://your-app-name.onrender.com` 주소로 접속 가능.

## 테스트

### curl로 테스트

```bash
curl -X POST https://your-app-name.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "question": "CNN이 뭐에요?",
    "styleOptions": {
      "formality": "반말"
    }
  }'
```

### Postman/Insomnia 등으로 테스트 가능

## 주요 파일 구조

```
chatbot-api/
├── index.js              # Express 서버 메인
├── routes/
│   └── chat.js          # POST /api/chat 엔드포인트
├── services/
│   ├── firestore.js     # Firestore 강의자료 검색
│   ├── promptBuilder.js # LLM 프롬프트 조합
│   └── llm.js           # Groq API 호출
├── package.json
├── .env                 # 환경변수 (로컬, gitignore됨)
└── serviceAccountKey.json  # Firebase 키 (로컬, gitignore됨)
```

## 성격 데이터 추가 (나중에)

현재는 `services/firestore.js`의 `getProfessorStyle()` 함수가 하드코딩된 기본값을 반환합니다.

나중에 Firestore에 `professorStyle` 컬렉션을 만들고 그곳에서 읽어오도록 수정하면 됩니다.

## 문제 해결

### "Firebase 초기화 실패" 오류
- Render 환경변수에 `FIREBASE_SERVICE_ACCOUNT_BASE64`가 올바르게 설정되었는지 확인
- base64 인코딩 시 줄바꿈 없이 한 줄로 되어 있는지 확인

### "Groq API 호출 오류"
- `GROQ_API_KEY`가 올바른지 확인
- Groq 무료 한도를 초과했는지 확인

### CORS 오류
- 프론트엔드에서 API 호출 시 CORS 오류가 나면 `index.js`의 cors 설정 확인
- 필요시 특정 도메인만 허용하도록 수정 가능
