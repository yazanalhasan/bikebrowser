// Executive Brain in-game feedback overlay — the primary human -> EB channel.
//
// F10        open the feedback overlay (category + priority + message)
// Shift+F10  annotation mode (draw on the screenshot) [phase: annotation]
// F9         voice feedback (local Whisper)           [phase: voice]
//
// Every submission auto-captures context: a screenshot of the game canvas, the
// current scene, the focused object/site, and a lightweight game-state slice.
// It POSTs to the Executive Brain inspect API (same localhost channel the
// narration TTS already uses). A critique with context is an actionable spec.

const EB_BASE = (typeof window !== 'undefined' && window.__EB_BASE__) || 'http://localhost:8000';

const CATEGORIES = ['graphics', 'gameplay', 'education', 'dialogue', 'narration', 'ux', 'performance', 'bug', 'suggestion'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

// ---- context capture --------------------------------------------------------

function detectSceneContext() {
  const w = window;
  if (w.__BIOME__?.active) return { scene: 'BiomeScene', object: w.__BIOME__.placementId || 'salt_river' };
  if (w.__ECOLOGY__?.active) return { scene: 'EcologyScene', object: w.__ECOLOGY__.placementId || null };
  if (w.__PREDICTION__?.active) return { scene: 'PredictionScene', object: 'utm_material_test' };
  if (w.__BRIDGE_DESIGN__?.active) return { scene: 'BridgeDesignScene', object: 'bridge_design_station' };
  if (w.__INVESTIGATION__?.active) return { scene: 'InvestigationScene', object: w.__INVESTIGATION__.id || 'wash_out_cause' };
  // Default: the open world — report the nearest interaction the player is at.
  let object = null;
  try {
    const s = w.__bikebrowserRebuildGame?.scene?.getScene('NeighborhoodScene');
    object = s?.interactions?.nearest?.(s.player)?.id || null;
  } catch { /* noop */ }
  return { scene: 'NeighborhoodScene', object };
}

function gameStateSlice() {
  try {
    const st = window.__GAME__?.getAct1State?.() || {};
    const quests = st.quests || {};
    const reg = st.discoveryRegistry || {};
    return {
      zuzubucks: st.zuzuBucks,
      active_biome: st.saltRiverComplete ? 'salt_river' : null,
      discoveries: Array.isArray(reg.entries) ? reg.entries.length : reg.count,
      quest: quests.activeQuestId || quests.activeQuest || quests.currentQuest || null,
      objective: quests.activeObjective || quests.activeObjectiveId || null,
      act1Complete: Boolean(st.act1Complete),
    };
  } catch { return {}; }
}

// Capture the game canvas (WebGL needs renderer.snapshot, not canvas.toDataURL).
function captureScreenshot() {
  return new Promise((resolve) => {
    const game = window.__bikebrowserRebuildGame;
    if (!game?.renderer?.snapshot) { resolve(null); return; }
    try {
      game.renderer.snapshot((image) => {
        try {
          const c = document.createElement('canvas');
          c.width = image.width; c.height = image.height;
          c.getContext('2d').drawImage(image, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch { resolve(null); }
      });
    } catch { resolve(null); }
  });
}

async function postFeedback(payload) {
  const resp = await fetch(`${EB_BASE}/inspect/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`EB ${resp.status}`);
  return resp.json();
}

// ---- overlay UI -------------------------------------------------------------

export function initFeedbackOverlay() {
  if (typeof document === 'undefined') return () => {};
  if (window.__EB_FEEDBACK__) return window.__EB_FEEDBACK__.teardown;

  const state = { open: false, category: 'graphics', priority: 'medium', shotPromise: null, context: null };

  const root = document.createElement('div');
  root.id = 'eb-feedback-overlay';
  root.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:99999', 'display:none',
    'align-items:center', 'justify-content:center',
    'background:rgba(8,12,18,0.55)', 'font-family:Arial,sans-serif',
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = [
    'width:560px', 'max-width:92vw', 'background:#121a22', 'color:#eaf6ff',
    'border:2px solid #7fd1ff', 'border-radius:12px', 'padding:18px 20px',
    'box-shadow:0 18px 60px rgba(0,0,0,0.5)',
  ].join(';');
  root.appendChild(panel);

  const chipRow = (items, get, set) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px';
    const buttons = [];
    items.forEach((item) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = item;
      b.style.cssText = 'padding:5px 10px;border-radius:7px;border:1px solid #2f4a5c;background:#16222c;color:#bcd6ec;cursor:pointer;font-size:12px;text-transform:capitalize';
      b.onclick = () => { set(item); buttons.forEach((bb) => paint(bb, bb === b)); };
      buttons.push(b);
      wrap.appendChild(b);
    });
    const paint = (btn, on) => {
      btn.style.background = on ? '#1f4d63' : '#16222c';
      btn.style.borderColor = on ? '#7fd1ff' : '#2f4a5c';
      btn.style.color = on ? '#eaf6ff' : '#bcd6ec';
    };
    buttons.forEach((b) => paint(b, b.textContent === get()));
    return wrap;
  };

  const title = document.createElement('div');
  title.textContent = 'Executive Brain Feedback';
  title.style.cssText = 'font-size:19px;font-weight:bold;margin-bottom:4px';
  const contextLine = document.createElement('div');
  contextLine.style.cssText = 'font-size:12px;color:#8fb8d6;margin-bottom:10px';

  const catLabel = document.createElement('div'); catLabel.textContent = 'Category'; catLabel.style.cssText = 'font-size:12px;color:#9fc2da';
  const catRow = chipRow(CATEGORIES, () => state.category, (v) => { state.category = v; });
  const priLabel = document.createElement('div'); priLabel.textContent = 'Priority'; priLabel.style.cssText = 'font-size:12px;color:#9fc2da';
  const priRow = chipRow(PRIORITIES, () => state.priority, (v) => { state.priority = v; });

  const msg = document.createElement('textarea');
  msg.placeholder = 'What should EB change? (e.g. "this bridge still looks too simple")';
  msg.rows = 4;
  msg.style.cssText = 'width:100%;box-sizing:border-box;background:#0d141b;color:#eaf6ff;border:1px solid #2f4a5c;border-radius:8px;padding:10px;font-size:14px;resize:vertical';
  // Keep typed keys inside the box — do NOT let them reach the game key handlers.
  ['keydown', 'keyup', 'keypress'].forEach((ev) => msg.addEventListener(ev, (e) => e.stopPropagation()));

  const status = document.createElement('div');
  status.style.cssText = 'font-size:12px;min-height:16px;margin:8px 0;color:#9affb0';

  const buttons = document.createElement('div');
  buttons.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin-top:6px';
  const submit = document.createElement('button');
  submit.textContent = 'Submit to EB';
  submit.style.cssText = 'padding:8px 16px;border-radius:8px;border:none;background:#2f9e5e;color:#fff;font-weight:bold;cursor:pointer';
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.style.cssText = 'padding:8px 16px;border-radius:8px;border:1px solid #3a3f46;background:#1a2129;color:#cfd8e3;cursor:pointer';
  buttons.append(cancel, submit);

  panel.append(title, contextLine, catLabel, catRow, priLabel, priRow, msg, status, buttons);
  document.body.appendChild(root);

  // Toast (confirmation after close).
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99998;background:#16323f;color:#eaf6ff;border:1px solid #7fd1ff;border-radius:8px;padding:8px 14px;font-family:Arial;font-size:13px;display:none';
  document.body.appendChild(toast);
  let toastTimer = null;
  const showToast = (text, ok = true) => {
    toast.textContent = text;
    toast.style.borderColor = ok ? '#7fd1ff' : '#ff8f8f';
    toast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3200);
  };

  function open() {
    if (state.open) return;
    state.open = true;
    // Capture context the instant the overlay opens (before the form covers it).
    state.shotPromise = captureScreenshot();
    state.context = detectSceneContext();
    contextLine.textContent = `scene: ${state.context.scene}` + (state.context.object ? `  ·  object: ${state.context.object}` : '');
    msg.value = '';
    status.textContent = '';
    root.style.display = 'flex';
    setTimeout(() => msg.focus(), 30);
    window.addEventListener('keydown', keyGuard, true);
    window.addEventListener('keyup', keyGuard, true);
  }

  function close() {
    if (!state.open) return;
    state.open = false;
    root.style.display = 'none';
    window.removeEventListener('keydown', keyGuard, true);
    window.removeEventListener('keyup', keyGuard, true);
  }

  // While open, swallow stray game keys (movement/interactions) unless the event
  // is inside the overlay (typing) or is the toggle/close key.
  function keyGuard(e) {
    if (root.contains(e.target)) return;
    if (e.key === 'F10' || e.key === 'Escape') return;
    e.stopImmediatePropagation();
    e.preventDefault();
  }

  async function doSubmit() {
    const message = msg.value.trim();
    if (!message) { status.style.color = '#ffd27a'; status.textContent = 'Add a message first.'; return; }
    status.style.color = '#9fd0ff'; status.textContent = 'Capturing + sending to EB…';
    submit.disabled = true;
    let screenshot = null;
    try { screenshot = await state.shotPromise; } catch { /* noop */ }
    const payload = {
      project: 'bikebrowser',
      message,
      category: state.category,
      priority: state.priority,
      scene: state.context?.scene,
      object: state.context?.object,
      game_state: gameStateSlice(),
      screenshot,
    };
    try {
      const res = await postFeedback(payload);
      const id = res?.feedback?.feedback_id || '?';
      const mt = res?.triage?.mission_type;
      close();
      showToast(`Sent to EB (${id})${mt ? ` → ${mt} candidate` : ''}`, true);
    } catch (err) {
      status.style.color = '#ff8f8f';
      status.textContent = `Could not reach EB (${err.message}). Is the EB server on ${EB_BASE}?`;
    } finally {
      submit.disabled = false;
    }
  }

  submit.onclick = doSubmit;
  cancel.onclick = close;

  function onKey(e) {
    if (e.key === 'F10' && !e.shiftKey) { e.preventDefault(); state.open ? close() : open(); }
    else if (e.key === 'Escape' && state.open) { e.preventDefault(); close(); }
    // Shift+F10 (annotation) and F9 (voice) are wired in later phases.
  }
  window.addEventListener('keydown', onKey);

  const teardown = () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keydown', keyGuard, true);
    window.removeEventListener('keyup', keyGuard, true);
    root.remove();
    toast.remove();
    delete window.__EB_FEEDBACK__;
  };
  window.__EB_FEEDBACK__ = { open, close, teardown, submit: doSubmit, _state: state };
  return teardown;
}
