/**
 * 3D Pulsar (Neutron Star) Cosmic Lighthouse Simulation
 * Simulates a rapidly rotating magnetized neutron star with relativistic radiation jets
 * and sweeping synchrotron lighthouse beams.
 */

export class PulsarSimulator {
  constructor(containerElement, telemetryElement, onPulseCallback = null) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;
    this.onPulse = onPulseCallback;

    this.spinFrequency = 4.0; // Rotations per second (Hz)
    this.magneticTilt = 0.55;  // Radians (~32 degrees)
    this.beamIntensity = 1.0;

    this.rotationAngle = 0;
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
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 3.5, 12);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 20;
      this.controls.minDistance = 3;
    }

    // 1. Neutron Star Core
    const starGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0x00f3ff,
      emissive: 0x0066aa,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9
    });
    this.starMesh = new THREE.Mesh(starGeo, starMat);
    this.scene.add(this.starMesh);

    // Glowing core atmosphere
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x7df9ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    this.starGlow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.starGlow);

    // 2. Magnetic Axis Group (Tilted relative to rotation axis)
    this.magneticGroup = new THREE.Group();
    this.scene.add(this.magneticGroup);

    // 3. Relativistic Beams (North & South Jets)
    this.buildBeams();

    // 4. Magnetic Field Lines (Dipole loops)
    this.buildMagneticFieldLines();

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

  buildBeams() {
    const THREE = window.THREE;
    // Tapered cone beams extending out to 8 units
    const beamGeo = new THREE.ConeGeometry(1.8, 9, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });

    // North Jet
    this.northBeam = new THREE.Mesh(beamGeo, beamMat);
    this.northBeam.position.y = 5.2;

    // South Jet
    this.southBeam = new THREE.Mesh(beamGeo, beamMat.clone());
    this.southBeam.position.y = -5.2;
    this.southBeam.rotation.x = Math.PI;

    this.magneticGroup.add(this.northBeam);
    this.magneticGroup.add(this.southBeam);
  }

  buildMagneticFieldLines() {
    const THREE = window.THREE;
    this.fieldGroup = new THREE.Group();

    // Generate dipole field loops: r = R0 * sin^2(theta)
    const loopCount = 10;
    for (let i = 0; i < loopCount; i++) {
      const phi = (i / loopCount) * Math.PI * 2;
      const points = [];
      const R0 = 3.5;

      for (let step = 0; step <= 36; step++) {
        const theta = (step / 36) * Math.PI;
        const r = R0 * Math.sin(theta) * Math.sin(theta);
        if (r < 0.9) continue;

        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.cos(theta);
        const z = r * Math.sin(theta) * Math.sin(phi);
        points.push(new THREE.Vector3(x, y, z));
      }

      if (points.length > 2) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x8a2be2,
          transparent: true,
          opacity: 0.35
        });
        const line = new THREE.Line(lineGeo, lineMat);
        this.fieldGroup.add(line);
      }
    }
    this.magneticGroup.add(this.fieldGroup);
  }

  setSpinFrequency(freq) {
    this.spinFrequency = parseFloat(freq);
    this.renderTelemetry();
  }

  setMagneticTilt(deg) {
    this.magneticTilt = (parseFloat(deg) * Math.PI) / 180;
    this.renderTelemetry();
  }

  renderTelemetry() {
    if (!this.telemetryElem) return;
    const periodMs = (1000 / this.spinFrequency).toFixed(1);
    const bFieldGauss = "1.2 × 10¹²";
    const surfaceGravity = "2.0 × 10¹¹";

    this.telemetryElem.innerHTML = `
      <div class="pulsar-metrics-grid">
        <div class="bh-metric-item">
          <span class="metric-title">Rotation Frequency</span>
          <span class="metric-value" style="color: var(--accent-cyan);">${this.spinFrequency.toFixed(1)} Hz (${(this.spinFrequency * 60).toFixed(0)} RPM)</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Pulse Period (P)</span>
          <span class="metric-value">${periodMs} ms</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Magnetic Field (B)</span>
          <span class="metric-value">${bFieldGauss} Gauss</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Surface Gravity</span>
          <span class="metric-value">${surfaceGravity} g</span>
        </div>
      </div>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Spin rate
    const delta = (this.spinFrequency * Math.PI * 2) / 60;
    this.rotationAngle += delta;

    if (this.isThree) {
      // Star rotates around Y axis
      if (this.starMesh) {
        this.starMesh.rotation.y = this.rotationAngle;
      }

      // Magnetic axis is tilted and rotates with star
      if (this.magneticGroup) {
        this.magneticGroup.rotation.z = this.magneticTilt;
        this.magneticGroup.rotation.y = this.rotationAngle;

        // Check if north beam is pointing close to the camera for pulse trigger
        const beamDir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.magneticGroup.quaternion);
        const camDir = this.camera.position.clone().normalize();
        const dot = beamDir.dot(camDir);

        if (dot > 0.92) {
          // Lighthouse flash!
          if (this.onPulse && !this.justPulsed) {
            this.onPulse();
            this.justPulsed = true;
          }
        } else {
          this.justPulsed = false;
        }
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
    ctx.fillStyle = '#03050e';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const angle = this.rotationAngle;

    // Draw beams
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(cx - Math.sin(angle) * 110, cy - Math.cos(angle) * 110);
    ctx.lineTo(cx + Math.sin(angle) * 110, cy + Math.cos(angle) * 110);
    ctx.stroke();

    // Neutron star core
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }
}
