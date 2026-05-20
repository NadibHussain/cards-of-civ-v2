// Synthesized attack sounds — Web Audio API, no audio files needed
window.playAttackSound = (function () {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Resume if suspended (browser auto-play policy)
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noiseBurst(ctx, startTime, duration, filterType, filterFreq) {
    const samples = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const flt = ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.value = filterFreq;
    const gain = ctx.createGain();
    src.connect(flt);
    flt.connect(gain);
    gain.connect(ctx.destination);
    src.start(startTime);
    return { src, gain };
  }

  const sounds = {
    // Sword clash — metallic high-frequency ping + noise burst
    infantry() {
      const c = getCtx(), t = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(340, t + 0.13);
      g.gain.setValueAtTime(0.55, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.35);
      const { gain: ng } = noiseBurst(c, t, 0.12, "bandpass", 2600);
      ng.gain.setValueAtTime(0.4, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    },

    // Cannon boom — deep bass sine + low-pass explosion noise
    artillery() {
      const c = getCtx(), t = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.5);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t); osc.stop(t + 0.8);
      const { gain: ng } = noiseBurst(c, t, 0.7, "lowpass", 380);
      ng.gain.setValueAtTime(0.75, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    },

    // Stealth whoosh — soft frequency sweep
    spy() {
      const c = getCtx(), t = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(270, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.18);
      osc.frequency.exponentialRampToValueAtTime(170, t + 0.4);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.28, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.45);
    },

    // Heavy tank explosion — low sawtooth rumble + deep noise
    tank() {
      const c = getCtx(), t = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(22, t + 1.1);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.25);
      osc.start(t); osc.stop(t + 1.25);
      const { gain: ng } = noiseBurst(c, t, 1.0, "lowpass", 210);
      ng.gain.setValueAtTime(1.0, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    },

    // Aerial missile — descending whistle then explosion
    drone() {
      const c = getCtx(), t = c.currentTime;
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1450, t);
      osc.frequency.exponentialRampToValueAtTime(170, t + 0.46);
      g.gain.setValueAtTime(0.44, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
      osc.start(t); osc.stop(t + 0.46);
      const { gain: ng } = noiseBurst(c, t + 0.38, 0.6, "lowpass", 650);
      ng.gain.setValueAtTime(0.001, t + 0.38);
      ng.gain.linearRampToValueAtTime(0.8, t + 0.44);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.98);
    },
  };

  return function playAttackSound(cardId) {
    try {
      if (sounds[cardId]) sounds[cardId]();
    } catch (e) {
      console.warn("Attack sound failed:", e);
    }
  };
})();
