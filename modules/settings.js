/**
 * Soda - settings.js
 * TTS 설정 스키마/기본값/마이그레이션
 */

import { extension_settings, saveSettingsDebounced } from "./deps.js";

/** 저장소 키 */
export const SETTINGS_KEY = "soda_tts";

/**
 * 설정 초기화 및 보정
 * extension_settings에서 설정을 꺼내고, 없으면 기본값으로 "완성된 settings"를 보장
 */
export function ensureSettings() {
  extension_settings[SETTINGS_KEY] ??= {};
  const s = extension_settings[SETTINGS_KEY];

  // === 기본값 보정 ===
  
  // 활성화 여부
  s.enabled ??= true;
  
  // 현재 선택된 프로바이더
  s.provider ??= "";
  
  // 프로바이더별 설정
  s.providers ??= {};
  
  // Qwen (Alibaba DashScope)
  s.providers.qwen ??= {};
  s.providers.qwen.apiKey ??= "";
  s.providers.qwen.model ??= "qwen3-tts-flash";
  s.providers.qwen.voice ??= "Cherry";
  
  // OpenAI
  s.providers.openai ??= {};
  s.providers.openai.apiKey ??= "";
  s.providers.openai.model ??= "tts-1";
  s.providers.openai.voice ??= "nova";
  s.providers.openai.speed ??= 1.0;
  s.providers.openai.instructions ??= "";
  
  // Gemini
  s.providers.gemini ??= {};
  s.providers.gemini.apiKey ??= "";
  s.providers.gemini.model ??= "gemini-2.5-flash-preview-tts";
  s.providers.gemini.voice ??= "Kore";
  
  // LMNT
  s.providers.lmnt ??= {};
  s.providers.lmnt.apiKey ??= "";
  s.providers.lmnt.model ??= "lightning";
  s.providers.lmnt.voice ??= "lily";
  s.providers.lmnt.speed ??= 1.0;
  
  // ElevenLabs
  s.providers.elevenlabs ??= {};
  s.providers.elevenlabs.apiKey ??= "";
  s.providers.elevenlabs.model ??= "eleven_multilingual_v2";
  s.providers.elevenlabs.voice ??= "21m00Tcm4TlvDq8ikWAM";
  s.providers.elevenlabs.stability ??= 0.5;
  s.providers.elevenlabs.similarityBoost ??= 0.75;
  
  // 메시지 버튼 설정
  s.msgButtonEnabled ??= false;
  s.msgButtonReadMode ??= "dialogue"; // "dialogue" | "full"
  
  // 자동 재생 (향후 기능용)
  s.autoPlay ??= false;
  
  // 디버그 모드
  s.debugMode ??= false;

  return s;
}

/**
 * 설정 저장 (debounced)
 */
export function saveSettings() {
  try {
    saveSettingsDebounced?.();
  } catch (e) {
    console.warn("[Soda] Failed to save settings:", e);
  }
}

/**
 * 현재 선택된 프로바이더의 설정 가져오기
 */
export function getCurrentProviderSettings() {
  const s = ensureSettings();
  const providerId = s.provider;
  if (!providerId) return null;
  return s.providers[providerId] || null;
}

/**
 * 프로바이더 설정 업데이트
 * @param {string} providerId - 프로바이더 ID
 * @param {object} updates - 업데이트할 설정 객체
 */
export function updateProviderSettings(providerId, updates) {
  const s = ensureSettings();
  if (!s.providers[providerId]) {
    s.providers[providerId] = {};
  }
  Object.assign(s.providers[providerId], updates);
  saveSettings();
}