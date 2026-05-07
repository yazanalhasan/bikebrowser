const DEFAULT_SPEECH_OPTIONS = {
  rate: 0.85,
  pitch: 1,
  lang: 'en-US',
};

function speak(text, options = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  Object.assign(utterance, DEFAULT_SPEECH_OPTIONS, options);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function speakLetter(letter) {
  return speak(String(letter), { rate: 0.85 });
}

export function speakWord(word) {
  return speak(String(word).toLowerCase(), { rate: 0.85 });
}

export function speakPhoneme(phoneme) {
  return speak(String(phoneme).replace(/\//g, ''), { rate: 0.8 });
}

export { speak };
