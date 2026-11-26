// Sound, synthesized with WebAudio only after a user gesture. Nothing is
// created on load: the AudioContext starts on the first key press or click,
// so the page never makes sound (or work) before the player acts.

export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    engineOsc: null,
    engineGain: null,
    engineFilter: null,
  };

  // Start the audio graph. Safe to call repeatedly; only the first call builds.
  audio.ensure = function ensure() {
    if (audio.ctx || audio.muted) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audio.ctx = new Ctx();
      // Engine hum: a sawtooth through a low-pass filter, quiet and low.
      audio.engineOsc = audio.ctx.createOscillator();
      audio.engineOsc.type = 'sawtooth';
      audio.engineOsc.frequency.value = 55;
      audio.engineFilter = audio.ctx.createBiquadFilter();
      audio.engineFilter.type = 'lowpass';
      audio.engineFilter.frequency.value = 320;
      audio.engineGain = audio.ctx.createGain();
      audio.engineGain.gain.value = 0.0;
      audio.engineOsc.connect(audio.engineFilter);
      audio.engineFilter.connect(audio.engineGain);
      audio.engineGain.connect(audio.ctx.destination);
      audio.engineOsc.start();
    } catch (err) {
      audio.ctx = null;
    }
  };

  // Follow the throttle: louder and higher-pitched as the engine works.
  audio.setEngine = function setEngine(throttle, speed, flying) {
    if (!audio.ctx || audio.muted) return;
    const t = audio.ctx.currentTime;
    const gain = flying ? 0.015 + (throttle / 100) * 0.05 : 0.0;
    audio.engineGain.gain.setTargetAtTime(gain, t, 0.1);
    audio.engineOsc.frequency.setTargetAtTime(48 + throttle * 0.9 + speed * 0.12, t, 0.1);
  };

  // A short tone: the building block for chimes and beeps.
  function tone(freq, dur, type, vol, when) {
    if (!audio.ctx || audio.muted) return;
    const t0 = audio.ctx.currentTime + (when || 0);
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audio.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  audio.chime = function chime() {
    tone(880, 0.18, 'sine', 0.14, 0);
    tone(1318, 0.3, 'sine', 0.12, 0.09);
  };

  audio.thud = function thud() {
    tone(140, 0.22, 'triangle', 0.2, 0);
    tone(70, 0.3, 'sine', 0.18, 0.02);
  };

  audio.warn = function warn() {
    tone(620, 0.12, 'square', 0.05, 0);
  };

  audio.crash = function crash() {
    if (!audio.ctx || audio.muted) return;
    const dur = 0.7;
    const buffer = audio.ctx.createBuffer(1, audio.ctx.sampleRate * dur, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = audio.ctx.createGain();
    gain.gain.value = 0.25;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.ctx.destination);
    src.start();
  };

  audio.click = function click() {
    tone(520, 0.07, 'sine', 0.08, 0);
  };

  audio.toggleMute = function toggleMute() {
    audio.muted = !audio.muted;
    if (audio.engineGain) {
      audio.engineGain.gain.value = 0;
    }
    return audio.muted;
  };

  return audio;
}
