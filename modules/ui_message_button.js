/**
 * Soda - ui_message_button.js
 * AI 메시지에 TTS 버튼 삽입 및 관리
 */

import { ensureSettings } from "./settings.js";
import { providers as ttsProviders } from "./providers/index.js";
import {
  getCurrentAudio, setCurrentAudio,
  getCurrentPlayingBtn, setCurrentPlayingBtn,
  getLastAudioBlob, setLastAudioBlob,
  resetPlaybackState,
  preprocessForTts, extractDialogues
} from "./state.js";



/* ============================================================================
 * 이벤트 위임 설정
 * ============================================================================ */

let _delegationSetup = false;

/**
 * 이벤트 위임 설정 (document 레벨에서 한 번만)
 */
function setupEventDelegation() {
  if (_delegationSetup) return;
  _delegationSetup = true;

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".soda-msg-tts-btn");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    // 메시지 컨테이너 찾기
    const messageEl = btn.closest(".mes");
    if (!messageEl) {
      console.warn("[Soda] Message container not found");
      return;
    }

    // 메시지 텍스트 가져오기
    const mesText = messageEl.querySelector(".mes_text");
    if (!mesText) {
      console.warn("[Soda] Message text not found");
      return;
    }

    const fullText = mesText.innerText || mesText.textContent || "";

    // 읽기 모드에 따라 처리
    const settings = ensureSettings();
    const readMode = settings.msgButtonReadMode || "dialogue";

    let textToRead = "";
    if (readMode === "dialogue") {
      const dialogues = extractDialogues(fullText);
      if (dialogues.length === 0) {
        console.log("[Soda] No dialogues found in message");
        showToast("이 메시지에서 대사를 찾을 수 없습니다.");
        return;
      }
      textToRead = dialogues.join(" ");
    } else {
      textToRead = fullText;
    }

    await playTts(textToRead, btn);
  });

  console.log("[Soda] Event delegation setup complete");
}



/* ============================================================================
 * TTS 재생
 * ============================================================================ */

/**
 * TTS 재생
 * @param {string} text - 읽을 텍스트
 * @param {HTMLElement} btn - 버튼 요소 (상태 표시용)
 */
async function playTts(text, btn) {
  const settings = ensureSettings();
  if (!settings) {
    console.warn("[Soda] Settings not found");
    return;
  }

  const providerId = settings.provider;
  const provider = ttsProviders[providerId];

  if (!provider) {
    console.error("[Soda] TTS provider not found:", providerId);
    showToast("TTS Provider를 설정해주세요.");
    return;
  }

  // 이전 재생 중지
  const currentAudio = getCurrentAudio();
  const currentPlayingBtn = getCurrentPlayingBtn();

  if (currentAudio) {
    currentAudio.pause();
    setCurrentAudio(null);
    if (currentPlayingBtn) {
      currentPlayingBtn.classList.remove("is-playing");
      currentPlayingBtn.innerHTML = getSpeakerIcon();
    }
  }

  // 같은 버튼 다시 누르면 정지만
  if (currentPlayingBtn === btn) {
    setCurrentPlayingBtn(null);
    return;
  }

  try {
    btn.classList.add("is-playing");
    btn.innerHTML = getStopIcon();
    setCurrentPlayingBtn(btn);

    // Provider settings 가져오기
    const providerSettings = settings.providers?.[providerId] || {};

    // 텍스트 전처리
    const processedText = preprocessForTts(text);
    if (!processedText || processedText.length === 0) {
      console.warn("[Soda] No text to speak after preprocessing");
      btn.classList.remove("is-playing");
      btn.innerHTML = getSpeakerIcon();
      setCurrentPlayingBtn(null);
      return;
    }

    // TTS 호출
    const audioUrl = await provider.getAudioUrl(processedText, providerSettings);

    // Blob 저장 (다운로드용)
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      setLastAudioBlob(blob);
    } catch (e) {
      console.warn("[Soda] Failed to save audio blob:", e);
    }

    // 오디오 재생
    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);

    audio.onended = () => {
      btn.classList.remove("is-playing");
      btn.innerHTML = getSpeakerIcon();
      setCurrentPlayingBtn(null);
      setCurrentAudio(null);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = (e) => {
      console.error("[Soda] Audio playback error:", e);
      btn.classList.remove("is-playing");
      btn.innerHTML = getSpeakerIcon();
      setCurrentPlayingBtn(null);
      setCurrentAudio(null);
    };

    await audio.play();

  } catch (e) {
    console.error("[Soda] TTS error:", e);
    btn.classList.remove("is-playing");
    btn.innerHTML = getSpeakerIcon();
    setCurrentPlayingBtn(null);
  }
}



/* ============================================================================
 * 버튼 관리
 * ============================================================================ */

/**
 * 메시지 요소에 TTS 버튼 추가
 */
function addTtsButtonToMessage(messageEl) {
  // 이미 버튼이 있으면 스킵
  if (messageEl.querySelector(".soda-msg-tts-btn")) return;

  // 버튼 영역 찾기
  const buttonArea = messageEl.querySelector(".mes_buttons, .extraMesButtons");
  if (!buttonArea) return;

  // TTS 버튼 생성
  const ttsBtn = document.createElement("div");
  ttsBtn.className = "soda-msg-tts-btn mes_button";
  ttsBtn.innerHTML = getSpeakerIcon();
  ttsBtn.title = "TTS로 읽기";

  // 버튼 영역 앞쪽에 삽입
  buttonArea.insertBefore(ttsBtn, buttonArea.firstChild);
}

