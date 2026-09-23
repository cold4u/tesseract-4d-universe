/**
 * Main Application Orchestrator
 * Connects UI, Telemetry, 3D Renderer, 4D Slicer, and Audio Engine.
 */

import { PolytopeRenderer } from './renderer3d.js';
import { SlicerDemo } from './slicer.js';
import { CosmicAudio } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const viewport = document.getElementById('viewport3d');
  const hudPolytope = document.getElementById('hud-polytope');
  const hudSchlafli = document.getElementById('hud-schlafli');
  const hudVertices = document.getElementById('hud-vertices');
  const hudEdges = document.getElementById('hud-edges');
  const hudFaces = document.getElementById('hud-faces');
  const hudCells = document.getElementById('hud-cells');
  const hudFps = document.getElementById('hud-fps');
  const vertexCoordsOutput = document.getElementById('vertex-coords-output');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const soundWaveIcon = document.getElementById('sound-wave-icon');

  // Sliders
  const sliderXW = document.getElementById('slider-xw');
  const sliderYW = document.getElementById('slider-yw');
  const sliderZW = document.getElementById('slider-zw');
  const sliderXY = document.getElementById('slider-xy');
  const sliderXZ = document.getElementById('slider-xz');
  const sliderYZ = document.getElementById('slider-yz');
  const sliderDist4D = document.getElementById('slider-dist-4d');
  const sliderOpacity = document.getElementById('slider-opacity');
  const sliderUnfold = document.getElementById('slider-unfold');

  // Audio Engine
  const audio = new CosmicAudio();
  let audioPlaying = false;

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audioPlaying = audio.toggle();
      audioToggleBtn.classList.toggle('active', audioPlaying);
      if (soundWaveIcon) {
        soundWaveIcon.style.opacity = audioPlaying ? '1' : '0.4';
      }
      audioToggleBtn.querySelector('.btn-text').textContent = audioPlaying ? 'Cosmic Sound: ON' : 'Cosmic Sound: OFF';
    });
  }

  // Polytope 3D Renderer
  const renderer = new PolytopeRenderer(viewport, {
    onVertexHover: (idx, v4, v3) => {
      if (idx !== -1 && v4 && v3) {
        vertexCoordsOutput.innerHTML = `
          <div class="coord-row highlight">
            <span class="coord-label">Vertex #${idx}</span>
            <span class="coord-badge">Active</span>
          </div>
          <div class="coord-row">
            <span class="dim-tag">4D (x,y,z,w)</span>
            <span class="dim-val">(${v4.x.toFixed(2)}, ${v4.y.toFixed(2)}, ${v4.z.toFixed(2)}, <strong>${v4.w.toFixed(2)}</strong>)</span>
          </div>
          <div class="coord-row">
            <span class="dim-tag">Projected 3D</span>
            <span class="dim-val">(${v3.x.toFixed(2)}, ${v3.y.toFixed(2)}, ${v3.z.toFixed(2)})</span>
          </div>
        `;
        if (audioPlaying) {
          audio.playChime(1.0 + (v4.w + 1.2) * 0.3);
        }
      } else {
        vertexCoordsOutput.innerHTML = `
          <div class="coord-row placeholder">
            <em>Hover over any vertex to inspect real-time 4D coordinates</em>
          </div>
        `;
      }
    }
  });

  // Update HUD with current Polytope Stats
  function updatePolytopeHUD() {
    const p = renderer.polytope;
    if (hudPolytope) hudPolytope.textContent = p.name;
    if (hudSchlafli) hudSchlafli.textContent = p.schlafli || 'N/A';
    if (hudVertices) hudVertices.textContent = p.vertexCount;
    if (hudEdges) hudEdges.textContent = p.edgeCount;
    if (hudFaces) hudFaces.textContent = p.faceCount;
    if (hudCells) hudCells.textContent = p.cellCount;
  }
  updatePolytopeHUD();

  // Polytope Selection Buttons
  const shapeButtons = document.querySelectorAll('[data-shape]');
  shapeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const shape = btn.getAttribute('data-shape');
      renderer.setPolytope(shape);
      updatePolytopeHUD();
      if (audioPlaying) audio.playChime(1.5);
    });
  });

  // Projection Mode Buttons
  const projButtons = document.querySelectorAll('[data-projection]');
  projButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      projButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderer.options.projectionMode = btn.getAttribute('data-projection');
    });
  });

  // Preset Buttons
  const presetButtons = document.querySelectorAll('[data-preset]');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-preset');
      renderer.setPreset(preset);

      // Sync slider UI values
      if (sliderXW) sliderXW.value = renderer.velocities.xw * 1000;
      if (sliderYW) sliderYW.value = renderer.velocities.yw * 1000;
      if (sliderZW) sliderZW.value = renderer.velocities.zw * 1000;
      if (sliderXY) sliderXY.value = renderer.velocities.xy * 1000;
      if (sliderXZ) sliderXZ.value = renderer.velocities.xz * 1000;
      if (sliderYZ) sliderYZ.value = renderer.velocities.yz * 1000;
      if (sliderUnfold) sliderUnfold.value = renderer.options.unfoldFactor * 100;

      if (audioPlaying) audio.playChime(1.25);
    });
  });

  // Rotation Sliders (velocities)
  function bindVelocitySlider(slider, plane) {
    if (!slider) return;
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 1000;
      renderer.velocities[plane] = val;
      renderer.autoRotate = true;
      if (audioPlaying) {
        audio.setFilterModulation(Math.abs(val) * 10);
      }
    });
  }

  bindVelocitySlider(sliderXW, 'xw');
  bindVelocitySlider(sliderYW, 'yw');
  bindVelocitySlider(sliderZW, 'zw');
  bindVelocitySlider(sliderXY, 'xy');
  bindVelocitySlider(sliderXZ, 'xz');
  bindVelocitySlider(sliderYZ, 'yz');

  // Camera Distance 4D Slider
  if (sliderDist4D) {
    sliderDist4D.addEventListener('input', (e) => {
      renderer.options.cameraDistance4D = parseFloat(e.target.value);
    });
  }

  // Opacity Slider
  if (sliderOpacity) {
    sliderOpacity.addEventListener('input', (e) => {
      const op = parseFloat(e.target.value) / 100;
      renderer.options.cellOpacity = op;
      if (renderer.faceMesh && renderer.faceMesh.material) {
        renderer.faceMesh.material.opacity = op;
      }
    });
  }

  // Dalí Unfold Slider
  if (sliderUnfold) {
    sliderUnfold.addEventListener('input', (e) => {
      renderer.options.unfoldFactor = parseFloat(e.target.value) / 100;
    });
  }

  // Toggles: Cells, Edges, Vertices
  const toggleCells = document.getElementById('toggle-cells');
  if (toggleCells) {
    toggleCells.addEventListener('change', (e) => {
      renderer.options.showCells = e.target.checked;
    });
  }

  const toggleEdges = document.getElementById('toggle-edges');
  if (toggleEdges) {
    toggleEdges.addEventListener('change', (e) => {
      renderer.options.showEdges = e.target.checked;
    });
  }

  const toggleVertices = document.getElementById('toggle-vertices');
  if (toggleVertices) {
    toggleVertices.addEventListener('change', (e) => {
      renderer.options.showVertices = e.target.checked;
    });
  }

  const resetRotationBtn = document.getElementById('btn-reset-rot');
  if (resetRotationBtn) {
    resetRotationBtn.addEventListener('click', () => {
      renderer.resetRotations();
      if (audioPlaying) audio.playChime(0.8);
    });
  }

  // FPS Telemetry Counter
  let frameCount = 0;
  let lastTime = performance.now();
  function countFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      if (hudFps) hudFps.textContent = frameCount;
      frameCount = 0;
      lastTime = now;
    }
    requestAnimationFrame(countFPS);
  }
  countFPS();

  // ----------------------------------------------------
  // Slicer Demo Setup
  // ----------------------------------------------------
  const slicer = new SlicerDemo('sliceCanvas', 'sliceTelemetry');
  const sliceSlider = document.getElementById('slice-w-slider');
  const sliceValDisplay = document.getElementById('slice-w-val');
  const slicerShapeButtons = document.querySelectorAll('[data-slice-shape]');

  if (sliceSlider) {
    sliceSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (sliceValDisplay) sliceValDisplay.textContent = val.toFixed(2);
      slicer.setSlice(val);
      if (audioPlaying) audio.setFilterModulation(Math.abs(val) * 2);
    });
  }

  slicerShapeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      slicerShapeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      slicer.setShape(btn.getAttribute('data-slice-shape'));
    });
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});
