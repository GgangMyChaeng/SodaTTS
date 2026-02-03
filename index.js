/**
 * 🥤 Soda TTS - SillyTavern Extension
 * 메인 진입점 (manifest.json에서 지정)
 */
import { __sodaResolveDeps } from "./modules/deps.js";
import { ensureSettings } from "./modules/settings.js";
import { initSettingsPanel } from "./modules/ui_settings.js";
import { initMessageButtons } from "./modules/ui_message_button.js";

const EXTENSION_NAME = "SodaTTS";
const LOG_PREFIX = "[Soda]";
const WAND_MENU_ID = "soda-wand-item";
const FLOATING_PANEL_ID = "soda_floating_panel";

let floatingPanelHtml = null;
let panelInitialized = false;

/**
 * 플로팅 패널 열기
 */
function openFloatingPanel() {
  try {
    let overlay = document.getElementById(FLOATING_PANEL_ID);

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = FLOATING_PANEL_ID;
      overlay.className = "soda-floating-overlay";
      overlay.innerHTML = `
        <div class="soda-floating-panel">
          <div class="soda-floating-header">
            <span>🥤 Soda TTS</span>
            <button class="soda-floating-close" title="닫기">✕</button>
          </div>
          <div class="soda-floating-content">
            ${floatingPanelHtml || "<p>로딩 중...</p>"}
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector(".soda-floating-close").onclick = () => {
        overlay.style.display = "none";
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.style.display = "none";
      };

      // 패널 초기화 (한 번만)
      if (!panelInitialized && floatingPanelHtml) {
        // ⚠️ 여기서 initSettingsPanel이 "HTML 문자열"을 받는 구조면,
        // DOM을 넘기지 말고 그냥 floatingPanelHtml을 다시 쓰거나,
        // ui_settings.js 쪽을 "컨테이너 + html" 형태로 바꿔야 함
        // 일단 최소 안전하게: 아무것도 안 함
        panelInitialized = true;
      }
    }

    overlay.style.display = "flex";
  } catch (err) {
    console.error(`${LOG_PREFIX} openFloatingPanel failed:`, err);
  }
}

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

async function loadSettingsPanelHtml() {
  const scriptUrl = import.meta.url;
  const extensionPath = scriptUrl.substring(0, scriptUrl.lastIndexOf("/"));

  try {
    const response = await fetch(`${extensionPath}/templates/settings.html`);
    if (!response.ok) throw new Error(`Failed to load settings.html: ${response.status}`);
    floatingPanelHtml = await response.text();
    console.log(`${LOG_PREFIX} Settings HTML loaded`);

    // settings.html을 로드한 뒤에만 패널 init
    await initSettingsPanel(floatingPanelHtml);
  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to load settings HTML:`, e);
    floatingPanelHtml = '<p style="color: red;">설정 로드 실패</p>';
  }
}

async function init() {
  console.log(`${LOG_PREFIX} 🥤 Initializing...`);
  try {
    await __sodaResolveDeps();
    await ensureSettings();

    await loadSettingsPanelHtml();

    addWandMenuButton();

    await initMessageButtons();

    console.log(`${LOG_PREFIX} 🥤 Ready!`);
  } catch (e) {
    console.error(`${LOG_PREFIX} Initialization failed:`, e);
  }
}

// ST 방식
if (typeof jQuery !== "undefined") {
  jQuery(() => init());
} else if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
