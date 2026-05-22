/**
 * Firestore 강의자료 및 교수 데이터 검색 서비스
 */

const admin = require('firebase-admin');
const db = admin.firestore();

// 교수별 컬렉션 매핑 (실제 Firestore 컬렉션 이름과 일치해야 함)
const COLLECTION_MAP = {
  'kim_hyunseok': 'materials',
  'jeon_dongsan': 'materials_jeondongsan',     // DB 실제 이름
  'ok_sooyeol': 'materials_oksuuyeal',         // DB 실제 이름 (철자 주의)
  'lee_yangmin': 'materials_leeyangmin'        // DB 실제 이름
};

/**
 * 질문에서 키워드를 추출하여 관련 강의자료 검색 (교수별 컬렉션)
 * @param {string} professorId - 교수 ID
 * @param {string} question - 사용자 질문
 * @param {number} limit - 최대 반환 문서 수
 * @returns {Promise<Array>} 관련 강의자료 배열
 */
async function searchMaterials(professorId, question, limit = 5) {
  try {
    // 1. 교수별 컬렉션 선택
    const collectionName = COLLECTION_MAP[professorId] || 'materials';
    console.log(`📚 ${professorId} → ${collectionName} 컬렉션 검색`);
    
    const snapshot = await db.collection(collectionName).limit(50).get();
    
    if (snapshot.empty) {
      console.log(`⚠️ ${collectionName}에 강의자료가 없습니다.`);
      return [];
    }

    const materials = [];
    snapshot.forEach(doc => {
      materials.push({ id: doc.id, ...doc.data() });
    });

    // 2. 질문 데이터 전처리
    const questionLower = question.toLowerCase();
    const questionNoSpace = questionLower.replace(/\s+/g, '');
    
    const questionWords = questionLower
      .split(/[\s,.\/?!~_-]+/)
      .filter(w => w.length > 0);

    // 3. 각 강의자료 문서별로 점수 매기기
    const scored = materials.map(material => {
      let score = 0;
      
      const keywords = Array.isArray(material.keywords) ? material.keywords : [];
      const topics = Array.isArray(material.topics) ? material.topics : [];
      
      const concepts = (material.concepts || '').toLowerCase();
      const examPoints = (material.examPoints || '').toLowerCase();
      const examples = (material.examples || '').toLowerCase();
      const rawSummary = (material.rawSummary || '').toLowerCase();

      const fullText = [concepts, examPoints, examples, rawSummary].join(' ');
      const fullTextNoSpace = fullText.replace(/\s+/g, '');

      // 패턴 A: 띄어쓰기 무시 매칭
      keywords.forEach(kw => {
        const kwLower = kw.toLowerCase();
        const kwNoSpace = kwLower.replace(/\s+/g, '');
        
        if (questionNoSpace.includes(kwNoSpace) || kwNoSpace.includes(questionNoSpace)) {
          score += 15;
        }
      });

      topics.forEach(topic => {
        const topicLower = topic.toLowerCase();
        const topicNoSpace = topicLower.replace(/\s+/g, '');
        if (questionNoSpace.includes(topicNoSpace) || topicNoSpace.includes(questionNoSpace)) {
          score += 10;
        }
      });

      // 패턴 B: 조사 제거 후 단어 단위 검색
      questionWords.forEach(word => {
        const cleanWord = word.replace(/(이|가|을|를|은|는|이의|에|에서|에게|과|와|의|이란|이란것|에대한|에대해|대해)$/, '');
        if (cleanWord.length < 1) return;

        keywords.forEach(kw => {
          if (kw.toLowerCase().includes(cleanWord)) score += 5;
        });

        topics.forEach(topic => {
          if (topic.toLowerCase().includes(cleanWord)) score += 4;
        });

        if (fullTextNoSpace.includes(cleanWord)) {
          score += 3;
        }
      });

      return { ...material, score };
    });

    // 4. 점수 기반 정렬 및 반환
    const sorted = scored
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (sorted.length === 0) {
      console.log('⚠️ 매칭 실패, 상위 기본 자료 반환');
      return materials.slice(0, Math.min(3, materials.length));
    }

    console.log(`✅ 검색 완료: ${sorted.length}개 자료 발견`);
    return sorted;
  } catch (error) {
    console.error('Firestore 검색 오류:', error);
    throw error;
  }
}

/**
 * Firestore의 professor 컬렉션에서 교수 성격 데이터 가져오기
 */
async function getProfessorStyle(professorId) {
  try {
    if (!professorId) {
      throw new Error('professorId가 누락되었습니다.');
    }

    const docRef = db.collection('professor').doc(professorId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error(`해당 ID(${professorId})의 교수 데이터를 찾을 수 없습니다.`);
    }

    return doc.data();
  } catch (error) {
    console.error('교수 데이터 가져오기 오류:', error);
    throw error;
  }
}

module.exports = {
  searchMaterials,
  getProfessorStyle
};