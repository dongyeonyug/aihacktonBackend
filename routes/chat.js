/**
 * 채팅 API 라우트
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
 *   "question": "CNN이 뭐에요?",
 *   "styleOptions": {  // 선택사항
 *     "tone": "친절한",
 *     "formality": "반말",
 *     "emphasis": "예시 위주"
 *   }
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const { question, styleOptions } = req.body;

    // 1) 입력 검증
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        error: '질문을 입력해주세요.'
      });
    }

    console.log(`[요청] 질문: "${question}"`);
    if (styleOptions) {
      console.log('[요청] 스타일 옵션:', styleOptions);
    }

    // 2) Firestore에서 관련 강의자료 검색
    const materials = await searchMaterials(question, 5);
    console.log(`[검색] ${materials.length}개 강의자료 발견`);

    // 3) 교수 성격 데이터 가져오기 (현재는 기본값)
    const professorStyle = await getProfessorStyle();

    // 4) 프롬프트 조합
    const messages = buildPrompt(professorStyle, styleOptions, materials, question);

    // 5) LLM 호출하여 답변 생성
    const answer = await generateAnswer(messages);
    console.log('[답변 생성 완료]');

    // 6) 응답
    res.json({
      answer: answer,
      sources: materials.map(m => ({
        file: m.sourceFile || m.id,
        topics: m.topics || []
      }))
    });

  } catch (error) {
    console.error('[오류]', error);
    res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

/**
 * GET /api/health
 * 서버 상태 체크
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
