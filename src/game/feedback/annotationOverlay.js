// Shift+F10 — Executive Brain annotation mode (premium feedback).
// Freeze a screenshot of the game, draw arrows/circles on what looks wrong, add a
// note, and send the COMPOSITED annotated image (+ the shape data) to EB. The
// annotation makes the critique unambiguous: "this, right here, is the problem".

import {
  captureScreenshot,
  detectSceneContext,
  gameStateSlice,
  postFeedback,
} from './feedbackOverlay.js';

const CATEGORIES = ['graphics', 'gameplay', 'education', 'dialogue', 'narration', 'ux', 'performance', 'bug', 'suggestion'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const INK = '#ff5252';

export function initAnnotationOverlay() {
  if (typeof document === 'undefined') return () => {};
  if (window.__EB_ANNOTATION__) return window.__EB_ANNOTATION__.teardown;

  const state = { open: false, category: 'graphics', priority: 'high', context: null, tool: 'arrow' };
  let img = null;
  let shapes = [];
  let drawing = null;

  const root = document.createElement('div');
  root.id = 'eb-annotation-overlay';
  root.style.cssText = 'position:fixed;inset:0;z-index:99999;display:none;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(6,9,13,0.88);font-family:Arial';

  const header = document.createElement('div');
  header.textContent = 'Executive Brain — Annotation';
  header.style.cssText = 'color:#eaf6ff;font-size:17px;font-weight:bold';
  const contextLine = document.createElement('div');
  contextLine.style.cssText = 'color:#8fb8d6;font-size:12px';

  // toolbar
  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;gap:6px;align-items:center';
  const toolButtons = {};
  const mkTool = (name, label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.style.cssText = 'padding:5px 12px;border-radius:7px;border:1px solid #2f4a5c;background:#16222c;color:#bcd6ec;cursor:pointer;font-size:12px';
    b.onclick = () => { state.tool = name; paintTools(); };
    toolButtons[name] = b; bar.appendChild(b); return b;
  };
  mkTool('arrow', '➤ Arrow');
  mkTool('circle', '◯ Circle');
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button'; clearBtn.textContent = '⌫ Clear';
  clearBtn.style.cssText = 'padding:5px 12px;border-radius:7px;border:1px solid #5a3a3a;background:#241a1a;color:#e0b4b4;cursor:pointer;font-size:12px';
  clearBtn.onclick = () => { shapes = []; redraw(); };
  bar.appendChild(clearBtn);
  const paintTools = () => Object.entries(toolButtons).forEach(([n, b]) => {
    const on = n === state.tool;
    b.style.background = on ? '#1f4d63' : '#16222c';
    b.style.borderColor = on ? '#7fd1ff' : '#2f4a5c';
    b.style.color = on ? '#eaf6ff' : '#bcd6ec';
  });

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'border:2px solid #7fd1ff;border-radius:8px;cursor:crosshair;max-width:88vw;max-height:54vh;background:#000';

  // compact form row
  const form = document.createElement('div');
  form.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:min(880px,88vw)';
  const chips = (items, get, set) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px';
    const bs = [];
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = it;
      b.style.cssText = 'padding:4px 9px;border-radius:6px;border:1px solid #2f4a5c;background:#16222c;color:#bcd6ec;cursor:pointer;font-size:11px;text-transform:capitalize';
      b.onclick = () => { set(it); bs.forEach((x) => paint(x, x === b)); };
      bs.push(b); wrap.appendChild(b);
    });
    const paint = (b, on) => { b.style.background = on ? '#1f4d63' : '#16222c'; b.style.borderColor = on ? '#7fd1ff' : '#2f4a5c'; b.style.color = on ? '#eaf6ff' : '#bcd6ec'; };
    bs.forEach((b) => paint(b, b.textContent === get()));
    return wrap;
  };
  const msg = document.createElement('textarea');
  msg.placeholder = 'Note (what is circled/arrowed and why)…';
  msg.rows = 2;
  msg.style.cssText = 'width:100%;box-sizing:border-box;background:#0d141b;color:#eaf6ff;border:1px solid #2f4a5c;border-radius:8px;padding:8px;font-size:13px;resize:vertical';
  ['keydown', 'keyup', 'keypress'].forEach((ev) => msg.addEventListener(ev, (e) => e.stopPropagation()));
  const status = document.createElement('div');
  status.style.cssText = 'font-size:12px;min-height:15px;color:#9affb0';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:10px;justify-content:flex-end';
  const submit = document.createElement('button');
  submit.textContent = 'Send annotation to EB';
  submit.style.cssText = 'padding:8px 16px;border-radius:8px;border:none;background:#2f9e5e;color:#fff;font-weight:bold;cursor:pointer';
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid #3a3f46;background:#1a2129;color:#cfd8e3;cursor:pointer';
  actions.append(cancel, submit);
  form.append(chips(CATEGORIES, () => state.category, (v) => { state.category = v; }), chips(PRIORITIES, () => state.priority, (v) => { state.priority = v; }), msg, status, actions);

  root.append(header, contextLine, bar, canvas, form);
  document.body.appendChild(root);

  // toast
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99998;background:#16323f;color:#eaf6ff;border:1px solid #7fd1ff;border-radius:8px;padding:8px 14px;font-size:13px;font-family:Arial;display:none';
  document.body.appendChild(toast);
  let toastTimer = null;
  const showToast = (text, ok = true) => { toast.textContent = text; toast.style.borderColor = ok ? '#7fd1ff' : '#ff8f8f'; toast.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3200); };

  // ---- drawing ----
  function drawShape(ctx, s) {
    ctx.lineWidth = Math.max(4, canvas.width / 320);
    ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineJoin = 'round';
    if (s.tool === 'circle') {
      ctx.beginPath();
      ctx.ellipse((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2, Math.max(8, Math.abs(s.x2 - s.x1) / 2), Math.max(8, Math.abs(s.y2 - s.y1) / 2), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
      const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1); const h = Math.max(14, canvas.width / 90);
      ctx.beginPath(); ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(s.x2 - h * Math.cos(a - 0.45), s.y2 - h * Math.sin(a - 0.45));
      ctx.lineTo(s.x2 - h * Math.cos(a + 0.45), s.y2 - h * Math.sin(a + 0.45));
      ctx.closePath(); ctx.fill();
    }
  }
  function redraw() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    [...shapes, drawing].filter(Boolean).forEach((s) => drawShape(ctx, s));
  }
  function xy(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  }
  canvas.addEventListener('mousedown', (e) => { const p = xy(e); drawing = { tool: state.tool, x1: p.x, y1: p.y, x2: p.x, y2: p.y }; });
  canvas.addEventListener('mousemove', (e) => { if (!drawing) return; const p = xy(e); drawing.x2 = p.x; drawing.y2 = p.y; redraw(); });
  window.addEventListener('mouseup', () => { if (drawing) { shapes.push(drawing); drawing = null; redraw(); } });

  function keyGuard(e) {
    if (root.contains(e.target)) return;
    if (e.key === 'F10' || e.key === 'Escape') return;
    e.stopImmediatePropagation(); e.preventDefault();
  }

  async function open() {
    if (state.open || window.__EB_FEEDBACK__?._state?.open) return;
    state.open = true;
    state.context = detectSceneContext();
    shapes = []; drawing = null;
    paintTools();
    const dataUrl = await captureScreenshot();
    if (!dataUrl) { state.open = false; showToast('Could not capture the screen to annotate.', false); return; }
    img = new Image();
    img.onload = () => { canvas.width = img.naturalWidth || 1280; canvas.height = img.naturalHeight || 720; redraw(); };
    img.src = dataUrl;
    msg.value = ''; status.textContent = '';
    contextLine.textContent = `scene: ${state.context.scene}` + (state.context.object ? `  ·  object: ${state.context.object}` : '') + '   —   drag to draw arrows/circles, then add a note';
    root.style.display = 'flex';
    setTimeout(() => msg.focus(), 30);
    window.addEventListener('keydown', keyGuard, true);
    window.addEventListener('keyup', keyGuard, true);
  }
  function close() {
    state.open = false; root.style.display = 'none';
    window.removeEventListener('keydown', keyGuard, true);
    window.removeEventListener('keyup', keyGuard, true);
  }
  async function doSubmit() {
    const message = msg.value.trim();
    if (!message) { status.style.color = '#ffd27a'; status.textContent = 'Add a note first.'; return; }
    status.style.color = '#9fd0ff'; status.textContent = 'Sending annotated feedback to EB…';
    submit.disabled = true;
    const annotated = canvas.toDataURL('image/png'); // screenshot + shapes composited
    try {
      const res = await postFeedback({
        project: 'bikebrowser', message, category: state.category, priority: state.priority,
        scene: state.context?.scene, object: state.context?.object, game_state: gameStateSlice(),
        screenshot: annotated,
        annotation: { kind: 'annotation', tool_shapes: shapes.map((s) => ({ tool: s.tool, x1: Math.round(s.x1), y1: Math.round(s.y1), x2: Math.round(s.x2), y2: Math.round(s.y2) })) },
      });
      close();
      showToast(`Annotation sent to EB (${res?.feedback?.feedback_id || '?'})`, true);
    } catch (err) {
      status.style.color = '#ff8f8f';
      status.textContent = `Could not reach EB (${err.message}).`;
    } finally { submit.disabled = false; }
  }
  submit.onclick = doSubmit; cancel.onclick = close;

  function onKey(e) {
    if (e.key === 'F10' && e.shiftKey) { e.preventDefault(); state.open ? close() : open(); }
    else if (e.key === 'Escape' && state.open) { e.preventDefault(); close(); }
  }
  window.addEventListener('keydown', onKey);

  const teardown = () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keydown', keyGuard, true);
    window.removeEventListener('keyup', keyGuard, true);
    root.remove(); toast.remove();
    delete window.__EB_ANNOTATION__;
  };
  window.__EB_ANNOTATION__ = { open, close, teardown, _state: state };
  return teardown;
}
