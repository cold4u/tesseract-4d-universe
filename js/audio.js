/**
 * Movie-Grade Interstellar Cinematic Soundscape
 * Features pipe-organ harmonic progressions, low-frequency gravitational wave rumble,
 * pulsar radio clicks, and collision crescendo audio.
 */

export class CosmicAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.filter = null;
    this.oscillators = [];
    this.chordStep = 0;
    this.chordTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Warm resonant atmospheric lowpass
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(420, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(4.2, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // Interstellar Chord Progression: Fm -> Ab -> Eb -> Db (Root frequencies in Hz)
    this.chords = [
      [87.31, 104.65, 130.81, 174.61], // F minor
      [104.65, 130.81, 155.56, 207.65], // Ab major
      [77.78, 97.99, 116.54, 155.56],  // Eb major
      [69.30, 87.31, 104.65, 138.59]   // Db major
    ];

    // Build 4 synth voices (pipe organ / interstellar drone)
    this.voices = [];
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = (i % 2 === 0) ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(this.chords[0][i], this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.filter);
      osc.start();
      this.voices.push({ osc, gain });
    }

    // Sub-bass Gravitational Hum (38 Hz)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(38.0, this.ctx.currentTime);
    subGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(this.filter);
    subOsc.start();
  }

  toggle() {
    if (!this.ctx) this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      this.isPlaying = false;
      if (this.chordTimer) clearInterval(this.chordTimer);
    } else {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.22, this.ctx.currentTime + 2.0);
      this.isPlaying = true;

      // Advance chord every 6 seconds for moving cinematic emotion
      this.chordTimer = setInterval(() => {
        if (!this.isPlaying || !this.ctx) return;
        this.chordStep = (this.chordStep + 1) % this.chords.length;
        const currentChord = this.chords[this.chordStep];
        this.voices.forEach((v, idx) => {
          v.osc.frequency.setTargetAtTime(currentChord[idx], this.ctx.currentTime, 1.8);
        });
      }, 6000);
    }

    return this.isPlaying;
  }

  playPulsarClick() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.045);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  playChime(pitchFactor = 1.0) {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseNote = 440 * (pitchFactor || 1.0);
      osc.frequency.setValueAtTime(baseNote, now);
      osc.frequency.exponentialRampToValueAtTime(baseNote * 1.5, now + 0.4);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }
}
