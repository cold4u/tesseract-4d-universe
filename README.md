# 4D Tesseract & Universe Interactive Experience 🌌

An interactive web application dedicated to the 4th dimension ($4\text{D}$), the tesseract (hypercube), higher-dimensional geometry, and their deep connection to modern cosmology and theoretical physics (Minkowski spacetime, General Relativity, Kaluza-Klein theory, and String Theory).

## 🚀 Quick Start

To launch and run the website locally:

```bash
cd /home/shubhamkumarpatel9911/.gemini/antigravity/scratch/tesseract-4d-universe
python3 -m http.server 8080
```

Then open your browser and navigate to:
```
http://localhost:8080
```
Or simply double-click and open `index.html` in any modern web browser (Google Chrome, Firefox, Safari, Edge).

---

## ✨ Features

### 1. Real-Time 4D Polytope Observatory
- **Full 6-Plane 4D Rotation**:
  - 3D spatial rotations: $XY$, $XZ$, $YZ$.
  - 4D hyper-rotations: $XW$, $YW$, $ZW$ (the transformations that turn the 4D hypercube "inside out" in 3D perspective projection).
- **Interactive 3D Navigation**:
  - Full OrbitControls: Click & drag to rotate in 3D, scroll to zoom in/out, right-click to pan.
  - Vertex Inspector: Hover over any vertex to inspect real-time 4D coordinates $(x,y,z,w)$ and projected 3D coordinates $(x',y',z')$.
- **Hyperspatial Geometry**:
  - 16 glowing vertices dynamically colored according to their 4th-dimension $w$-coordinate (electric cyan for $+w$, ultraviolet magenta for $-w$).
  - 32 tubular edges with gradient depth.
  - 8 cubic cells (translucent volumetric hyper-faces) with opacity control.
- **Dalí Cross Unfold**:
  - Morph the 4D tesseract into Salvador Dalí's 3D cross net (*Corpus Hypercubus*).
- **Multiple 4D Polytopes**:
  - **Tesseract (8-Cell)** $\{4,3,3\}$: 16 vertices, 32 edges, 24 faces, 8 cubes.
  - **16-Cell (Hexadecachoron)** $\{3,3,4\}$: 8 vertices, 24 edges, 32 faces, 16 tetrahedra.
  - **5-Cell (Pentachoron / 4-Simplex)** $\{3,3,3\}$: 5 vertices, 10 edges, 10 faces, 5 tetrahedra.
  - **24-Cell (Icositetrachoron)** $\{3,4,3\}$: Unique 4D regular polytope with no 3D or 5D analogue!
  - **4D Hypersphere (Glome / 3-Sphere)**: Hyperspherical coordinate visualization.

### 2. 4D Hyperplane Slicing Laboratory
- Explore the **Flatland dimensional analogy**:
  - Just as a 2D Flatlander sees a growing and shrinking circle when a 3D sphere passes through their world, 3D beings perceive 4D objects as morphing 3D cross-sections!
  - Move the $w$-hyperplane slider between $-1.5$ and $+1.5$ to witness:
    - **Axis-aligned tesseract**: a 3D cube flashing into existence.
    - **Corner-first tesseract**: point $\to$ expanding tetrahedron $\to$ truncated tetrahedron $\to$ regular octahedron $\to$ point!
    - **4D Hypersphere (Glome)**: point $\to$ expanding 3D sphere $\to$ contracting 3D sphere $\to$ point!

### 3. Theoretical Physics & Cosmology
- **Minkowski Spacetime**: Invariant interval $ds^2 = -c^2dt^2 + dx^2 + dy^2 + dz^2$.
- **General Relativity**: Gravity as the physical curvature of 4D spacetime.
- **Kaluza-Klein Theory**: 5th dimension unifying electromagnetism and gravity.
- **String Theory & Calabi-Yau**: 10D and 11D supergravity with compactified manifolds.
- **Salvador Dalí's Corpus Hypercubus**: Art and higher-dimensional geometry.

### 4. Generative Cosmic Soundscape
- Built with the **Web Audio API** (zero external sound files needed).
- Generates deep space drones, 432Hz harmonic overtones, breathing resonant filter sweeps, and interactive celestial chimes when hovering over vertices or switching hyper-planes.

---

## 📁 Project Architecture

```
tesseract-4d-universe/
├── index.html        # Main presentation page & HUD layout
├── styles.css        # Cosmic cyberpunk glassmorphism stylesheet
├── README.md         # Documentation & guide
└── js/
    ├── math4d.js     # 4D Vector operations, Givens rotations & polytope generators
    ├── renderer3d.js # Three.js cosmic scene + Canvas 3D offline fallback
    ├── slicer.js     # 4D hyperplane cross-section slicing simulator
    ├── audio.js      # Generative Web Audio API ambient cosmic soundscape
    └── app.js        # Controller tying UI, telemetry, and 3D visualizers
```

---

## 🧮 Mathematical Reference

### 4D to 3D Perspective Projection
For a point $P = (x, y, z, w) \in \mathbb{R}^4$ and 4D camera distance $d$:
$$\text{scale} = \frac{1}{d - w}$$
$$P_{3D} = (x \cdot \text{scale},\; y \cdot \text{scale},\; z \cdot \text{scale})$$

As the object rotates through the $XW$, $YW$, or $ZW$ planes, $w$ changes dynamically, producing the characteristic inversion where the inner cube appears to turn inside-out and engulf the outer cube.
