/**
 * 4D Mathematics and Hyper-geometry Engine
 * Supports 4D vectors, 6 rotation planes, projections, and polytope generators.
 */

export class Vector4 {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  clone() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    this.w = v.w;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    this.w -= v.w;
    return this;
  }

  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    this.w *= s;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  lengthSq() {
    return this.dot(this);
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const len = this.length();
    if (len > 0.000001) {
      this.multiplyScalar(1 / len);
    }
    return this;
  }

  distanceTo(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    const dw = this.w - v.w;
    return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
  }

  /**
   * Apply 4D rotation on a specific plane
   * @param {string} plane - 'xy', 'xz', 'yz', 'xw', 'yw', 'zw'
   * @param {number} theta - rotation angle in radians
   */
  rotate(plane, theta) {
    if (Math.abs(theta) < 1e-9) return this;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    let x = this.x, y = this.y, z = this.z, w = this.w;

    switch (plane) {
      case 'xy':
        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;
        break;
      case 'xz':
        this.x = x * cos - z * sin;
        this.z = x * sin + z * cos;
        break;
      case 'yz':
        this.y = y * cos - z * sin;
        this.z = y * sin + z * cos;
        break;
      case 'xw':
        this.x = x * cos - w * sin;
        this.w = x * sin + w * cos;
        break;
      case 'yw':
        this.y = y * cos - w * sin;
        this.w = y * sin + w * cos;
        break;
      case 'zw':
        this.z = z * cos - w * sin;
        this.w = z * sin + w * cos;
        break;
    }
    return this;
  }
}

/**
 * 4D to 3D Projection utilities
 */
