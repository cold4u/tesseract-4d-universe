/**
 * Main Cosmic Hub Orchestrator
 * Connects Milky Way Galaxy, Black Hole Collision Sandbox, Pulsar,
 * 3D Exploded Rocket, Voyager Missions, and the 4D Tesseract Widget.
 */

import { MilkyWayGalaxy } from './galaxy.js?v=20260923-02';
import { BlackHoleSimulator } from './blackhole.js?v=20260923-02';
import { PulsarSimulator } from './pulsar.js?v=20260923-02';
import { RocketExplodedViewer } from './rocket.js?v=20260923-02';
import { MissionsManager } from './missions.js?v=20260923-02';
import { TesseractWidget } from './tesseract-widget.js?v=20260923-02';
import { CosmicAudio } from './audio.js?v=20260923-02';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Audio Engine
  const audio = new CosmicAudio();
  let audioPlaying = false;
  const audioBtn = document.getElementById('audio-toggle-btn');
  const soundWave = document.getElementById('sound-wave-icon');

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      audioPlaying = audio.toggle();
      audioBtn.classList.toggle('active', audioPlaying);
      if (soundWave) soundWave.style.opacity = audioPlaying ? '1' : '0.4';
      audioBtn.querySelector('.btn-text').textContent = audioPlaying ? 'Cosmic Sound: ON' : 'Cosmic Sound: OFF';
    });
  }

  // 2. Smooth Navigation and Active Section Tracking
  const navLinks = document.querySelectorAll('.station-tab-btn');
  const sections = document.querySelectorAll('.station-section');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const targetElem = document.querySelector(targetId);
        if (targetElem) {
          e.preventDefault();
          targetElem.scrollIntoView({ behavior: 'smooth' });
          if (audioPlaying) audio.playChime(1.2);
        }
      }
    });
  });

  // ----------------------------------------------------
  // STATION 1: MILKY WAY GALAXY
  // ----------------------------------------------------
  const galaxyContainer = document.getElementById('galaxyViewport');
  let galaxyInstance = null;
  if (galaxyContainer) {
    galaxyInstance = new MilkyWayGalaxy(galaxyContainer);

    document.querySelectorAll('[data-galaxy-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-galaxy-target]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-galaxy-target');
        galaxyInstance.flyTo(target);
        if (audioPlaying) audio.playChime(1.4);
      });
    });

    const galaxySpeedSlider = document.getElementById('slider-galaxy-speed');
    if (galaxySpeedSlider) {
      galaxySpeedSlider.addEventListener('input', (e) => {
        galaxyInstance.rotationSpeed = parseFloat(e.target.value) / 10000;
      });
    }
  }

  // ----------------------------------------------------
  // STATION 2: REAL BLACK HOLE & CATACLYSM COLLISION SANDBOX
  // ----------------------------------------------------
  const bhContainer = document.getElementById('blackholeViewport');
  const bhTelemetry = document.getElementById('bhTelemetryBox');
  let bhInstance = null;
  if (bhContainer) {
    bhInstance = new BlackHoleSimulator(bhContainer, bhTelemetry);

    document.querySelectorAll('[data-bh-scenario]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-bh-scenario]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sc = btn.getAttribute('data-bh-scenario');
        bhInstance.setScenario(sc);
        const playBtn = document.getElementById('btn-bh-play');
        if (playBtn) playBtn.textContent = '▶ Play Simulation';
        if (audioPlaying) audio.playChime(0.9);
      });
    });

    // Play / Pause Simulation Button
    const playBtn = document.getElementById('btn-bh-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const isPlaying = bhInstance.togglePlay();
        playBtn.textContent = isPlaying ? '⏸ Pause Simulation' : '▶ Play Simulation';
        if (audioPlaying) audio.playChime(isPlaying ? 1.5 : 0.8);
      });
    }

    // Reset Simulation Button
    const resetBtn = document.getElementById('btn-bh-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        bhInstance.resetSimulation();
        if (playBtn) playBtn.textContent = '▶ Play Simulation';
        const slider = document.getElementById('slider-bh-distance');
        const valDisp = document.getElementById('val-bh-distance');
        if (slider) slider.value = '10.0';
        if (valDisp) valDisp.textContent = '10.0 AU';
        if (audioPlaying) audio.playChime(1.1);
      });
    }

    // Distance Slider (10 AU to 0.2 AU)
    const bhDistSlider = document.getElementById('slider-bh-distance');
    const bhDistVal = document.getElementById('val-bh-distance');
    if (bhDistSlider) {
      bhDistSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (bhDistVal) bhDistVal.textContent = val.toFixed(1) + ' AU';
        bhInstance.setDistance(val);
        if (playBtn) playBtn.textContent = '▶ Play Simulation';
      });
    }
  }

  // ----------------------------------------------------
  // STATION 3: PULSAR (NEUTRON STAR)
  // ----------------------------------------------------
  const pulsarContainer = document.getElementById('pulsarViewport');
  const pulsarTelemetry = document.getElementById('pulsarTelemetryBox');
  let pulsarInstance = null;
  if (pulsarContainer) {
    pulsarInstance = new PulsarSimulator(pulsarContainer, pulsarTelemetry, () => {
      if (audioPlaying) audio.playPulsarClick();
    });

    const spinSlider = document.getElementById('slider-pulsar-spin');
    const spinVal = document.getElementById('val-pulsar-spin');
    if (spinSlider) {
      spinSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (spinVal) spinVal.textContent = val.toFixed(1) + ' Hz';
        pulsarInstance.setSpinFrequency(val);
      });
    }

    const tiltSlider = document.getElementById('slider-pulsar-tilt');
    const tiltVal = document.getElementById('val-pulsar-tilt');
    if (tiltSlider) {
      tiltSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (tiltVal) tiltVal.textContent = val.toFixed(0) + '°';
        pulsarInstance.setMagneticTilt(val);
      });
    }
  }

  // ----------------------------------------------------
  // STATION 4: 3D ROCKET WITH EXPLODED VIEW
  // ----------------------------------------------------
  const rocketContainer = document.getElementById('rocketViewport');
  const rocketTelemetry = document.getElementById('rocketTelemetryBox');
  let rocketInstance = null;
  if (rocketContainer) {
    rocketInstance = new RocketExplodedViewer(rocketContainer, rocketTelemetry);

    const explodeSlider = document.getElementById('slider-rocket-explode');
    const explodeVal = document.getElementById('val-rocket-explode');
    if (explodeSlider) {
      explodeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (explodeVal) explodeVal.textContent = Math.round(val * 100) + '%';
        rocketInstance.setExplode(val);
      });
    }
  }

  // ----------------------------------------------------
  // STATION 5: VOYAGER MISSIONS
  // ----------------------------------------------------
  new MissionsManager('voyagerTelemetryBox');

  // ----------------------------------------------------
  // STATION 6: THE TESSERACT (4D HYPERCUBE)
  // ----------------------------------------------------
  const tesseractCanvas = document.getElementById('tesseractCanvas');
  if (tesseractCanvas) {
    const tesseract = new TesseractWidget(tesseractCanvas);

    const wSlider = document.getElementById('slider-tesseract-w');
    if (wSlider) {
      wSlider.addEventListener('input', (e) => {
        tesseract.setWAngle(parseFloat(e.target.value));
      });
    }

    const autoBtn = document.getElementById('btn-tesseract-auto');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        const isAuto = tesseract.toggleAutoRotate();
        autoBtn.textContent = isAuto ? 'Auto Inversion: ON' : 'Auto Inversion: OFF';
        autoBtn.classList.toggle('active', isAuto);
      });
    }
  }
});
