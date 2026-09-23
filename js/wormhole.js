/**
 * Traversable Wormhole (Einstein-Rosen Bridge) Flight Simulator
 * Simulates real-time 3D flight through a curved 4D spacetime throat connecting two universes.
 * Features relativistic warp streaks, gravitational aberration, and exit mouth transition.
 */

export class WormholeSimulator {
  constructor(containerElement, telemetryElement) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;

    this.flightSpeed = 1.0; // In units of c (0.1c to 9.9c Warp)
    this.cameraProgress = 0.0; // Distance traveled along throat (-15 to +15)
    this.throatRadius = 2.4;
    this.throatLength = 30.0;

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
    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 1000);
    this.camera.position.set(0, 0, -14);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxDistance = 25;
      this.controls.minDistance = 0.5;
    }

    // 1. Build Wormhole Throat Geometry (Hyperboloid of Revolution)
    this.buildWormholeThroat();

    // 2. Build Relativistic Warp Streak Particles (4,000 particles)
    this.buildWarpStreaks();

    // 3. Build Universe A (Entrance Mouth - Milky Way side) and Universe B (Exit Mouth - Gargantua side)
    this.buildUniverses();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const nw = this.container.clientWidth;
      const nh = this.container.clientHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });

    this.renderTelemetry();
  }

  buildWormholeThroat() {
    const THREE = window.THREE;
    // Curved spacetime throat: radius r(z) = sqrt(r0^2 + (z/b)^2)
    const segmentsZ = 64;
    const segmentsR = 32;
    const geo = new THREE.CylinderGeometry(
      this.throatRadius * 2.8, // Top mouth radius
      this.throatRadius * 2.8, // Bottom mouth radius
      this.throatLength,
      segmentsR,
      segmentsZ,
      true
    );

    // Deform cylinder into a curved hyperboloid throat
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const rFactor = Math.sqrt(1 + Math.pow(y / 4.5, 2));
      pos.setX(i, pos.getX(i) * (rFactor / 2.8));
      pos.setZ(i, pos.getZ(i) * (rFactor / 2.8));
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });
    this.throatMesh = new THREE.Mesh(geo, mat);
    this.throatMesh.rotation.x = Math.PI / 2; // Lie along Z axis for forward camera flight
    this.scene.add(this.throatMesh);
  }

  buildWarpStreaks() {
    const THREE = window.THREE;
    const count = 4000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    this.streakData = [];
    for (let i = 0; i < count; i++) {
      const z = (Math.random() - 0.5) * this.throatLength * 1.5;
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * (this.throatRadius * 1.8);

      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.sin(angle) * r;
      pos[i * 3 + 2] = z;

      // Color transitions along throat: Cyan -> Violet -> Amber
      const t = (z + this.throatLength) / (this.throatLength * 2);
      cols[i * 3] = t < 0.5 ? 0.0 : 1.0;
      cols[i * 3 + 1] = t < 0.5 ? 0.95 : 0.6;
      cols[i * 3 + 2] = 1.0;

      this.streakData.push({ x: pos[i * 3], y: pos[i * 3 + 1], z: z, baseZ: z, speed: 0.05 + Math.random() * 0.1 });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    this.warpParticles = new THREE.Points(geo, mat);
    this.scene.add(this.warpParticles);
  }

  buildUniverses() {
    const THREE = window.THREE;
    // Entrance Portal Ring (Universe 1: Milky Way)
    const mouth1Geo = new THREE.RingGeometry(this.throatRadius * 1.4, this.throatRadius * 2.2, 48);
    const mouth1Mat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.mouth1 = new THREE.Mesh(mouth1Geo, mouth1Mat);
    this.mouth1.position.z = -this.throatLength / 2;
    this.scene.add(this.mouth1);

    // Exit Portal Ring (Universe 2: Gargantua / Distant Galaxy)
    const mouth2Geo = new THREE.RingGeometry(this.throatRadius * 1.4, this.throatRadius * 2.2, 48);
    const mouth2Mat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.mouth2 = new THREE.Mesh(mouth2Geo, mouth2Mat);
    this.mouth2.position.z = this.throatLength / 2;
    this.scene.add(this.mouth2);
  }

  setSpeed(val) {
    this.flightSpeed = parseFloat(val);
    this.renderTelemetry();
  }

  renderTelemetry() {
    if (!this.telemetryElem) return;

    const vC = this.flightSpeed;
    const lorentzGamma = 1 / Math.sqrt(Math.max(0.001, 1 - Math.min(0.999, Math.pow(vC / 10, 2))));
    const timeDilation = lorentzGamma.toFixed(2);
    const status = vC > 1.0 ? 'SUPERLUMINAL WARP TRANSIT ACTIVE' : 'SUBLUMINAL APPROACH';

    this.telemetryElem.innerHTML = `
      <div class="bh-hud-status ${vC > 1.0 ? 'status-critical' : 'status-nominal'}">
        <span class="hud-indicator-dot"></span>
        <div>
          <div style="font-weight: 800; font-size: 0.88rem;">${status}</div>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">
            ${vC > 1.0 ? `Hyperspace geodesic compression active: Traveling at ${(vC).toFixed(1)}× Speed of Light through 4D bulk space!` : `Approaching the Einstein-Rosen throat at ${vC.toFixed(1)} c.`}
          </div>
        </div>
      </div>
      <div class="bh-metrics-grid">
        <div class="bh-metric-item">
          <span class="metric-title">Warp Factor</span>
          <span class="metric-value" style="color: var(--accent-cyan);">${vC.toFixed(1)} c (${(vC * 299792).toLocaleString()} km/s)</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Throat Diameter</span>
          <span class="metric-value">2.4 AU (Einstein-Rosen)</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Lorentz Factor (γ)</span>
          <span class="metric-value">${timeDilation}×</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Exit Destination</span>
          <span class="metric-value" style="color: var(--accent-gold);">Gargantua Galaxy (10B ly)</span>
        </div>
      </div>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);

    const deltaSpeed = this.flightSpeed * 0.08;

    if (this.isThree) {
      // Advance warp particles toward camera along Z axis
      if (this.warpParticles) {
        const posAttr = this.warpParticles.geometry.attributes.position;
        const halfLen = this.throatLength / 2;

        for (let i = 0; i < this.streakData.length; i++) {
          const item = this.streakData[i];
          item.z += deltaSpeed * item.speed * 2.5;

          // Wrap particles when passing camera
          if (item.z > halfLen + 5) {
            item.z = -halfLen - 5;
          }

          posAttr.array[i * 3 + 2] = item.z;
        }
        posAttr.needsUpdate = true;
      }

      // Rotate throat geometry for hyperspace twisting effect
      if (this.throatMesh) {
        this.throatMesh.rotation.z += 0.005 * (this.flightSpeed * 0.5);
      }
      if (this.mouth1) this.mouth1.rotation.z += 0.01;
      if (this.mouth2) this.mouth2.rotation.z -= 0.01;

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
    this.rot = 0;
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
    this.rot += 0.02 * this.flightSpeed;

    // Concentric hyperspace warp rings
    for (let r = 20; r < 200; r += 25) {
      ctx.strokeStyle = `rgba(0, 243, 255, ${0.8 - r / 250})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.5, r * 0.8, this.rot, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