export const Math4D = {
  /**
   * Perspective projection from 4D to 3D
   * @param {Vector4} v4 - 4D vector
   * @param {number} cameraDistance - distance of the 4D camera along the W axis (typically 2.0 to 3.5)
   * @returns {{x: number, y: number, z: number, w: number, scale: number}}
   */
  projectPerspective(v4, cameraDistance = 2.5) {
    const wDist = cameraDistance - v4.w;
    const scale = wDist > 0.05 ? 1 / wDist : 1 / 0.05;
    return {
      x: v4.x * scale,
      y: v4.y * scale,
      z: v4.z * scale,
      w: v4.w,
      scale: scale
    };
  },

  /**
   * Orthographic projection: simply drops the W component
   */
  projectOrthographic(v4) {
    return {
      x: v4.x,
      y: v4.y,
      z: v4.z,
      w: v4.w,
      scale: 1.0
    };
  },

  /**
   * Stereographic projection from 4-sphere S^3 to 3D space
   */
  projectStereographic(v4, radius = 1.8) {
    const factor = radius / (radius - v4.w + 0.001);
    return {
      x: v4.x * factor,
      y: v4.y * factor,
      z: v4.z * factor,
      w: v4.w,
      scale: factor
    };
  },

  /**
   * Polytope Generator: Tesseract (8-Cell / Hypercube)
   * 16 vertices, 32 edges, 24 faces, 8 cubic cells
   */
  createTesseract() {
    const vertices = [];
    for (let i = 0; i < 16; i++) {
      const x = (i & 1) ? 1 : -1;
      const y = (i & 2) ? 1 : -1;
      const z = (i & 4) ? 1 : -1;
      const w = (i & 8) ? 1 : -1;
      vertices.push(new Vector4(x, y, z, w));
    }

    const edges = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        const diff = i ^ j;
        if (diff > 0 && (diff & (diff - 1)) === 0) {
          edges.push([i, j]);
        }
      }
    }

    const faces = [];
    for (let c1 = 0; c1 < 4; c1++) {
      for (let c2 = c1 + 1; c2 < 4; c2++) {
        const bit1 = 1 << c1;
        const bit2 = 1 << c2;
        for (let fixed = 0; fixed < 16; fixed++) {
          if ((fixed & bit1) === 0 && (fixed & bit2) === 0) {
            const v0 = fixed;
            const v1 = fixed | bit1;
            const v2 = fixed | bit1 | bit2;
            const v3 = fixed | bit2;
            faces.push([v0, v1, v2, v3]);
          }
        }
      }
    }

    const cells = [
      { name: "Positive W (+W Cell)", axis: 3, val: 1, indices: [] },
      { name: "Negative W (-W Cell)", axis: 3, val: 0, indices: [] },
      { name: "Positive X (+X Cell)", axis: 0, val: 1, indices: [] },
      { name: "Negative X (-X Cell)", axis: 0, val: 0, indices: [] },
      { name: "Positive Y (+Y Cell)", axis: 1, val: 1, indices: [] },
      { name: "Negative Y (-Y Cell)", axis: 1, val: 0, indices: [] },
      { name: "Positive Z (+Z Cell)", axis: 2, val: 1, indices: [] },
      { name: "Negative Z (-Z Cell)", axis: 2, val: 0, indices: [] },
    ];

    cells.forEach(cell => {
      const bit = 1 << cell.axis;
      for (let i = 0; i < 16; i++) {
        if (cell.val === 1 && (i & bit)) cell.indices.push(i);
        if (cell.val === 0 && !(i & bit)) cell.indices.push(i);
      }
    });

    return {
      type: 'Tesseract',
      name: 'Tesseract (Hypercube / 8-Cell)',
      schlafli: '{4,3,3}',
      vertices,
      edges,
      faces,
      cells,
      vertexCount: 16,
      edgeCount: 32,
      faceCount: 24,
      cellCount: 8,
      description: 'The 4-dimensional analogue of a cube. Bound by 8 cubic cells, 24 square faces, 32 edges, and 16 vertices.'
    };
  },

  /**
   * Polytope Generator: 16-Cell (Hexadecachoron)
   * Dual of the Tesseract: 8 vertices, 24 edges, 32 faces, 16 tetrahedral cells
   */
  create16Cell() {
    const vertices = [
      new Vector4( 1.4,  0,    0,    0),
      new Vector4(-1.4,  0,    0,    0),
      new Vector4( 0,    1.4,  0,    0),
      new Vector4( 0,   -1.4,  0,    0),
      new Vector4( 0,    0,    1.4,  0),
      new Vector4( 0,    0,   -1.4,  0),
      new Vector4( 0,    0,    0,    1.4),
      new Vector4( 0,    0,    0,   -1.4),
    ];

    const edges = [];
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        if (Math.floor(i / 2) !== Math.floor(j / 2)) {
          edges.push([i, j]);
        }
      }
    }

    const faces = [];
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        if (Math.floor(i / 2) === Math.floor(j / 2)) continue;
        for (let k = j + 1; k < 8; k++) {
          if (Math.floor(i / 2) === Math.floor(k / 2) || Math.floor(j / 2) === Math.floor(k / 2)) continue;
          faces.push([i, j, k]);
        }
      }
    }

    return {
      type: '16-Cell',
      name: '16-Cell (Hexadecachoron)',
      schlafli: '{3,3,4}',
      vertices,
      edges,
      faces,
      cells: [],
      vertexCount: 8,
      edgeCount: 24,
      faceCount: 32,
      cellCount: 16,
      description: 'The regular cross-polytope in 4 dimensions and the dual of the hypercube. Bound by 16 tetrahedral cells.'
    };
  },

  /**
   * Polytope Generator: 5-Cell (Pentachoron / 4-Simplex)
   * 5 vertices, 10 edges, 10 triangular faces, 5 tetrahedral cells
   */
  create5Cell() {
    const s5 = Math.sqrt(5);
    const vertices = [
      new Vector4(1, 1, 1, -1 / s5),
      new Vector4(1, -1, -1, -1 / s5),
      new Vector4(-1, 1, -1, -1 / s5),
      new Vector4(-1, -1, 1, -1 / s5),
      new Vector4(0, 0, 0, s5 - 1 / s5)
    ];

    const scale = 1.3;
    vertices.forEach(v => v.multiplyScalar(scale / 1.7));

    const edges = [];
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        edges.push([i, j]);
      }
    }

    const faces = [];
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          faces.push([i, j, k]);
        }
      }
    }

    return {
      type: '5-Cell',
      name: '5-Cell (Pentachoron / 4-Simplex)',
      schlafli: '{3,3,3}',
      vertices,
      edges,
      faces,
      cells: [],
      vertexCount: 5,
      edgeCount: 10,
      faceCount: 10,
      cellCount: 5,
      description: 'The simplest possible 4D regular polytope, analogous to the tetrahedron in 3D and triangle in 2D.'
    };
  },

  /**
   * Polytope Generator: 24-Cell (Icositetrachoron)
   * 24 vertices, 96 edges, 96 faces, 24 octahedral cells
   */
  create24Cell() {
    const vertices = [];
    const signs = [-1, 1];
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        for (let s1 of signs) {
          for (let s2 of signs) {
            const arr = [0, 0, 0, 0];
            arr[i] = s1;
            arr[j] = s2;
            vertices.push(new Vector4(arr[0] * 1.1, arr[1] * 1.1, arr[2] * 1.1, arr[3] * 1.1));
          }
        }
      }
    }

    const edges = [];
    const targetDistSq = 2 * 1.1 * 1.1;
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        const dSq = vertices[i].distanceTo(vertices[j]) ** 2;
        if (Math.abs(dSq - targetDistSq) < 0.05) {
          edges.push([i, j]);
        }
      }
    }

    return {
      type: '24-Cell',
      name: '24-Cell (Icositetrachoron)',
      schlafli: '{3,4,3}',
      vertices,
      edges,
      faces: [],
      cells: [],
      vertexCount: 24,
      edgeCount: 96,
      faceCount: 96,
      cellCount: 24,
      description: 'One of the jewels of 4D geometry: a self-dual regular polytope that exists strictly in 4 dimensions with no 3D or 5D equivalent!'
    };
  },

  /**
   * Polytope Generator: 4D Hypersphere (Glome)
   */
  createHypersphere(bands = 8, ringPoints = 24) {
    const vertices = [];
    const edges = [];
    const r = 1.3;

    for (let b = 1; b < bands; b++) {
      const psi = (b / bands) * Math.PI;
      const sinPsi = Math.sin(psi);
      const cosPsi = Math.cos(psi);

      for (let ring = 0; ring < 3; ring++) {
        const startIndex = vertices.length;
        for (let p = 0; p < ringPoints; p++) {
          const theta = (p / ringPoints) * Math.PI * 2;
          let x, y, z;
          if (ring === 0) {
            x = r * sinPsi * Math.cos(theta);
            y = r * sinPsi * Math.sin(theta);
            z = 0;
          } else if (ring === 1) {
            x = r * sinPsi * Math.cos(theta);
            y = 0;
            z = r * sinPsi * Math.sin(theta);
          } else {
            x = 0;
            y = r * sinPsi * Math.cos(theta);
            z = r * sinPsi * Math.sin(theta);
          }
          const w = r * cosPsi;
          vertices.push(new Vector4(x, y, z, w));

          if (p > 0) {
            edges.push([startIndex + p - 1, startIndex + p]);
          }
        }
        edges.push([startIndex + ringPoints - 1, startIndex]);
      }
    }

    return {
      type: 'Hypersphere',
      name: '4D Hypersphere (Glome / 3-Sphere)',
      schlafli: 'S³',
      vertices,
      edges,
      faces: [],
      cells: [],
      vertexCount: vertices.length,
      edgeCount: edges.length,
      faceCount: 0,
      cellCount: 1,
      description: 'A 3-sphere embedded in 4-dimensional Euclidean space defined by x² + y² + z² + w² = R².'
    };
  },

  /**
   * Dalí Net (Salvador Dalí's Corpus Hypercubus) Unfold:
   * Maps each vertex towards the 3D unfolded Latin cross net based on unfoldFactor [0, 1].
   */
  getDaliUnfoldedPosition(v, index, unfoldFactor) {
    if (unfoldFactor <= 0.001) return null;

    // 8 cubes arranged along 3D cross
    // Assign vertex to its primary cube in Dalí net
    const isWPos = v.w > 0;
    const isXPos = v.x > 0;
    const isYPos = v.y > 0;
    const isZPos = v.z > 0;

    let targetX = v.x * 0.7;
    let targetY = v.y * 0.7;
    let targetZ = v.z * 0.7;

    // Shift cubes outwards in Dalí net shape
    if (isWPos) {
      targetY += 1.8;
    } else {
      targetY -= 1.0;
    }
    if (isXPos && !isWPos) targetX += 1.6;
    if (!isXPos && !isWPos) targetX -= 1.6;
    if (isZPos && !isWPos) targetZ += 1.6;
    if (!isZPos && !isWPos) targetZ -= 1.6;

    return {
      x: targetX,
      y: targetY,
      z: targetZ,
      w: 0
    };
  }
};
