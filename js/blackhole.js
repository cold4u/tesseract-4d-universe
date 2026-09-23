/**
 * Black Hole Physics & Cataclysmic Collision Sandbox
 * Simulates relativistic accretion, Doppler beaming, gravitational lensing,
 * and what happens when a Black Hole encounters the Sun, Earth, or Light.
 */

export class BlackHoleSimulator {
  constructor(containerElement, telemetryElement) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;
    this.scenario = 'sun'; // 'sun', 'earth', 'light'
    this.distanceAU = 5.0; // Distance in AU (10.0 to 0.1)
    this.blackHoleMass = 10; // Solar masses M_sun

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
    this.camera.position.set(0, 4.5, 14);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 25;
      this.controls.minDistance = 3;
    }

    // 1. Event Horizon (Absolute Shadow)
    const horizonGeo = new THREE.SphereGeometry(1.2, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.scene.add(this.eventHorizon);

    // 2. Photon Sphere / Einstein Ring (Lensed Light Ring)
    const photonRingGeo = new THREE.RingGeometry(1.25, 1.45, 64);
    const photonRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    this.scene.add(this.photonRing);

    // 3. Relativistic Accretion Disk (Doppler Beamed: approaching side is brighter & blue-tinted)
    const diskCount = 4500;
    const diskGeo = new THREE.BufferGeometry();
    const diskPos = new Float32Array(diskCount * 3);
    const diskColors = new Float32Array(diskCount * 3);

    this.diskData = [];
    for (let i = 0; i < diskCount; i++) {
      const radius = 1.6 + Math.pow(Math.random(), 1.5) * 4.2;
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.0 / Math.sqrt(radius)) * 0.035; // Keplerian orbital velocity

      diskPos[i * 3] = Math.cos(angle) * radius;
      diskPos[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
      diskPos[i * 3 + 2] = Math.sin(angle) * radius;

      // Base gold/amber accretion color
      diskColors[i * 3] = 1.0;
      diskColors[i * 3 + 1] = 0.6;
      diskColors[i * 3 + 2] = 0.1;

      this.diskData.push({ radius, angle, speed, y: diskPos[i * 3 + 1] });
    }

    diskGeo.setAttribute('position', new THREE.BufferAttribute(diskPos, 3));
    diskGeo.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.accretionDisk = new THREE.Points(diskGeo, diskMat);
    this.accretionDisk.rotation.x = Math.PI / 3.2; // Tilted for cinematic angle
    this.scene.add(this.accretionDisk);

    // 4. Target Body Group (Sun or Earth or Light Rays)
    this.targetGroup = new THREE.Group();
    this.scene.add(this.targetGroup);

    // 5. Plasma Stream Group (for Tidal Disruption)
    this.plasmaCount = 1500;
    const plasmaGeo = new THREE.BufferGeometry();
    const plasmaPos = new Float32Array(this.plasmaCount * 3);
    const plasmaCols = new Float32Array(this.plasmaCount * 3);
    plasmaGeo.setAttribute('position', new THREE.BufferAttribute(plasmaPos, 3));
    plasmaGeo.setAttribute('color', new THREE.BufferAttribute(plasmaCols, 3));

    const plasmaMat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.plasmaMesh = new THREE.Points(plasmaGeo, plasmaMat);
    this.scene.add(this.plasmaMesh);

    this.rebuildTargetBody();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  rebuildTargetBody() {
    const THREE = window.THREE;
    while (this.targetGroup.children.length > 0) {
      const obj = this.targetGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.targetGroup.remove(obj);
    }

    if (this.scenario === 'sun') {
      // The Sun: Bright glowing yellow sphere with corona
      const sunGeo = new THREE.SphereGeometry(0.85, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
      this.targetMesh = new THREE.Mesh(sunGeo, sunMat);

      // Corona glow
      const coronaGeo = new THREE.SphereGeometry(1.05, 32, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      this.coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      this.targetGroup.add(this.targetMesh);
      this.targetGroup.add(this.coronaMesh);
    } else if (this.scenario === 'earth') {
      // The Earth: Blue sphere with atmosphere
      const earthGeo = new THREE.SphereGeometry(0.55, 32, 32);
      const earthMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
      this.targetMesh = new THREE.Mesh(earthGeo, earthMat);

      // Atmosphere glow
      const atmoGeo = new THREE.SphereGeometry(0.68, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      this.coronaMesh = new THREE.Mesh(atmoGeo, atmoMat);
      this.targetGroup.add(this.targetMesh);
      this.targetGroup.add(this.coronaMesh);
    } else if (this.scenario === 'light') {
      // Light rays passing by black hole
      this.targetMesh = null;
      this.coronaMesh = null;
    }

    this.updateScenarioPhysics();
  }

  setScenario(type) {
    this.scenario = type;
    if (this.isThree) {
      this.rebuildTargetBody();
    }
    this.updateScenarioPhysics();
  }

  setDistance(dAU) {
    this.distanceAU = parseFloat(dAU);
    this.updateScenarioPhysics();
  }

  updateScenarioPhysics() {
    // 3D visual position maps distanceAU [0.1, 10.0] -> [1.8, 8.5]
    const visualDist = 1.5 + (this.distanceAU / 10.0) * 7.0;

    if (this.targetMesh) {
      this.targetGroup.position.set(visualDist, 0, visualDist * 0.4);

      // Spaghettification stretching effect:
      // When distance drops below Roche limit (around 2.5 AU for Sun, 1.8 AU for Earth)
      const rocheLimit = this.scenario === 'sun' ? 2.8 : 2.0;

      if (this.distanceAU < rocheLimit) {
        // Stretch target into an ellipse pointing directly at the black hole center (0,0,0)
        const stretchFactor = 1.0 + (rocheLimit - this.distanceAU) * 1.6;
        const compressFactor = Math.max(0.1, 1.0 / Math.sqrt(stretchFactor));
        this.targetMesh.scale.set(stretchFactor, compressFactor, compressFactor);
        this.targetMesh.lookAt(0, 0, 0);

        // Update plasma accretion stream
        this.updatePlasmaStream(visualDist, true);
      } else {
        this.targetMesh.scale.set(1, 1, 1);
        this.updatePlasmaStream(visualDist, false);
      }
    }

    // Telemetry text output
    this.renderTelemetry();
  }

  updatePlasmaStream(targetDist, isDisrupted) {
    if (!this.plasmaMesh) return;
    const posAttr = this.plasmaMesh.geometry.attributes.position;
    const colAttr = this.plasmaMesh.geometry.attributes.color;

    if (!isDisrupted) {
      this.plasmaMesh.visible = false;
      return;
    }

    this.plasmaMesh.visible = true;
    const count = this.plasmaCount;

    for (let i = 0; i < count; i++) {
      const t = i / count; // 0 at target body, 1 at event horizon
      const spiralTurns = 3.5 * t;
      const r = targetDist * (1 - t) + 1.4 * t;
      const angle = spiralTurns * Math.PI * 2;

      posAttr.array[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 0.15;
      posAttr.array[i * 3 + 1] = (Math.random() - 0.5) * 0.18;
      posAttr.array[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.15;

      // Color gets hotter / brighter as plasma approaches black hole
      colAttr.array[i * 3] = 1.0;
      colAttr.array[i * 3 + 1] = 0.4 + 0.6 * t; // white-hot near event horizon
      colAttr.array[i * 3 + 2] = 0.1 + 0.8 * t;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  renderTelemetry() {
    if (!this.telemetryElem) return;

    const d = this.distanceAU;
    const M = this.blackHoleMass;
    const rsKm = (2 * 6.674e-11 * M * 1.989e30) / Math.pow(299792458, 2) / 1000;

    let status = '';
    let badgeClass = 'status-nominal';

    if (this.scenario === 'sun') {
      if (d > 5.0) {
        status = `The Sun is in an unperturbed orbital approach at ${d.toFixed(1)} AU. Solar flares are mildly active.`;
      } else if (d > 2.8) {
        status = `WARNING: Extreme gravitational tides detected. Solar corona expanding rapidly toward the singularity.`;
        badgeClass = 'status-warning';
      } else if (d > 1.0) {
        status = `CRITICAL: ROCHE LIMIT BREACHED. Tidal disruption event in progress! The Sun is being spaghettified into a massive glowing plasma accretion stream.`;
        badgeClass = 'status-critical';
      } else {
        status = `TERMINAL ENGULFMENT: Over 75% of the Sun's mass has been swallowed by the black hole. High-energy X-ray relativistic jets erupt!`;
        badgeClass = 'status-critical';
      }
    } else if (this.scenario === 'earth') {
      if (d > 4.0) {
        status = `Earth is experiencing subtle orbital precession at ${d.toFixed(1)} AU. Climate disrupted.`;
      } else if (d > 2.0) {
        status = `GLOBAL CATACLYSM: Atmosphere stripped into space; tectonic plates buckling under tidal stresses.`;
        badgeClass = 'status-warning';
      } else {
        status = `PLANETARY DESTRUCTION: Earth crosses the Roche limit. The planet is crushed and shredded into a molten ring of debris.`;
        badgeClass = 'status-critical';
      }
    } else {
      status = `Gravitational Lensing: Starlight passing within distance ${d.toFixed(1)} AU is deflected by angle θ = 4GM/(c²b), forming a complete Einstein Ring around the photon sphere!`;
      badgeClass = 'status-nominal';
    }

    this.telemetryElem.innerHTML = `
      <div class="bh-hud-status ${badgeClass}">
        <span class="hud-indicator-dot"></span> ${status}
      </div>
      <div class="bh-metrics-grid">
        <div class="bh-metric-item">
          <span class="metric-title">Event Horizon Radius (rₛ)</span>
          <span class="metric-value">${rsKm.toFixed(1)} km</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Approach Distance</span>
          <span class="metric-value">${d.toFixed(2)} AU (${(d * 149.6).toFixed(1)}M km)</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Tidal Gravity Differential</span>
          <span class="metric-value">${(100 / Math.pow(d, 3)).toFixed(1)}× G-Limit</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Accretion Disk Temp</span>
          <span class="metric-value">${(d < 2.8 ? 12.4 : 1.2).toFixed(1)} Million K</span>
        </div>
      </div>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isThree) {
      // Accretion disk Keplerian orbital motion
      if (this.accretionDisk) {
        const posAttr = this.accretionDisk.geometry.attributes.position;
        const colAttr = this.accretionDisk.geometry.attributes.color;

        for (let i = 0; i < this.diskData.length; i++) {
          const item = this.diskData[i];
          item.angle += item.speed;

          const x = Math.cos(item.angle) * item.radius;
          const z = Math.sin(item.angle) * item.radius;

          posAttr.array[i * 3] = x;
          posAttr.array[i * 3 + 2] = z;

          // Relativistic Doppler Beaming:
          // Stars/plasma moving toward observer (z > 0 with positive dx/dt) appear brighter and blue-shifted
          const velocityTowardsViewer = -Math.sin(item.angle);
          if (velocityTowardsViewer > 0) {
            colAttr.array[i * 3] = 0.4;
            colAttr.array[i * 3 + 1] = 0.8;
            colAttr.array[i * 3 + 2] = 1.0; // Blue shifted
          } else {
            colAttr.array[i * 3] = 1.0;
            colAttr.array[i * 3 + 1] = 0.3;
            colAttr.array[i * 3 + 2] = 0.05; // Red shifted
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      // Keep photon ring facing camera
      if (this.photonRing) {
        this.photonRing.lookAt(this.camera.position);
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
    this.angle = 0;
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
    this.angle += 0.02;

    // Glowing accretion disk
    const diskGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 120);
    diskGrad.addColorStop(0, '#ffffff');
    diskGrad.addColorStop(0.3, '#ffaa00');
    diskGrad.addColorStop(0.8, '#ff3300');
    diskGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 130, 45, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Event Horizon Shadow
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fill();

    // Target object
    const targetX = cx + (this.distanceAU / 10.0) * 160;
    ctx.fillStyle = this.scenario === 'sun' ? '#ffcc00' : '#00aaff';
    ctx.beginPath();
    ctx.arc(targetX, cy, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}
