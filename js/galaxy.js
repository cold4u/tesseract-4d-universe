/**
 * Movie-Grade Milky Way Galaxy 3D Interactive Simulation
 * Features 20,000+ stars, volumetric dark dust lanes (The Great Rift),
 * luminous H II stellar nurseries, and glowing Sagittarius A* core bulge.
 */

export class MilkyWayGalaxy {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      starCount: 20000,
      armCount: 4,
      rotationSpeed: 0.0007,
      armWinding: 0.38,
      coreRadius: 2.2,
      galaxyRadius: 19.0
    }, options);

    this.isThree = typeof window.THREE !== 'undefined';
    this.rotationSpeed = this.options.rotationSpeed;
    this.targetCameraPos = null;
    this.targetControlsTarget = null;
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
    this.camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 1000);
    this.camera.position.set(0, 24, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 55;
      this.controls.minDistance = 3;
    }

    // 1. Build Multi-Tier Galaxy Stars (20,000 particles)
    this.buildGalaxyMesh();

    // 2. Build Volumetric Dark Dust Lanes (Interstellar Absorption Nebulae)
    this.buildDustLanes();

    // 3. Build Glowing Core & Sagittarius A*
    this.buildCoreBulge();

    // 4. Solar System & POI Markers
    this.buildPOIMarkers();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const nw = this.container.clientWidth;
      const nh = this.container.clientHeight;
      this.camera.aspect = nw / nh;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(nw, nh);
    });
  }

  buildGalaxyMesh() {
    const THREE = window.THREE;
    const count = this.options.starCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorBulge = new THREE.Color(0xffd180); // Warm yellow/red giants
    const colorArmHot = new THREE.Color(0x7df9ff); // Young hot O/B blue stars
    const colorArmMid = new THREE.Color(0xffffff); // Solar-type stars
    const colorHII = new THREE.Color(0xff4081);    // Glowing pink ionized hydrogen nebulae

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const isCore = Math.random() < 0.28;

      if (isCore) {
        // Core bulge distribution
        const r = Math.pow(Math.random(), 2.2) * this.options.coreRadius * 1.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.9;

        positions[i3] = r * Math.cos(theta) * Math.cos(phi);
        positions[i3 + 1] = r * Math.sin(phi) * 0.42;
        positions[i3 + 2] = r * Math.sin(theta) * Math.cos(phi);

        const c = colorBulge.clone().lerp(new THREE.Color(0xfff0c0), Math.random() * 0.4);
        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      } else {
        // Spiral Arms: Perseus, Scutum-Centaurus, Sagittarius, Outer
        const armIndex = i % this.options.armCount;
        const armOffset = (armIndex * 2 * Math.PI) / this.options.armCount;
        const dist = Math.pow(Math.random(), 1.35) * this.options.galaxyRadius;

        const spin = dist * this.options.armWinding;
        const angle = armOffset + spin;

        // Gaussian scatter
        const spread = (dist / this.options.galaxyRadius) * 2.2 + 0.35;
        const randomX = (Math.random() - 0.5) * spread;
        const randomY = (Math.random() - 0.5) * (spread * 0.32);
        const randomZ = (Math.random() - 0.5) * spread;

        positions[i3] = Math.cos(angle) * dist + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(angle) * dist + randomZ;

        // Stellar population color grading
        let starCol = colorArmHot.clone();
        const randType = Math.random();
        if (randType < 0.35) {
          starCol = colorArmMid.clone();
        } else if (randType < 0.55) {
          starCol = colorHII.clone(); // Ionized stellar nursery
        } else if (randType < 0.75) {
          starCol = new THREE.Color(0x00f3ff);
        }

        colors[i3] = starCol.r;
        colors[i3 + 1] = starCol.g;
        colors[i3 + 2] = starCol.b;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.19,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.galaxyPoints = new THREE.Points(geometry, material);
    this.scene.add(this.galaxyPoints);
  }

  buildDustLanes() {
    const THREE = window.THREE;
    // Volumetric dark dust lanes running along the inner edges of spiral arms
    const dustCount = 4000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      const armIndex = i % this.options.armCount;
      const armOffset = (armIndex * 2 * Math.PI) / this.options.armCount + 0.18; // offset from bright arms
      const dist = 2.5 + Math.pow(Math.random(), 1.2) * (this.options.galaxyRadius - 3.0);
      const angle = armOffset + dist * this.options.armWinding;

      const spread = 0.8;
      pos[i * 3] = Math.cos(angle) * dist + (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.22;
      pos[i * 3 + 2] = Math.sin(angle) * dist + (Math.random() - 0.5) * spread;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      color: 0x050814,
      transparent: true,
      opacity: 0.55
    });

    this.dustLanes = new THREE.Points(geo, mat);
    this.scene.add(this.dustLanes);
  }

  buildCoreBulge() {
    const THREE = window.THREE;
    this.coreGroup = new THREE.Group();

    // Central supermassive black hole shadow
    const sgrAGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const sgrAMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const sgrA = new THREE.Mesh(sgrAGeo, sgrAMat);

    // Blinding core light halo
    const glowGeo = new THREE.SphereGeometry(2.4, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd180,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const coreGlow = new THREE.Mesh(glowGeo, glowMat);

    // Accretion disk ring around Sagittarius A*
    const ringGeo = new THREE.RingGeometry(0.85, 2.2, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.coreAccretion = new THREE.Mesh(ringGeo, ringMat);
    this.coreAccretion.rotation.x = Math.PI / 2.3;

    this.coreGroup.add(sgrA);
    this.coreGroup.add(coreGlow);
    this.coreGroup.add(this.coreAccretion);
    this.scene.add(this.coreGroup);
  }

  buildPOIMarkers() {
    const THREE = window.THREE;
    this.poiGroup = new THREE.Group();

    // Solar System coordinates in Orion Spur (~26,000 ly out)
    const sunAngle = 1.35;
    const sunDist = 9.8;
    this.sunCoords = new THREE.Vector3(
      Math.cos(sunAngle) * sunDist,
      0.18,
      Math.sin(sunAngle) * sunDist
    );

    // Glowing yellow Sun marker
    const sunGeo = new THREE.SphereGeometry(0.25, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.copy(this.sunCoords);

    // Pulsing target beacon ring
    const ringGeo = new THREE.RingGeometry(0.45, 0.65, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(this.sunCoords);
    ringMesh.rotation.x = Math.PI / 2;

    this.poiGroup.add(sunMesh);
    this.poiGroup.add(ringMesh);
    this.scene.add(this.poiGroup);
  }

  flyTo(targetKey) {
    const THREE = window.THREE;
    if (!this.camera) return;

    if (targetKey === 'sun') {
      this.targetCameraPos = new THREE.Vector3(this.sunCoords.x + 2.8, 1.8, this.sunCoords.z + 3.2);
      this.targetControlsTarget = this.sunCoords.clone();
    } else if (targetKey === 'core') {
      this.targetCameraPos = new THREE.Vector3(0, 3.8, 5.5);
      this.targetControlsTarget = new THREE.Vector3(0, 0, 0);
    } else if (targetKey === 'overview') {
      this.targetCameraPos = new THREE.Vector3(0, 24, 30);
      this.targetControlsTarget = new THREE.Vector3(0, 0, 0);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isThree) {
      if (this.galaxyPoints) this.galaxyPoints.rotation.y += this.rotationSpeed;
      if (this.dustLanes) this.dustLanes.rotation.y += this.rotationSpeed;
      if (this.poiGroup) this.poiGroup.rotation.y += this.rotationSpeed;
      if (this.coreAccretion) this.coreAccretion.rotation.z += this.rotationSpeed * 3.5;

      // Smooth camera interpolation
      if (this.targetCameraPos) {
        this.camera.position.lerp(this.targetCameraPos, 0.05);
        if (this.controls && this.targetControlsTarget) {
          this.controls.target.lerp(this.targetControlsTarget, 0.05);
        }
        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.12) {
          this.targetCameraPos = null;
          this.targetControlsTarget = null;
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
    ctx.fillStyle = '#03050e';
    ctx.fillRect(0, 0, w, h);

    this.rot += this.rotationSpeed * 1.5;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#00f3ff';
    for (let arm = 0; arm < 4; arm++) {
      const armOffset = (arm * Math.PI) / 2;
      for (let r = 5; r < 140; r += 2) {
        const theta = armOffset + r * 0.05 + this.rot;
        const x = cx + Math.cos(theta) * (r * 1.5);
        const y = cy + Math.sin(theta) * (r * 0.7);
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    ctx.fillStyle = '#ffd180';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
  }
}
