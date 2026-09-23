/**
 * Movie-Grade "Interstellar Gargantua" Black Hole & Tidal Disruption Engine
 * Implements realistic gravitational lensing (warped accretion disk arching above and below),
 * relativistic Doppler beaming, photon sphere caustic rings, and a fluid solar spaghettification ribbon.
 */

export class BlackHoleSimulator {
  constructor(containerElement, telemetryElement) {
    this.container = containerElement;
    this.telemetryElem = telemetryElement;

    this.scenario = 'sun'; // 'sun', 'earth', 'light'
    this.distanceAU = 8.5; // 10.0 (distant) down to 0.2 (consumed)
    this.blackHoleMass = 10; // M_sun

    // Cinematic Animation State
    this.isPlaying = false;
    this.simProgress = 0.0;
    this.simSpeed = 0.0028;
    this.time = 0;

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
    this.camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 1000);
    this.camera.position.set(0, 3.2, 14.8);

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
      this.controls.maxDistance = 28;
      this.controls.minDistance = 3.2;
    }

    // Distant background starfield for gravitational lensing context
    this.buildLensedBackgroundStars();

    // 1. Central Event Horizon (Absolute Vacuum Shadow)
    const horizonGeo = new THREE.SphereGeometry(1.32, 64, 64);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.eventHorizon = new THREE.Mesh(horizonGeo, horizonMat);
    this.scene.add(this.eventHorizon);

    // 2. Razor-Sharp Photon Sphere Ring (Einstein Ring at r = 1.5 rs)
    const photonGeo = new THREE.RingGeometry(1.36, 1.48, 128);
    const photonMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending
    });
    this.photonRing = new THREE.Mesh(photonGeo, photonMat);
    this.scene.add(this.photonRing);

    // 3. Movie-Grade Gargantua Accretion Disk System (Equatorial + Gravitational Warped Arches)
    this.buildGargantuaSystem();

    // 4. Relativistic Polar Jet Cones
    this.buildRelativisticJets();

    // 5. Target Celestial Body (Sun / Earth)
    this.targetGroup = new THREE.Group();
    this.scene.add(this.targetGroup);

    // 6. Fluid Spaghettification Ribbon (3,500 High-Density Plasma Particles)
    this.buildSpaghettificationRibbon();

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

  buildLensedBackgroundStars() {
    const THREE = window.THREE;
    const starCount = 1800;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const cols = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const r = 35 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      cols[i * 3] = 0.8 + Math.random() * 0.2;
      cols[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      cols[i * 3 + 2] = 1.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });
    this.backgroundStars = new THREE.Points(geo, mat);
    this.scene.add(this.backgroundStars);
  }

  buildGargantuaSystem() {
    const THREE = window.THREE;
    this.gargantuaGroup = new THREE.Group();

    // A. Main Equatorial Accretion Disk (4,000 Keplerian particles)
    const countDisk = 4500;
    const geoDisk = new THREE.BufferGeometry();
    const posDisk = new Float32Array(countDisk * 3);
    const colDisk = new Float32Array(countDisk * 3);

    this.diskParticles = [];
    for (let i = 0; i < countDisk; i++) {
      const r = 1.7 + Math.pow(Math.random(), 1.6) * 4.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.0 / Math.sqrt(r)) * 0.042;

      posDisk[i * 3] = Math.cos(angle) * r;
      posDisk[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      posDisk[i * 3 + 2] = Math.sin(angle) * r;

      this.diskParticles.push({ radius: r, angle: angle, speed: speed, y: posDisk[i * 3 + 1] });

      // Fiery plasma color gradient (White-hot inner, blazing gold-orange outer)
      const t = (r - 1.7) / 4.5;
      colDisk[i * 3] = 1.0;
      colDisk[i * 3 + 1] = Math.max(0.2, 0.95 - t * 0.65);
      colDisk[i * 3 + 2] = Math.max(0.05, 0.5 - t * 0.45);
    }

    geoDisk.setAttribute('position', new THREE.BufferAttribute(posDisk, 3));
    geoDisk.setAttribute('color', new THREE.BufferAttribute(colDisk, 3));

    const matDisk = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    this.equatorialDisk = new THREE.Points(geoDisk, matDisk);
    this.gargantuaGroup.add(this.equatorialDisk);

    // B. Iconic Gravitational Lensing Arch (The disk behind the hole bent OVER the top)
    const countArch = 2500;
    const geoArch = new THREE.BufferGeometry();
    const posArch = new Float32Array(countArch * 3);
    const colArch = new Float32Array(countArch * 3);

    this.archParticles = [];
    for (let i = 0; i < countArch; i++) {
      // Semicircular arch over the top and bottom
      const isTop = Math.random() > 0.4;
      const angle = isTop ? (Math.random() * Math.PI) : (Math.PI + Math.random() * Math.PI);
      const r = 1.65 + Math.pow(Math.random(), 1.5) * 3.8;
      const speed = (1.0 / Math.sqrt(r)) * 0.035;

      posArch[i * 3] = Math.cos(angle) * r;
      posArch[i * 3 + 1] = Math.sin(angle) * r;
      posArch[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      this.archParticles.push({ radius: r, angle: angle, speed: speed, isTop: isTop });

      const t = (r - 1.65) / 3.8;
      colArch[i * 3] = 1.0;
      colArch[i * 3 + 1] = Math.max(0.3, 0.85 - t * 0.55);
      colArch[i * 3 + 2] = Math.max(0.05, 0.35 - t * 0.3);
    }

    geoArch.setAttribute('position', new THREE.BufferAttribute(posArch, 3));
    geoArch.setAttribute('color', new THREE.BufferAttribute(colArch, 3));

    const matArch = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending
    });
    this.lensedArchMesh = new THREE.Points(geoArch, matArch);
    this.gargantuaGroup.add(this.lensedArchMesh);

    // Tilted at the signature cinematic Interstellar 65° inclination
    this.gargantuaGroup.rotation.x = Math.PI / 3.2;
    this.scene.add(this.gargantuaGroup);
  }

  buildRelativisticJets() {
    const THREE = window.THREE;
    this.jetsGroup = new THREE.Group();

    const jetGeo = new THREE.ConeGeometry(1.1, 14, 32, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    this.northJet = new THREE.Mesh(jetGeo, jetMat);
    this.northJet.position.y = 7.5;

    this.southJet = new THREE.Mesh(jetGeo, jetMat.clone());
    this.southJet.position.y = -7.5;
    this.southJet.rotation.x = Math.PI;

    this.jetsGroup.add(this.northJet);
    this.jetsGroup.add(this.southJet);
    this.scene.add(this.jetsGroup);
  }

  buildSpaghettificationRibbon() {
    const THREE = window.THREE;
    this.streamCount = 3500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(this.streamCount * 3);
    const cols = new Float32Array(this.streamCount * 3);

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending
    });
    this.plasmaRibbon = new THREE.Points(geo, mat);
    this.scene.add(this.plasmaRibbon);
  }

  rebuildTargetBody() {
    const THREE = window.THREE;
    while (this.targetGroup.children.length > 0) {
      const obj = this.targetGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.targetGroup.remove(obj);
    }

    if (this.scenario === 'sun') {
      // The Sun: Multi-layered blazing yellow-orange star with volumetric corona
      const sunGeo = new THREE.SphereGeometry(0.9, 48, 48);
      const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      this.targetMesh = new THREE.Mesh(sunGeo, sunMat);

      // Inner corona
      const corona1Geo = new THREE.SphereGeometry(1.2, 32, 32);
      const corona1Mat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
      });
      this.coronaMesh = new THREE.Mesh(corona1Geo, corona1Mat);

      // Outer solar prominence flare
      const flareGeo = new THREE.SphereGeometry(1.6, 32, 32);
      const flareMat = new THREE.MeshBasicMaterial({
        color: 0xff0044,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
      });
      this.flareMesh = new THREE.Mesh(flareGeo, flareMat);

      this.targetGroup.add(this.targetMesh);
      this.targetGroup.add(this.coronaMesh);
      this.targetGroup.add(this.flareMesh);
    } else if (this.scenario === 'earth') {
      // The Earth: High-detail blue globe with atmosphere
      const earthGeo = new THREE.SphereGeometry(0.6, 48, 48);
      const earthMat = new THREE.MeshBasicMaterial({ color: 0x0088ff });
      this.targetMesh = new THREE.Mesh(earthGeo, earthMat);

      const atmoGeo = new THREE.SphereGeometry(0.78, 32, 32);
      const atmoMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.45,
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
    // 3D position mapped along realistic Keplerian orbital decay
    const visualDist = 1.35 + (this.distanceAU / 10.0) * 8.2;
    const orbitalAngle = (1.0 - this.distanceAU / 10.0) * Math.PI * 3.8;

    if (this.targetMesh) {
      const posX = Math.cos(orbitalAngle) * visualDist;
      const posZ = Math.sin(orbitalAngle) * visualDist;
      this.targetGroup.position.set(posX, 0, posZ);

      // Roche Tidal Disruption Radius: ~3.2 AU for Sun, ~2.2 AU for Earth
      const rocheLimit = this.scenario === 'sun' ? 3.4 : 2.4;

      if (this.distanceAU < rocheLimit) {
        // Severe Spaghettification!
        const severity = (rocheLimit - this.distanceAU) / rocheLimit; // 0 to 1
        const stretchX = 1.0 + severity * 4.5;
        const compressYZ = Math.max(0.06, 1.0 - severity * 0.88);

        this.targetMesh.scale.set(stretchX, compressYZ, compressYZ);
        this.targetMesh.lookAt(0, 0, 0);

        if (this.targetMesh.material) {
          this.targetMesh.material.opacity = Math.max(0.08, 1.0 - severity * 0.92);
          this.targetMesh.material.transparent = true;
        }

        // Fluid plasma ribbon
        this.updatePlasmaRibbon(visualDist, orbitalAngle, severity);

        // Relativistic Polar Jet ignition
        const jetAlpha = Math.min(0.9, severity * 1.5);
        if (this.northJet) this.northJet.material.opacity = jetAlpha;
        if (this.southJet) this.southJet.material.opacity = jetAlpha;

        // Camera shake during intense destruction
        if (severity > 0.6 && this.controls) {
          this.camera.position.x += (Math.random() - 0.5) * 0.05 * severity;
          this.camera.position.y += (Math.random() - 0.5) * 0.05 * severity;
        }
      } else {
        this.targetMesh.scale.set(1, 1, 1);
        if (this.targetMesh.material) {
          this.targetMesh.material.opacity = 1.0;
          this.targetMesh.material.transparent = false;
        }
        if (this.plasmaRibbon) this.plasmaRibbon.visible = false;
        if (this.northJet) this.northJet.material.opacity = 0.0;
        if (this.southJet) this.southJet.material.opacity = 0.0;
      }
    }

    this.renderTelemetry();
  }

  updatePlasmaRibbon(startDist, startAngle, severity) {
    if (!this.plasmaRibbon) return;
    this.plasmaRibbon.visible = true;

    const posAttr = this.plasmaRibbon.geometry.attributes.position;
    const colAttr = this.plasmaRibbon.geometry.attributes.color;
    const count = this.streamCount;

    for (let i = 0; i < count; i++) {
      const t = i / count; // 0 at dying star, 1 at event horizon
      const r = startDist * (1 - t) + 1.45 * t;
      const spiralTurns = startAngle + t * Math.PI * 5.2;

      // Volumetric fluid stream spread
      const spread = 0.06 + t * 0.22;
      const x = Math.cos(spiralTurns) * r + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.7;
      const z = Math.sin(spiralTurns) * r + (Math.random() - 0.5) * spread;

      posAttr.array[i * 3] = x;
      posAttr.array[i * 3 + 1] = y;
      posAttr.array[i * 3 + 2] = z;

      // Incandescent plasma thermal spectrum
      if (t > 0.55) {
        // Blinding white-hot near event horizon
        colAttr.array[i * 3] = 1.0;
        colAttr.array[i * 3 + 1] = 0.98;
        colAttr.array[i * 3 + 2] = 0.92;
      } else {
        // Fiery gold-red plasma bridge
        colAttr.array[i * 3] = 1.0;
        colAttr.array[i * 3 + 1] = this.scenario === 'sun' ? 0.65 : 0.4;
        colAttr.array[i * 3 + 2] = 0.08;
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
      } else if (d > 3.4) {
        phaseTitle = 'Phase 2: Extreme Tidal Stretching';
        phaseDesc = `Differential gravity pulls the near side faster. Solar corona erupts with massive prominence flares.`;
        badgeClass = 'status-warning';
      } else if (d > 1.2) {
        phaseTitle = 'Phase 3: Roche Limit Rupture (Spaghettification)';
        phaseDesc = `ROCHE LIMIT BREACHED: The Sun is violently shredded into a continuous, swirling relativistic plasma ribbon wrapping around the black hole!`;
        badgeClass = 'status-critical';
      } else {
        phaseTitle = 'Phase 4: Super-Eddington Accretion & Relativistic Jets';
        phaseDesc = `CATASTROPHIC ACCRETION: Solar core plunges past the event horizon. Twin relativistic particle jets erupt from the poles at 0.998c!`;
        badgeClass = 'status-critical';
      }
    } else if (this.scenario === 'earth') {
      if (d > 4.5) {
        phaseTitle = 'Phase 1: Orbital Ejection';
        phaseDesc = `Earth is torn from the habitable zone at ${d.toFixed(1)} AU. Severe orbital perturbation.`;
      } else if (d > 2.4) {
        phaseTitle = 'Phase 2: Atmospheric Stripping';
        phaseDesc = `Atmosphere and oceans are ripped into space; crust fractures into global molten chasms.`;
        badgeClass = 'status-warning';
      } else {
        phaseTitle = 'Phase 3: Total Planetary Shredding';
        phaseDesc = `ROCHE LIMIT BREACHED: The Earth is crushed and obliterated into a glowing ring of magma debris before crossing the event horizon.`;
        badgeClass = 'status-critical';
      }
    } else {
      phaseTitle = 'Gravitational Lensing (Einstein Light Deflection)';
      phaseDesc = `Photons passing near the photon sphere (1.5 rs) are deflected by General Relativity, creating the iconic double Einstein ring and warped disk!`;
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
          <span class="metric-title">Distance</span>
          <span class="metric-value">${d.toFixed(2)} AU (${(d * 149.6).toFixed(1)}M km)</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Tidal Gravity</span>
          <span class="metric-value">${(350 / Math.pow(Math.max(0.4, d), 3)).toFixed(0)}× Earth G</span>
        </div>
        <div class="bh-metric-item">
          <span class="metric-title">Relativistic Jets</span>
          <span class="metric-value" style="color: ${d < 3.4 ? '#00f3ff' : '#64748b'};">${d < 3.4 ? 'ACTIVE (0.998 c)' : 'Dormant'}</span>
        </div>
      </div>
    `;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.time += 0.016;

    // Simulation playback
    if (this.isPlaying) {
      this.simProgress += this.simSpeed;
      if (this.simProgress >= 1.0) {
        this.simProgress = 1.0;
        this.isPlaying = false;
        const playBtn = document.getElementById('btn-bh-play');
        if (playBtn) playBtn.textContent = '▶ Replay Simulation';
      }
      this.distanceAU = 10.0 - this.simProgress * 9.8;
      this.updateScenarioPhysics();

      const slider = document.getElementById('slider-bh-distance');
      const valDisp = document.getElementById('val-bh-distance');
      if (slider) slider.value = this.distanceAU.toFixed(1);
      if (valDisp) valDisp.textContent = this.distanceAU.toFixed(1) + ' AU';
    }

    if (this.isThree) {
      // 1. Keplerian differential rotation of equatorial disk
      if (this.equatorialDisk) {
        const posAttr = this.equatorialDisk.geometry.attributes.position;
        const colAttr = this.equatorialDisk.geometry.attributes.color;

        for (let i = 0; i < this.diskParticles.length; i++) {
          const item = this.diskParticles[i];
          item.angle += item.speed;

          posAttr.array[i * 3] = Math.cos(item.angle) * item.radius;
          posAttr.array[i * 3 + 2] = Math.sin(item.angle) * item.radius;

          // Relativistic Doppler beaming
          const vToward = -Math.sin(item.angle);
          if (vToward > 0) {
            // Approaching observer: blue-shifted & blindingly bright
            colAttr.array[i * 3] = 0.6;
            colAttr.array[i * 3 + 1] = 0.9;
            colAttr.array[i * 3 + 2] = 1.0;
          } else {
            // Receding observer: red-shifted & dimmer
            colAttr.array[i * 3] = 1.0;
            colAttr.array[i * 3 + 1] = 0.38;
            colAttr.array[i * 3 + 2] = 0.05;
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      // 2. Gravitational Warped Arch rotation
      if (this.lensedArchMesh) {
        this.lensedArchMesh.rotation.z += 0.0025;
      }

      // 3. Keep photon ring facing camera
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
