let context = null;

// Short scanner feedback tone; silent when Web Audio is unavailable or blocked.
export const playBeep = (kind = 'ok') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    context = context || new AudioCtx();
    // Browsers start the context suspended until a user gesture; a scan is one.
    if (context.state === 'suspended') {
      Promise.resolve(context.resume()).catch(() => {});
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === 'ok' ? 1200 : 300;
    gain.gain.value = 0.1;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === 'ok' ? 0.08 : 0.3));
  } catch {
    // no sound
  }
};
