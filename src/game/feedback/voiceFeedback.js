// F9 — voice feedback. Speak your critique; EB transcribes it locally (Whisper,
// no paid API) and routes it like any other feedback. Press F9 to start, F9 again
// to stop+send, Esc to cancel. Captures the same scene/object/state context.

import { detectSceneContext, gameStateSlice, postFeedback } from './feedbackOverlay.js';

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });
}

export function initVoiceFeedback() {
  if (typeof document === 'undefined' || !navigator?.mediaDevices) return () => {};
  if (window.__EB_VOICE__) return window.__EB_VOICE__.teardown;

  const state = { recording: false, canceled: false, context: null };
  let recorder = null;
  let stream = null;
  let chunks = [];

  const indicator = document.createElement('div');
  indicator.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:99999;background:#3a1414;color:#ffd9d9;border:1px solid #ff6b6b;border-radius:20px;padding:7px 16px;font-family:Arial;font-size:13px;display:none;align-items:center;gap:8px';
  indicator.innerHTML = '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff4d4d;animation:eb-pulse 1s infinite"></span> Recording voice feedback — F9 to send, Esc to cancel';
  document.body.appendChild(indicator);
  const style = document.createElement('style');
  style.textContent = '@keyframes eb-pulse{0%,100%{opacity:1}50%{opacity:0.3}}';
  document.head.appendChild(style);

  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99998;background:#16323f;color:#eaf6ff;border:1px solid #7fd1ff;border-radius:8px;padding:8px 14px;font-size:13px;font-family:Arial;display:none';
  document.body.appendChild(toast);
  let toastTimer = null;
  const showToast = (text, ok = true) => { toast.textContent = text; toast.style.borderColor = ok ? '#7fd1ff' : '#ff8f8f'; toast.style.display = 'block'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 3600); };

  async function start() {
    if (state.recording) return;
    state.context = detectSceneContext();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      showToast('Microphone permission denied — cannot record voice feedback.', false);
      return;
    }
    chunks = []; state.canceled = false;
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      showToast('Audio recording is not supported in this browser.', false);
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = () => finish();
    recorder.start();
    state.recording = true;
    indicator.style.display = 'flex';
  }

  function stop() {
    if (!state.recording || !recorder) return;
    state.recording = false;
    indicator.style.display = 'none';
    try { recorder.stop(); } catch { /* noop */ }
  }
  function cancel() { state.canceled = true; stop(); }

  async function finish() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (state.canceled || !chunks.length) return;
    const blob = new Blob(chunks, { type: (recorder && recorder.mimeType) || 'audio/webm' });
    const audio = await blobToDataUrl(blob);
    if (!audio) { showToast('Could not encode the recording.', false); return; }
    showToast('Voice sent to EB — transcribing locally…', true);
    try {
      await postFeedback({
        project: 'bikebrowser',
        message: '',
        category: 'suggestion',
        priority: 'medium',
        scene: state.context?.scene,
        object: state.context?.object,
        game_state: gameStateSlice(),
        voice: { audio },
      });
    } catch (err) {
      showToast(`Could not reach EB (${err.message}).`, false);
    }
  }

  function onKey(e) {
    if (e.key === 'F9') { e.preventDefault(); state.recording ? stop() : start(); }
    else if (e.key === 'Escape' && state.recording) { e.preventDefault(); cancel(); }
  }
  window.addEventListener('keydown', onKey);

  const teardown = () => {
    window.removeEventListener('keydown', onKey);
    if (state.recording) cancel();
    indicator.remove(); toast.remove(); style.remove();
    delete window.__EB_VOICE__;
  };
  window.__EB_VOICE__ = { start, stop, teardown, _state: state };
  return teardown;
}
