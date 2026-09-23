/**
 * 4D Hyperplane Slicer Visualizer
 * Demonstrates what 3D beings perceive when a 4D object traverses 3D space.
 */

export class SlicerDemo {
  constructor(canvasId, textId) {
    this.canvas = document.getElementById(canvasId);
    this.textElem = document.getElementById(textId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.wSlice = 0.0;
    this.shapeType = 'tesseract_axis'; // 'tesseract_axis', 'tesseract_corner', 'glome'
    this.rotAngle = 0.0;

    if (this.canvas) {
      this.initEvents();
      this.render();
    }
  }

  initEvents() {
    let isDragging = false;
    let lastX = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      this.rotAngle += dx * 0.015;
      this.render();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      lastX = e.touches[0].clientX;
      this.rotAngle += dx * 0.015;
      this.render();
    });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  setSlice(w) {
    this.wSlice = parseFloat(w);
    this.render();
  }

  setShape(shape) {
    this.shapeType = shape;
    this.render();
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    // High DPI scaling
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.scale(dpr, dpr);
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    // Cosmic background inside slice viewport
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 1.5);
    bgGrad.addColorStop(0, '#0c1228');
    bgGrad.addColorStop(1, '#050712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle coordinate grid in 3D
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < w; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 40; y < h; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    const cx = w / 2;
    const cy = h / 2;
    const sliceVal = this.wSlice;
    let description = '';

    if (this.shapeType === 'glome') {
      // 4D Hypersphere glome: x^2 + y^2 + z^2 + w^2 = R^2
      // Slice at w gives 3D sphere of radius r = sqrt(R^2 - w^2)
      const R = 1.0;
      if (Math.abs(sliceVal) > R) {
        description = `Hyperplane w = ${sliceVal.toFixed(2)} is outside the 4D Hypersphere (R = ${R.toFixed(1)}). The 3D observer sees absolute empty space!`;
        this.drawEmptySpace(ctx, cx, cy);
      } else {
        const r3 = Math.sqrt(R * R - sliceVal * sliceVal);
        description = `Hyperplane w = ${sliceVal.toFixed(2)} intersects the 4D Hypersphere! The 3D observer perceives a solid 3D sphere of radius r = ${r3.toFixed(2)}. As w traverses from -1 to +1, the sphere manifests from a singularity point, balloons up to radius 1.0 at w = 0, and shrinks back to nothingness!`;
        this.drawSphereSlice(ctx, cx, cy, r3 * 90);
      }
    } else if (this.shapeType === 'tesseract_axis') {
      // Axis-aligned slice: [-1, 1] in all 4 axes.
      // Slicing at w in [-1, 1] yields an identical full 3D cube!
      if (Math.abs(sliceVal) > 1.0) {
        description = `Hyperplane w = ${sliceVal.toFixed(2)} is outside the hypercube. Empty 3D space.`;
        this.drawEmptySpace(ctx, cx, cy);
      } else if (Math.abs(sliceVal) === 1.0) {
        description = `Hyperplane w = ${sliceVal.toFixed(2)} is grazing the boundary face! An entire solid 3D cube suddenly flashes into existence instantly!`;
        this.drawCube(ctx, cx, cy, 80, this.rotAngle, true);
      } else {
        description = `Hyperplane w = ${sliceVal.toFixed(2)} passes through the hypercube along its 4th axis. The 3D slice remains a constant 3D cube (a 3D "slice" of a 4D block, just like slicing a block of cheese creates identical 2D squares)!`;
        this.drawCube(ctx, cx, cy, 80, this.rotAngle, false);
      }
    } else if (this.shapeType === 'tesseract_corner') {
      // Corner-first slice of tesseract:
      // Slice through the diagonal (w' axis from -2 to +2):
      // -2: point
      // -2 to -1: expanding tetrahedron
      // -1 to 0: truncated tetrahedron transitioning to regular octahedron at 0!
      // 0: regular octahedron
      // 0 to 1: truncated tetrahedron inverted
      // 1 to 2: contracting tetrahedron
      // > 2: nothing
      const absS = Math.abs(sliceVal);
      if (absS > 1.414) {
        description = `Corner diagonal slice: w = ${sliceVal.toFixed(2)} is beyond the hyper-vertices. Empty space.`;
        this.drawEmptySpace(ctx, cx, cy);
      } else if (absS > 0.8) {
        const factor = (1.414 - absS) / 0.614;
        description = `Corner-first entry: A single vertex touches our 3D space and instantly blooms into an expanding 3D Tetrahedron (size ${factor.toFixed(2)})!`;
        this.drawPolyhedron(ctx, cx, cy, 4, factor * 85, this.rotAngle);
      } else if (absS > 0.25) {
        description = `Truncation phase: The tetrahedron's corners are sliced off, forming a Truncated Tetrahedron that morphs continuously as the 4D hypercube continues its journey!`;
        this.drawPolyhedron(ctx, cx, cy, 8, 85, this.rotAngle);
      } else {
        description = `Hyper-equator (w ≈ 0): The central cross-section of a corner-first tesseract is a perfect regular 3D Octahedron!`;
        this.drawPolyhedron(ctx, cx, cy, 6, 95, this.rotAngle);
      }
    }

    if (this.textElem) {
      this.textElem.innerHTML = `<span class="badge-tag">3D Observer Telemetry</span> <p class="telemetry-text">${description}</p>`;
    }
  }

