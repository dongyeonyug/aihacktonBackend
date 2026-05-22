/**
 * Firestore 강의자료 검색 서비스
 */

const admin = require('firebase-admin');

// Firebase 초기화 (index.js에서 먼저 초기화됨)
const db = admin.firestore();

/**
 * 질문에서 키워드를 추출하여 관련 강의자료 검색
 * @param {string} question - 사용자 질문
 * @param {number} limit - 최대 반환 문서 수
 * @returns {Promise<Array>} 관련 강의자료 배열
 */
async function searchMaterials(question, limit = 5) {
  try {
    // 모든 강의자료 가져오기 (일단 전체, 나중에 최적화 가능)
    const snapshot = await db.collection('materials').limit(50).get();
    
    if (snapshot.empty) {
      console.log('Firestore에 강의자료가 없습니다.');
      return [];
    }

    const materials = [];
    snapshot.forEach(doc => {
      materials.push({ id: doc.id, ...doc.data() });
    });

    // 질문과 강의자료의 keywords 매칭으로 점수 계산
    const questionLower = question.toLowerCase();
    const questionWords = questionLower.split(/\s+/).filter(w => w.length > 1);

    const scored = materials.map(material => {
      let score = 0;
      const keywords = material.keywords || [];
      const topics = material.topics || [];
      const concepts = (material.concepts || '').toLowerCase();
      
      // keywords 매칭 (가중치 높음)
      keywords.forEach(kw => {
        if (questionLower.includes(kw.toLowerCase())) {
          score += 10;
        }
      });

      // topics 매칭
      topics.forEach(topic => {
        if (questionLower.includes(topic.toLowerCase())) {
          score += 8;
        }
      });

      // 질문 단어가 concepts에 있는지
      questionWords.forEach(word => {
        if (concepts.includes(word)) {
          score += 2;
        }
      });

      return { ...material, score };
    });

    // 점수 높은 순으로 정렬하고 상위 N개 반환
    const sorted = scored
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 점수가 0인 경우(관련 자료 없음) 최근 자료 몇 개라도 반환
    if (sorted.length === 0) {
      console.log('관련 자료를 찾지 못해 일부 자료를 기본 반환합니다.');
      return materials.slice(0, Math.min(3, materials.length));
    }

    return sorted;
  } catch (error) {
    console.error('Firestore 검색 오류:', error);
    throw error;
  }
}

/**
 * 교수 성격 데이터 가져오기 (나중에 구현, 지금은 기본값 반환)
 * @returns {Promise<Object>} 성격 데이터
 */
async function getProfessorStyle() {
  // TODO: Firestore의 professorStyle 컬렉션에서 가져오기
  // 지금은 하드코딩된 기본값
  return {
    tone: '친절하고 명확한',
    formality: '존댓말',
    teachingStyle: '개념 설명 후 구체적인 예시를 드는'
  };
}

module.exports = {
  searchMaterials,
  getProfessorStyle
};
