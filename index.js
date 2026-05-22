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
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase initialized with base64 credentials');
    } catch (e) {
      console.error('Base64 Firebase 키 파싱 실패:', e);
      throw e;
    }
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
app.use(cors());          // CORS 허용 (프론트엔드 호환)
app.use(express.json());  // JSON 파싱 미들웨어 (req.body 읽기 필수)

// 루트 경로 (설명 페이지)
app.get('/', (req, res) => {
  res.json({
    message: '교수 스타일 챗봇 API 서버',
    status: 'healthy',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/health'
    }
  });
});

// Render 배포 및 모니터링을 위한 Health Check 엔드포인트 추가
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// 채팅 라우트 등록 (/api/chat 으로 연결됨)
const chatRoutes = require('./routes/chat');
app.use('/api', chatRoutes);

// 404 처리 미들웨어
app.use((req, res, next) => {
  res.status(404).json({ error: '존재하지 않는 엔드포인트입니다.' });
});

// 글로벌 에러 핸들링 미들웨어 (서버 다운 방지)
app.use((err, req, res, next) => {
  console.error('서버 내부 에러 발생:', err.stack);
  res.status(500).json({ error: '서버 내부에서 오류가 발생했습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API 엔드포인트: http://localhost:${PORT}/api/chat`);
  console.log(`🏥 헬스체크 경로: http://localhost:${PORT}/api/health`);
});

// 예기치 못한 프로미스 거부 에러 핸들링
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});