/**
 * 모든 AI 메시지에 TTS 버튼 추가
 */
export function addTtsButtonsToAllMessages() {
  const settings = ensureSettings();
  if (!settings?.msgButtonEnabled) return;

  // AI 메시지만 선택 (is_user가 아닌 것)
  const messages = document.querySelectorAll(".mes:not(.is_user)");
  let addedCount = 0;

  messages.forEach(msg => {
    if (msg.querySelector(".soda-msg-tts-btn")) return;
    addTtsButtonToMessage(msg);
    addedCount++;
  });

  if (addedCount > 0) {
    console.log(`[Soda] Added TTS buttons to ${addedCount} messages`);
  }
}

/**
 * 모든 TTS 버튼 제거
 */
export function removeTtsButtonsFromAllMessages() {
  const buttons = document.querySelectorAll(".soda-msg-tts-btn");
  buttons.forEach(btn => btn.remove());
  console.log(`[Soda] Removed ${buttons.length} TTS buttons`);
}



/* ============================================================================
 * MutationObserver
 * ============================================================================ */

let messageObserver = null;

/**
 * 새 메시지 감지 Observer 시작
 */
export function startMessageObserver() {
  if (messageObserver) {
    messageObserver.disconnect();
    messageObserver = null;
  }

  const chatContainer = document.querySelector("#chat");
  if (!chatContainer) {
    console.warn("[Soda] Chat container not found, will retry");
    setTimeout(() => startMessageObserver(), 1000);
    return;
  }

  messageObserver = new MutationObserver((mutations) => {
    const settings = ensureSettings();
    if (!settings?.msgButtonEnabled) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 새로 추가된 메시지 확인
          if (node.classList?.contains("mes") && !node.classList?.contains("is_user")) {
            setTimeout(() => addTtsButtonToMessage(node), 50);
          }
          // 내부에 메시지가 있는 경우
          const innerMsgs = node.querySelectorAll?.(".mes:not(.is_user)");
          innerMsgs?.forEach(msg => setTimeout(() => addTtsButtonToMessage(msg), 50));
        }
      }
    }
  });

  messageObserver.observe(chatContainer, {
    childList: true,
    subtree: true
  });
}

/**
 * Observer 중지
 */
export function stopMessageObserver() {
  if (messageObserver) {
    messageObserver.disconnect();
    messageObserver = null;
    console.log("[Soda] Message observer stopped");
  }
}



/* ============================================================================
 * 공개 API
 * ============================================================================ */

/**
 * 토글 상태에 따라 활성화/비활성화
 */
export function setMessageButtonsEnabled(enabled) {
  if (enabled) {
    addTtsButtonsToAllMessages();
    startMessageObserver();
  } else {
    removeTtsButtonsFromAllMessages();
    stopMessageObserver();
    resetPlaybackState();
  }
}

/**
 * 초기화 (확장 로드 시 호출)
 */
export function initMessageButtons() {
  // 이벤트 위임 설정 (최초 1회)
  setupEventDelegation();

  // ST 이벤트 등록
  registerSTEvents();

  const settings = ensureSettings();
  if (settings?.msgButtonEnabled) {
    setTimeout(() => {
      addTtsButtonsToAllMessages();
      startMessageObserver();
    }, 1000);
  }
}



/* ============================================================================
 * ST 이벤트 연동
 * ============================================================================ */

let _stEventsRegistered = false;

/**
 * ST 이벤트 기반 자동 초기화
 */
function registerSTEvents() {
  if (_stEventsRegistered) return;
  _stEventsRegistered = true;

  const eventSource = window.eventSource;
  const event_types = window.event_types;

  if (!eventSource || !event_types) {
    console.warn("[Soda] ST event system not found, using interval fallback");
    setInterval(() => {
      const settings = ensureSettings();
      if (settings?.msgButtonEnabled) {
        addTtsButtonsToAllMessages();
      }
    }, 2000);
    return;
  }

  // 채팅방 로드/전환 시
  eventSource.on(event_types.CHAT_CHANGED, () => {
    console.log("[Soda] CHAT_CHANGED event");
    setTimeout(() => {
      const settings = ensureSettings();
      if (settings?.msgButtonEnabled) {
        stopMessageObserver();
        addTtsButtonsToAllMessages();
        startMessageObserver();
      }
    }, 500);
  });

  // 새 AI 메시지 렌더링 시
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, () => {
    const settings = ensureSettings();
    if (settings?.msgButtonEnabled) {
      setTimeout(() => addTtsButtonsToAllMessages(), 100);
    }
  });

  console.log("[Soda] ST events registered");
}



/* ============================================================================
 * 유틸
 * ============================================================================ */

/**
 * 스피커 아이콘 SVG
 */
function getSpeakerIcon() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M11 5L6 9H2v6h4l5 4V5z"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
  </svg>`;
}

/**
 * 정지 아이콘 SVG
 */
function getStopIcon() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>`;
}

/**
 * 간단한 토스트 메시지
 */
function showToast(message) {
  // ST의 toastr가 있으면 사용
  if (window.toastr?.warning) {
    window.toastr.warning(message);
    return;
  }
  // 없으면 alert
  alert(message);
}