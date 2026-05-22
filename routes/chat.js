/**
 * 채팅 API 라우트 - 커스터마이징 지원
 */

const express = require('express');
const router = express.Router();
const { searchMaterials, getProfessorStyle } = require('../services/firestore');
const { buildPrompt } = require('../services/promptBuilder');
const { generateAnswer } = require('../services/llm');

/**
 * POST /api/chat
 * 사용자 질문에 대한 답변 생성
 * 
 * Body:
 * {
 *   "professorId": "kim_hyunseok",        // 필수: 교수 ID
 *   "question": "CNN이 뭐예요?",          // 필수: 질문
 *   "customization": {                    // 선택: 커스터마이징
 *     "personality": "츤데레형",          // 6가지 중 선택
 *     "gender": "남",                     // 남/여
 *     "speechStyle": "김현석"             // 4명 교수 중 선택
 *   }
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const { professorId, question, customization } = req.body;

    console.log('📨 요청 수신:', { professorId, question, customization });

    // 1) 입력 검증
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '질문(question)을 입력해주세요.' 
      });
    }
    
    if (!professorId) {
      return res.status(400).json({ 
        success: false,
        error: '교수님 ID(professorId)가 필요합니다.' 
      });
    }

    // 2) Firestore에서 해당 교수님의 성격 데이터 가져오기
    const professorData = await getProfessorStyle(professorId);
    console.log(`👨‍🏫 교수 데이터 로드: ${professorData.name}`);

    // 3) 교수별 컬렉션에서 관련 강의자료 검색
    const materials = await searchMaterials(professorId, question, 5);
    console.log(`📚 강의자료 검색 완료: ${materials.length}개`);

    // 4) 커스터마이징 + 강의자료로 프롬프트 생성
    const messages = buildPrompt(professorData, customization, materials, question);

    // 5) LLM으로 답변 생성
    const answer = await generateAnswer(messages);
    console.log('✅ 답변 생성 완료');

    // 6) 응답
    return res.status(200).json({
      success: true,
      professorName: professorData.name,
      answer: answer,
      customization: customization || {},
      materialsUsed: materials.length
    });

  } catch (error) {
    console.error('❌ 채팅 라우터 오류:', error);
    return res.status(500).json({ 
      success: false,
      error: '답변 생성 중 서버 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

/**
 * GET /api/options
 * 프론트엔드에서 선택 가능한 옵션 목록 반환
 */
router.get('/options', (req, res) => {
  res.json({
    personalities: [
      { value: '츤데레형', label: '츤데레형 - 차갑지만 은근 챙겨줌' },
      { value: '다정다감형', label: '다정다감형 - 친근하고 이해하기 쉽게' },
      { value: '원칙주의형', label: '원칙주의형 - PDF와 교재대로만' },
      { value: '칭찬감옥형', label: '칭찬감옥형 - 칭찬을 아낌없이' },
      { value: '해외파감성형', label: '해외파감성형 - 원어민 교수님' },
      { value: '마이웨이형', label: '마이웨이형 - 본인 페이스대로' }
    ],
    genders: [
      { value: '남', label: '남성' },
      { value: '여', label: '여성' }
    ],
    speechStyles: [
      { value: '김현석', label: '김현석 교수님 - 실무 압박형' },
      { value: '전동산', label: '전동산 교수님 - 친근+영어 섞음' },
      { value: '옥수열', label: '옥수열 교수님 - 열정 폭발형' },
      { value: '이양민', label: '이양민 교수님 - ASMR→열정' }
    ],
    professors: [
      { value: 'kim_hyunseok', label: '김현석 교수님' },
      { value: 'jeon_dongsan', label: '전동산 교수님' },
      { value: 'ok_sooyeol', label: '옥수열 교수님' },
      { value: 'lee_yangmin', label: '이양민 교수님' }
    ]
  });
});

module.exports = router;