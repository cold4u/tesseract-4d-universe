/**
 * Real-time 3D/4D Cosmic Polytope Renderer
 * Uses Three.js when available, with built-in high performance Canvas 3D fallback.
 */

import { Vector4, Math4D } from './math4d.js';

export class PolytopeRenderer {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = Object.assign({
      projectionMode: 'perspective', // 'perspective', 'orthographic', 'stereographic'
      cameraDistance4D: 2.8,
      edgeThickness: 2.0,
      vertexSize: 0.08,
      cellOpacity: 0.15,
      showCells: true,
      showVertices: true,
      showEdges: true,
      unfoldFactor: 0.0,
      colorMode: 'w-depth', // 'w-depth', 'neon-cyan', 'spectrum'
      onVertexHover: null
    }, options);

    // Current 4D Polytope Data
    this.polytope = Math4D.createTesseract();
    // Working 4D vertices (rotated)
    this.currentVertices4D = [];
    this.projectedVertices3D = [];

    // 4D Rotation Angles & Velocities
    this.angles = {
      xy: 0, xz: 0, yz: 0,
      xw: 0, yw: 0, zw: 0
    };
    this.velocities = {
      xy: 0.0, xz: 0.005, yz: 0.0,
      xw: 0.012, yw: 0.008, zw: 0.004
    };
    this.autoRotate = true;

    // Highlighted cell index (-1 = none)
    this.highlightedCellIndex = -1;
    this.hoveredVertexIndex = -1;

