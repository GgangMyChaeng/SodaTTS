/**
 * Soda - ui_settings.js
 * Extensions 메뉴 내 설정 패널 UI + 이벤트
 */

import { ensureSettings, saveSettings } from "./settings.js";
import { getLastAudioBlob } from "./state.js";
import { providers as ttsProviders } from "./providers/index.js";
import { QWEN_VOICES } from "./providers/qwen.js";
import { OPENAI_VOICES } from "./providers/openai.js";
import { GEMINI_VOICES } from "./providers/gemini.js";
import { LMNT_VOICES } from "./providers/lmnt.js";
import { ELEVENLABS_VOICES, ELEVENLABS_MODELS } from "./providers/elevenlabs.js";
import { setMessageButtonsEnabled, initMessageButtons } from "./ui_message_button.js";



/* ============================================================================
 * 설정 패널 초기화
 * ============================================================================ */

/**
 * 설정 패널 초기화 (Extensions 메뉴에 삽입된 후 호출)
 * @param {HTMLElement} container - 설정 패널 컨테이너
 */
export function initSettingsPanel(container) {
  if (!container) {
    console.error("[Soda] Settings container not found");
    return;
  }

  const settings = ensureSettings();

  // === 요소 참조 ===
  const providerSel = container.querySelector('#soda_tts_provider');
  const commonActions = container.querySelector('#soda_tts_common_actions');
  const corsWarning = container.querySelector('#soda_tts_cors_warning');
  const testBtn = container.querySelector('#soda_tts_test_btn');
  const testResult = container.querySelector('#soda_tts_test_result');
  const downloadBtn = container.querySelector('#soda_tts_download_btn');
  const downloadStatus = container.querySelector('#soda_tts_download_status');

  // Provider별 설정 박스
  const qwenSettings = container.querySelector('#soda_tts_qwen_settings');
  const openaiSettings = container.querySelector('#soda_tts_openai_settings');
  const geminiSettings = container.querySelector('#soda_tts_gemini_settings');
  const lmntSettings = container.querySelector('#soda_tts_lmnt_settings');
  const elevenlabsSettings = container.querySelector('#soda_tts_elevenlabs_settings');

  // 메시지 버튼 토글
  const msgButtonToggle = container.querySelector('#soda_tts_msg_button_toggle');
  const msgButtonOptions = container.querySelector('#soda_tts_msg_button_options');
  const msgReadModeSel = container.querySelector('#soda_tts_msg_read_mode');

  // === Provider 드롭다운 채우기 ===
  if (providerSel) {
    providerSel.innerHTML = '<option value="">🥤 Select Provider</option>';
    Object.values(ttsProviders).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      providerSel.appendChild(opt);
    });
  }

  // === Voice 드롭다운 채우기 ===
  fillVoiceSelect(container.querySelector('#soda_tts_qwen_voice'), QWEN_VOICES, "Cherry");
  fillVoiceSelect(container.querySelector('#soda_tts_openai_voice'), OPENAI_VOICES, "nova");
  fillVoiceSelect(container.querySelector('#soda_tts_gemini_voice'), GEMINI_VOICES, "Kore");
  fillVoiceSelect(container.querySelector('#soda_tts_lmnt_voice'), LMNT_VOICES, "lily");
  fillVoiceSelect(container.querySelector('#soda_tts_elevenlabs_voice'), ELEVENLABS_VOICES, "21m00Tcm4TlvDq8ikWAM");

  // ElevenLabs 모델
  const elevenlabsModelSel = container.querySelector('#soda_tts_elevenlabs_model');
  if (elevenlabsModelSel && elevenlabsModelSel.options.length === 0) {
    ELEVENLABS_MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      elevenlabsModelSel.appendChild(opt);
    });
  }

  // === UI 업데이트 함수 ===
  function updateUI() {
    const provider = settings.provider || "";

    // Provider 드롭다운
    if (providerSel) providerSel.value = provider;

    // Provider 설정 박스 show/hide
    if (qwenSettings) qwenSettings.style.display = (provider === 'qwen') ? 'block' : 'none';
    if (openaiSettings) openaiSettings.style.display = (provider === 'openai') ? 'block' : 'none';
    if (geminiSettings) geminiSettings.style.display = (provider === 'gemini') ? 'block' : 'none';
    if (lmntSettings) lmntSettings.style.display = (provider === 'lmnt') ? 'block' : 'none';
    if (elevenlabsSettings) elevenlabsSettings.style.display = (provider === 'elevenlabs') ? 'block' : 'none';

    // 공통 액션 & CORS 경고
    if (commonActions) commonActions.style.display = provider ? 'flex' : 'none';
    if (corsWarning) corsWarning.style.display = provider ? 'block' : 'none';

    // 각 Provider별 값 복원
    restoreProviderValues(container, settings, provider);

    // 메시지 버튼 토글 상태
    if (msgButtonToggle) {
      msgButtonToggle.checked = settings.msgButtonEnabled || false;
    }
    if (msgButtonOptions) {
      msgButtonOptions.style.display = settings.msgButtonEnabled ? 'block' : 'none';
    }
    if (msgReadModeSel) {
      msgReadModeSel.value = settings.msgButtonReadMode || 'dialogue';
    }
  }

  // === 이벤트 바인딩 ===

  // Provider 변경
  providerSel?.addEventListener('change', (e) => {
    settings.provider = e.target.value;
    saveSettings();
    updateUI();
  });

  // Qwen 설정
  qwenSettings?.addEventListener('input', (e) => {
    const s = settings.providers.qwen;
    if (e.target.id === 'soda_tts_qwen_model') s.model = e.target.value;
    if (e.target.id === 'soda_tts_qwen_voice') s.voice = e.target.value;
    if (e.target.id === 'soda_tts_qwen_apikey') s.apiKey = e.target.value;
    saveSettings();
  });

  // OpenAI 설정
  openaiSettings?.addEventListener('input', (e) => {
    const s = settings.providers.openai;
    if (e.target.id === 'soda_tts_openai_model') s.model = e.target.value;
    if (e.target.id === 'soda_tts_openai_voice') s.voice = e.target.value;
    if (e.target.id === 'soda_tts_openai_speed') {
      s.speed = parseFloat(e.target.value);
      const valEl = container.querySelector('#soda_tts_openai_speed_val');
      if (valEl) valEl.textContent = `${s.speed}x`;
    }
    if (e.target.id === 'soda_tts_openai_instructions') s.instructions = e.target.value;
    if (e.target.id === 'soda_tts_openai_apikey') s.apiKey = e.target.value;
    saveSettings();
  });

  // Gemini 설정
  geminiSettings?.addEventListener('input', (e) => {
    const s = settings.providers.gemini;
    if (e.target.id === 'soda_tts_gemini_model') s.model = e.target.value;
    if (e.target.id === 'soda_tts_gemini_voice') s.voice = e.target.value;
    if (e.target.id === 'soda_tts_gemini_apikey') s.apiKey = e.target.value;
    saveSettings();
  });

  // LMNT 설정
  lmntSettings?.addEventListener('input', (e) => {
    const s = settings.providers.lmnt;
    if (e.target.id === 'soda_tts_lmnt_model') s.model = e.target.value;
    if (e.target.id === 'soda_tts_lmnt_voice') s.voice = e.target.value;
    if (e.target.id === 'soda_tts_lmnt_speed') {
      s.speed = parseFloat(e.target.value);
      const valEl = container.querySelector('#soda_tts_lmnt_speed_val');
      if (valEl) valEl.textContent = `${s.speed}x`;
    }
    if (e.target.id === 'soda_tts_lmnt_apikey') s.apiKey = e.target.value;
    saveSettings();
  });

  // ElevenLabs 설정
  elevenlabsSettings?.addEventListener('input', (e) => {
    const s = settings.providers.elevenlabs;
    if (e.target.id === 'soda_tts_elevenlabs_model') s.model = e.target.value;
    if (e.target.id === 'soda_tts_elevenlabs_voice') s.voice = e.target.value;
    if (e.target.id === 'soda_tts_elevenlabs_stability') {
      s.stability = parseFloat(e.target.value);
      const valEl = container.querySelector('#soda_tts_elevenlabs_stability_val');
      if (valEl) valEl.textContent = s.stability;
    }
    if (e.target.id === 'soda_tts_elevenlabs_similarity') {
      s.similarityBoost = parseFloat(e.target.value);
      const valEl = container.querySelector('#soda_tts_elevenlabs_similarity_val');
      if (valEl) valEl.textContent = s.similarityBoost;
    }
    if (e.target.id === 'soda_tts_elevenlabs_apikey') s.apiKey = e.target.value;
    saveSettings();
  });

  // 테스트 버튼
  testBtn?.addEventListener('click', async () => {
    await handleTestTts(settings, testResult);
  });

  // 다운로드 버튼
  downloadBtn?.addEventListener('click', () => {
    handleDownloadAudio(downloadStatus);
  });

  // 메시지 버튼 토글
  msgButtonToggle?.addEventListener('change', (e) => {
    settings.msgButtonEnabled = e.target.checked;
    if (msgButtonOptions) {
      msgButtonOptions.style.display = e.target.checked ? 'block' : 'none';
    }
    setMessageButtonsEnabled(e.target.checked);
    saveSettings();
  });

  // 읽기 모드 변경
  msgReadModeSel?.addEventListener('change', (e) => {
    settings.msgButtonReadMode = e.target.value;
    saveSettings();
  });

  // 초기 UI 렌더링
  updateUI();

  // 메시지 버튼 초기화
  initMessageButtons();

  console.log("[Soda] Settings panel initialized");
}



