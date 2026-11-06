/**
 * SmΔrt Color Picker — opt-in banner overlay launcher.
 * Add <a href="https://color.smdeltart.com/smart-color-picker.html"
 * data-scp-overlay><img src="your-banner.svg" alt="Open SmΔrt Color Picker"></a>
 * and <script defer src="https://color.smdeltart.com/color-picker-overlay.js"></script>.
 * Works with external SVG <img>, where SVG-internal scripts cannot control the host page.
 */
(() => {
  "use strict";
  const PICKER_URL = "https://color.smdeltart.com/smart-color-picker.html?embed=overlay";
  const ORIGIN = new URL(PICKER_URL).origin;
  let frame = null, cover = null, previousFocus = null;
  function close() {
    if (!cover) return;
    cover.remove();
    cover = frame = null;
    document.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("message", onMessage);
    if (previousFocus?.isConnected) previousFocus.focus();
    previousFocus = null;
  }
  function onKeydown(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    close();
  }
  function onMessage(event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== ORIGIN) return;
    if (event.data?.type !== "smart-widget") return;
    if (event.data.action === "scp:close") close();
  }
  function open() {
    if (cover) return;
    previousFocus = document.activeElement;
    cover = document.createElement("div");
    cover.setAttribute("data-scp-overlay-root", "");
    cover.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:transparent;color-scheme:only light";
    frame = document.createElement("iframe");
    frame.title = "SmΔrt Color Picker";
    frame.allow = "clipboard-write";
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;background:transparent;color-scheme:only light";
    frame.src = PICKER_URL;
    frame.addEventListener("load", () => {
      if (!frame?.contentWindow) return;
      frame.contentWindow.postMessage({
        type: "smart-widget", action: "scp:open",
        data: { theme: "dark" }
      }, ORIGIN);
      frame.focus();
    }, { once: true });
    cover.appendChild(frame);
    document.body.appendChild(cover);
    document.addEventListener("keydown", onKeydown, true);
    window.addEventListener("message", onMessage);
  }
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const el = event.target?.closest?.("a[data-scp-overlay]");
    if (!el) return;
    // Only intercept links pointing to the canonical Color Picker hostname.
    try {
      const url = new URL(el.href.baseVal || el.href, document.baseURI);
      if (url.origin !== ORIGIN) return;
    } catch { return; }
    event.preventDefault();
    open();
  });
  window.SmartColorPickerOverlay = Object.freeze({open,close});
})();
