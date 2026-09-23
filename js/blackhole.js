/**
 * Realistic Black Hole & Celestial Cataclysm Simulator
 * Features Gargantua-style warped gravitational lensing, relativistic Doppler accretion disk,
 * polar relativistic jets, and an automated multi-phase Spaghettification / Collision sequence.
 */

export class BlackHoleSimulator {
  constructor(containerElement, telemetryElement) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;

    this.scenario = 'sun'; // 'sun', 'earth', 'light'
    this.distanceAU = 8.0; // 10.0 (distant) down to 0.2 (swallowed)
    this.blackHoleMass = 10; // M_sun

    // Cinematic Animation State
    this.isPlaying = false;
    this.simProgress = 0.0; // 0.0 (start at 10 AU) to 1.0 (swallowed at 0.2 AU)
    this.simSpeed = 0.003; // progress increment per frame

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
    this.camera.position.set(0, 3.8, 14.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 26;
      this.controls.minDistance = 3.5;
    }

    // 1. Event Horizon Shadow (True Black Sphere)
    const horizonGeo = new THREE.SphereGeometry(1.25, 48, 48);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.scene.add(this.eventHorizon);

    // 2. Photon Sphere Ring (Einstein Ring around shadow)
    const photonRingGeo = new THREE.RingGeometry(1.28, 1.48, 64);
    const photonRingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.photonRing = new THREE.Mesh(photonRingGeo, photonRingMat);
    this.scene.add(this.photonRing);

    // 3. Real Gargantua-Style Gravitational Lensed Disk:
    // A. Horizontal equatorial accretion disk
    // B. Vertical warped light ring (light from back of disk bent up and over the top/bottom!)
    this.buildGargantuaAccretionDisk();

    // 4. Relativistic Polar Jets (Active during high accretion / tidal disruption)
    this.buildRelativisticJets();

    // 5. Target Celestial Body (Sun or Earth)
    this.targetGroup = new THREE.Group();
    this.scene.add(this.targetGroup);

    // 6. Spaghettified Plasma Accretion Stream Ribbon
    this.buildPlasmaStream();