/* ============================================================================
 * 헬퍼 함수들
 * ============================================================================ */

/**
 * Voice 드롭다운 채우기
 */
function fillVoiceSelect(selectEl, voices, defaultVoice) {
  if (!selectEl || selectEl.options.length > 0) return;
  voices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.name || v.id;
    selectEl.appendChild(opt);
  });
  if (defaultVoice) selectEl.value = defaultVoice;
}

/**
 * Provider별 값 복원
 */
function restoreProviderValues(container, settings, provider) {
  if (provider === 'qwen') {
    const s = settings.providers.qwen;
    const modelSel = container.querySelector('#soda_tts_qwen_model');
    const voiceSel = container.querySelector('#soda_tts_qwen_voice');
    const apiKeyInput = container.querySelector('#soda_tts_qwen_apikey');
    if (modelSel) modelSel.value = s.model || "qwen3-tts-flash";
    if (voiceSel) voiceSel.value = s.voice || "Cherry";
    if (apiKeyInput) apiKeyInput.value = s.apiKey || "";
  }

  if (provider === 'openai') {
    const s = settings.providers.openai;
    const modelSel = container.querySelector('#soda_tts_openai_model');
    const voiceSel = container.querySelector('#soda_tts_openai_voice');
    const speedInput = container.querySelector('#soda_tts_openai_speed');
    const speedVal = container.querySelector('#soda_tts_openai_speed_val');
    const instructionsInput = container.querySelector('#soda_tts_openai_instructions');
    const apiKeyInput = container.querySelector('#soda_tts_openai_apikey');
    if (modelSel) modelSel.value = s.model || "tts-1";
    if (voiceSel) voiceSel.value = s.voice || "nova";
    if (speedInput) speedInput.value = s.speed ?? 1.0;
    if (speedVal) speedVal.textContent = `${s.speed ?? 1.0}x`;
    if (instructionsInput) instructionsInput.value = s.instructions || "";
    if (apiKeyInput) apiKeyInput.value = s.apiKey || "";
  }

  if (provider === 'gemini') {
    const s = settings.providers.gemini;
    const modelSel = container.querySelector('#soda_tts_gemini_model');
    const voiceSel = container.querySelector('#soda_tts_gemini_voice');
    const apiKeyInput = container.querySelector('#soda_tts_gemini_apikey');
    if (modelSel) modelSel.value = s.model || "gemini-2.5-flash-preview-tts";
    if (voiceSel) voiceSel.value = s.voice || "Kore";
    if (apiKeyInput) apiKeyInput.value = s.apiKey || "";
  }

  if (provider === 'lmnt') {
    const s = settings.providers.lmnt;
    const modelSel = container.querySelector('#soda_tts_lmnt_model');
    const voiceSel = container.querySelector('#soda_tts_lmnt_voice');
    const speedInput = container.querySelector('#soda_tts_lmnt_speed');
    const speedVal = container.querySelector('#soda_tts_lmnt_speed_val');
    const apiKeyInput = container.querySelector('#soda_tts_lmnt_apikey');
    if (modelSel) modelSel.value = s.model || "blizzard";
    if (voiceSel) voiceSel.value = s.voice || "lily";
    if (speedInput) speedInput.value = s.speed ?? 1.0;
    if (speedVal) speedVal.textContent = `${s.speed ?? 1.0}x`;
    if (apiKeyInput) apiKeyInput.value = s.apiKey || "";
  }

  if (provider === 'elevenlabs') {
    const s = settings.providers.elevenlabs;
    const modelSel = container.querySelector('#soda_tts_elevenlabs_model');
    const voiceSel = container.querySelector('#soda_tts_elevenlabs_voice');
    const stabilityInput = container.querySelector('#soda_tts_elevenlabs_stability');
    const stabilityVal = container.querySelector('#soda_tts_elevenlabs_stability_val');
    const similarityInput = container.querySelector('#soda_tts_elevenlabs_similarity');
    const similarityVal = container.querySelector('#soda_tts_elevenlabs_similarity_val');
    const apiKeyInput = container.querySelector('#soda_tts_elevenlabs_apikey');
    if (modelSel) modelSel.value = s.model || "eleven_flash_v2_5";
    if (voiceSel) voiceSel.value = s.voice || "21m00Tcm4TlvDq8ikWAM";
    if (stabilityInput) stabilityInput.value = s.stability ?? 0.5;
    if (stabilityVal) stabilityVal.textContent = s.stability ?? 0.5;
    if (similarityInput) similarityInput.value = s.similarityBoost ?? 0.75;
    if (similarityVal) similarityVal.textContent = s.similarityBoost ?? 0.75;
    if (apiKeyInput) apiKeyInput.value = s.apiKey || "";
  }
}

