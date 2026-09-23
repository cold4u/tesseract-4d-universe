/**
 * Milky Way Galaxy 3D Interactive Simulation
 * Logarithmic spiral density wave engine with 15,000+ stars, Sagittarius A* core, and Solar System locator.
 */

export class MilkyWayGalaxy {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      starCount: 15000,
      armCount: 4,
      rotationSpeed: 0.0008,
      armWinding: 0.38,
      coreRadius: 1.8,
      galaxyRadius: 18.0
    }, options);

    this.isThree = typeof window.THREE !== 'undefined';
    this.rotationSpeed = this.options.rotationSpeed;
    this.targetCameraPos = null;
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
    this.camera.position.set(0, 22, 28);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 50;
      this.controls.minDistance = 3;
    }

    // Build Galaxy Stars
    this.buildGalaxyMesh();

    // Build Sagittarius A* Core
    this.buildCoreBlackHole();

    // Build Solar System & POI Markers
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

    // Color palettes: Core is golden-amber; arms are electric cyan, starlight white, and violet
    const colorCore = new THREE.Color(0xffd180);
    const colorMid = new THREE.Color(0x80d8ff);
    const colorArm = new THREE.Color(0x00f3ff);
    const colorDust = new THREE.Color(0xff80ab);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Core stars vs Arm stars
      const isCore = Math.random() < 0.25;

      if (isCore) {
        // Spherical + elliptical distribution around galactic bulge
        const r = Math.pow(Math.random(), 2) * this.options.coreRadius * 1.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.8;

        positions[i3] = r * Math.cos(theta) * Math.cos(phi);
        positions[i3 + 1] = r * Math.sin(phi) * 0.45;
        positions[i3 + 2] = r * Math.sin(theta) * Math.cos(phi);

        const mixed = colorCore.clone().lerp(new THREE.Color(0xffffff), Math.random() * 0.5);
        colors[i3] = mixed.r;
        colors[i3 + 1] = mixed.g;
        colors[i3 + 2] = mixed.b;
      } else {
        // Spiral Arms using logarithmic spiral: r = a * exp(b * theta)
        const armIndex = i % this.options.armCount;
        const armOffset = (armIndex * 2 * Math.PI) / this.options.armCount;
        const distFromCenter = Math.pow(Math.random(), 1.4) * this.options.galaxyRadius;

        const spinAngle = distFromCenter * this.options.armWinding;
        const angle = armOffset + spinAngle;

        // Gaussian scatter perpendicular to arms
        const spread = (distFromCenter / this.options.galaxyRadius) * 1.8 + 0.3;
        const randomX = (Math.random() - 0.5) * spread;
        const randomY = (Math.random() - 0.5) * (spread * 0.35);
        const randomZ = (Math.random() - 0.5) * spread;

        positions[i3] = Math.cos(angle) * distFromCenter + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(angle) * distFromCenter + randomZ;

        // Color gradient from center to outer arms
        const t = distFromCenter / this.options.galaxyRadius;
        let c = colorMid.clone().lerp(colorArm, t);
        if (Math.random() < 0.15) c = colorDust.clone(); // Stellar nursery / H II regions
        if (Math.random() < 0.1) c = new THREE.Color(0xffffff);

        colors[i3] = c.r;
        colors[i3 + 1] = c.g;
        colors[i3 + 2] = c.b;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.galaxyPoints = new THREE.Points(geometry, material);
    this.scene.add(this.galaxyPoints);
  }

  buildCoreBlackHole() {
    const THREE = window.THREE;
    // Sagittarius A* supermassive core
    const coreGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    this.sgrA = new THREE.Mesh(coreGeo, coreMat);

    // Glowing accretion ring
    const ringGeo = new THREE.RingGeometry(0.8, 1.8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.coreAccretion = new THREE.Mesh(ringGeo, ringMat);
    this.coreAccretion.rotation.x = Math.PI / 2.2;

    this.scene.add(this.sgrA);
    this.scene.add(this.coreAccretion);
  }

  buildPOIMarkers() {
    const THREE = window.THREE;
    this.poiGroup = new THREE.Group();

    // 1. Solar System Marker (Our Sun in the Orion-Cygnus Spur, ~26,000 ly from core)
    // In our coordinate space: ~9.2 units out
    const sunAngle = 1.35;
    const sunDist = 9.4;
    this.sunCoords = new THREE.Vector3(
      Math.cos(sunAngle) * sunDist,
      0.15,
      Math.sin(sunAngle) * sunDist
    );

    const sunGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.copy(this.sunCoords);

    // Marker ring
    const beaconRingGeo = new THREE.RingGeometry(0.35, 0.5, 32);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.position.copy(this.sunCoords);
    beaconRing.rotation.x = Math.PI / 2;

    this.poiGroup.add(sunMesh);
    this.poiGroup.add(beaconRing);
    this.scene.add(this.poiGroup);
  }

  flyTo(targetKey) {
    const THREE = window.THREE;
    if (!this.camera) return;

    if (targetKey === 'sun') {
      this.targetCameraPos = new THREE.Vector3(this.sunCoords.x + 2.5, 1.8, this.sunCoords.z + 3.0);
      if (this.controls) this.controls.target.copy(this.sunCoords);
    } else if (targetKey === 'core') {
      this.targetCameraPos = new THREE.Vector3(0, 3.5, 5.0);
      if (this.controls) this.controls.target.set(0, 0, 0);
    } else if (targetKey === 'overview') {
      this.targetCameraPos = new THREE.Vector3(0, 22, 28);
      if (this.controls) this.controls.target.set(0, 0, 0);
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isThree) {
      if (this.galaxyPoints) {
        this.galaxyPoints.rotation.y += this.rotationSpeed;
      }
      if (this.poiGroup) {
        this.poiGroup.rotation.y += this.rotationSpeed;
      }
      if (this.coreAccretion) {
        this.coreAccretion.rotation.z += this.rotationSpeed * 3;
      }

      // Smooth camera interpolation
      if (this.targetCameraPos) {
        this.camera.position.lerp(this.targetCameraPos, 0.05);
        if (this.camera.position.distanceTo(this.targetCameraPos) < 0.1) {
          this.targetCameraPos = null;
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

    // Draw spiral galaxy arms
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

    // Core
    ctx.fillStyle = '#ffd180';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}
