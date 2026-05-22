// /**
//  * LLM(Groq) 호출 서비스
//  */

// const Groq = require('groq-sdk');

// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY
// });

// const MODEL = 'openai/gpt-oss-120b';  // 다국어 품질 좋은 모델

// /**
//  * Groq을 통해 답변 생성
//  * @param {Array} messages - 프롬프트 메시지 배열
//  * @returns {Promise<string>} 생성된 답변
//  */
// async function generateAnswer(messages) {
//   try {
//     const completion = await groq.chat.completions.create({
//       model: MODEL,
//       messages: messages,
//       temperature: 0.3,  // 일관성 있는 답변 위해 낮게
//       max_tokens: 1500,
//     });

//     return completion.choices[0].message.content;
//   } catch (error) {
//     console.error('Groq API 호출 오류:', error);
//     throw new Error('답변 생성 중 오류가 발생했습니다.');
//   }
// }

// module.exports = {
//   generateAnswer
// };


/**
 * LLM(Groq) 호출 서비스 (llmService.js)
 */

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = 'openai/gpt-oss-120b';  // 설정된 다국어 모델

/**
 * Groq을 통해 답변 생성
 * @param {Array} messages - 프롬프트 메시지 배열
 * @returns {Promise<string>} 생성된 답변
 */
async function generateAnswer(messages) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: messages,
      temperature: 0.3,  // 일관성 있는 답변을 위해 낮게 유지
      max_tokens: 1500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Groq API 호출 오류:', error);
    throw new Error('답변 생성 중 오류가 발생했습니다.');
  }
}

module.exports = {
  generateAnswer
};