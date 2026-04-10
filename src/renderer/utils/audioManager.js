export function setupAudioNormalization() {
  const handlePlay = (event) => {
    const element = event.target;

    if (element?.tagName === 'VIDEO' || element?.tagName === 'AUDIO') {
      try {
        element.muted = false;
        element.defaultMuted = false;

        if (element.volume < 0.9) {
          element.volume = 1;
        }
      } catch (error) {
        console.warn('Audio normalization error:', error);
      }
    }
  };

  document.addEventListener('play', handlePlay, true);

  return () => {
    document.removeEventListener('play', handlePlay, true);
  };
}