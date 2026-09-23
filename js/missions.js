/**
 * Voyager 1 & 2 Interstellar Mission Telemetry & Deep Space Exploration
 * Features live distance calculation, Golden Record inspection, and mission timelines.
 */

export class MissionsManager {
  constructor(telemetryContainerId) {
    this.container = document.getElementById(telemetryContainerId);
    // Baseline reference: Voyager 1 on Jan 1, 2024 was ~162.7 AU (~24.34 billion km)
    // Moving at ~16.9 km/s (~3.56 AU/year)
    this.v1BaseTime = new Date('2024-01-01T00:00:00Z').getTime();
    this.v1BaseKm = 24340000000;
    this.v1SpeedKmPerSec = 16.9;

    // Voyager 2 reference: ~135.8 AU (~20.31 billion km)
    // Moving at ~15.3 km/s (~3.22 AU/year)
    this.v2BaseTime = new Date('2024-01-01T00:00:00Z').getTime();
    this.v2BaseKm = 20310000000;
    this.v2SpeedKmPerSec = 15.3;

    this.activeProbe = 'voyager1';
    this.init();
  }

  init() {
    this.updateLiveTelemetry = this.updateLiveTelemetry.bind(this);
    this.updateLiveTelemetry();
    this.timer = setInterval(this.updateLiveTelemetry, 1000);
  }

  getVoyagerStats(probe) {
    const now = Date.now();
    const isV1 = probe === 'voyager1';
    const baseTime = isV1 ? this.v1BaseTime : this.v2BaseTime;
    const baseKm = isV1 ? this.v1BaseKm : this.v2BaseKm;
    const speed = isV1 ? this.v1SpeedKmPerSec : this.v2SpeedKmPerSec;

    const elapsedSeconds = (now - baseTime) / 1000;
    const currentKm = baseKm + elapsedSeconds * speed;
    const currentAU = currentKm / 149597870.7; // 1 AU = ~149.6M km

    // One-way light time: distance / speed of light (299,792 km/s)
    const lightSeconds = currentKm / 299792;
    const lightHours = Math.floor(lightSeconds / 3600);
    const lightMinutes = Math.floor((lightSeconds % 3600) / 60);
    const lightSecs = Math.floor(lightSeconds % 60);

    return {
      name: isV1 ? 'Voyager 1' : 'Voyager 2',
      km: currentKm,
      au: currentAU,
      speedKmS: speed,
      speedMph: speed * 2236.94,
      lightTime: `${lightHours}h ${lightMinutes}m ${lightSecs}s`,
      status: 'Interstellar Space (Crossing Oort Cloud in ~300 years)',
      launchDate: isV1 ? 'September 5, 1977' : 'August 20, 1977'
    };
  }

  setProbe(probeKey) {
    this.activeProbe = probeKey;
    this.updateLiveTelemetry();
  }

  updateLiveTelemetry() {
    if (!this.container) return;
    const data = this.getVoyagerStats(this.activeProbe);

    this.container.innerHTML = `
      <div class="voyager-ticker-card">
        <div class="voyager-head">
          <div>
            <span class="cosmic-badge">Active Deep Space Probe</span>
            <h3 class="voyager-title">${data.name} Telemetry</h3>
          </div>
          <div class="btn-group-chips">
            <button class="chip-btn ${this.activeProbe === 'voyager1' ? 'active' : ''}" data-probe="voyager1">Voyager 1</button>
            <button class="chip-btn ${this.activeProbe === 'voyager2' ? 'active' : ''}" data-probe="voyager2">Voyager 2</button>
          </div>
        </div>

        <div class="voyager-main-metric">
          <span class="v-label">Current Distance from Earth</span>
          <div class="v-counter-num">${Math.floor(data.km).toLocaleString()} <span class="v-unit">km</span></div>
          <div class="v-au-badge">${data.au.toFixed(4)} Astronomical Units (AU)</div>
        </div>

        <div class="bh-metrics-grid" style="margin-top: 1rem;">
          <div class="bh-metric-item">
            <span class="metric-title">One-Way Light Time</span>
            <span class="metric-value" style="color: var(--accent-cyan);">${data.lightTime}</span>
          </div>
          <div class="bh-metric-item">
            <span class="metric-title">Cruising Velocity</span>
            <span class="metric-value">${data.speedKmS.toFixed(1)} km/s (${Math.round(data.speedMph).toLocaleString()} mph)</span>
          </div>
          <div class="bh-metric-item">
            <span class="metric-title">Mission Age</span>
            <span class="metric-value">49+ Years in Flight</span>
          </div>
          <div class="bh-metric-item">
            <span class="metric-title">Heliopause Boundary</span>
            <span class="metric-value" style="color: #4ade80;">Crossed into Interstellar Void</span>
          </div>
        </div>
      </div>
    `;

    // Rebind probe buttons
    const btns = this.container.querySelectorAll('[data-probe]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setProbe(btn.getAttribute('data-probe'));
      });
    });
  }
}