    this.rebuildTargetBody();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const nw = this.container.clientWidth;
      const nh = this.container.clientHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });
  }

  buildGargantuaAccretionDisk() {
    const THREE = window.THREE;
    this.diskGroup = new THREE.Group();

    // Part A: Main Horizontal Equatorial Accretion Disk (3,500 particles)
    const countH = 3500;
    const geoH = new THREE.BufferGeometry();
    const posH = new Float32Array(countH * 3);
    const colH = new Float32Array(countH * 3);

    this.diskParticlesH = [];
    for (let i = 0; i < countH; i++) {
      const radius = 1.65 + Math.pow(Math.random(), 1.4) * 4.2;
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.0 / Math.sqrt(radius)) * 0.038;

      posH[i * 3] = Math.cos(angle) * radius;
      posH[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      posH[i * 3 + 2] = Math.sin(angle) * radius;

      // Golden white inner, fiery orange outer
      const t = (radius - 1.65) / 4.2;
      colH[i * 3] = 1.0;
      colH[i * 3 + 1] = 0.85 - t * 0.45;
      colH[i * 3 + 2] = 0.3 - t * 0.25;

      this.diskParticlesH.push({ radius, angle, speed, y: posH[i * 3 + 1] });
    }

    geoH.setAttribute('position', new THREE.BufferAttribute(posH, 3));
    geoH.setAttribute('color', new THREE.BufferAttribute(colH, 3));

    const matH = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    this.diskMeshH = new THREE.Points(geoH, matH);
    this.diskGroup.add(this.diskMeshH);

    // Part B: Gravitationally Lensed Vertical Halo (Iconic Gargantua halo arching over the top)
    const countV = 1600;
    const geoV = new THREE.BufferGeometry();
    const posV = new Float32Array(countV * 3);
    const colV = new Float32Array(countV * 3);

    for (let i = 0; i < countV; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.55 + Math.pow(Math.random(), 1.6) * 3.2;
      posV[i * 3] = Math.cos(angle) * r;
      posV[i * 3 + 1] = Math.sin(angle) * r;
      posV[i * 3 + 2] = (Math.random() - 0.5) * 0.25;

      colV[i * 3] = 1.0;
      colV[i * 3 + 1] = 0.65;
      colV[i * 3 + 2] = 0.15;
    }
    geoV.setAttribute('position', new THREE.BufferAttribute(posV, 3));
    geoV.setAttribute('color', new THREE.BufferAttribute(colV, 3));

    const matV = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.diskMeshV = new THREE.Points(geoV, matV);
    this.diskGroup.add(this.diskMeshV);

    this.diskGroup.rotation.x = Math.PI / 3.4; // Cinematic tilt angle
    this.scene.add(this.diskGroup);
  }

  buildRelativisticJets() {
    const THREE = window.THREE;
    this.jetsGroup = new THREE.Group();

    // Twin cones shooting out vertically along rotational poles
    const jetGeo = new THREE.ConeGeometry(0.8, 12, 32, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0, // Becomes intense during high accretion / tidal disruption
      blending: THREE.AdditiveBlending
    });

    this.northJet = new THREE.Mesh(jetGeo, jetMat);
    this.northJet.position.y = 6.8;

    this.southJet = new THREE.Mesh(jetGeo, jetMat.clone());
    this.southJet.position.y = -6.8;
    this.southJet.rotation.x = Math.PI;

    this.jetsGroup.add(this.northJet);
    this.jetsGroup.add(this.southJet);
    this.scene.add(this.jetsGroup);
  }

  buildPlasmaStream() {
    const THREE = window.THREE;
    this.streamCount = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.streamCount * 3);
    const cols = new Float32Array(this.streamCount * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.plasmaMesh = new THREE.Points(geo, mat);
    this.scene.add(this.plasmaMesh);
  }

  rebuildTargetBody() {
    const THREE = window.THREE;
    while (this.targetGroup.children.length > 0) {
      const obj = this.targetGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.targetGroup.remove(obj);
    }

    if (this.scenario === 'sun') {
      // The Sun: Bright fiery yellow sphere
      const sunGeo = new THREE.SphereGeometry(0.85, 32, 32);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
      this.targetMesh = new THREE.Mesh(sunGeo, sunMat);

      // Corona glow
      const coronaGeo = new THREE.SphereGeometry(1.15, 32, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      this.coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      this.targetGroup.add(this.targetMesh);
      this.targetGroup.add(this.coronaMesh);
    } else if (this.scenario === 'earth') {
      // The Earth: Vibrant blue & clouds
      const earthGeo = new THREE.SphereGeometry(0.55, 32, 32);
      const earthMat = new THREE.MeshBasicMaterial({ color: 0x0077ff });
      this.targetMesh = new THREE.Mesh(earthGeo, earthMat);

      // Atmosphere glow
      const atmoGeo = new THREE.SphereGeometry(0.72, 32, 32);
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
      this.targetMesh = null;
      this.coronaMesh = null;
    }

    this.updateScenarioPhysics();
  }

  setScenario(type) {
    this.scenario = type;
    this.resetSimulation();
    if (this.isThree) {
      this.rebuildTargetBody();
    }
  }

  setDistance(dAU) {
    this.distanceAU = parseFloat(dAU);
    this.simProgress = (10.0 - this.distanceAU) / 9.8;
    this.updateScenarioPhysics();
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    return this.isPlaying;
  }

  resetSimulation() {
    this.isPlaying = false;
    this.simProgress = 0.0;
    this.distanceAU = 10.0;
    this.updateScenarioPhysics();
  }

  updateScenarioPhysics() {
    // Maps distanceAU [10.0, 0.2] to 3D visual position [9.2, 1.4]
    const visualDist = 1.3 + (this.distanceAU / 10.0) * 7.8;
    // Spiral orbital trajectory
    const orbitalAngle = (1.0 - this.distanceAU / 10.0) * Math.PI * 3.5;

    if (this.targetMesh) {
      const posX = Math.cos(orbitalAngle) * visualDist;
      const posZ = Math.sin(orbitalAngle) * visualDist;
      this.targetGroup.position.set(posX, 0, posZ);

      // Roche Tidal Disruption Radius
      // For Sun: ~2.8 AU; for Earth: ~2.0 AU
      const rocheLimit = this.scenario === 'sun' ? 3.0 : 2.2;

      if (this.distanceAU < rocheLimit) {
        // Severe Spaghettification!
        const severity = (rocheLimit - this.distanceAU) / rocheLimit; // 0 to 1
        const stretchX = 1.0 + severity * 3.5; // Stretched along radial line
        const compressYZ = Math.max(0.08, 1.0 - severity * 0.85);

        this.targetMesh.scale.set(stretchX, compressYZ, compressYZ);
        this.targetMesh.lookAt(0, 0, 0);

        // Fade target body as mass is pulled away into the stream
        if (this.targetMesh.material) {
          this.targetMesh.material.opacity = Math.max(0.1, 1.0 - severity * 0.9);
          this.targetMesh.material.transparent = true;
        }

        // Activate relativistic plasma stream
        this.updatePlasmaStream(visualDist, orbitalAngle, severity);

        // Ignite polar relativistic jets as mass fuels the black hole
        const jetIntensity = Math.min(0.85, severity * 1.4);
        if (this.northJet) this.northJet.material.opacity = jetIntensity;
        if (this.southJet) this.southJet.material.opacity = jetIntensity;
      } else {
        // Normal spherical body
        this.targetMesh.scale.set(1, 1, 1);
        if (this.targetMesh.material) {
          this.targetMesh.material.opacity = 1.0;
          this.targetMesh.material.transparent = false;
        }
        if (this.plasmaMesh) this.plasmaMesh.visible = false;
        if (this.northJet) this.northJet.material.opacity = 0.0;
        if (this.southJet) this.southJet.material.opacity = 0.0;
      }
    }

    this.renderTelemetry();
  }

  updatePlasmaStream(startDist, startAngle, severity) {
    if (!this.plasmaMesh) return;
    this.plasmaMesh.visible = true;

    const posAttr = this.plasmaMesh.geometry.attributes.position;
    const colAttr = this.plasmaMesh.geometry.attributes.color;
    const count = this.streamCount;

    // Logarithmic Keplerian spiral stream wrapping from target into event horizon
    for (let i = 0; i < count; i++) {
      const t = i / count; // 0 at body, 1 at event horizon
      const r = startDist * (1 - t) + 1.4 * t;
      const spiralWinding = startAngle + t * Math.PI * 4.2;

      // Scatter spread increases as it wraps
      const spread = 0.08 + t * 0.18;
      const x = Math.cos(spiralWinding) * r + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.8;
      const z = Math.sin(spiralWinding) * r + (Math.random() - 0.5) * spread;

      posAttr.array[i * 3] = x;
      posAttr.array[i * 3 + 1] = y;
      posAttr.array[i * 3 + 2] = z;

      // Color temperature gets blinding white-hot near event horizon
      if (t > 0.6) {
        colAttr.array[i * 3] = 1.0;
        colAttr.array[i * 3 + 1] = 0.95;
        colAttr.array[i * 3 + 2] = 0.9; // White-hot plasma
      } else {
        colAttr.array[i * 3] = 1.0;
        colAttr.array[i * 3 + 1] = this.scenario === 'sun' ? 0.6 : 0.4;
        colAttr.array[i * 3 + 2] = 0.1;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  renderTelemetry() {
    if (!this.telemetryElem) return;

    const d = this.distanceAU;
    const M = this.blackHoleMass;
    const rsKm = (2 * 6.674e-11 * M * 1.989e30) / Math.pow(299792458, 2) / 1000;

    let phaseTitle = 'Phase 1: Gravitational Capture';
    let phaseDesc = '';
    let badgeClass = 'status-nominal';

    if (this.scenario === 'sun') {
      if (d > 5.5) {
        phaseTitle = 'Phase 1: Gravitational Capture';
        phaseDesc = `The Sun enters the black hole's gravity well at ${d.toFixed(1)} AU. Solar orbits begin warping.`;
      } else if (d > 3.0) {
        phaseTitle = 'Phase 2: Extreme Tidal Stretching';
        phaseDesc = `Massive solar coronal mass ejections erupt. Differential gravity pulls the facing hemisphere faster.`;
        badgeClass = 'status-warning';
      } else if (d > 1.4) {
        phaseTitle = 'Phase 3: Roche Limit Rupture (Spaghettification)';
        phaseDesc = `CRITICAL: The Sun's self-gravity is completely overwhelmed! Solar plasma is pulled into a continuous swirling relativistic accretion ribbon!`;
        badgeClass = 'status-critical';
      } else {
        phaseTitle = 'Phase 4: Terminal Accretion & Relativistic Jets';
        phaseDesc = `CATASTROPHIC ACCRETION: Solar core swallowed past event horizon. Twin relativistic particle jets blast out from the poles at 99.8% the speed of light!`;
        badgeClass = 'status-critical';
      }
    } else if (this.scenario === 'earth') {
      if (d > 4.5) {
        phaseTitle = 'Phase 1: Orbital Disruption';
        phaseDesc = `Earth is pulled from the Habitable Zone at ${d.toFixed(1)} AU. Extreme climate chaos begins.`;
      } else if (d > 2.2) {
        phaseTitle = 'Phase 2: Atmospheric Stripping';
        phaseDesc = `Atmosphere and oceans are ripped away into space; tectonic plates buckle into global volcanic rifts.`;
        badgeClass = 'status-warning';
      } else {
        phaseTitle = 'Phase 3: Total Planetary Shredding';
        phaseDesc = `ROCHE LIMIT BREACHED: The Earth is crushed and shredded into a ring of molten rubble before vanishing past the event horizon.`;
        badgeClass = 'status-critical';
      }
    } else {
      phaseTitle = 'Gravitational Lensing & Light Bending';
      phaseDesc = `General Relativity in action: Light rays passing at ${d.toFixed(1)} AU bend by angle θ = 4GM/(c²b), creating complete Einstein rings and double distorted images!`;
    }

    this.telemetryElem.innerHTML = `
      <div class="bh-hud-status ${badgeClass}">
        <span class="hud-indicator-dot"></span>
        <div>
          <div style="font-weight: 800; font-size: 0.88rem;">${phaseTitle}</div>
          <div style="font-size: 0.8rem; margin-top: 0.2rem;">${phaseDesc}</div>
        </div>
      </div>
      <div class="bh-metrics-grid">
        <div class="bh-metric-item">
          <span class="metric-title">Event Horizon (rₛ)</span>
          <span class="metric-value">${rsKm.toFixed(1)} km</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Distance (AU)</span>
          <span class="metric-value">${d.toFixed(2)} AU (${(d * 149.6).toFixed(1)}M km)</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Tidal Force</span>
          <span class="metric-value">${(250 / Math.pow(Math.max(0.5, d), 3)).toFixed(0)}× Earth Normal</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Relativistic Jets</span>
          <span class="metric-value" style="color: ${d < 2.5 ? '#00f3ff' : '#64748b'};">${d < 2.5 ? 'Active (0.998 c)' : 'Dormant'}</span>
        </div>
      </div>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Automated Collision Progression
    if (this.isPlaying) {
      this.simProgress += this.simSpeed;
      if (this.simProgress >= 1.0) {
        this.simProgress = 1.0;
        this.isPlaying = false;
      }
      this.distanceAU = 10.0 - this.simProgress * 9.8; // 10.0 down to 0.2
      this.updateScenarioPhysics();

      // Update external UI slider
      const slider = document.getElementById('slider-bh-distance');
      const valDisp = document.getElementById('val-bh-distance');
      if (slider) slider.value = this.distanceAU.toFixed(1);
      if (valDisp) valDisp.textContent = this.distanceAU.toFixed(1) + ' AU';
    }

    if (this.isThree) {
      // Rotate accretion disk particles with Keplerian motion
      if (this.diskMeshH) {
        const posAttr = this.diskMeshH.geometry.attributes.position;
        const colAttr = this.diskMeshH.geometry.attributes.color;

        for (let i = 0; i < this.diskParticlesH.length; i++) {
          const item = this.diskParticlesH[i];
          item.angle += item.speed;

          posAttr.array[i * 3] = Math.cos(item.angle) * item.radius;
          posAttr.array[i * 3 + 2] = Math.sin(item.angle) * item.radius;

          // Doppler beaming: approaching side is brighter & blue-shifted
          const vToward = -Math.sin(item.angle);
          if (vToward > 0) {
            colAttr.array[i * 3] = 0.5;
            colAttr.array[i * 3 + 1] = 0.85;
            colAttr.array[i * 3 + 2] = 1.0;
          } else {
            colAttr.array[i * 3] = 1.0;
            colAttr.array[i * 3 + 1] = 0.4;
            colAttr.array[i * 3 + 2] = 0.05;
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      // Rotate vertical warped halo slowly
      if (this.diskMeshV) {
        this.diskMeshV.rotation.z += 0.003;
      }

      // Face photon ring to camera
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

    // Glowing Gargantua accretion halo
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 140, 50, 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Event horizon
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.fill();

    // Target body
    const dFactor = this.distanceAU / 10.0;
    const tx = cx + dFactor * 160;
    ctx.fillStyle = this.scenario === 'sun' ? '#ffe600' : '#00f3ff';
    ctx.beginPath();
    ctx.arc(tx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}
