(function(){
  "use strict";

  let disposed = false;

  const stage = document.getElementById("stage");
  const img   = document.getElementById("img");
  const cv    = document.getElementById("cv");

  const list = document.getElementById("maskList");
  const stats = document.getElementById("stats");
  const aiStatus = document.getElementById("aiStatus");
  const btnExport = document.getElementById("btnExport");
  const btnClear = document.getElementById("btnClear");
  const btnAcceptAll = document.getElementById("btnAcceptAll");
  const btnClearSug = document.getElementById("btnClearSug");
  const title = document.getElementById("title");
  const explanation = document.getElementById("explanation");
  const btnGenMeta = document.getElementById("btnGenMeta");
  const metaStatus = document.getElementById("metaStatus");

  function clamp01(v){ return Math.max(0, Math.min(1, v)); }
  function deepCopy(x){ return JSON.parse(JSON.stringify(x)); }
  function escapeHtml(s){
    return (s||"").replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  const state = {
    imageUrl: "",
    masks: [],
    suggestions: [],
    selected: -1,

    // drag
    dragging: false,
    dragMode: null,      // "new" | "move" | "resize"
    dragStart: {x:0,y:0},
    orig: null,
    handle: null,

    // view
    view: {
      scale: 1.0,
      min: 0.2,
      max: 6.0,
      fitW: 0,  // scale=1の基準幅（初回ロード時に確定）
    },

    // undo/redo
    hist: {
      past: [],
      future: [],
      limit: 80,
      pendingSnap: null,
      changed: false,
    }
  };

  function snapshot(){
    return { masks: deepCopy(state.masks), selected: state.selected };
  }
  function beginChange(){
    state.hist.pendingSnap = snapshot();
    state.hist.changed = false;
    state.hist.future = [];
  }
  function markChanged(){ state.hist.changed = true; }
  function commitChange(){
    if (!state.hist.pendingSnap) return;
    if (!state.hist.changed) { state.hist.pendingSnap = null; return; }
    state.hist.past.push(state.hist.pendingSnap);
    if (state.hist.past.length > state.hist.limit) state.hist.past.shift();
    state.hist.pendingSnap = null;
  }
  function undo(){
    if (!state.hist.past.length) return;
    const cur = snapshot();
    const prev = state.hist.past.pop();
    state.hist.future.push(cur);
    state.masks = deepCopy(prev.masks);
    state.selected = prev.selected;
    draw();
  }
  function redo(){
    if (!state.hist.future.length) return;
    const cur = snapshot();
    const nxt = state.hist.future.pop();
    state.hist.past.push(cur);
    state.masks = deepCopy(nxt.masks);
    state.selected = nxt.selected;
    draw();
  }

  function setStats(){
    stats.textContent = `masks=${state.masks.length} suggestions=${state.suggestions.length} zoom=${state.view.scale.toFixed(2)}x`;
  }

  function renderList(){
    list.innerHTML = "";
    state.masks.forEach((m, idx) => {
      const el = document.createElement("div");
      el.className = "item" + (idx===state.selected ? " sel":"");
      el.innerHTML =
        `#${idx+1} ${escapeHtml(m.label || "")}` +
        `<div class="meta">x=${m.x.toFixed(3)} y=${m.y.toFixed(3)} w=${m.w.toFixed(3)} h=${m.h.toFixed(3)}${m.source ? " · "+escapeHtml(m.source):""}</div>`;
      el.addEventListener("click", () => { state.selected = idx; draw(); });
      list.appendChild(el);
    });
  }

  function resizeCanvas(){
    if (disposed) return;
    const w = Math.max(1, Math.round(img.clientWidth || 1));
    const h = Math.max(1, Math.round(img.clientHeight || 1));
    cv.width = w;
    cv.height = h;
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    draw();
  }

  function rectPx(m){
    return { x: m.x*cv.width, y: m.y*cv.height, w: m.w*cv.width, h: m.h*cv.height };
  }

  function drawHandles(ctx, r){
    const sz = 8;
    const handles = [
      {k:"nw", x:r.x, y:r.y},
      {k:"ne", x:r.x+r.w, y:r.y},
      {k:"sw", x:r.x, y:r.y+r.h},
      {k:"se", x:r.x+r.w, y:r.y+r.h},
    ];
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    handles.forEach(h => {
      ctx.fillRect(h.x - sz/2, h.y - sz/2, sz, sz);
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.strokeRect(h.x - sz/2, h.y - sz/2, sz, sz);
    });
  }

  function draw(){
    if (disposed) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0,0,cv.width,cv.height);

    const stroke = "rgba(0,0,0,0.65)";
    const fill = "rgba(255,215,0,0.35)";
    const fillSel = "rgba(40,140,255,0.35)";
    const fillNew = "rgba(160,160,160,0.25)";
    const fillSug = "rgba(80,220,120,0.25)";
    const lw = 2;

    state.masks.forEach((m, idx) => {
      const r = rectPx(m);
      ctx.fillStyle = (idx === state.selected) ? fillSel : fill;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.strokeRect(r.x+0.5, r.y+0.5, r.w, r.h);
      if (idx === state.selected) drawHandles(ctx, r);
    });

    state.suggestions.forEach((m) => {
      const r = rectPx(m);
      ctx.setLineDash([6,4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(80,220,120,0.85)";
      ctx.strokeRect(r.x+0.5, r.y+0.5, r.w, r.h);
      ctx.setLineDash([]);
      ctx.fillStyle = fillSug;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    if (state.dragging && state.dragMode === "new" && state.orig) {
      const r = rectPx(state.orig);
      ctx.fillStyle = fillNew;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.strokeRect(r.x+0.5, r.y+0.5, r.w, r.h);
    }

    setStats();
    renderList();
  }

  function hitTestHandles(idx, px, py){
    const m = state.masks[idx];
    const r = { x: m.x*cv.width, y: m.y*cv.height, w: m.w*cv.width, h: m.h*cv.height };
    const sz = 10;
    const pts = {
      nw: {x:r.x, y:r.y},
      ne: {x:r.x+r.w, y:r.y},
      sw: {x:r.x, y:r.y+r.h},
      se: {x:r.x+r.w, y:r.y+r.h},
    };
    for (const k of Object.keys(pts)) {
      const p = pts[k];
      if (Math.abs(px - p.x) <= sz && Math.abs(py - p.y) <= sz) return k;
    }
    return null;
  }

  function hitTestMask(px, py){
    const nx = px / cv.width;
    const ny = py / cv.height;
    for (let i=state.masks.length-1; i>=0; i--) {
      const m = state.masks[i];
      if (nx >= m.x && nx <= m.x+m.w && ny >= m.y && ny <= m.y+m.h) return i;
    }
    return -1;
  }

  function normalizeRect(a, b){
    const x0 = Math.min(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    return {x:x0, y:y0, w:Math.max(0.001, x1-x0), h:Math.max(0.001, y1-y0), label:"", source:"manual"};
  }

  function setZoom(newScale, anchorClientX, anchorClientY){
    newScale = Math.max(state.view.min, Math.min(state.view.max, newScale));
    if (!state.view.fitW) state.view.fitW = Math.max(1, img.clientWidth || 1);

    const stageRect = stage.getBoundingClientRect();
    const imgRectBefore = img.getBoundingClientRect();

    const ix = clamp01((anchorClientX - imgRectBefore.left) / Math.max(1, imgRectBefore.width));
    const iy = clamp01((anchorClientY - imgRectBefore.top)  / Math.max(1, imgRectBefore.height));

    const oldScrollL = stage.scrollLeft;
    const oldScrollT = stage.scrollTop;

    state.view.scale = newScale;

    if (Math.abs(state.view.scale - 1) < 1e-6) {
      img.style.maxWidth = "100%";
      img.style.width = "";
    } else {
      img.style.maxWidth = "none";
      img.style.width = Math.round(state.view.fitW * state.view.scale) + "px";
    }

    requestAnimationFrame(() => {
      resizeCanvas();

      const imgRectAfter = img.getBoundingClientRect();
      const imgLeftContent  = oldScrollL + (imgRectAfter.left - stageRect.left);
      const imgTopContent   = oldScrollT + (imgRectAfter.top  - stageRect.top);

      const desiredScrollL = (imgLeftContent + ix * imgRectAfter.width) - (anchorClientX - stageRect.left);
      const desiredScrollT = (imgTopContent  + iy * imgRectAfter.height) - (anchorClientY - stageRect.top);

      stage.scrollLeft = desiredScrollL;
      stage.scrollTop  = desiredScrollT;
    });
  }

  const onWheel = (ev) => {
    if (disposed) return;
    // ピンチが ctrl/meta + wheel で来ることが多い
    if (ev.ctrlKey || ev.metaKey) {
      ev.preventDefault();
      const factor = Math.exp((-ev.deltaY) * 0.001);
      setZoom(state.view.scale * factor, ev.clientX, ev.clientY);
    }
  };

  const onDown = (ev) => {
    if (disposed) return;
    if (!state.imageUrl) return;

    beginChange();

    const px = ev.offsetX;
    const py = ev.offsetY;

    const idx = hitTestMask(px, py);
    if (idx >= 0) {
      state.selected = idx;
      const h = hitTestHandles(idx, px, py);
      state.dragMode = h ? "resize" : "move";
      state.handle = h;
      state.dragging = true;
      state.dragStart = { x: px/cv.width, y: py/cv.height };
      state.orig = deepCopy(state.masks[idx]);
      draw();
      return;
    }

    state.selected = -1;
    state.dragMode = "new";
    state.dragging = true;
    state.dragStart = { x: px/cv.width, y: py/cv.height };
    state.orig = { x: state.dragStart.x, y: state.dragStart.y, w: 0.001, h: 0.001, label: "", source: "manual" };
    draw();
  };

  const onMove = (ev) => {
    if (disposed) return;
    if (!state.dragging) return;

    const px = ev.offsetX;
    const py = ev.offsetY;
    const now = { x: clamp01(px / cv.width), y: clamp01(py / cv.height) };

    if (state.dragMode === "new") {
      state.orig = Object.assign(state.orig, normalizeRect(state.dragStart, now));
      markChanged();
      draw();
      return;
    }

    if (state.selected < 0) return;

    if (state.dragMode === "move") {
      const dx = now.x - state.dragStart.x;
      const dy = now.y - state.dragStart.y;
      const m0 = state.orig;
      const m = state.masks[state.selected];
      m.x = clamp01(m0.x + dx);
      m.y = clamp01(m0.y + dy);
      m.x = clamp01(Math.min(m.x, 1 - m.w));
      m.y = clamp01(Math.min(m.y, 1 - m.h));
      markChanged();
      draw();
      return;
    }

    if (state.dragMode === "resize") {
      const m0 = state.orig;
      const m = state.masks[state.selected];
      let x0 = m0.x, y0 = m0.y, x1 = m0.x + m0.w, y1 = m0.y + m0.h;
      if (state.handle === "nw") { x0 = now.x; y0 = now.y; }
      if (state.handle === "ne") { x1 = now.x; y0 = now.y; }
      if (state.handle === "sw") { x0 = now.x; y1 = now.y; }
      if (state.handle === "se") { x1 = now.x; y1 = now.y; }
      const rr = normalizeRect({x:x0,y:y0}, {x:x1,y:y1});
      rr.x = clamp01(Math.min(rr.x, 0.999));
      rr.y = clamp01(Math.min(rr.y, 0.999));
      rr.w = clamp01(Math.min(rr.w, 1 - rr.x));
      rr.h = clamp01(Math.min(rr.h, 1 - rr.y));
      m.x = rr.x; m.y = rr.y; m.w = rr.w; m.h = rr.h;
      markChanged();
      draw();
      return;
    }
  };

  const onUp = () => {
    if (disposed) return;
    if (!state.dragging) return;

    if (state.dragMode === "new" && state.orig) {
      const m = state.orig;
      if (m.w >= 0.005 && m.h >= 0.005) {
        m.label = m.label || `mask_${state.masks.length+1}`;
        state.masks.push(m);
        state.selected = state.masks.length-1;
        markChanged();
      }
    }

    state.dragging = false;
    state.dragMode = null;
    state.orig = null;
    state.handle = null;

    commitChange();
    draw();
  };

  const onKey = (ev) => {
    if (disposed) return;

    if ((ev.ctrlKey || ev.metaKey) && !ev.altKey) {
      const k = ev.key.toLowerCase();
      if (k === "z" && !ev.shiftKey) { ev.preventDefault(); undo(); return; }
      if (k === "y" || (k === "z" && ev.shiftKey)) { ev.preventDefault(); redo(); return; }
    }

    if (ev.key === "Delete") {
      if (state.selected >= 0) {
        beginChange();
        state.masks.splice(state.selected, 1);
        state.selected = Math.min(state.selected, state.masks.length-1);
        markChanged();
        commitChange();
        draw();
      }
    }
  };

  function exportPayload(){
    return {
      v: 2,
      imageUrl: state.imageUrl,
      masks: state.masks,
      meta: {
        title: (title && title.value) ? title.value.trim() : "",
        explanation: (explanation && explanation.value) ? explanation.value.trim() : "",
      }
    };
  }

  btnClear.addEventListener("click", () => {
    if (disposed) return;
    if (!state.masks.length) return;
    beginChange();
    state.masks = [];
    state.selected = -1;
    markChanged();
    commitChange();
    draw();
  });

  btnExport.addEventListener("click", () => {
    if (disposed) return;
    pycmd("aioe:export:" + encodeURIComponent(JSON.stringify(exportPayload())));
  });

  
  if (btnGenMeta) {
    btnGenMeta.addEventListener("click", () => {
      if (disposed) return;
      if (metaStatus) metaStatus.textContent = "Generating…";
      pycmd("aioe:genmeta:" + encodeURIComponent(JSON.stringify(exportPayload())));
    });
  }
btnAcceptAll.addEventListener("click", () => {
    if (disposed) return;
    if (!state.suggestions.length) return;

    beginChange();
    state.suggestions.forEach((m, i) => {
      const mm = Object.assign({}, m);
      if (!mm.label) mm.label = `ai_${state.masks.length+1+i}`;
      mm.source = mm.source || "ai";
      state.masks.push(mm);
    });
    state.suggestions = [];
    aiStatus.textContent = "";
    markChanged();
    commitChange();
    draw();
  });

  btnClearSug.addEventListener("click", () => {
    if (disposed) return;
    state.suggestions = [];
    aiStatus.textContent = "";
    draw();
  });

  window.aioe = {
    setImage: function(url){
      if (disposed) return;
      state.imageUrl = url || "";
      state.view.scale = 1.0;
      state.view.fitW = 0;
      img.style.maxWidth = "100%";
      img.style.width = "";
      img.src = state.imageUrl;
    },
    setMasks: function(masks){
      if (disposed) return;
      state.masks = Array.isArray(masks) ? masks : [];
      state.selected = -1;
      state.hist.past = [];
      state.hist.future = [];
      state.hist.pendingSnap = null;
      state.hist.changed = false;
      draw();
    },
    setSuggestions: function(masks, message){
      if (disposed) return;
      state.suggestions = Array.isArray(masks) ? masks : [];
      aiStatus.textContent = message || (state.suggestions.length ? "Suggestions loaded." : "");
      draw();
    },
    setMeta: function(meta){
      if (disposed) return;
      meta = meta || {};
      if (title) title.value = meta.title || "";
      if (explanation) explanation.value = meta.explanation || "";
      if (metaStatus) metaStatus.textContent = meta.message || "";
    },
    setMetaStatus: function(msg){
      if (disposed) return;
      if (metaStatus) metaStatus.textContent = msg || "";
    },
    exportNow: function(){
      if (disposed) return;
      pycmd("aioe:export:" + encodeURIComponent(JSON.stringify(exportPayload())));
    }
  };

  img.addEventListener("load", () => {
    if (disposed) return;
    state.view.fitW = Math.max(1, img.clientWidth || 1);
    resizeCanvas();
  });

  img.addEventListener("error", () => {
    if (disposed) return;
    try { pycmd("aioe:imgerr:" + (img.src || "")); } catch(e) {}
  });

  cv.addEventListener("mousedown", onDown);
  cv.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  window.addEventListener("keydown", onKey);
  stage.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", resizeCanvas);

  try { pycmd("aioe:ready"); } catch(e) {}
})();
