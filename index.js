/**
 * 🥤 Soda TTS - SillyTavern Extension
 * 
 * 메인 진입점 (manifest.json에서 지정)
 */
import { __sodaResolveDeps } from './modules/deps.js';
import { ensureSettings } from './modules/settings.js';
import { initSettingsPanel } from './modules/ui_settings.js';
import { initMessageButtons } from './modules/ui_message_button.js';



/* ============================================================================
 * 확장 정보
 * ============================================================================ */
        // 2. 설정 초기화 (기본값 보정 등)
        await ensureSettings();

const EXTENSION_NAME = "SodaTTS";
const LOG_PREFIX = "[Soda]";
const WAND_MENU_ID = "soda-wand-item";
const FLOATING_PANEL_ID = "soda_floating_panel";
        // 3. 설정 패널 템플릿 로드
        // import.meta.url을 사용하여 현재 스크립트 위치 기준 상대 경로로 로드
        const extensionUrl = new URL('.', import.meta.url);
        const templateRes = await fetch(new URL('./templates/settings.html', extensionUrl));
        if (!templateRes.ok) throw new Error('Failed to load settings.html');
        const settingsHtml = await templateRes.text();

/* ============================================================================
 * 플로팅 패널 관리
 * ============================================================================ */
        // 4. 설정 패널 UI 초기화
        await initSettingsPanel(settingsHtml);

let floatingPanelHtml = null;
let panelInitialized = false;
        // 5. 메시지 버튼 기능 초기화
        await initMessageButtons();

/**
 * 플로팅 패널 열기
 */
function openFloatingPanel() {
  try {
    let overlay = document.getElementById(FLOATING_PANEL_ID);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = FLOATING_PANEL_ID;
      overlay.className = 'soda-floating-overlay';
      overlay.innerHTML = `
        <div class="soda-floating-panel">
          <div class="soda-floating-header">
            <span>🥤 Soda TTS</span>
            <button class="soda-floating-close" title="닫기">✕</button>
          </div>
          <div class="soda-floating-content">
            ${floatingPanelHtml || '<p>로딩 중...</p>'}
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('.soda-floating-close').onclick = () => {
        overlay.style.display = 'none';
      };
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.style.display = 'none';
      };
      // 패널 초기화 (한 번만)
      if (!panelInitialized && floatingPanelHtml) {
        const content = overlay.querySelector('.soda-floating-content');
        initSettingsPanel(content);
        panelInitialized = true;
      }
    }
    overlay.style.display = 'flex';
  } catch (err) {
    console.error(`${LOG_PREFIX} openFloatingPanel failed:`, err);
  }
}


/**
 * 드래그 기능
 */
function makeDraggable(element, handle) {
  let offsetX = 0, offsetY = 0, startX = 0, startY = 0;
  handle.style.cursor = 'move';
  handle.onmousedown = dragStart;

  function dragStart(e) {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    document.onmouseup = dragEnd;
    document.onmousemove = dragMove;
  }
  
  function dragMove(e) {
    e.preventDefault();
    offsetX = startX - e.clientX;
    offsetY = startY - e.clientY;
    startX = e.clientX;
    startY = e.clientY;
    element.style.top = (element.offsetTop - offsetY) + 'px';
    element.style.left = (element.offsetLeft - offsetX) + 'px';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }
  
  function dragEnd() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

/* ============================================================================
 * 마법봉 메뉴 버튼
 * ============================================================================ */

function addWandMenuButton() {
  if (document.getElementById(WAND_MENU_ID)) return;
  const menu = document.getElementById("extensionsMenu");
  if (!menu) {
    if ((addWandMenuButton._retry ?? 0) < 10) {
      addWandMenuButton._retry = (addWandMenuButton._retry ?? 0) + 1;
      setTimeout(addWandMenuButton, 1000);
    }
    return;
  }
  const item = document.createElement("div");
  item.id = WAND_MENU_ID;
  item.className = "list-group-item flex-container flexGap5 interactable";
  item.innerHTML = `<i class="fa-solid fa-volume-high extensionsMenuExtensionButton"></i> Soda TTS`;
  item.onclick = () => {
    openFloatingPanel();
    menu.style.display = "none";
  };
  menu.appendChild(item);
  console.log(`${LOG_PREFIX} Wand menu button added`);
}

/* ============================================================================
 * 확장 초기화
 * ============================================================================ */

async function init() {
  console.log(`${LOG_PREFIX} 🥤 Initializing...`);
  try {
    // 1) ST 의존성 resolve
    await __sodaResolveDeps();
    console.log(`${LOG_PREFIX} Dependencies resolved`);
    // 2) 설정 초기화
    const settings = ensureSettings();
    console.log(`${LOG_PREFIX} Settings loaded:`, settings.provider || "(no provider)");
    // 3) 설정 패널 HTML 로드 (캐시만)
    await loadSettingsPanelHtml();
    // 4) 마법봉 메뉴 버튼 추가
    addWandMenuButton();
    // 5) 메시지 버튼 초기화
    initMessageButtons();
    console.log(`${LOG_PREFIX} 🥤 Ready!`);
  } catch (e) {
    console.error(`${LOG_PREFIX} Initialization failed:`, e);
  }
}

/**
 * 설정 패널 HTML 로드 (캐시만, 삽입은 나중에)
 */
async function loadSettingsPanelHtml() {
  const scriptUrl = import.meta.url;
  const extensionPath = scriptUrl.substring(0, scriptUrl.lastIndexOf('/'));
  try {
    const response = await fetch(`${extensionPath}/templates/settings.html`);
    if (!response.ok) {
      throw new Error(`Failed to load settings.html: ${response.status}`);
    }
    floatingPanelHtml = await response.text();
    console.log(`${LOG_PREFIX} Settings HTML loaded`);
  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to load settings HTML:`, e);
    floatingPanelHtml = '<p style="color: red;">설정 로드 실패</p>';
  }
}

/* ============================================================================
 * jQuery Ready (ST 방식)
 * ============================================================================ */

if (typeof jQuery !== 'undefined') {
  jQuery(async () => {
    await init();
  });
} else {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
