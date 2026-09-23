/**
 * Cosmic Soundscape Generator using Web Audio API
 * Produces real-time ambient space drones, harmonic celestial tones, and interactive interaction chimes.
 */

export class CosmicAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.oscillators = [];
    this.filter = null;
    this.lfo = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }
    this.ctx = new AudioContext();

    // Master volume node
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Cosmic Lowpass Resonant Filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
    this.filter.connect(this.masterGain);

    // LFO for filter breathing (slow cosmic expansion cycle)
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // ~12 sec cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);
    this.lfo.start();

    // Sub-harmonic cosmic drone oscillators (F# / 432Hz harmonic series)
    const baseFreq = 54.0; // Deep space root
    const harmonics = [
      { freq: baseFreq, type: 'sine', gain: 0.35 },
      { freq: baseFreq * 1.5, type: 'triangle', gain: 0.2 },      // Fifth
      { freq: baseFreq * 2.0, type: 'sine', gain: 0.15 },         // Octave
      { freq: baseFreq * 4.01, type: 'sine', gain: 0.08 },        // Shimmer with slight detune
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
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      // Fade out
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      this.isPlaying = false;
    } else {
      // Fade in
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 2.0);
      this.isPlaying = true;
    }

    return this.isPlaying;
  }

  /**
   * Play celestial chime when interacting with 4D vertices or planes
   */
  playChime(pitchFactor = 1.0) {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Harmonic pentatonic pitch series based around 432Hz
      const baseNote = 432 * (pitchFactor || 1.0);
      osc.frequency.setValueAtTime(baseNote, now);
      osc.frequency.exponentialRampToValueAtTime(baseNote * 1.5, now + 0.4);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      // Ignore audio glitches
    }
  }

  setFilterModulation(rate) {
    if (this.filter && this.ctx) {
      const target = Math.min(1200, Math.max(180, 250 + rate * 300));
      this.filter.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.2);
    }
  }
}
