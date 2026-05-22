/**
 * 챗봇 API 서버 메인
 * Render 배포용 Express 앱
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Firebase 초기화
function initializeFirebase() {
  if (admin.apps.length > 0) {
    console.log('Firebase already initialized');
    return;
  }

  // Render 환경: base64로 인코딩된 서비스 계정 키 사용
  // 로컬 환경: serviceAccountKey.json 파일 사용
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized with base64 credentials');
  } else {
    // 로컬 개발용
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase initialized with local serviceAccountKey.json');
  }
}

// Firebase 초기화 실행
try {
  initializeFirebase();
} catch (error) {
  console.error('Firebase 초기화 실패:', error);
  process.exit(1);
}

// Express 앱 설정
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());  // CORS 허용 (프론트엔드에서 접근 가능하도록)
app.use(express.json());  // JSON 파싱

// 라우트
const chatRoutes = require('./routes/chat');
app.use('/api', chatRoutes);

// 루트 경로
app.get('/', (req, res) => {
  res.json({
    message: '교수 스타일 챗봇 API',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health'
    }
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api/chat`);
});

// 에러 핸들링
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});
