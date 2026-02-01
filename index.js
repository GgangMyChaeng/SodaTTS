/**
 * Soda - providers/index.js
 * TTS Provider 레지스트리
 */

import * as qwen from "./qwen.js";
import * as openai from "./openai.js";
import * as gemini from "./gemini.js";
import * as lmnt from "./lmnt.js";
import * as elevenlabs from "./elevenlabs.js";

/**
 * 등록된 프로바이더들
 * key: provider id
 * value: { id, name, getAudioUrl, voices, ... }
 */
export const providers = {
  qwen: {
    id: "qwen",
    name: "Qwen (Alibaba)",
    getAudioUrl: qwen.getAudioUrl,
    voices: qwen.QWEN_VOICES,
    meta: qwen.meta,
  },
  openai: {
    id: "openai",
    name: "OpenAI TTS",
    getAudioUrl: openai.getAudioUrl,
    voices: openai.OPENAI_VOICES,
    meta: openai.meta,
  },
  gemini: {
    id: "gemini",
    name: "Gemini (Google)",
    getAudioUrl: gemini.getAudioUrl,
    voices: gemini.GEMINI_VOICES,
    meta: gemini.meta,
  },
  lmnt: {
    id: "lmnt",
    name: "LMNT",
    getAudioUrl: lmnt.getAudioUrl,
    voices: lmnt.LMNT_VOICES,
    meta: lmnt.meta,
  },
  elevenlabs: {
    id: "elevenlabs",
    name: "ElevenLabs",
    getAudioUrl: elevenlabs.getAudioUrl,
    voices: elevenlabs.ELEVENLABS_VOICES,
    models: elevenlabs.ELEVENLABS_MODELS,
    meta: elevenlabs.meta,
  },
};

/**
 * Provider 가져오기
 * @param {string} id - Provider ID
 * @returns {object|null}
 */
export function getProvider(id) {
  return providers[id] || null;
}

/**
 * Provider 목록 가져오기
 * @returns {object[]}
 */
export function getProviderList() {
  return Object.values(providers);
}