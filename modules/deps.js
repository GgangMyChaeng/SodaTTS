/**
 * Soda - deps.js
 * ST 의존성(전역) 로더 / 캐시
 * 
 * ST의 extension_settings / script.js의 saveSettingsDebounced를
 * 설치 경로가 달라도 찾아서 export 변수에 "주입"해주는 로더
 */

export let extension_settings;
export let saveSettingsDebounced;
export let getRequestHeaders;

/**
 * ST 의존성 resolve
 * - 현재 파일(import.meta.url) 기준으로 상대경로를 바꿔가며
 * - extensions.js에서 extension_settings를 찾고
 * - script.js에서 saveSettingsDebounced를 찾음
 * - 못 찾으면 에러를 던져서 문제를 빨리 드러내게 함
 */
export async function __sodaResolveDeps() {
  const base = import.meta.url;

  const tryImport = async (rel) => {
    try {
      return await import(new URL(rel, base));
    } catch (e) {
      return null;
    }
  };

  // extensions.js 찾기
  const extMod =
    // 1) third-party 레이아웃: /scripts/extensions/third-party/<ext>/modules/deps.js
    (await tryImport("../../../../extensions.js")) ||
    // 2) 일반 레이아웃: /scripts/extensions/<ext>/modules/deps.js
    (await tryImport("../../../extensions.js")) ||
    // 3) (구버전/예외 fallback)
    (await tryImport("../../extensions.js"));

  if (!extMod?.extension_settings) {
    throw new Error("[Soda] Failed to import extension_settings (extensions.js path mismatch)");
  }
  extension_settings = extMod.extension_settings;

  // script.js 찾기
  const scriptMod =
    // 1) third-party 레이아웃이면 deps.js 기준 5단계 위
    (await tryImport("../../../../../script.js")) ||
    // 2) 일반 레이아웃이면 deps.js 기준 4단계 위
    (await tryImport("../../../../script.js")) ||
    // 3) (구버전/예외 fallback)
    (await tryImport("../../../script.js"));

  if (!scriptMod?.saveSettingsDebounced) {
    throw new Error("[Soda] Failed to import saveSettingsDebounced (script.js path mismatch)");
  }
  saveSettingsDebounced = scriptMod.saveSettingsDebounced;
  getRequestHeaders = scriptMod.getRequestHeaders;
}



/**
 * ST 컨텍스트 헬퍼
 * ST 환경이 버전/빌드/로딩 타이밍에 따라 getContext 접근 방식이 갈릴 수 있어서
 * - window.SillyTavern.getContext() 있으면 그걸 우선
 * - 아니면 전역 getContext() 있으면 그걸 사용
 * - 둘 다 실패하면 null
 */
export function getSTContextSafe() {
  try {
    if (window.SillyTavern?.getContext) return window.SillyTavern.getContext();
  } catch {}
  try {
    if (typeof getContext === "function") return getContext();
  } catch {}
  return null;
}