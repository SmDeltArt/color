/**
 * SmΔrt gradient eyedropper: samples a user-provided local image along a drawn line.
 * Returns approximate linear gradient stops in the existing SmartColorPicker state format.
 * Does not read cross-origin frames or capture the user's screen.
 */
export function initGradientEyedropper({ trigger, onApply }) {
  if (!trigger || typeof onApply !== "function") return;
  const dialog = document.createElement("div");
  dialog.className = "scp-gradient-sampler";
  dialog.hidden = true;
  dialog.innerHTML = `
    <section class="scp-gradient-sampler-panel" role="dialog" aria-modal="true"
      aria-labelledby="scpGradientSamplerTitle">
      <header class="scp-gradient-sampler-header">
        <strong id="scpGradientSamplerTitle">🌈 Gradient eyedropper</strong>
        <button type="button" data-close aria-label="Close gradient eyedropper">✕</button>
      </header>
      <p>Choose a local PNG, JPEG, WebP or SVG. Drag a line from the gradient's start to its end to estimate up to 8 editable color stops.</p>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" aria-label="Choose an image to sample">
      <canvas aria-label="Draw a sampling line across the image" tabindex="0"></canvas>
      <p class="scp-gradient-sampler-status" role="status" aria-live="polite">Choose an image to begin. Samples are approximate; original SVG/CSS settings cannot be recovered from pixels.</p>
      <footer>
        <button type="button" data-cancel>Cancel</button>
        <button type="button" data-apply disabled>Apply gradient</button>
      </footer>
    </section>`;
  document.body.appendChild(dialog);
  const $ = selector => dialog.querySelector(selector);
  const input = $('input[type="file"]'), canvas = $("canvas");
  const status = $(".scp-gradient-sampler-status");
  const apply = $("[data-apply]"), ctx = canvas.getContext("2d", { willReadFrequently: true });
  const source = document.createElement("canvas"), sourceCtx = source.getContext("2d", { willReadFrequently: true });
  let start = null, end = null, dragging = false, estimate = null, previousFocus = null;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rgbToHsv = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  };
  const pointFromEvent = e => {
    const r = canvas.getBoundingClientRect();
    return {
      x: clamp((e.clientX - r.left) * canvas.width / r.width, 0, canvas.width - 1),
      y: clamp((e.clientY - r.top) * canvas.height / r.height, 0, canvas.height - 1)
    };
  };
  const redraw = () => {
    if (!canvas.width || !canvas.height) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0);
    if (!start || !end) return;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([7, 4]);
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(start.x, start.y, 5, 0, Math.PI * 2);
    ctx.moveTo(end.x + 5, end.y); ctx.arc(end.x, end.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };
  const reconstruct = () => {
    if (!start || !end) return null;
    const dx = end.x - start.x, dy = end.y - start.y;
    if (Math.hypot(dx, dy) < 12) return null;
    const samples = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      const x = clamp(Math.round(start.x + dx * t), 0, source.width - 1);
      const y = clamp(Math.round(start.y + dy * t), 0, source.height - 1);
      const rgba = sourceCtx.getImageData(x, y, 1, 1).data;
      samples.push([rgba[0], rgba[1], rgba[2]]);
    }
    const delta = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    let widest = 0;
    for (const color of samples) widest = Math.max(widest, delta(samples[0], color));
    if (widest < 12) return null;
    // Iteratively keep the point with the greatest RGB deviation from linear interpolation.
    const indices = [0, 64];
    while (indices.length < 8) {
      let maxError = 0, maxIndex = -1;
      for (let segment = 0; segment < indices.length - 1; segment++) {
        const a = indices[segment], b = indices[segment + 1];
        for (let i = a + 1; i < b; i++) {
          const t = (i - a) / (b - a);
          const prediction = samples[a].map((v, c) => v + (samples[b][c] - v) * t);
          const error = delta(samples[i], prediction);
          if (error > maxError) { maxError = error; maxIndex = i; }
        }
      }
      if (maxError <= 16 || maxIndex < 0) break;
      indices.push(maxIndex);
      indices.sort((a, b) => a - b);
    }
    const angle = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
    return {
      type: "linear", angle: Math.round(angle),
      stops: indices.map(i => ({
        pos: Math.round(100 * i / 64),
        ...rgbToHsv(...samples[i]), a: 1
      }))
    };
  };
  const close = () => {
    dialog.hidden = true;
    dragging = false;
    if (previousFocus?.isConnected) previousFocus.focus();
  };
  const open = () => {
    previousFocus = document.activeElement;
    dialog.hidden = false;
    input.focus();
  };
  trigger.addEventListener("click", open);
  $("[data-close]").addEventListener("click", close);
  $("[data-cancel]").addEventListener("click", close);
  dialog.addEventListener("pointerdown", e => { if (e.target === dialog) close(); });
  dialog.addEventListener("keydown", e => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
    if (e.key === "Tab") {
      const focusable = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),canvas[tabindex]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    estimate = null; apply.disabled = true; start = end = null;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type) || file.size > 15_000_000) {
      status.textContent = "Choose a supported image smaller than 15 MB."; return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve; img.onerror = reject; img.src = url;
      });
      if (!img.naturalWidth || !img.naturalHeight) throw new Error("Empty image");
      const scale = Math.min(1, 960 / img.naturalWidth, 520 / img.naturalHeight);
      source.width = canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      source.height = canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      sourceCtx.clearRect(0, 0, source.width, source.height);
      sourceCtx.drawImage(img, 0, 0, source.width, source.height);
      redraw();
      status.textContent = "Drag a line across the gradient. Results are estimates from rendered pixels.";
    } catch {
      status.textContent = "Unable to decode the selected image.";
    } finally { URL.revokeObjectURL(url); }
  });
  canvas.addEventListener("pointerdown", e => {
    if (!source.width || !source.height || e.button !== 0) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    start = end = pointFromEvent(e); dragging = true; estimate = null; apply.disabled = true; redraw();
  });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    end = pointFromEvent(e); redraw();
  });
  const finish = e => {
    if (!dragging) return;
    dragging = false;
    end = pointFromEvent(e);
    redraw();
    try { estimate = reconstruct(); } catch { estimate = null; }
    apply.disabled = !estimate;
    status.textContent = estimate
      ? `Estimated linear gradient: ${estimate.angle}°, ${estimate.stops.length} stops. Review and adjust after applying.`
      : "No distinct gradient detected. Draw a longer line through a changing color region.";
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", () => { dragging = false; redraw(); });
  apply.addEventListener("click", () => {
    if (!estimate) return;
    onApply(estimate);
    close();
  });
}
