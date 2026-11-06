/**
 * Direct DOM gradient picker for accessible same-origin documents.
 * SVG and supported CSS gradients are inspected as data. Raster images
 * are sampled from a user-drawn line; cross-origin/tainted pixels are refused.
 */
export function initDirectGradientEyedropper({ trigger, onApply, onInfo }) {
  if (!trigger || typeof onApply !== "function") return;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hsv = (red, green, blue) => {
    const r = red / 255, g = green / 255, b = blue / 255;
    const top = Math.max(r, g, b), bottom = Math.min(r, g, b), d = top - bottom;
    let h = 0;
    if (d) {
      if (top === r) h = ((g - b) / d) % 6;
      else if (top === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h = (60 * h + 360) % 360;
    }
    return { h, s: top ? d / top : 0, v: top };
  };
  const colorToStop = (value, pos, opacity = 1) => {
    const probe = document.createElement("span");
    probe.style.color = value;
    if (!probe.style.color) return null;
    document.body.append(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    const match = computed.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[, /]+([\d.]+))?\s*\)$/i);
    if (!match) return null;
    const [,r,g,b,a] = match;
    return { pos: clamp(Math.round(pos), 0, 100), ...hsv(+r,+g,+b), a: clamp(opacity * (a === undefined ? 1 : +a), 0, 1) };
  };
  const rgbHexStop = (value, pos, opacity = 1) => {
    const normalized = value.trim();
    const hex = normalized.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
      let n = hex[1];
      if (n.length === 3 || n.length === 4) n = [...n].map(c => c + c).join("");
      if (n.length !== 6 && n.length !== 8) return null;
      const r = parseInt(n.slice(0,2),16),g = parseInt(n.slice(2,4),16),b = parseInt(n.slice(4,6),16);
      const alpha = n.length === 8 ? parseInt(n.slice(6,8),16)/255 : 1;
      return { pos, ...hsv(r,g,b), a: clamp(alpha * opacity,0,1) };
    }
    return colorToStop(normalized, pos, opacity);
  };
  const splitTopLevel = (text) => {
    const parts = []; let level = 0, start = 0;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "(") level++;
      else if (text[i] === ")") level--;
      else if (text[i] === "," && level === 0) {parts.push(text.slice(start,i).trim());start=i+1;}
    }
    parts.push(text.slice(start).trim()); return parts;
  };
  const fromCSS = css => {
    const match = css.trim().match(/^(linear|radial)-gradient\((.*)\)$/is);
    if (!match) return null;
    const type = match[1].toLowerCase(), tokens = splitTopLevel(match[2]);
    let angle = 180;
    if (type === "linear" && /deg$/.test(tokens[0])) angle = (+tokens.shift().replace(/deg$/,"") + 360) % 360;
    else if (/^(to\s|circle|ellipse|at\s)/i.test(tokens[0])) return null; // avoid false precision
    const stops = tokens.map((token, i) => {
      const m = token.match(/^(#[a-f0-9]{3,8}|rgba?\([^)]*\))\s*(\d+(?:\.\d+)?)?%?$/i);
      if (!m) return null;
      const position = m[2] === undefined ? (100 * i / (tokens.length - 1)) : +m[2];
      return rgbHexStop(m[1], clamp(position,0,100));
    });
    if (stops.length < 2 || stops.length > 8 || stops.some(stop=>!stop)) return null;
    return { type, angle: Math.round(angle), stops };
  };
  const inspectSVG = target => {
    const svg = target.closest?.("svg");
    if (!svg) return null;
    let node = target;
    while (node && node !== svg.parentElement) {
      const style = getComputedStyle(node);
      for (const value of [node.getAttribute?.("fill"), node.getAttribute?.("stroke"), style.fill, style.stroke]) {
        const ref = value?.match(/^url\(\s*['"]?#([^)'"]+)['"]?\s*\)$/);
        if (!ref) continue;
        const def = [...svg.querySelectorAll("linearGradient,radialGradient")].find(n=>n.id===ref[1]);
        if (!def) continue;
        const tag = def.localName;
        let linked = def, stops = [...linked.querySelectorAll(":scope > stop")];
        // Handle inherited stops via href and avoid cycles.
        const seen = new Set();
        while (!stops.length && linked && !seen.has(linked)) {
          seen.add(linked);
          const href = linked.getAttribute("href") || linked.getAttribute("xlink:href");
          linked = href?.startsWith("#") ? [...svg.querySelectorAll("linearGradient,radialGradient")].find(n=>n.id===href.slice(1)) : null;
          if (linked) stops = [...linked.querySelectorAll(":scope > stop")];
        }
        if (stops.length < 2 || stops.length > 8) return null;
        const result = stops.map(st => {
          const style = getComputedStyle(st);
          const o = st.getAttribute("offset") || "0";
          const p = o.trim().endsWith("%") ? parseFloat(o) : parseFloat(o) * 100;
          const opacity = +(st.getAttribute("stop-opacity") ?? style.stopOpacity ?? "1");
          return rgbHexStop(st.getAttribute("stop-color") || style.stopColor || "#000", clamp(p,0,100), opacity);
        });
        if (result.some(st=>!st)) return null;
        if (def.hasAttribute("gradientTransform") || def.hasAttribute("gradientUnits") && def.getAttribute("gradientUnits") !== "objectBoundingBox") {
          onInfo?.("SVG gradient has a transform or custom coordinate units; its advanced geometry cannot be preserved by this picker.");
        }
        let angle = 90;
        if (tag.toLowerCase() === "lineargradient") {
          const parseCoord = (v, d) => v == null ? d : parseFloat(v) * (v.endsWith("%") ? 1 : 100);
          const x1 = parseCoord(def.getAttribute("x1"),0), x2 = parseCoord(def.getAttribute("x2"),100);
          const y1 = parseCoord(def.getAttribute("y1"),0), y2 = parseCoord(def.getAttribute("y2"),0);
          angle = (Math.atan2(x2-x1, y1-y2) * 180 / Math.PI + 360) % 360;
        }
        return { type: tag.toLowerCase() === "radialgradient" ? "radial" : "linear", angle: Math.round(angle), stops: result };
      }
      node = node.parentElement;
    }
    return null;
  };
  const rasterGradient = (img, start, end) => {
    const width = img.naturalWidth, height = img.naturalHeight;
    if (!width || !height) throw new Error("Image not loaded");
    const bitmap = document.createElement("canvas");
    bitmap.width = width; bitmap.height = height;
    const ctx = bitmap.getContext("2d", {willReadFrequently: true});
    ctx.drawImage(img,0,0);
    const rect = img.getBoundingClientRect();
    const locate = p => ({
      x: clamp(Math.floor((p.x-rect.left)*width/rect.width),0,width-1),
      y: clamp(Math.floor((p.y-rect.top)*height/rect.height),0,height-1)
    });
    const a = locate(start), b = locate(end);
    if (Math.hypot(b.x-a.x,b.y-a.y) < 12) throw new Error("Drag a longer line across the gradient");
    const stops = [0,.25,.5,.75,1].map(t=>{
      const x = Math.round(a.x+(b.x-a.x)*t),y = Math.round(a.y+(b.y-a.y)*t);
      const c = ctx.getImageData(x,y,1,1).data;
      return {pos: Math.round(100*t), ...hsv(c[0],c[1],c[2]),a:1};
    });
    return { type:"linear",angle:Math.round((Math.atan2(b.x-a.x,a.y-b.y)*180/Math.PI+360)%360),stops };
  };
  let overlay = null, line = null, start = null, raster = null, activeDoc = null;
  function clear() {
    if (overlay) overlay.remove();
    overlay = line = raster = start = activeDoc = null;
  }
  const inform = msg => {onInfo?.(msg);};
  function begin() {
    clear();
    let doc = document;
    try {if (window.parent !== window && window.parent.document?.body) doc = window.parent.document;} catch {
      inform("Cross-origin parent: activate gradient picking through the MF SMIL host bridge, or use 🌈 file sampling.");
      return;
    }
    activeDoc=doc;
    overlay = doc.createElement("div");
    overlay.style.cssText="position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(80,100,220,.08);touch-action:none";
    overlay.title="Select an SVG/CSS gradient or drag across a raster image. Escape to cancel.";
    line=doc.createElement("div");
    line.style.cssText="position:fixed;z-index:2147483647;pointer-events:none;border-top:2px dashed white;transform-origin:left center;display:none";
    doc.body.append(overlay,line);
    const cancel = e => {if(e.key==="Escape"){e.preventDefault();finish();}};
    function finish(){doc.removeEventListener("keydown",cancel,true);clear();}
    doc.addEventListener("keydown",cancel,true);
    const point = e=>({x:e.clientX,y:e.clientY});
    function targetAt(e) {
      overlay.style.pointerEvents="none";
      const el=doc.elementFromPoint(e.clientX,e.clientY);
      overlay.style.pointerEvents="auto";
      return el;
    }
    overlay.addEventListener("pointerdown",e=>{
      if(e.button!==0) return;
      e.preventDefault();
      start=point(e);
      const target=targetAt(e);
      const exact=inspectSVG(target) || fromCSS(getComputedStyle(target).backgroundImage);
      if(exact){onApply(exact);finish();return;}
      raster=target?.closest?.("img");
      if(!raster){inform("No supported SVG or CSS gradient here. Select an image to draw a sample line, or use 🌈 file mode.");finish();return;}
      overlay.setPointerCapture(e.pointerId);
    });
    overlay.addEventListener("pointermove",e=>{
      if(!start || !raster) return;
      const dx=e.clientX-start.x,dy=e.clientY-start.y;
      line.style.display="block";line.style.left=start.x+"px";line.style.top=start.y+"px";
      line.style.width=Math.hypot(dx,dy)+"px";
      line.style.transform="rotate("+Math.atan2(dy,dx)+"rad)";
    });
    overlay.addEventListener("pointerup",e=>{
      if(!start || !raster) return;
      try {onApply(rasterGradient(raster,start,point(e)));} catch(err){inform("Raster sampling unavailable: "+err.message+". Try 🌈 local file mode.");}
      finish();
    });
    overlay.addEventListener("pointercancel",finish);
    inform("Direct gradient mode: click an SVG/CSS gradient, or drag a line across an image. Escape cancels.");
  }
  trigger.addEventListener("click",begin);
}
