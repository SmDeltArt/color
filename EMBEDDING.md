# Transparent full-screen embedding

## Contract

Use `smart-color-picker.html?embed=overlay` in a full-viewport iframe. The iframe, its ancestors (including any dialog/backdrop), and the widget's html/body must have transparent backgrounds. Overlay mode keeps a transparent click-outside layer; only the picker panel paints a surface. Panel alpha and the alpha of the selected colour are separate settings.

The widget owns panel dragging, centering, viewport bounds and gradient expansion. Ignore `scp:size` and `scp:drag*` in overlay mode. Do not resize or move the iframe. Legacy compact embedding without `embed=overlay` uses a different geometry contract.

```html
<iframe id="picker" title="SmΔrt Color Picker"
  src="/assets/widgets/color/smart-color-picker.html?embed=overlay"
  style="position:fixed;inset:0;width:100vw;height:100dvh;border:0;background:transparent;color-scheme:normal;z-index:10000"
  allow="clipboard-write"></iframe>
```

For a host already inside a modal dialog, put the iframe in a transparent full-screen `dialog` appended to `document.body` and call `showModal()`. Clear its border, margin, padding, max-width/max-height, background and `::backdrop` background. This places it above existing modal content. Keep keyboard dismissal and remove the iframe/listener on close.

## Messages and results

After iframe `load`, send `{type:'smart-widget', action:'scp:open', data:{hex:'#39ff88', alpha:1, theme:'dark'}}` using `frame.contentWindow.postMessage(message, new URL(frame.src).origin)`.

Check BOTH `event.source === frame.contentWindow` and `event.origin === new URL(frame.src).origin` before accepting `{type:'smart-widget'}` messages. Allow only expected actions. `scp:color` previews; `scp:validate` confirms; `scp:close` dismisses. Decide explicitly whether close retains the latest preview or cancels it.

Solid results contain `rgba: {r,g,b,a}`: convert to `rgba(r,g,b,a)` rather than assigning the object to CSS. If `gradientActive` is true, backgrounds can use the validated `gradient` string. CSS `color` cannot use a gradient; use background-clip:text or restrict the control to solid colours. Restore saved editor selections before changing contenteditable text.

Theme/palette/appearance messages style the PANEL. They must never paint the iframe canvas. `scp:setGradient` restores gradient configuration; inspect the current implementation before relying on optional fields.

## Local copy or hosted HTML

- topic.earth intentionally uses a pinned same-origin copy, with its JSON/CSV companions. It needs no remote host. Keep its origin/source checks and local adaptations when syncing.
- Studio uses a hosted URL; its bridge is `studio/public/app/src/color-picker-bridge.js` in SmDeltArt/private. Studio's cross-origin isolation may require compatible COEP/CORP responses or a public credentialless iframe.
- Hosted entry: `https://color-iota-five.vercel.app/smart-color-picker.html?embed=overlay`. Verify deployment/domain status before switching to a branded alias. Aliases of one Vercel project are not independent fallbacks.
- Use an actual HTML host for iframe documents. GitHub repository/raw pages and asset CDNs serving `text/plain` are not iframe application hosts. Check Content-Type, redirects and framing headers. GitHub Pages, if enabled, uses the repository name `color`, not `smart-color-picker`.
- The current upstream bridge restricts allowed parent origins; inspect/update its allowlist for a new consumer. CORS does not grant postMessage access or make backgrounds transparent.
- Deploy/cache changes matter: update the consumer service worker precache/version for bundled copies. A query parameter alone does not replace an old service-worker-cached module.

## Verification

Use a patterned/bright host behind the iframe. Outside the panel it must remain visible without dark tint, in dark/light themes, desktop/mobile and after gradient expansion/dragging. Test live alpha, gradient restoration, native close, Escape and repeated opens. Confirm origin/source rejection and repeat after service-worker upgrade. Inspect root/body/backdrop computed backgrounds separately from the selected paint value.

## Copy into Copilot, GPT or Ollama

```text
Integrate the existing SmDeltArt/color smart-color-picker.html. Read EMBEDDING.md
and the actual picker bridge before editing. Preserve this app's Manager pattern.
Use ?embed=overlay in a transparent FULL-VIEWPORT iframe in the current page.
The picker owns panel movement and expansion; ignore scp:size and scp:drag*.
Do not open a tab or shrink/move the iframe. Keep all host/dialog/backdrop and
widget html/body layers transparent; retain an opaque readable picker panel.
Use the app's existing local copy or verified hosted HTML URL, not a raw/asset
CDN URL. Preserve source+origin validation and send to the exact targetOrigin.
Wire live colour, rgba alpha, supported gradients and close lifecycle. Preserve
editor selection and clean up listeners. Respect the upstream origin allowlist.
Update offline cache versions if bundled. Test on a bright patterned host in
light/dark themes, mobile, dragging, gradient expansion, close/reopen and Escape.
Report actual test results and any unverified deployed behaviour. Do not claim
that iframe CSS alone can change a cross-origin document's background.
```

Give the assistant repository access or paste this guide plus the bridge/picker files. A model cannot inspect private code from a URL alone. For local Ollama, provide those files in the coding client's context and request a diff first; model choice does not change this embedding contract.
