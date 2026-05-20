# Kit-of-Parts — 3D Modular Building Configurator

<div align="center">

![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Three.js](https://img.shields.io/badge/Three.js-0.183-black?logo=three.js)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)
[![Deploy](https://img.shields.io/badge/GitHub%20Pages-live-blue?logo=github)](https://onuresen.github.io/Kit-of-Parts/)

*In-browser 3D configurator for modular / prefabricated building systems — with structural simulations, Japanese compliance checks, and real-time cost & carbon tracking.*

**[→ Open Live Demo](https://onuresen.github.io/Kit-of-Parts/)**

</div>

---

## What is Kit-of-Parts?

Kit-of-Parts is a client-side React SPA that lets architects and engineers assemble, analyse, and simulate modular building systems directly in the browser — no install, no server. Load a bundled sample kit or import your own JSON, then explore the building in 3D, run earthquake or fire simulations, check Japanese seismic and fire compliance, and export a cost/carbon/BOM report to PDF.

> **"Configure once. Simulate everything."**

It does **not** replace a BIM tool. It sits alongside one — as a lightweight, shareable decision layer for early-stage design and prefab planning.

---

## Features

### 3D Viewer
| Capability | Details |
|---|---|
| **Explode mode** | Parts fan apart along their explosion vectors (GSAP, elastic/expo easing) |
| **Assembly sequence** | Step through the construction sequence; tower crane follows each part |
| **Section cut** | Live horizontal clipping plane — drag to slice anywhere on Y |
| **Dimension lines** | 3D measurement overlays across the active kit |
| **Cinematic demo** | Scripted GSAP timeline: hero orbit → explode → reassemble → metrics reveal |
| **Assembly game** | Click parts in sequence order; score mistakes and elapsed time |
| **Screenshot share** | Captures the WebGL canvas with a metrics badge to clipboard |

### Structural Simulations

| Simulation | What it does |
|---|---|
| **Earthquake** | Magnitude 3–9 Richter slider. Parts sway with amplitude scaled by seismic grade; base-isolated connections damp movement by 80%. 3-2-1 brace countdown, indicative PGA readout, and survived / at-risk verdict after each run. Camera rumble, shockwave rings, fault-line cracks, and stress labels via `EarthquakeEffects.jsx`. |
| **Fire spread** | Ignite any part and watch fire propagate through connections over time. Per-part fire resistance grades (non-rated / 1hr / 2hr) set the failure timer. Extinguish at any point. Flame columns, smoke plumes, and heat-ring visuals via `FireEffects.jsx`. |
| **Wind analysis** | Pressure arrows on every facade face (windward blue / leeward red / roof uplift). Arrow scale pulses with live wind speed. Animated wind-field ribbons and speed beads via `WindStreamlines.jsx`. |
| **Water / rain** | Instanced rain streaks, puddle accumulation, and splash rings. Wind-driven pressure heatmap on all five faces of each part — colour-coded light blue → deep blue → red with sinusoidal pulsing opacity. |

### Material & Compliance Overlays
| Overlay | What it does |
|---|---|
| **Thermal bridge** | Pulsing spheres at connection midpoints; colour by active variant thermal conductivity (W/m·K) |
| **Acoustic STC** | Parts colour-shifted red → green by STC rating; floating STC labels in 3D |
| **Supply chain risk** | Lead-time-derived risk badges (low / medium / high). Shortage simulation swaps high-risk variants to safer alternatives |
| **Fire compartments** | AABB wireframe per compartment with worst fire rating colour; BSL 500 m² area limit check |

### Crane & Logistics
| Feature | Details |
|---|---|
| **Tower crane** | Animated 3D mast, jib, trolley, and hook. Trolley slews to each part during sequence mode |
| **Multi-crane collision** | Second crane with X-offset slider. Overlapping jib radii shown as a translucent red anti-collision disc |
| **Lift path planner** | Click pick-up and installation points on the site grid; crane sweeps a GSAP arc to each |
| **Crane cab view** | First-person camera locked to the crane trolley; press Cab View in the panel |
| **Wind load (Beaufort)** | CranePanel shows Beaufort scale, EN 14439 load %, and lifts windSpeed to shared state |

### Site & Factory
| Mode | Details |
|---|---|
| **Site plan** | Ken grid (18.2 m / 910 mm module), top-down camera, unit placement palette |
| **Factory layout planner** | Parts laid flat in sequence order across production bays. Bay warnings for weight (>3 t), size overflow, and lead-time bottlenecks (>45 d). Drag bays to reorder sequence |
| **Floor plan generator** | 2D canvas projection of all visible parts (XZ plane), Ken grid overlay, SVG export |

### Reporting & Export
| Export | Details |
|---|---|
| **Metrics panel** | Tabs: cost · carbon · BOM · prefab · structural · schedule (Gantt) · AI optimiser · Pareto · supply chain |
| **Gantt chart** | CSS bars per part grouped by week; hover a week to dim non-week parts in 3D |
| **PDF report** | 施工要領書-style report with metrics and BOM via jsPDF |
| **IFC export** | BuildingSMART IFC format via `ifcExporter.js` |
| **SVG floor plan** | Vector export from FloorPlanPanel |

### AI Carbon Optimiser
Rule engine scans all variant combinations and finds the lowest-carbon option that still meets the required seismic grade. Apply per-part or all-at-once. Lives in the ✦ AI tab of MetricsPanel.

### Carbon vs Cost Pareto Frontier
Enumerates variant combinations (capped at 5 000 samples), finds Pareto-optimal set, and renders an interactive SVG scatter. Click any point to apply that variant combo.

---

## Sample Kits

Four bundled kits ship in `/public/`:

| Kit | Description |
|---|---|
| `default-kit.json` | Basic starter — foundation, columns, beams, walls, roof |
| `advanced-kit.json` | 12-part demonstrator with full variant data for all overlays and simulations |
| `eco-kit.json` | Low-carbon material selections; CASBEE S targets |
| `premium-kit.json` | High-spec materials with damper and base-isolation connections |

Load via the **Sidebar → Sample Kit** buttons, or drag and drop your own JSON.

---

## Compliance Standards

Kit-of-Parts implements Japanese building compliance data at the variant level:

| Standard | Field | Values |
|---|---|---|
| **Seismic grade** (耐震等級) | `seismic_grade` | 1 / 2 / 3 |
| **Fire resistance** | `fire_resistance_grade` | `non-rated` / `1hr` / `2hr` |
| **BSL compliance** | `bsl_compliant` | `true` / `false` |
| **CASBEE rating** | Computed from carbon + materials | S / A / B+ / B− / C |
| **RIBA 2030 target** | 300 kg CO₂e/m² | Shown in Carbon tab |
| **JIS standards** | `jis_standards[]` | e.g. `["JIS A 5364"]` |

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React | 19.2.4 |
| 3D engine | Three.js + @react-three/fiber | 0.183 / 9.6 |
| 3D helpers | @react-three/drei | 10.7 |
| Animation | GSAP | 3.15 |
| Icons | lucide-react | 1.8 |
| PDF export | jsPDF | 4.2 |
| Build | Vite | 8.0.4 |
| Deploy | GitHub Pages (gh-pages) | — |

No Tailwind — all styling is custom CSS in `src/App.css`. Dark mode via `[data-theme="dark"]` on `#root-container`.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (localhost:5173)
npm run dev

# Production build → /dist
npm run build

# Deploy to GitHub Pages
npm run deploy
```

---

## Kit JSON Schema

Each part in a kit JSON follows this schema:

```json
{
  "id": "Foundation",
  "shape": "box",
  "position": [0, 0, 0],
  "size": [3, 0.5, 3],
  "explosionVector": [0, -1, 0],
  "sequence": 1,
  "structural_role": "primary",
  "factory_work": true,
  "connections": [{ "to": "Column-A", "type": "bolted" }],
  "variants": [{
    "label": "Pre-cast Concrete",
    "color": "#95a5a6",
    "unit_cost_usd": 4200,
    "labor_cost_usd": 800,
    "weight_kg": 1200,
    "carbon_kgco2e": 420,
    "seismic_grade": 3,
    "fire_resistance_grade": "2hr",
    "bsl_compliant": true,
    "jis_standards": ["JIS A 5364"],
    "lead_time_days": 21,
    "assembly_time_min": 45,
    "load_bearing_kn": 800,
    "sku": "PC-F-001",
    "supplier": "Sumitomo Kensetsu"
  }]
}
```

**Connection types:** `dry-fit` · `bolted` · `welded` · `adhesive` · `damper` · `base-isolation`

**Optional overlay fields** (auto-derived from defaults if absent):
`thermal_conductivity_wpmk` · `stc_rating` · `supply_risk` · `fire_compartment` · `recyclability_pct`

---

## Project Structure

```
src/
  App.jsx                  Root orchestrator — all global state (~55 state vars)
  App.css                  All styles (~2000 lines). Dark mode via [data-theme="dark"]
  components/
    Scene.jsx              <Canvas> host — Three.js scene graph
    Part.jsx               Individual 3D part with all overlay/animation props
    Crane.jsx              Tower crane mesh + GSAP jib slew
    Connection.jsx         Animated connector lines between parts
    EarthquakeEffects.jsx  Camera rumble, shockwave rings, fault cracks
    FireEffects.jsx        Flame columns, smoke, embers, point lights
    WindArrows.jsx         Pressure arrows per facade face
    WindStreamlines.jsx    Animated wind-field ribbons
    RainSimulation.jsx     Instanced rain + puddles + splash rings
    WaterPressure.jsx      Pressure heatmap planes
    ThermalOverlay.jsx     Connection-midpoint thermal bridge nodes
    FireCompartments.jsx   AABB wireframe + BSL area check
    FactoryGrid.jsx        Production bay layout planner
    SiteGrid.jsx           Ken grid for site plan mode
    CinematicMode.jsx      Scripted GSAP demo tour
    DimensionLines.jsx     3D measurement overlays
    ViewCube.jsx           Navigation cube (bottom-right)
    Toolbar.jsx            Top-centre action bar
    Sidebar.jsx            Left panel — visibility, presets, kit loader
    InfoPanel.jsx          Right panel — selected part detail + variants
    CranePanel.jsx         Right panel — crane controls + wind sim
    MetricsPanel.jsx       Bottom-left modal — all analysis tabs
    EarthquakePanel.jsx    Earthquake controls + verdict
    FirePanel.jsx          Fire simulation controls
    FloorPlanPanel.jsx     2D floor plan canvas + SVG export
    GanttPanel.jsx         CSS Gantt chart with 3D week highlight
    AIOptimiserPanel.jsx   AI carbon optimiser tab
    BuilderPanel.jsx       Part editor — shape, position, variants
    GameScorePanel.jsx     Assembly game completion overlay
    ShortcutsModal.jsx     Keyboard shortcuts reference
  utils/
    ifcExporter.js         IFC (BuildingSMART) export
    pdfGenerator.js        PDF 施工要領書 report
    materialMetrics.js     Shared material defaults (thermal/STC/risk)
  KitContext.jsx           Context provider — parts, presets, undo/redo, localStorage
public/
  default-kit.json         Basic sample kit
  advanced-kit.json        12-part feature-test kit
  eco-kit.json             Low-carbon kit
  premium-kit.json         High-spec kit
```

---

## Keyboard Shortcuts

<details>
<summary>Show all shortcuts</summary>

| Key | Action |
|---|---|
| `E` | Toggle explode mode |
| `S` | Toggle assembly sequence mode |
| `↑ / ↓` | Step sequence forward / back |
| `M` | Open metrics panel |
| `D` | Toggle dimension lines |
| `X` | Toggle section cut |
| `G` | Toggle site grid mode |
| `F` | Toggle factory layout mode |
| `C` | Toggle crane |
| `W` | Toggle wind analysis |
| `T` | Toggle thermal overlay |
| `A` | Toggle acoustic overlay |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Escape` | Deselect / close panels |
| `?` | Show shortcuts reference |

</details>

---

## State Persistence

Kit data auto-saves to `localStorage` key `ic-kit-save` on every change. Dark mode preference persists under `ic-dark`. Export/import full kit state as JSON via the Sidebar file controls.
