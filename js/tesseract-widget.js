/**
 * Clean & Simple 4D Tesseract Interactive Widget
 * Focuses strictly on an intuitive, fun, single 3D/4D hypercube experience.
 */

export class TesseractWidget {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');

    // 16 vertices of a 4D hypercube (+/-1, +/-1, +/-1, +/-1)
    this.vertices = [];
    for (let i = 0; i < 16; i++) {
      this.vertices.push([
        (i & 1) ? 1 : -1,
        (i & 2) ? 1 : -1,
        (i & 4) ? 1 : -1,
        (i & 8) ? 1 : -1
      ]);
    }

    // 32 edges connecting vertices that differ by 1 bit
    this.edges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        const diff = i ^ j;
        if (diff > 0 && (diff & (diff - 1)) === 0) {
          this.edges.push([i, j]);
        }
      }
    }

    // Angles
    this.angleXW = 0.0;
    this.angleYW = 0.0;
    this.rotY = 0.5;
    this.rotX = 0.3;
    this.autoRotate = true;

    this.initEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initEvents() {
    let isDragging = false;
    let lastX = 0, lastY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      this.rotY += dx * 0.01;
      this.rotX += dy * 0.01;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      this.rotY += dx * 0.01;
      this.rotX += dy * 0.01;
    });

    window.addEventListener('touchend', () => { isDragging = false; });
  }

  setWAngle(rad) {
    this.angleXW = parseFloat(rad);
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.autoRotate) {
      this.angleXW += 0.012;
      this.angleYW += 0.008;
      this.rotY += 0.005;
    }

    this.render();
  }

  render() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    // Deep obsidian background
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 1.4);
    bgGrad.addColorStop(0, '#0c1228');
    bgGrad.addColorStop(1, '#050712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 4D Rotation on XW and YW planes
    const cosXW = Math.cos(this.angleXW);
    const sinXW = Math.sin(this.angleXW);
    const cosYW = Math.cos(this.angleYW);
    const sinYW = Math.sin(this.angleYW);

    // 3D View rotation
    const cosY = Math.cos(this.rotY);
    const sinY = Math.sin(this.rotY);
    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);

    const projected2D = [];
    const focal4D = 2.4;
    const zoom3D = 95;

    for (let i = 0; i < this.vertices.length; i++) {
      let [x, y, z, w4] = this.vertices[i];

      // Rotate XW
      const rx1 = x * cosXW - w4 * sinXW;
      const rw1 = x * sinXW + w4 * cosXW;

      // Rotate YW
      const ry1 = y * cosYW - rw1 * sinYW;
      const rw2 = y * sinYW + rw1 * cosYW;

      // 4D to 3D perspective projection
      const scale4D = 1 / (focal4D - rw2);
      const x3 = rx1 * scale4D;
      const y3 = ry1 * scale4D;
      const z3 = z * scale4D;

      // 3D camera rotation
      const xRotY = x3 * cosY - z3 * sinY;
      const zRotY = x3 * sinY + z3 * cosY;
      const yRotX = y3 * cosX - zRotY * sinX;
      const zFinal = y3 * sinX + zRotY * cosX;

      // 3D to 2D screen projection
      const screenX = w / 2 + xRotY * zoom3D;
      const screenY = h / 2 - yRotX * zoom3D;

      projected2D.push({ x: screenX, y: screenY, w: rw2 });
    }

    // Draw Edges with glowing neon gradient
    ctx.lineWidth = 2;
    this.edges.forEach(([i, j]) => {
      const p1 = projected2D[i];
      const p2 = projected2D[j];

      // Cyan for +W, Magenta for -W
      const avgW = (p1.w + p2.w) / 2;
      const normW = Math.max(0, Math.min(1, (avgW + 1.2) / 2.4));
      const r = Math.round(normW * 0 + (1 - normW) * 255);
      const g = Math.round(normW * 243 + (1 - normW) * 0);
      const b = Math.round(normW * 255 + (1 - normW) * 127);

      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw Vertices
    projected2D.forEach(p => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
