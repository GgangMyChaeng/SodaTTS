/**
 * Soda - state.js
 * TTS 재생 상태 관리 + 유틸 함수
 * 
 * 이 모듈은 독립적으로 유지 (다른 모듈 import 없음)
 */



/* ============================================================================
 * 재생 상태 관리
 * ============================================================================ */

// 현재 재생 중인 Audio 객체
let _currentAudio = null;

// 현재 재생 중인 버튼 요소
let _currentPlayingBtn = null;

// 마지막 재생된 오디오 Blob (다운로드용)
let _lastAudioBlob = null;

// 마지막 오디오 URL
let _lastAudioUrl = null;

/**
 * 현재 오디오 가져오기
 */
export function getCurrentAudio() {
  return _currentAudio;
}

/**
 * 현재 오디오 설정
 */
export function setCurrentAudio(audio) {
  _currentAudio = audio;
}

/**
 * 현재 재생 중인 버튼 가져오기
 */
export function getCurrentPlayingBtn() {
  return _currentPlayingBtn;
}

/**
 * 현재 재생 중인 버튼 설정
 */
export function setCurrentPlayingBtn(btn) {
  _currentPlayingBtn = btn;
}

/**
 * 마지막 오디오 Blob 가져오기
 */
export function getLastAudioBlob() {
  return _lastAudioBlob;
}

/**
 * 마지막 오디오 Blob 설정
 */
export function setLastAudioBlob(blob) {
  _lastAudioBlob = blob;
}

/**
 * 마지막 오디오 URL 가져오기
 */
export function getLastAudioUrl() {
  return _lastAudioUrl;
}

/**
 * 마지막 오디오 URL 설정
 */
export function setLastAudioUrl(url) {
  _lastAudioUrl = url;
}

/**
 * 재생 상태 초기화
 */
export function resetPlaybackState() {
  if (_currentAudio) {
    try {
      _currentAudio.pause();
      _currentAudio.src = "";
    } catch {}
  }
  _currentAudio = null;
  _currentPlayingBtn = null;
}



/* ============================================================================
 * 텍스트 전처리 유틸
 * ============================================================================ */

/**
 * TTS용 텍스트 전처리
 * - 마크다운 제거
 * - 이모지 제거
 * - *지문* 제거
 * - 공백 정리
 * 
 * @param {string} text - 원본 텍스트
 * @returns {string} - 전처리된 텍스트
 */
export function preprocessForTts(text) {
  let t = String(text || "");
  
  // 1) 마크다운 제거
  t = stripMarkdown(t);
  
  // 2) 이모지 제거
  t = stripEmoji(t);
  
  // 3) *지문* 제거 (별표로 감싼 구간)
  t = t.replace(/\*[^*]+\*/g, " ");
  
  // 4) 공백 정리
  t = t.replace(/\s+/g, " ").trim();
  
  return t;
}

/**
 * 마크다운 제거
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdown(text) {
  let t = String(text || "");
  
  // 코드블록 제거
  t = t.replace(/```[\s\S]*?```/g, " ");
  
  // 인라인 코드
  t = t.replace(/`([^`]+)`/g, "$1");
  
  // 굵게/기울임
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/_([^_]+)_/g, "$1");
  
  // 링크 [text](url) -> text
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  
  // 헤더/리스트 마커 제거
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  t = t.replace(/^\s*[-*+]\s+/gm, "");
  
  return t;
}

/**
 * 이모지 제거
 * @param {string} text
 * @returns {string}
 */
export function stripEmoji(text) {
  // 범용 이모지 범위 제거
  return String(text || "").replace(/[\u{1F000}-\u{1FAFF}]/gu, "");
}

/**
 * 대사만 추출 (따옴표 안의 텍스트)
 * 다양한 따옴표 패턴 지원: "대사", "대사", 「대사」, 『대사』
 * 
 * @param {string} text - 원본 텍스트
 * @returns {string[]} - 대사 배열
 */
export function extractDialogues(text) {
  const dialogues = [];
  const t = String(text || "");
  
  // 다양한 따옴표 패턴
  const patterns = [
    /"([^"]+)"/g,      // 한국어 큰따옴표
    /"([^"]+)"/g,      // 영어 큰따옴표
    /「([^」]+)」/g,    // 일본어 낫표
    /『([^』]+)』/g,    // 일본어 겹낫표
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(t)) !== null) {
      const dialogue = match[1].trim();
      if (dialogue.length > 0) {
        dialogues.push(dialogue);
      }
    }
  }
  
  // 중복 제거
  return [...new Set(dialogues)];
}

/**
 * 텍스트 길이 제한 분할
 * API 글자수 제한 대응용
 * 
 * @param {string} text - 원본 텍스트
 * @param {number} maxLength - 최대 길이 (기본 500)
 * @returns {string[]} - 분할된 텍스트 배열
 */
export function splitTextByLength(text, maxLength = 500) {
  const t = String(text || "");
  if (t.length <= maxLength) return [t];
  
  const chunks = [];
  for (let i = 0; i < t.length; i += maxLength) {
    const chunk = t.slice(i, i + maxLength).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}