/**
 * TTS 테스트
 */
async function handleTestTts(settings, resultEl) {
  const providerId = settings.provider;
  const provider = ttsProviders[providerId];

  if (!provider) {
    if (resultEl) {
      resultEl.textContent = "❌ Provider를 선택해주세요.";
      resultEl.className = "soda-status soda-status-error";
    }
    return;
  }

  const providerSettings = settings.providers[providerId] || {};

  if (resultEl) {
    resultEl.textContent = "🔄 연결 중...";
    resultEl.className = "soda-status soda-status-loading";
  }

  try {
    const audioUrl = await provider.getAudioUrl("Hello! Soda TTS is working.", providerSettings);
    const audio = new Audio(audioUrl);
    audio.volume = 0.8;
    audio.play().catch(e => console.warn("[Soda] Auto-play blocked:", e));

    if (resultEl) {
      resultEl.textContent = `✅ 연결 성공! (${provider.name})`;
      resultEl.className = "soda-status soda-status-success";
    }
  } catch (e) {
    console.error("[Soda] TTS Test Failed:", e);
    if (resultEl) {
      resultEl.innerHTML = `❌ 오류: ${e.message}<br><span class="soda-hint">API Key를 확인하거나 ST config.yaml에서 <b>enableCorsProxy: true</b>를 켜보세요.</span>`;
      resultEl.className = "soda-status soda-status-error";
    }
  }
}

/**
 * 오디오 다운로드
 */
function handleDownloadAudio(statusEl) {
  const blob = getLastAudioBlob();

  if (!blob) {
    if (statusEl) {
      statusEl.textContent = "❌ 다운로드할 오디오가 없습니다. 먼저 TTS를 재생해주세요.";
      statusEl.className = "soda-status soda-status-error";
    }
    return;
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soda_tts_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (statusEl) {
      statusEl.textContent = "✅ 다운로드 완료!";
      statusEl.className = "soda-status soda-status-success";
    }
  } catch (e) {
    console.error("[Soda] Download error:", e);
    if (statusEl) {
      statusEl.textContent = `❌ 다운로드 실패: ${e.message}`;
      statusEl.className = "soda-status soda-status-error";
    }
  }
}