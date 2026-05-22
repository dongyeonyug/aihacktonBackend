/**
 * LLM 프롬프트 생성 서비스
 */

/**
 * 시스템 프롬프트 + 강의자료 컨텍스트 조합
 * @param {Object} professorStyle - 교수 성격 데이터
 * @param {Object} styleOptions - 프론트에서 전달한 스타일 옵션
 * @param {Array} materials - 검색된 강의자료 배열
 * @param {string} question - 사용자 질문
 * @returns {Array} messages 배열 (Groq/OpenAI 형식)
 */
function buildPrompt(professorStyle, styleOptions, materials, question) {
  // 1) 시스템 메시지: 성격 데이터 + styleOptions 반영
  const tone = styleOptions?.tone || professorStyle.tone;
  const formality = styleOptions?.formality || professorStyle.formality;
  const emphasis = styleOptions?.emphasis || '개념 설명';

  const systemMessage = `당신은 대학 강의를 담당하는 교수의 답변 스타일을 모방하는 AI 조교입니다.

**말투 및 스타일:**
- 어조: ${tone}
- 격식: ${formality}
- 강조점: ${emphasis}
- 교수의 강의 스타일: ${professorStyle.teachingStyle}

**답변 원칙:**
1. 제공된 강의자료 내용을 기반으로 정확하게 답변하세요.
2. 강의자료에 없는 내용은 "강의자료에서 다루지 않았습니다"라고 명시하세요.
3. 답변은 ${formality === '반말' ? '반말' : '존댓말'}로 작성하세요.
4. ${emphasis} 방식으로 설명하세요.
5. 간결하고 명확하게 답변하되, 필요시 구체적인 예시를 들어주세요.
6. **마크다운 문법(**, ##, - 등)을 사용하지 말고 일반 텍스트로만 답변하세요.**`;

  // 2) 강의자료 컨텍스트 구성
  let context = '';
  if (materials && materials.length > 0) {
    context = '**참고 강의자료:**\n\n';
    materials.forEach((material, idx) => {
      const source = material.sourceFile || material.id || `자료 ${idx + 1}`;
      const topics = (material.topics || []).join(', ');
      const summary = material.rawSummary || material.concepts || '내용 요약 없음';
      
      context += `[${source}]\n`;
      if (topics) context += `주제: ${topics}\n`;
      context += `${summary}\n\n`;
    });
  } else {
    context = '(참고할 강의자료를 찾지 못했습니다. 일반적인 지식으로 답변하되, 강의자료 기반이 아님을 명시하세요.)\n\n';
  }

  // 3) 사용자 질문
  const userMessage = `${context}**질문:** ${question}`;

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: userMessage }
  ];
}

module.exports = {
  buildPrompt
};
