/**
 * Cosmic Soundscape Generator using Web Audio API
 * Generates ambient space drones, rhythmic pulsar clicks, black hole hums, and celestial chimes.
 */

export class CosmicAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.filter = null;
    this.oscillators = [];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(3.0, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // Cosmic base harmonic drone (432Hz harmonic sub-octaves)
    const baseFreq = 54.0;
    const harmonics = [
      { freq: baseFreq, type: 'sine', gain: 0.3 },
      { freq: baseFreq * 1.5, type: 'triangle', gain: 0.18 },
      { freq: baseFreq * 2.0, type: 'sine', gain: 0.12 }
    ];

    harmonics.forEach(h => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = h.type;
      osc.frequency.setValueAtTime(h.freq, this.ctx.currentTime);
      g.gain.setValueAtTime(h.gain, this.ctx.currentTime);
      osc.connect(g);
      g.connect(this.filter);
      osc.start();
      this.oscillators.push(osc);
    });
  }

  toggle() {
    if (!this.ctx) this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
      this.isPlaying = false;
    } else {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.5);
      this.isPlaying = true;
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
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
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
      const baseNote = 432 * (pitchFactor || 1.0);
      osc.frequency.setValueAtTime(baseNote, now);
      osc.frequency.exponentialRampToValueAtTime(baseNote * 1.5, now + 0.35);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {}
  }
}
