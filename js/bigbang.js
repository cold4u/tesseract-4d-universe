/**
 * The Big Bang & Cosmic Web Origin Simulation
 * Simulates cosmic inflation from an infinitesimal Planck singularity (t=0)
 * to 25,000-particle gravitational clustering into the modern Cosmic Web (13.8 Gyr).
 */

export class BigBangSimulator {
  constructor(containerElement, telemetryElement) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;

    this.cosmicTimeGyr = 0.0; // 0.0 to 13.8 Gyr
    this.isPlaying = false;
    this.playSpeed = 0.08; // Gyr per frame
    this.darkEnergy = 0.68;
    this.darkMatter = 0.27;

    this.particleCount = 20000;
    this.isThree = typeof window.THREE !== 'undefined';
    this.init();
  }

  init() {
    if (this.isThree) {
      this.initThree();
    } else {
      this.initCanvasFallback();
    }
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    const THREE = window.THREE;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    this.camera.position.set(0, 5, 22);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 45;
      this.controls.minDistance = 2.5;
    }

    // 1. Initial Singularity Core (Active at t=0)
    const singGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const singMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.singularityMesh = new THREE.Mesh(singGeo, singMat);
    this.scene.add(this.singularityMesh);

    // Singularity Inflation Flare Halo
    const flareGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    this.singularityFlare = new THREE.Mesh(flareGeo, flareMat);
    this.scene.add(this.singularityFlare);

    // 2. Cosmic Expansion Particles (20,000 Matter/Galaxy Nodes)
    this.buildCosmicParticles();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const nw = this.container.clientWidth;
      const nh = this.container.clientHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });

    this.updateCosmicState();
  }

  buildCosmicParticles() {
    const THREE = window.THREE;
    const count = this.particleCount;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    this.particleData = [];

    // Pre-calculate filamentary seed nodes (Zel'dovich pancake approximation)
    const clusterCenters = [];
    for (let c = 0; c < 28; c++) {
      clusterCenters.push(new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16
      ));
    }

    for (let i = 0; i < count; i++) {
      // Unit spherical direction of expansion
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.sin(phi) * Math.sin(theta);
      const dirZ = Math.cos(phi);

      // Expansion speed variations (Hubble flow)
      const baseSpeed = 0.8 + Math.random() * 0.4;

      // Find nearest cluster center for cosmic filament clustering
      const targetCluster = clusterCenters[i % clusterCenters.length];

      this.particleData.push({
        dirX, dirY, dirZ,
        baseSpeed,
        clusterX: targetCluster.x + (Math.random() - 0.5) * 2.5,
        clusterY: targetCluster.y + (Math.random() - 0.5) * 2.5,
        clusterZ: targetCluster.z + (Math.random() - 0.5) * 2.5,
        randomFactor: Math.random()
      });

      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      cols[i * 3] = 1.0;
      cols[i * 3 + 1] = 1.0;
      cols[i * 3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.cosmicMesh = new THREE.Points(geo, mat);
    this.scene.add(this.cosmicMesh);
  }

  igniteBigBang() {
    this.cosmicTimeGyr = 0.01;
    this.isPlaying = true;
    this.updateCosmicState();
  }

  setTime(gyr) {
    this.cosmicTimeGyr = Math.max(0, Math.min(13.8, parseFloat(gyr)));
    this.updateCosmicState();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  reset() {
    this.isPlaying = false;
    this.cosmicTimeGyr = 0.0;
    this.updateCosmicState();
  }

  updateCosmicState() {
    const tGyr = this.cosmicTimeGyr;
    const isAtSingularity = tGyr <= 0.001;

    // 1. Singularity visibility
    if (this.singularityMesh) {
      this.singularityMesh.visible = isAtSingularity;
      this.singularityFlare.visible = isAtSingularity;
      if (isAtSingularity) {
        this.cosmicMesh.visible = false;
        this.renderTelemetry();
        return;
      }
    }

    if (!this.cosmicMesh) return;
    this.cosmicMesh.visible = true;

    // 2. Cosmic Expansion Scale Factor a(t) ~ t^(2/3) in matter era, exponential in dark energy era
    const tNorm = tGyr / 13.8; // 0 to 1
    const scaleFactor = Math.pow(Math.max(0.01, tNorm), 0.72) * 14.5;
    // Gravitational clustering factor (structures condense later in time)
    const clusterWeight = Math.pow(Math.max(0, tNorm - 0.15) / 0.85, 1.8);

    const posAttr = this.cosmicMesh.geometry.attributes.position;
    const colAttr = this.cosmicMesh.geometry.attributes.color;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particleData[i];

      // Hubble expansion component
      const expX = p.dirX * scaleFactor * p.baseSpeed;
      const expY = p.dirY * scaleFactor * p.baseSpeed;
      const expZ = p.dirZ * scaleFactor * p.baseSpeed;

      // Gravitational condensation toward cosmic web filaments
      const finalX = expX * (1 - clusterWeight * 0.7) + p.clusterX * (clusterWeight * 0.7 * tNorm);
      const finalY = expY * (1 - clusterWeight * 0.7) + p.clusterY * (clusterWeight * 0.7 * tNorm);
      const finalZ = expZ * (1 - clusterWeight * 0.7) + p.clusterZ * (clusterWeight * 0.7 * tNorm);

      posAttr.array[i * 3] = finalX;
      posAttr.array[i * 3 + 1] = finalY;
      posAttr.array[i * 3 + 2] = finalZ;

      // Thermal cooling color transition:
      // t < 0.05 Gyr: Blinding white-hot / quark-gluon plasma (10^9 K)
      // t < 0.4 Gyr: Recombination / CMB orange-cyan (3,000 K)
      // t < 2.0 Gyr: Dark Ages to first stars
      // t >= 2.0 Gyr: Modern Cosmic Web (electric violet, cyan, starlight white galaxies)
      if (tGyr < 0.05) {
        colAttr.array[i * 3] = 1.0;
        colAttr.array[i * 3 + 1] = 1.0;
        colAttr.array[i * 3 + 2] = 1.0; // Blinding Singularity flash
      } else if (tGyr < 0.5) {
        colAttr.array[i * 3] = 1.0;
        colAttr.array[i * 3 + 1] = 0.55;
        colAttr.array[i * 3 + 2] = 0.15; // Recombination Amber
      } else if (tGyr < 2.0) {
        colAttr.array[i * 3] = 0.2;
        colAttr.array[i * 3 + 1] = 0.8;
        colAttr.array[i * 3 + 2] = 1.0; // First Stars Ignition (Cyan)
      } else {
        // Modern Galaxies in Cosmic Web
        if (p.randomFactor < 0.4) {
          colAttr.array[i * 3] = 0.0;
          colAttr.array[i * 3 + 1] = 0.95;
          colAttr.array[i * 3 + 2] = 1.0; // Cyan galaxies
        } else if (p.randomFactor < 0.7) {
          colAttr.array[i * 3] = 0.75;
          colAttr.array[i * 3 + 1] = 0.35;
          colAttr.array[i * 3 + 2] = 1.0; // Violet filaments
        } else {
          colAttr.array[i * 3] = 1.0;
          colAttr.array[i * 3 + 1] = 0.85;
          colAttr.array[i * 3 + 2] = 0.4; // Golden stellar clusters
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    this.renderTelemetry();
  }

  renderTelemetry() {
    if (!this.telemetryElem) return;

    const t = this.cosmicTimeGyr;
    let eraTitle = 'Planck Epoch (t = 0)';
    let eraDesc = 'Infinite density and temperature. All four fundamental forces unified.';
    let tempK = '10³² K';
    let dominance = 'Quantum Gravity';

    if (t > 12.0) {
      eraTitle = 'Modern Era: Dark Energy Dominance (13.8 Gyr)';
      eraDesc = 'Cosmic Web formed. Accelerated spatial expansion driven by Dark Energy (68%). Billions of galaxy clusters interconnected by filamentary bridges.';
      tempK = '2.73 K (CMB)';
      dominance = 'Dark Energy (68%)';
    } else if (t > 2.0) {
      eraTitle = 'Cosmic Web & Galaxy Assembly Era (2 - 12 Gyr)';
      eraDesc = 'Dark matter halos attract baryonic gas, collapsing into hundreds of billions of galaxies and superclusters.';
      tempK = '20 - 5 K';
      dominance = 'Dark Matter (27%)';
    } else if (t > 0.4) {
      eraTitle = 'Reionization & First Stars (100 - 400 Myr)';
      eraDesc = 'Population III primordial stars ignite, emitting intense ultraviolet radiation that reionizes neutral hydrogen gas across the cosmos.';
      tempK = '100 K';
      dominance = 'Baryonic Matter';
    } else if (t > 0.001) {
      eraTitle = 'Cosmic Inflation & Recombination (380,000 yr)';
      eraDesc = 'Space expands exponentially faster than light. Electrons bind to protons, releasing the Cosmic Microwave Background (CMB) photons into transparent space!';
      tempK = '3,000 K';
      dominance = 'Radiation Pressure';
    }

    this.telemetryElem.innerHTML = `
      <div class="bh-hud-status status-nominal">
        <span class="hud-indicator-dot"></span>
        <div>
          <div style="font-weight: 800; font-size: 0.88rem;">${eraTitle}</div>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">${eraDesc}</div>
        </div>
      </div>
      <div class="bh-metrics-grid">
        <div class="bh-metric-item">
          <span class="metric-title">Cosmic Time</span>
          <span class="metric-value" style="color: var(--accent-cyan);">${t.toFixed(2)} Billion Years</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Ambient Temperature</span>
          <span class="metric-value">${tempK}</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Dominant Energy</span>
          <span class="metric-value" style="color: var(--accent-gold);">${dominance}</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Cosmic Web Nodes</span>
          <span class="metric-value">${this.particleCount.toLocaleString()} Galaxies</span>
        </div>
      </div>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isPlaying) {
      this.cosmicTimeGyr += this.playSpeed;
      if (this.cosmicTimeGyr >= 13.8) {
        this.cosmicTimeGyr = 13.8;
        this.isPlaying = false;
        const playBtn = document.getElementById('btn-bigbang-play');
        if (playBtn) playBtn.textContent = '▶ Replay Evolution';
      }
      this.updateCosmicState();

      const slider = document.getElementById('slider-bigbang-time');
      const valDisp = document.getElementById('val-bigbang-time');
      if (slider) slider.value = this.cosmicTimeGyr.toFixed(1);
      if (valDisp) valDisp.textContent = this.cosmicTimeGyr.toFixed(2) + ' Gyr';
    }

    if (this.isThree) {
      if (this.cosmicMesh) {
        this.cosmicMesh.rotation.y += 0.0008;
      }
      if (this.controls) this.controls.update();
      this.renderer.render(this.scene, this.camera);
    } else {
      this.renderCanvasFallback();
    }
  }

  initCanvasFallback() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);
  }

  renderCanvasFallback() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const ctx = this.ctx;
    ctx.fillStyle = '#020409';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const r = (this.cosmicTimeGyr / 13.8) * 160 + 5;

    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