    // Engine type
    this.isThree = typeof window.THREE !== 'undefined';
    this.init();
  }

  init() {
    this.currentVertices4D = this.polytope.vertices.map(v => v.clone());
    this.projectedVertices3D = new Array(this.polytope.vertices.length).fill(null);

    if (this.isThree) {
      this.initThree();
    } else {
      console.warn("Three.js not detected. Initializing embedded Canvas 3D engine.");
      this.initFallback();
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /* ----------------------------------------------------
   * Three.js Implementation
   * ---------------------------------------------------- */
  initThree() {
    const THREE = window.THREE;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050712, 0.04);

    // Camera
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.2, 4.8);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxDistance = 15;
      this.controls.minDistance = 1.2;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f3ff, 1.2);
    dirLight1.position.set(5, 8, 5);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff007f, 0.9);
    dirLight2.position.set(-5, -6, -5);
    this.scene.add(dirLight2);

    // Cosmic Starfield & Nebula
    this.createCosmicEnvironment();

    // 4D Mesh Hierarchy
    this.polytopeGroup = new THREE.Group();
    this.scene.add(this.polytopeGroup);

    this.rebuildThreePolytope();

    // Raycasting for interactive vertex/cell hover
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points = { threshold: 0.2 };
    this.mouse = new THREE.Vector2(-999, -999);

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    // Resize Handler
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  createCosmicEnvironment() {
    const THREE = window.THREE;
    // Layer 1: Deep cosmic stars (3,000 points)
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0x00f3ff), // Cyan
      new THREE.Color(0xff007f), // Magenta
      new THREE.Color(0x8a2be2), // Violet
      new THREE.Color(0xffffff), // Starlight White
      new THREE.Color(0x7df9ff)  // Electric blue
    ];

    for (let i = 0; i < starCount; i++) {
      const r = 40 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);

    // Layer 2: Subtle cosmic dust ring
    const ringGeo = new THREE.RingGeometry(8, 14, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.03,
      wireframe: true
    });
    this.cosmicRing = new THREE.Mesh(ringGeo, ringMat);
    this.cosmicRing.rotation.x = Math.PI / 2.3;
    this.scene.add(this.cosmicRing);
  }

  rebuildThreePolytope() {
    const THREE = window.THREE;
    // Clear previous polytope objects
    while (this.polytopeGroup.children.length > 0) {
      const obj = this.polytopeGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
      this.polytopeGroup.remove(obj);
    }

    this.currentVertices4D = this.polytope.vertices.map(v => v.clone());
    this.projectedVertices3D = new Array(this.polytope.vertices.length);

    // 1. Vertices (Spheres)
    this.vertexMeshes = [];
    const sphereGeo = new THREE.SphereGeometry(this.options.vertexSize, 16, 16);
    this.polytope.vertices.forEach((_, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00a8ff,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.userData = { vertexIndex: idx };
      this.vertexMeshes.push(mesh);
      this.polytopeGroup.add(mesh);
    });

    // 2. Edges (LineSegments with Dynamic Vertex Colors)
    const edgeCount = this.polytope.edges.length;
    this.edgeGeometry = new THREE.BufferGeometry();
    this.edgePositions = new Float32Array(edgeCount * 2 * 3);
    this.edgeColors = new Float32Array(edgeCount * 2 * 3);

    this.edgeGeometry.setAttribute('position', new THREE.BufferAttribute(this.edgePositions, 3));
    this.edgeGeometry.setAttribute('color', new THREE.BufferAttribute(this.edgeColors, 3));

    const edgeMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });

    this.edgeLines = new THREE.LineSegments(this.edgeGeometry, edgeMaterial);
    this.polytopeGroup.add(this.edgeLines);

    // 3. Faces / Cells (Volumetric Translucent Cubes for Tesseract)
    this.cellMeshes = [];
    if (this.polytope.faces && this.polytope.faces.length > 0) {
      const faceGeo = new THREE.BufferGeometry();
      const faceIndices = [];

      // Triangulate each polygon face (mostly quads or triangles)
      this.polytope.faces.forEach(face => {
        if (face.length === 4) {
          // Quad: 2 triangles [0, 1, 2] and [0, 2, 3]
          faceIndices.push(face[0], face[1], face[2]);
          faceIndices.push(face[0], face[2], face[3]);
        } else if (face.length === 3) {
          faceIndices.push(face[0], face[1], face[2]);
        }
      });

      const facePositions = new Float32Array(this.polytope.vertices.length * 3);
      faceGeo.setAttribute('position', new THREE.BufferAttribute(facePositions, 3));
      faceGeo.setIndex(faceIndices);

      const faceMat = new THREE.MeshPhysicalMaterial({
        color: 0x8a2be2,
        roughness: 0.1,
        transmission: 0.7,
        thickness: 0.5,
        transparent: true,
        opacity: this.options.cellOpacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      this.faceMesh = new THREE.Mesh(faceGeo, faceMat);
      this.polytopeGroup.add(this.faceMesh);
    }
  }

  /* ----------------------------------------------------
   * Pure Canvas Fallback Implementation
   * ---------------------------------------------------- */
  initFallback() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);

    // Camera angles for 3D view
    this.camRotX = 0.3;
    this.camRotY = 0.5;
    this.camZoom = 140;

    let isDragging = false;
    let lastX = 0, lastY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      this.camRotY += (e.clientX - lastX) * 0.01;
      this.camRotX += (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
    this.canvas.addEventListener('wheel', (e) => {
      this.camZoom = Math.max(40, Math.min(300, this.camZoom - e.deltaY * 0.1));
    });
  }

  /* ----------------------------------------------------
   * Mathematics & 4D State Updates
   * ---------------------------------------------------- */
  update4DGeometry() {
    // 1. Advance auto-rotation if enabled
    if (this.autoRotate) {
      for (const plane of ['xy', 'xz', 'yz', 'xw', 'yw', 'zw']) {
        this.angles[plane] += this.velocities[plane];
      }
    }

    // 2. Rotate all vertices in 4D space
    const originalVerts = this.polytope.vertices;
    const dalíNet = this.options.unfoldFactor > 0 ? Math4D.getDaliUnfoldedPosition : null;

    for (let i = 0; i < originalVerts.length; i++) {
      let v = originalVerts[i].clone();

      // Apply 4D rotations in sequence
      v.rotate('xw', this.angles.xw);
      v.rotate('yw', this.angles.yw);
      v.rotate('zw', this.angles.zw);
      v.rotate('xy', this.angles.xy);
      v.rotate('xz', this.angles.xz);
      v.rotate('yz', this.angles.yz);

      // Handle Salvador Dalí Cross unfold interpolation
      if (this.options.unfoldFactor > 0 && dalíNet) {
        const target = Math4D.getDaliUnfoldedPosition(v, i, this.options.unfoldFactor);
        if (target) {
          const u = this.options.unfoldFactor;
          v.x = v.x * (1 - u) + target.x * u;
          v.y = v.y * (1 - u) + target.y * u;
          v.z = v.z * (1 - u) + target.z * u;
          v.w = v.w * (1 - u) + target.w * u;
        }
      }

      this.currentVertices4D[i] = v;

      // Project from 4D down to 3D
      let proj;
      if (this.options.projectionMode === 'perspective') {
        proj = Math4D.projectPerspective(v, this.options.cameraDistance4D);
      } else if (this.options.projectionMode === 'orthographic') {
        proj = Math4D.projectOrthographic(v);
      } else {
        proj = Math4D.projectStereographic(v, this.options.cameraDistance4D);
      }
      this.projectedVertices3D[i] = proj;
    }
  }

  /**
   * Helper: calculate color based on 4D W coordinate
   */
  getColorForW(w) {
    // W typically in [-1.5, 1.5]
    // Cyan for +W (0x00f3ff), Magenta for -W (0xff007f)
    const normalized = Math.max(0, Math.min(1, (w + 1.2) / 2.4));
    const r = Math.round(normalized * 0x00 + (1 - normalized) * 0xff);
    const g = Math.round(normalized * 0xf3 + (1 - normalized) * 0x00);
    const b = Math.round(normalized * 0xff + (1 - normalized) * 0x7f);
    return { r: r / 255, g: g / 255, b: b / 255, hex: (r << 16) | (g << 8) | b };
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.update4DGeometry();

    if (this.isThree) {
      this.renderThree();
    } else {
      this.renderFallback();
    }
  }

  renderThree() {
    const THREE = window.THREE;
    if (this.controls) this.controls.update();

    // Rotate background stars subtly
    if (this.starfield) this.starfield.rotation.y += 0.0003;
    if (this.cosmicRing) this.cosmicRing.rotation.z += 0.0006;

    // Update 3D Vertices
    const verts3D = this.projectedVertices3D;
    const vertexMeshes = this.vertexMeshes;

    for (let i = 0; i < verts3D.length; i++) {
      const p = verts3D[i];
      if (!p || !vertexMeshes[i]) continue;
      vertexMeshes[i].position.set(p.x, p.y, p.z);

      // Color vertex by its 4th dimension W
      const col = this.getColorForW(p.w);
      if (i === this.hoveredVertexIndex) {
        vertexMeshes[i].material.color.setHex(0xffffff);
        vertexMeshes[i].material.emissive.setHex(0xffffff);
        vertexMeshes[i].scale.set(1.6, 1.6, 1.6);
      } else {
        vertexMeshes[i].material.color.setRGB(col.r, col.g, col.b);
        vertexMeshes[i].material.emissive.setRGB(col.r * 0.8, col.g * 0.8, col.b * 0.8);
        vertexMeshes[i].scale.set(1, 1, 1);
      }
      vertexMeshes[i].visible = this.options.showVertices;
    }

    // Update 3D Edges
    if (this.edgeGeometry && this.options.showEdges) {
      const edges = this.polytope.edges;
      const posAttr = this.edgeGeometry.attributes.position;
      const colAttr = this.edgeGeometry.attributes.color;
      let pIdx = 0;

      for (let i = 0; i < edges.length; i++) {
        const [v1Idx, v2Idx] = edges[i];
        const p1 = verts3D[v1Idx];
        const p2 = verts3D[v2Idx];
        if (!p1 || !p2) continue;

        const c1 = this.getColorForW(p1.w);
        const c2 = this.getColorForW(p2.w);

        // Position 1
        posAttr.array[pIdx] = p1.x;
        posAttr.array[pIdx + 1] = p1.y;
        posAttr.array[pIdx + 2] = p1.z;
        colAttr.array[pIdx] = c1.r;
        colAttr.array[pIdx + 1] = c1.g;
        colAttr.array[pIdx + 2] = c1.b;

        // Position 2
        posAttr.array[pIdx + 3] = p2.x;
        posAttr.array[pIdx + 4] = p2.y;
        posAttr.array[pIdx + 5] = p2.z;
        colAttr.array[pIdx + 3] = c2.r;
        colAttr.array[pIdx + 4] = c2.g;
        colAttr.array[pIdx + 5] = c2.b;

        pIdx += 6;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      this.edgeLines.visible = true;
    } else if (this.edgeLines) {
      this.edgeLines.visible = false;
    }

    // Update Faces / Volumetric Cells
    if (this.faceMesh && this.options.showCells) {
      const posAttr = this.faceMesh.geometry.attributes.position;
      for (let i = 0; i < verts3D.length; i++) {
        const p = verts3D[i];
        if (!p) continue;
        posAttr.setXYZ(i, p.x, p.y, p.z);
      }
      posAttr.needsUpdate = true;
      this.faceMesh.geometry.computeVertexNormals();
      this.faceMesh.visible = true;
    } else if (this.faceMesh) {
      this.faceMesh.visible = false;
    }

    // Raycast hover check
    if (this.raycaster && this.mouse.x !== -999) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.vertexMeshes);
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.vertexIndex;
        if (this.hoveredVertexIndex !== idx) {
          this.hoveredVertexIndex = idx;
          if (this.options.onVertexHover) {
            this.options.onVertexHover(idx, this.currentVertices4D[idx], this.projectedVertices3D[idx]);
          }
        }
      } else {
        if (this.hoveredVertexIndex !== -1) {
          this.hoveredVertexIndex = -1;
          if (this.options.onVertexHover) {
            this.options.onVertexHover(-1, null, null);
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  renderFallback() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const rect = this.container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Deep space gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w / 1.2);
    grad.addColorStop(0, '#0c1228');
    grad.addColorStop(1, '#050712');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 3D camera transformation
    const cosY = Math.cos(this.camRotY);
    const sinY = Math.sin(this.camRotY);
    const cosX = Math.cos(this.camRotX);
    const sinX = Math.sin(this.camRotX);

    const projected2D = this.projectedVertices3D.map(p => {
      if (!p) return null;
      // Rotate around Y
      let x1 = p.x * cosY - p.z * sinY;
      let z1 = p.x * sinY + p.z * cosY;
      // Rotate around X
      let y1 = p.y * cosX - z1 * sinX;
      let z2 = p.y * sinX + z1 * cosX;

      // 3D perspective projection to 2D screen
      const dist = 4.0;
      const fov = this.camZoom / (dist - z2);
      return {
        x: w / 2 + x1 * fov,
        y: h / 2 - y1 * fov,
        z: z2,
        w: p.w
      };
    });

    // Draw Edges
    if (this.options.showEdges) {
      ctx.lineWidth = this.options.edgeThickness;
      this.polytope.edges.forEach(([i, j]) => {
        const p1 = projected2D[i];
        const p2 = projected2D[j];
        if (!p1 || !p2) return;

        const col = this.getColorForW((p1.w + p2.w) / 2);
        ctx.strokeStyle = `rgb(${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });
    }

    // Draw Vertices
    if (this.options.showVertices) {
      projected2D.forEach((p, idx) => {
        if (!p) return;
        const col = this.getColorForW(p.w);
        ctx.beginPath();
        ctx.arc(p.x, p.y, idx === this.hoveredVertexIndex ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = idx === this.hoveredVertexIndex ? '#ffffff' : `rgb(${Math.round(col.r * 255)}, ${Math.round(col.g * 255)}, ${Math.round(col.b * 255)})`;
        ctx.fill();
      });
    }
  }

  /* ----------------------------------------------------
   * Public API Methods
   * ---------------------------------------------------- */
  setPolytope(polytopeName) {
    if (polytopeName === 'tesseract') {
      this.polytope = Math4D.createTesseract();
    } else if (polytopeName === '16cell') {
      this.polytope = Math4D.create16Cell();
    } else if (polytopeName === '5cell') {
      this.polytope = Math4D.create5Cell();
    } else if (polytopeName === '24cell') {
      this.polytope = Math4D.create24Cell();
    } else if (polytopeName === 'hypersphere') {
      this.polytope = Math4D.createHypersphere(10, 20);
    }

    if (this.isThree) {
      this.rebuildThreePolytope();
    }
  }

  setPreset(presetName) {
    // Reset velocities and angles
    for (const k in this.velocities) this.velocities[k] = 0;
    this.options.unfoldFactor = 0.0;

    switch (presetName) {
      case 'inside_out':
        // Classic XW hyper-rotation that turns tesseract inside out
        this.velocities.xw = 0.015;
        this.velocities.xz = 0.004;
        break;
      case 'clifford_double':
        // Double Clifford rotation: simultaneous XW and YZ rotations
        this.velocities.xw = 0.012;
        this.velocities.yz = 0.012;
        break;
      case 'cosmic_drift':
        // Subtle drift on all 4D planes
        this.velocities.xw = 0.008;
        this.velocities.yw = 0.006;
        this.velocities.zw = 0.004;
        this.velocities.xz = 0.005;
        break;
      case 'unfolded_dali':
        // Dali Net cross
        this.options.unfoldFactor = 1.0;
        this.velocities.xz = 0.006;
        break;
      case 'frozen':
        this.autoRotate = false;
        break;
    }

    if (presetName !== 'frozen') {
      this.autoRotate = true;
    }
  }

  resetRotations() {
    for (const k in this.angles) this.angles[k] = 0;
  }
}
