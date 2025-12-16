(function(){
  "use strict";

  function parseInternal(root) {
    try {
      const el = root.querySelector("script.aioe-internal");
      if (!el) return null;

      const txt = (el.textContent || "").trim();
      if (!txt) return null;

      const obj = JSON.parse(txt);
      if (!obj || typeof obj !== "object") return null;
      if ((obj.v | 0) < 1) return null;

      const masks = Array.isArray(obj.masks) ? obj.masks : null;
      const active = Number.isFinite(Number(obj.active)) ? Number(obj.active) : 0;

      if (!masks) return null;
      return { masks, active };
    } catch (e) {
      return null;
    }
  }

  function ensureWrapper(img) {
    let wrap = img.closest(".aioe-wrap");
    if (wrap) return wrap;
    wrap = document.createElement("div");
    wrap.className = "aioe-wrap";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    return wrap;
  }

  function makeCanvas(wrap) {
    let cv = wrap.querySelector("canvas.aioe-cv");
    if (cv) return cv;
    cv = document.createElement("canvas");
    cv.className = "aioe-cv";
    wrap.appendChild(cv);
    return cv;
  }

  function draw(side, img, masks, activeIndex, style) {
    const wrap = ensureWrapper(img);
    const cv = makeCanvas(wrap);

    const r = img.getBoundingClientRect();
    if (!r || r.width < 2 || r.height < 2) {
      requestAnimationFrame(() => draw(side, img, masks, activeIndex, style));
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    cv.style.width = `${r.width}px`;
    cv.style.height = `${r.height}px`;
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));

    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);

    const stroke = style.stroke || "rgba(0,0,0,0.65)";
    const fillFront = style.fill_front || "rgba(40,40,40,0.85)";
    const fillOther = style.fill_other || "rgba(255,215,0,0.35)";
    const lw = style.outline_px || 2;

    masks.forEach((m, idx) => {
      if (!m) return;
      const x = (Number(m.x) || 0) * r.width;
      const y = (Number(m.y) || 0) * r.height;
      const w = (Number(m.w) || 0) * r.width;
      const h = (Number(m.h) || 0) * r.height;

      if (w <= 0 || h <= 0) return;

      if (side === "front") {
        ctx.fillStyle = (idx === activeIndex) ? fillFront : fillOther;
        ctx.fillRect(x, y, w, h);
      } else {
        if (idx !== activeIndex) {
          ctx.fillStyle = fillOther;
          ctx.fillRect(x, y, w, h);
        }
      }

      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    });
  }

  function initOne(root) {
    const side = root.getAttribute("data-side") || "front";

    const style = {
      fill_front: root.getAttribute("data-fill-front") || "",
      fill_other: root.getAttribute("data-fill-other") || "",
      stroke: root.getAttribute("data-stroke") || "",
      outline_px: parseInt(root.getAttribute("data-outline-px") || "2", 10) || 2,
    };

    const parsed = parseInternal(root);
    if (!parsed) return;

    const masks = parsed.masks;
    const activeIndex = parsed.active;

    const img = root.querySelector("img");
    if (!img) return;

    const rerender = () => draw(side, img, masks, activeIndex, style);

    if (img.complete) rerender();
    else img.addEventListener("load", rerender, { once: true });

    window.addEventListener("resize", rerender);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(rerender);
      ro.observe(img);
    }
    requestAnimationFrame(rerender);
  }

  function init() {
    const roots = document.querySelectorAll("#aioe-root");
    roots.forEach(initOne);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  setTimeout(init, 0);
})();