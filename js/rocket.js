/**
 * 3D Multi-Stage Rocket with Interactive Exploded View
 * Features procedural 3D rocket stages, engines, tanks, and a 0-100% disassembly slider.
 */

export class RocketExplodedViewer {
  constructor(containerElement, telemetryElement) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;
    this.explodeFactor = 0.0; // 0.0 to 1.0
    this.selectedStage = 'all';

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
    this.camera.position.set(0, 1.5, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 35;
      this.controls.minDistance = 5;
      this.controls.target.set(0, 1.0, 0);
    }

    // Studio / Cosmic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f3ff, 1.2);
    keyLight.position.set(10, 15, 10);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xff007f, 0.8);
    fillLight.position.set(-10, -5, -10);
    this.scene.add(fillLight);

    // Rocket Root Group
    this.rocketGroup = new THREE.Group();
    this.scene.add(this.rocketGroup);

    // Build Modular Stages
    this.buildRocketStages();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const nw = this.container.clientWidth;
      const nh = this.container.clientHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });

    this.updateExplodedPositions();
  }

  buildRocketStages() {
    const THREE = window.THREE;

    // Materials
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.25
    });

    const darkHullMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.3
    });

    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.95,
      roughness: 0.2
    });

    const goldProbeMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.9,
      roughness: 0.1
    });

    // 1. Stage 1 Booster Engines Cluster (Bottom)
    this.partBoosterEngines = new THREE.Group();
    this.partBoosterEngines.userData = { basePosY: -4.5, explodeOffsetY: -3.5, name: 'Booster Engine Cluster' };

    // Central engine + 4 outer engines
    const nozzleGeo = new THREE.ConeGeometry(0.35, 0.9, 16, 1, true);
    for (let i = 0; i < 5; i++) {
      const nozzle = new THREE.Mesh(nozzleGeo, engineMat);
      if (i > 0) {
        const a = ((i - 1) * Math.PI) / 2;
        nozzle.position.set(Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7);
      }
      this.partBoosterEngines.add(nozzle);
    }
    this.rocketGroup.add(this.partBoosterEngines);

    // 2. Stage 1 Main Propellant Tanks (Booster Core)
    this.partStage1Tank = new THREE.Group();
    this.partStage1Tank.userData = { basePosY: -1.8, explodeOffsetY: -1.5, name: 'Stage 1 Booster Core (LOX/RP-1)' };

    const tank1Geo = new THREE.CylinderGeometry(1.2, 1.2, 4.5, 32);
    const tank1Mesh = new THREE.Mesh(tank1Geo, hullMat);
    this.partStage1Tank.add(tank1Mesh);

    // Grid fins for reentry stability
    const finGeo = new THREE.BoxGeometry(0.8, 0.08, 0.4);
    for (let f = 0; f < 4; f++) {
      const fin = new THREE.Mesh(finGeo, darkHullMat);
      const angle = (f * Math.PI) / 2;
      fin.position.set(Math.cos(angle) * 1.45, 1.8, Math.sin(angle) * 1.45);
      fin.rotation.y = angle;
      this.partStage1Tank.add(fin);
    }
    this.rocketGroup.add(this.partStage1Tank);

    // 3. Interstage Assembly (Lattice separator)
    this.partInterstage = new THREE.Group();
    this.partInterstage.userData = { basePosY: 0.8, explodeOffsetY: 0.2, name: 'Interstage Ring' };

    const interGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 24, 1, true);
    const interMesh = new THREE.Mesh(interGeo, darkHullMat);
    this.partInterstage.add(interMesh);
    this.rocketGroup.add(this.partInterstage);

    // 4. Stage 2 (Upper In-Space Stage + Vacuum Engine)
    this.partStage2 = new THREE.Group();
    this.partStage2.userData = { basePosY: 2.2, explodeOffsetY: 1.8, name: 'Stage 2 In-Space Cryogenic Engine' };

    const tank2Geo = new THREE.CylinderGeometry(1.15, 1.15, 2.0, 32);
    const tank2Mesh = new THREE.Mesh(tank2Geo, hullMat);
    this.partStage2.add(tank2Mesh);

    // Vacuum Engine (Large bell nozzle)
    const vacNozzleGeo = new THREE.ConeGeometry(0.55, 1.1, 24, 1, true);
    const vacNozzle = new THREE.Mesh(vacNozzleGeo, engineMat);
    vacNozzle.position.y = -1.4;
    this.partStage2.add(vacNozzle);
    this.rocketGroup.add(this.partStage2);

    // 5. Scientific Payload: Interplanetary Deep Space Probe (Voyager-style)
    this.partPayload = new THREE.Group();
    this.partPayload.userData = { basePosY: 3.8, explodeOffsetY: 3.6, name: 'Deep Space Scientific Probe' };

    // Gold foil satellite body
    const probeBodyGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const probeBody = new THREE.Mesh(probeBodyGeo, goldProbeMat);
    this.partPayload.add(probeBody);

    // High-Gain Parabolic Dish Antenna
    const dishGeo = new THREE.SphereGeometry(0.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 0.75, 0);
    dish.rotation.x = Math.PI;
    this.partPayload.add(dish);
    this.rocketGroup.add(this.partPayload);

    // 6. Payload Fairings (Left & Right halves)
    this.partFairingLeft = new THREE.Group();
    this.partFairingLeft.userData = { basePosY: 4.6, explodeOffsetY: 5.5, explodeSideX: -1.8, name: 'Payload Fairing (Port)' };

    this.partFairingRight = new THREE.Group();
    this.partFairingRight.userData = { basePosY: 4.6, explodeOffsetY: 5.5, explodeSideX: 1.8, name: 'Payload Fairing (Starboard)' };

    // Half-cone fairings
    const fairingGeoLeft = new THREE.ConeGeometry(1.25, 2.8, 32, 1, false, 0, Math.PI);
    const fairingGeoRight = new THREE.ConeGeometry(1.25, 2.8, 32, 1, false, Math.PI, Math.PI);

    const fairingMeshLeft = new THREE.Mesh(fairingGeoLeft, hullMat);
    const fairingMeshRight = new THREE.Mesh(fairingGeoRight, hullMat);

    this.partFairingLeft.add(fairingMeshLeft);
    this.partFairingRight.add(fairingMeshRight);

    this.rocketGroup.add(this.partFairingLeft);
    this.rocketGroup.add(this.partFairingRight);
  }

  setExplode(factor) {
    this.explodeFactor = Math.max(0, Math.min(1, parseFloat(factor)));
    this.updateExplodedPositions();
  }

  updateExplodedPositions() {
    if (!this.rocketGroup) return;

    const t = this.explodeFactor;
    const stages = [
      this.partBoosterEngines,
      this.partStage1Tank,
      this.partInterstage,
      this.partStage2,
      this.partPayload,
      this.partFairingLeft,
      this.partFairingRight
    ];

    stages.forEach(stage => {
      if (!stage) return;
      const d = stage.userData;
      // Vertical translation
      stage.position.y = d.basePosY + (d.explodeOffsetY || 0) * t;

      // Lateral fairing opening
      if (d.explodeSideX) {
        stage.position.x = d.explodeSideX * t;
      }
    });

    this.renderTelemetry();
  }

  selectStage(stageKey) {
    this.selectedStage = stageKey;
    this.renderTelemetry();
  }

  renderTelemetry() {
    if (!this.telemetryElem) return;

    let title = 'Complete Deep Space Launch Vehicle';
    let thrust = '7.5 Million lbf (33,400 kN)';
    let isp = '311 s (Sea Level) / 348 s (Vacuum)';
    let fuel = 'Liquid Oxygen (LOX) + Refined Kerosene (RP-1)';
    let missionRole = 'Heavy-lift trans-planetary insertion booster capable of sending robotic explorers to the outer Solar System and interstellar space.';

    if (this.explodeFactor > 0.1) {
      title = `Vehicle in Exploded Disassembly (${Math.round(this.explodeFactor * 100)}% Separation)`;
    }

    this.telemetryElem.innerHTML = `
      <div class="bh-hud-status status-nominal">
        <span class="hud-indicator-dot"></span> <strong>${title}</strong>
      </div>
      <div class="bh-metrics-grid">
        <div class="bh-metric-item">
          <span class="metric-title">Booster Thrust</span>
          <span class="metric-value">${thrust}</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Specific Impulse (Iₛₚ)</span>
          <span class="metric-value">${isp}</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Propellant Chemistry</span>
          <span class="metric-value">${fuel}</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Payload Capacity</span>
          <span class="metric-value">64,000 kg (LEO) / 16,800 kg (Mars)</span>
        </div>
      </div>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.8rem; line-height: 1.5;">
        ${missionRole}
      </p>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.isThree) {
      if (this.rocketGroup) {
        this.rocketGroup.rotation.y += 0.003;
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
    const t = this.explodeFactor;

    // Draw schematic rocket stages
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 20, cy - 80 - t * 40, 40, 50); // Payload
    ctx.fillRect(cx - 25, cy - 20 - t * 20, 50, 40); // Stage 2
    ctx.fillRect(cx - 30, cy + 30 + t * 20, 60, 80); // Stage 1
  }
}