  drawEmptySpace(ctx, cx, cy) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('∅ NO 3D INTERSECTION DETECTED', cx, cy - 10);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
    ctx.fillText('4D object is outside the current 3D universe hyperplane', cx, cy + 15);
  }

  drawSphereSlice(ctx, cx, cy, radius) {
    // 3D Sphere shaded circle with latitude rings
    const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    grad.addColorStop(0, '#00f3ff');
    grad.addColorStop(0.5, '#7928ca');
    grad.addColorStop(1, '#110038');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Glowing rim
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawCube(ctx, cx, cy, size, rot, isFlash) {
    // Render 3D isometric/rotated cube
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    // 8 vertices of a 3D cube
    const rawV = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
    ];

    const projected = rawV.map(([x, y, z]) => {
      // Rotate around Y and X slightly
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const ry = y * 0.9 - rz * 0.3;
      return [cx + rx * size, cy + ry * size];
    });

    const cubeEdges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    // Translucent faces
    const faces = [
      [0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,3,7,4], [1,2,6,5]
    ];

    faces.forEach((f, idx) => {
      ctx.beginPath();
      ctx.moveTo(projected[f[0]][0], projected[f[0]][1]);
      for (let i = 1; i < f.length; i++) {
        ctx.lineTo(projected[f[i]][0], projected[f[i]][1]);
      }
      ctx.closePath();
      ctx.fillStyle = isFlash ? 'rgba(0, 243, 255, 0.35)' : `rgba(138, 43, 226, ${0.12 + (idx % 3) * 0.05})`;
      ctx.fill();
    });

    // Edges
    ctx.strokeStyle = isFlash ? '#00f3ff' : '#00f3ff';
    ctx.lineWidth = isFlash ? 3 : 2;
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = isFlash ? 20 : 8;

    cubeEdges.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(projected[i][0], projected[i][1]);
      ctx.lineTo(projected[j][0], projected[j][1]);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Vertices
    projected.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  }

  drawPolyhedron(ctx, cx, cy, vertexCount, size, rot) {
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    let verts = [];
    if (vertexCount === 4) {
      // Tetrahedron
      verts = [
        [ 1,  1,  1],
        [-1, -1,  1],
        [-1,  1, -1],
        [ 1, -1, -1]
      ];
    } else if (vertexCount === 6) {
      // Octahedron
      verts = [
        [ 1.3, 0, 0], [-1.3, 0, 0],
        [0, 1.3, 0], [0, -1.3, 0],
        [0, 0, 1.3], [0, 0, -1.3]
      ];
    } else {
      // Truncated tetrahedron (approximate 8 vertices)
      verts = [
        [ 1, 0.5, 0.5], [-1, -0.5, 0.5], [-0.5, 1, -0.5], [0.5, -1, -0.5],
        [ 0.5, 1, 0.5], [-0.5, -1, 0.5], [-1, 0.5, -0.5], [1, -0.5, -0.5]
      ];
    }

    const projected = verts.map(([x, y, z]) => {
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const ry = y * 0.9 - rz * 0.3;
      return [cx + rx * (size * 0.8), cy + ry * (size * 0.8)];
    });

    // Draw connecting edges
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;

    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
      }
    }
    ctx.shadowBlur = 0;

    projected.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00f3ff';
      ctx.fill();
    });
  }
}
