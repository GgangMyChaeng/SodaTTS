/**
 * Soda TTS - SillyTavern Extension
 * 🥤 톡톡 터지는 TTS!
 * 
 * 메인 진입점 (manifest.json에서 지정)
 */

import { __sodaResolveDeps } from "./modules/deps.js";
import { ensureSettings } from "./modules/settings.js";
import { initSettingsPanel } from "./modules/ui_settings.js";
import { initMessageButtons } from "./modules/ui_message_button.js";

/* ============================================================================
 * 확장 정보
 * ============================================================================ */

const EXTENSION_NAME = "SodaTTS";
const LOG_PREFIX = "[Soda]";

/* ============================================================================
 * 확장 초기화
 * ============================================================================ */

/**
 * 메인 초기화 함수
 */
async function init() {
  console.log(`${LOG_PREFIX} 🥤 Initializing...`);

  try {
    // 1) ST 의존성 resolve
    await __sodaResolveDeps();
    console.log(`${LOG_PREFIX} Dependencies resolved`);

    // 2) 설정 초기화
    const settings = ensureSettings();
    console.log(`${LOG_PREFIX} Settings loaded:`, settings.provider || "(no provider)");

    // 3) 설정 패널 HTML 로드 및 Extensions 메뉴에 삽입
    await loadSettingsPanel();

    // 4) 메시지 버튼 초기화
    initMessageButtons();

    console.log(`${LOG_PREFIX} 🥤 Ready!`);

  } catch (e) {
    console.error(`${LOG_PREFIX} Initialization failed:`, e);
  }
}

/**
 * 설정 패널 HTML 로드 및 삽입
 */
async function loadSettingsPanel() {
  // 확장 경로 계산
  const scriptUrl = import.meta.url;
  const extensionPath = scriptUrl.substring(0, scriptUrl.lastIndexOf('/'));

  try {
    // settings.html 로드
    const response = await fetch(`${extensionPath}/templates/settings.html`);
    if (!response.ok) {
      throw new Error(`Failed to load settings.html: ${response.status}`);
    }
    const html = await response.text();

    // 컨테이너 생성
    const container = document.createElement('div');
    container.id = 'soda_extension_container';
    container.innerHTML = html;

    // ST Extensions 영역에 삽입
    const extensionsMenu = document.querySelector('#extensions_settings');
    if (extensionsMenu) {
      extensionsMenu.appendChild(container);
      console.log(`${LOG_PREFIX} Settings panel injected`);
      
      // 패널 초기화
      initSettingsPanel(container);
    } else {
      // Extensions 메뉴가 아직 없으면 대기 후 재시도
      console.warn(`${LOG_PREFIX} Extensions menu not found, retrying...`);
      setTimeout(async () => {
        const retryMenu = document.querySelector('#extensions_settings');
        if (retryMenu) {
          retryMenu.appendChild(container);
          initSettingsPanel(container);
          console.log(`${LOG_PREFIX} Settings panel injected (retry)`);
        } else {
          console.error(`${LOG_PREFIX} Extensions menu not found after retry`);
        }
      }, 2000);
    }

  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to load settings panel:`, e);
  }
}

/* ============================================================================
 * jQuery Ready (ST 방식)
 * ============================================================================ */

// ST는 jQuery 사용
if (typeof jQuery !== 'undefined') {
  jQuery(async () => {
    await init();
  });
} else {
  // jQuery 없으면 DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
