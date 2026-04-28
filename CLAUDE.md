# Kit-of-Parts

## Keeping This File Up to Date

**After every session that adds, removes, or significantly changes a feature, update this file.**
Specifically update: the Component Map (new files), the State Inventory (new App.jsx state), the Feature Backlog (mark shipped items, add new ideas), and any relevant implementation notes. A future session should never need to re-read the codebase just to understand the project — this file should be enough.

---

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/plan-devex-review`, `/devex-review`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

---

## Project Overview

**Kit-of-Parts** is a client-side React SPA — a 3D interactive architectural configurator for modular/prefabricated building systems. Targets architects and engineers with focus on Japanese building standards (seismic, fire, Ken grid, CASBEE).

**Dev server:** `npm run dev` (Vite on localhost:5173)
**Build:** `npm run build` → `/dist/`
**Deploy:** GitHub Pages — base path `/Kit-of-Parts/` (set in `vite.config.js`)
**Deploy command:** `npm run deploy` (gh-pages)

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React | 19.2.4 |
| 3D | Three.js + @react-three/fiber | 0.183 / 9.6 |
| 3D helpers | @react-three/drei | 10.7 |
| Animation | GSAP | 3.15 |
| Icons | lucide-react | 1.8 |
| PDF export | jspdf | 4.2 |
| Build | Vite | 8.0.4 |

No Tailwind — all styling is custom CSS in `src/App.css` plus inline styles. Dark mode via `[data-theme="dark"]` attribute on `#root-container`.

---

## Architecture

### State Management (3 layers)

**1. `src/KitContext.jsx`** — persistent, survives re-renders
- `parts[]` — array of part objects (CRUD, undo/redo 30-step history)
- `presets[]` — named variant configurations
- `projectSettings` — `{ currency: 'USD'|'JPY', standard: 'JP'|'EN' }`
- Auto-saves to `localStorage` key `ic-kit-save`
- File I/O: load/export kit JSON
- Exposes: `duplicatePart`, `removePart`, `undo`, `redo`, `canUndo`, `canRedo`, `formatCurrency`

**2. `src/App.jsx`** — session state (~35 state vars as of last update)

| State var | Type | Purpose |
|---|---|---|
| `exploded` | bool | Explode mode active |
| `selected` | part\|null | Currently selected part object |
| `visible` | `{[id]: bool}` | Part visibility map |
| `selectedVariants` | `{[id]: number}` | Variant index per part |
| `activePreset` | id\|null | Currently applied preset |
| `sequenceMode` | bool | Assembly sequence active |
| `sequenceStep` | number | Current step (0 = all ghost) |
| `showMetrics` | bool | MetricsPanel open |
| `showDimensions` | bool | DimensionLines visible |
| `sectionCutActive` | bool | Section cut plane on |
| `sectionCutY` | number | Section cut Y position |
| `envSettings` | object | `{ grass, time, clouds, stars, kenGrid }` |
| `siteMode` | bool | Site plan mode |
| `placedUnits` | array | `[{ col, row, presetId }]` |
| `selectedUnitType` | id | Active unit type for site placement |
| `builderMode` | bool | Part editor mode |
| `cameraCmd` | object\|null | `{ type:'preset'\|'frame', ...opts, ts }` — change `ts` to re-fire |
| `darkMode` | bool | Persisted to localStorage `ic-dark` |
| `showShortcuts` | bool | Keyboard shortcuts modal |
| `showCrane` | bool | Crane 3D + panel visible |
| `showCraneRadius` | bool | Crane reach rings visible |
| `cinematicMode` | bool | Cinematic demo tour active |
| `rendererRef` | ref | WebGL renderer (captured via `onRendererReady`) |
| `gameMode` | bool | Assembly game active |
| `gamePhase` | `'idle'\|'playing'\|'complete'` | |
| `gameStep` | number | Current target part index |
| `gameMistakes` | number | Wrong clicks |
| `gameElapsed` | number | Timer ms |
| `highlightedWeek` | number\|null | Gantt week hovered — dims non-week parts in 3D |
| `showSecondCrane` | bool | Second crane + collision disc visible |
| `secondCraneX` | number | X offset of second crane from first (default −8) |
| `showWindArrows` | bool | Wind load arrow overlay active |
| `windSpeed` | number | Shared wind speed (m/s) — lifted from CranePanel |
| `showWaterSim` | bool | Water simulation overlay active (rain + pressure planes) |
| `showFloorPlan` | bool | Floor plan modal open |
| `showEarthquake` | bool | Earthquake panel visible |
| `earthquakeMagnitude` | number | Richter 3–9 |
| `isShaking` | bool | Shake animation running |
| `hasShaken` | bool | Verdict visible (true after shake completes) |

**3. Component-level** — hover, animation refs, panel open states

### Data Flow
User action → App state update → props flow to Scene/panels → GSAP tweens animate → Three.js `useFrame` updates per-frame

### Camera Command Pattern
To trigger camera movement from outside Scene: `setCameraCmd({ type: 'preset', preset: 'front', ts: Date.now() })`. The `ts` field is what triggers the `useEffect` in `CameraController`. Preset names: `front`, `back`, `top`, `bottom`, `right`, `left`, `home`.

### Kit JSON Schema (per part)
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
Default kits in `/dist/`: `default-kit.json`, `eco-kit.json`, `premium-kit.json`

---

## Component Map

### Core
| File | Role |
|---|---|
| `src/App.jsx` | Root orchestrator, all global state, handlers |
| `src/components/KitContext.jsx` | Context provider, persistence, undo/redo |
| `src/App.css` | All styles (~2000 lines). Dark mode via `[data-theme="dark"]` prefix |

### 3D / Scene
| File | Role |
|---|---|
| `src/components/Scene.jsx` | `<Canvas>` host. Props: all mode flags + `onRendererReady`, `cinematicMode`, `onCinematicEnd`, `onSetExploded`, `onSetSequenceMode`, `onSetSequenceStep`, `onSetShowMetrics`, `maxStep`. `gl={{ preserveDrawingBuffer: true }}` for screenshots |
| `src/components/Part.jsx` | Individual part: GLB models, GSAP explode/sequence animations, selection highlight, clipping planes, game mode ghosting |
| `src/components/Connection.jsx` | Animated lines between connected parts. Color by type: dry-fit=#27ae60, bolted=#e67e22, welded=#e74c3c, adhesive=#3498db, damper=#9b59b6, base-isolation=#1abc9c |
| `src/components/Crane.jsx` | Tower crane 3D mesh (mast, jib, hook, trolley). Animates trolley to part positions during sequence mode |
| `src/components/CinematicMode.jsx` | GSAP timeline for scripted demo tour. Disables OrbitControls during playback. Calls `onEnd` when complete |
| `src/components/SiteGrid.jsx` | 18.2m Ken grid for site plan mode |
| `src/components/DimensionLines.jsx` | 3D dimension overlays |
| `src/components/ViewCube.jsx` | 3D nav cube (bottom-right). Calls `onPreset(name)` |
| `src/components/WindArrows.jsx` | Pressure arrows per part face: blue=windward, red=leeward, orange=roof. Scale pulses with `windSpeed` via `useFrame` |
| `src/components/RainSimulation.jsx` | Instanced rain particles + puddle accumulation. Up to 80 falling drops (spheres) and 20 puddle discs rendered via `instancedMesh`. Particles spawn from roof centres of visible parts, integrate gravity, land on part tops or ground, then recycle. Controlled by `showWaterSim` prop. |
| `src/components/WaterPressure.jsx` | Semi-transparent pressure heatmap planes on all 5 faces of each visible part. Color scale: light blue (low) → deep blue → red (high) based on `windSpeed`. Opacity pulses sinusoidally via `useFrame`. Controlled by `showWaterSim` prop. |

### UI Panels
| File | Role |
|---|---|
| `src/components/Toolbar.jsx` | Top-center toolbar. Imports `ShareButton`. Props: all toggle handlers + `onShare`, `shareMetrics`, `cinematicMode`, `onToggleCinematic` |
| `src/components/ShareButton.jsx` | Camera icon button — calls `onShare` prop (logic lives in App.jsx) |
| `src/components/Sidebar.jsx` | Left 220px panel: visibility toggles, presets, game HUD, kit loader |
| `src/components/InfoPanel.jsx` | Right 272px panel: selected part detail, variants, connections, environment settings |
| `src/components/CranePanel.jsx` | Right panel (when crane visible): lift specs, wind sim (Beaufort, EN 14439), load % bar |
| `src/components/MetricsPanel.jsx` | Bottom-left modal. Tabs: cost, carbon, bom, prefab, structural, ai. Props include `onVariantChange` |
| `src/components/AIOptimiserPanel.jsx` | "✦ AI" tab — rule engine finds lowest-carbon variants that still meet seismic grade. Apply individually or all at once |
| `src/components/BuilderPanel.jsx` | Part editor: name, shape, position, size, explosion vector, variant props, GLB import |
| `src/components/GameScorePanel.jsx` | Game completion overlay |
| `src/components/ShortcutsModal.jsx` | Keyboard shortcuts reference |
| `src/components/EarthquakePanel.jsx` | Right-side panel (`right:280, bottom:20`, uses `metrics-panel` class). Magnitude slider 3–9, seismic grade table, Shake button, survived/at-risk verdict |
| `src/components/FloorPlanPanel.jsx` | Full-screen modal. 2D canvas projects parts onto XZ plane (top-down). Ken grid overlay toggle. SVG export button |
| `src/components/GanttPanel.jsx` | Schedule tab inside MetricsPanel. CSS Gantt bars per part, grouped by week. Click week to highlight parts in 3D |

### Utils
| File | Role |
|---|---|
| `src/utils/ifcExporter.js` | Converts parts to IFC (BuildingSMART) format |
| `src/utils/pdfGenerator.js` | PDF reports (施工要領書) with metrics and BOM |

---

## Key Domain Concepts

- **Parts** have variants (materials/sizes/specs), each with cost, weight, carbon, compliance data
- **Connections** typed joints: dry-fit, bolted, welded, adhesive, damper, base-isolation
- **Explode mode** — GSAP fans parts along their `explosionVector`. Elastic easing when connected, expo-out otherwise
- **Sequence mode** — parts animate in by `sequence` field order; crane follows
- **Site mode** — Ken grid (18.2m / 910mm module), camera elevated top-down
- **Game mode** — all parts ghosted except current target `gameStep`; wrong clicks = mistake
- **Section cut** — Three.js clipping plane at Y = `sectionCutY`
- **Cinematic mode** — GSAP timeline: hero orbit → explode → reassemble → sequence walk → metrics reveal → final orbit
- **Share** — `gl.domElement.toDataURL()` (needs `preserveDrawingBuffer: true` on Canvas) + 2D canvas badge overlay + clipboard caption
- **Compliance standards**: seismic grades 1/2/3 (耐震等級), fire resistance (1hr/2hr/non-rated), CASBEE (S/A/B+/B-/C), RIBA 2030 (300 kg CO₂e/m²), BSL, JIS

---

## Animation Patterns

- **GSAP** for all timeline animations — explode, assemble, camera moves, crane, sequence, cinematic
- **`useFrame`** for per-frame Three.js updates (materials, positions)
- **OrbitControls ref** (`controlsRef`) must be disabled (`controlsRef.current.enabled = false`) before GSAP camera moves, re-enabled after
- Camera preset positions (in `CameraController` inside `Scene.jsx`):
  - `front`: `[0,2,14]`, `back`: `[0,2,-14]`, `top`: `[0.001,16,0]`, `right`: `[14,2,0]`, `left`: `[-14,2,0]`, `home`: `[8,8,8]`

---

## Styling Conventions

- All panel styles in `src/App.css` — grouped by component with `/* ─── Component Name ───── */` headers
- Dark mode: duplicate rules under `[data-theme="dark"] .class-name { ... }`
- Glass panels: `backdrop-filter: blur(10px)`, `rgba(255,255,255,0.95)` light / `rgba(30,34,44,0.95)` dark
- Toolbar buttons: `.tb-btn` base class, `.tb-btn--active` for active state, `.tb-btn--text` for icon+text buttons
- Metrics tabs: `.metrics-tab` / `.metrics-tab--active`

---

## Performance Notes

- Material cloning per part (avoid shared state mutation)
- Connection deduplication (Set-based, rendered once per pair)
- Clipping planes GPU-side
- Suspense boundaries for GLB async loading
- `preserveDrawingBuffer: true` on Canvas — needed for screenshots, slight GPU memory cost

---

## Feature Backlog

Priority order as agreed. Build these in sequence. Each entry has enough detail to implement without re-reading the codebase.

---

### 1. Earthquake Shake Simulation ✅ SHIPPED
**What:** Magnitude slider (3.0–9.0 Richter). Press "Shake" — building sways with sinusoidal oscillation. Parts with lower seismic grades shake more and flash red. Base-isolated parts (connection type = `base-isolation`) move less. "Survived / At Risk" verdict at end.

**UI:** New button in Toolbar (`Waves` icon from lucide). New `EarthquakePanel` right-side panel with magnitude slider + verdict readout.

**State to add in App.jsx:** `earthquakeMode: bool`, `earthquakeMagnitude: number (3–9)`, `isShaking: bool`

**3D implementation:** In `Part.jsx`, when `isShaking` prop is true, run a GSAP `timeline().to(mesh.position, { x: '+=amplitude', yoyo: true, repeat: cycles, duration: 0.08 })`. Amplitude = `magnitude * 0.05 * (1 / seismicGrade)`. Base-isolated parts (check `part.connections.some(c => c.type === 'base-isolation')`) get amplitude × 0.2.

**New files:** `src/components/EarthquakePanel.jsx`
**Modified files:** `src/App.jsx` (state + handler), `src/components/Toolbar.jsx` (button), `src/components/Part.jsx` (shake prop + GSAP), `src/App.css`

---

### 2. Construction Schedule / Gantt Overlay ✅ SHIPPED
**What:** Each part already has a `sequence` field. Add a `week` field to each part (or derive from sequence). Sequence timeline becomes a Gantt chart — horizontal bars per part, grouped by week. Hover a week bar to highlight that week's parts in 3D. Export as PDF schedule.

**UI:** New "Schedule" tab in MetricsPanel (alongside cost, carbon, bom, prefab, structural, ai). Gantt rendered as CSS bars (no canvas needed).

**Data:** Add optional `week: number` field to part schema. If absent, derive: `week = Math.ceil(sequence / 2)`.

**New files:** `src/components/GanttPanel.jsx`
**Modified files:** `src/components/MetricsPanel.jsx` (add 'schedule' tab), `src/components/BuilderPanel.jsx` (add week input), `src/App.css`

---

### 3. Multi-Crane Collision Zone ✅ SHIPPED
**What:** Add a second crane to the site. Both cranes have configurable positions. The system calculates the anti-collision envelope (overlapping jib radii) and renders a translucent red disc at the danger zone. When sequence steps would put both jibs in the zone simultaneously, both freeze and flash.

**UI:** "Add Crane" button in CranePanel. Second crane position slider (X offset). Anti-collision radius shown as `<mesh>` ring on site.

**State to add in App.jsx:** `showSecondCrane: bool`, `secondCraneX: number`

**3D implementation:** In `Crane.jsx`, accept `position` prop (default [0,0,0]). Render second instance at `[secondCraneX, 0, 0]`. Collision disc: `<mesh rotation={[-PI/2,0,0]} position={[midpoint, 0, midpoint]}><circleGeometry /><meshBasicMaterial color="#e74c3c" transparent opacity={0.15} /></mesh>`.

**New files:** None
**Modified files:** `src/components/Crane.jsx` (position prop), `src/components/CranePanel.jsx` (second crane controls), `src/App.jsx`, `src/components/Scene.jsx`, `src/App.css`

---

### 4. Wind Load Arrows on Facade ✅ SHIPPED
**What:** A "Wind Analysis" toggle overlays animated pressure arrows on part faces. Windward faces get inward blue arrows, leeward faces get outward red arrows (suction), roof faces get uplift arrows. Arrow size scales with wind speed (already simulated in CranePanel's `windSpeed` state).

**UI:** Button in Toolbar (`Wind` icon). Arrows visible in Scene when active.

**State to add in App.jsx:** `showWindArrows: bool`. Share `windSpeed` from CranePanel via lifting it to App.jsx state (or pass down from CranePanel via callback `onWindChange`).

**3D implementation:** New `WindArrows.jsx` component. For each visible part, compute face normals from `part.size`. Render `<ArrowHelper>` (Three.js) or custom cone meshes at face centers. Animate scale with `useFrame` using a sine wave + windSpeed factor.

**New files:** `src/components/WindArrows.jsx`
**Modified files:** `src/App.jsx`, `src/components/Toolbar.jsx`, `src/components/Scene.jsx`, `src/components/CranePanel.jsx` (lift windSpeed to App), `src/App.css`

---

### 5. Floor Plan Auto-Generator ✅ SHIPPED
**What:** Projects all visible parts downward onto a 2D canvas. Auto-traces footprints, labels rooms/parts, shows dimensions. Export as SVG or PNG. Optionally shows Ken grid (910mm module) overlay.

**UI:** New "Floor Plan" button in Toolbar or new tab in MetricsPanel. Renders a `<canvas>` element in a modal. Export button downloads SVG.

**Implementation:** No Three.js needed. Iterate `parts` (filtered by `visible`), use `part.position` and `part.size` as XZ rectangle. Draw rects on 2D canvas, scale to fit panel. Label with `part.id`. Draw dimension lines at edges. For SVG export, build SVG string manually.

**New files:** `src/components/FloorPlanPanel.jsx`, `src/utils/floorPlanExporter.js`
**Modified files:** `src/App.jsx` (`showFloorPlan` state), `src/components/Toolbar.jsx`, `src/App.css`

---

---

### Group A — Crane Tools ⬜
**Shared files:** `Crane.jsx`, `CranePanel.jsx`, `Scene.jsx`, `App.jsx`, `App.css`

#### 6. Crane Swing Path Planner
State: `liftPlanMode: bool`, `liftStart: [col,row]|null`, `liftEnd: [col,row]|null`. UI: "Plan Lift" button in CranePanel (site mode + crane only). In `SiteGrid.jsx`, clicks set start then end when `liftPlanMode` is true. In `Crane.jsx`, GSAP animates jib slew angle start→end azimuth; sweep arc as `<line>`. Warns if arc crosses placed units.

#### 10. Crane Operator First-Person View
State: `craneCabView: bool`. UI: "Cab View" button in CranePanel. In `CameraController` (Scene.jsx), position camera at `[craneX, mastHeight+2, craneZ-1]` looking toward `[craneX+20, mastHeight, craneZ]`; disable OrbitControls. Re-enable on exit. Disable conflicting modes in Toolbar.

---

### Group B — Fire & Safety ⬜
**Shared files:** `App.jsx`, `Toolbar.jsx`, `App.css`

#### 7. Fire Spread Simulation
State: `fireMode: bool`, `fireState: {[partId]: 'ok'|'burning'|'failed'}`, `fireElapsed: number`. UI: Toolbar `Flame` icon → new `FirePanel.jsx`. In `Part.jsx`: `'burning'` → GSAP emissive `0x000000→0xff6600`; `'failed'` → `0x1a0000`. `useEffect` in App.jsx propagates fire via `part.connections` every N seconds (N from `fire_resistance_grade`: non-rated=1s, 1hr=3s, 2hr=stops spread).
New file: `FirePanel.jsx`. Also modifies: `Part.jsx`.

#### 12. Japanese Fire Compartment Visualizer
State: `showFireCompartments: bool`. UI: Toolbar `Shield` icon. Data: add optional `fire_compartment: string` to part schema. New `FireCompartments.jsx`: group parts by `fire_compartment`, compute bounding box per group, render as `<Box><meshBasicMaterial wireframe /></Box>` color-coded by fire rating. Panel shows compartment areas vs BSL limits (500 m² unsprinklered / 1500 m² sprinklered).
New file: `FireCompartments.jsx`. Also modifies: `Scene.jsx`.

---

### Group C — Material Overlays ⬜
All are variant-data-driven toggle overlays. **Shared files:** `App.jsx`, `Toolbar.jsx`, `App.css`. Add one bool state + one Toolbar button per item.

#### 8. Thermal Bridge Visualizer
State: `showThermal`. Data: add `thermal_conductivity_wpmk: number` to variant schema (steel=50, CLT=0.13, concrete=1.7). New `ThermalOverlay.jsx`: sphere at each connection midpoint, color lerp blue→red by conductivity, pulse via `useFrame`.
New file: `ThermalOverlay.jsx` (`Thermometer` icon). Also modifies: `Scene.jsx`.

#### 13. Material Supply Chain Risk
State: `showSupplyRisk`. Data: add optional `supply_risk: 'low'|'medium'|'high'` to variant (derive from `lead_time_days`: >60→high, >30→medium). New "Supply" tab in MetricsPanel + risk badge in BOM table. "Simulate shortage" button auto-switches that material's variants to next best.
New file: `SupplyRiskPanel.jsx`. Also modifies: `MetricsPanel.jsx`.

#### 15. Acoustic Performance Overlay
State: `showAcoustic`. Data: add `stc_rating: number` to variant. In `Part.jsx` when `showAcoustic`, override material color lerp red→green (`stc_rating/60`); floating label with STC value. Show STC in `InfoPanel.jsx` variant stats. (`Volume2` icon).

---

### Group D — Carbon & Sustainability ⬜
All extend MetricsPanel. **Shared files:** `MetricsPanel.jsx`, `App.css`.

#### 11. Carbon vs Cost Pareto Frontier
New "Pareto" tab. Enumerate variant combinations (cap at 5000 samples if V^N > 5000; 8 parts × 3 variants = 6561 — fully enumerable). Find Pareto-optimal set (no point dominates on both axes). Render SVG scatter: X=cost, Y=carbon, frontier highlighted. Click point → apply that variant combo via `onVariantChange`.
New file: `ParetoPanel.jsx`.

#### 16. Carbon Payback Calculator
New section in Carbon tab below CASBEE. Data: add `operational_carbon_kgco2e_per_year` to `projectSettings` in KitContext; slider in InfoPanel settings. `paybackYear = totalEmbodied / (3500 - operationalCarbon)` (baseline 3500 kg CO₂e/yr per 16m² module). Bar chart 0–50 yr timeline. Also modifies: `KitContext.jsx`, `InfoPanel.jsx`.

#### 17. Circular Economy End-of-Life Score
New "Circular" tab. Data: add `recyclability_pct: number` + optional `end_of_life_cost_usd` to variant (derive defaults: steel→98, timber/CLT→60, concrete→30 by label keyword). Circularity score = weighted avg recyclability. Show gauge + per-part breakdown.
New file: `CircularEconomyPanel.jsx`.

---

### Group E — Structural Compliance ⬜
**Shared files:** `App.jsx`, `MetricsPanel.jsx`, `App.css`.

#### 14. BSL / Seismic Compliance Report Card
New "Compliance" tab (or extend "structural"). Existing `minSeismicGrade` + `bslCompliantCount` already in MetricsPanel. Add: highlight non-compliant parts in 3D via `onHighlight` callback to App.jsx. Traffic-light verdict (Pass/Conditional/Fail). "Export Compliance PDF" button → `pdfGenerator.js`. Also modifies: `pdfGenerator.js`.

#### 18. Structural Redundancy Heatmap
State: `redundancyMode: bool`, `removedPartId: string|null`. UI: Toolbar toggle + click any part to simulate removal. Distribute removed part's `load_bearing_kn` across connected parts; parts exceeding capacity → red, partial → yellow, unaffected → green. Label as indicative (no FEM). Toolbar button.
New file: `RedundancyOverlay.jsx`. Also modifies: `Toolbar.jsx`, `Scene.jsx`.

---

### Group F — Standalone ⬜

#### 9. Prefab Factory Layout Planner
State: `factoryMode: bool`. UI: Toolbar "Factory" toggle. New `FactoryGrid.jsx`: render parts flat (`rotation.x=-PI/2`) in sequence order, one per bay at Y=0; bays as `<gridHelper>` sections; sequence number as 3D text label. Replaces building view when active.
New file: `FactoryGrid.jsx`. Modifies: `App.jsx`, `Toolbar.jsx`, `Scene.jsx`, `App.css`.

#### 19. 4D Time-Lapse Recording
State: `isRecording: bool`, `mediaRecorderRef: ref`. UI: Toolbar `Circle` icon (red when recording). `rendererRef.current.domElement.captureStream(30)` → `MediaRecorder({mimeType:'video/webm'})`. On start: auto-trigger cinematic mode. On cinematic end: auto-stop recorder → download `.webm` blob.
Modifies: `App.jsx`, `Toolbar.jsx`, `App.css`.

---

## Recently Shipped Features (for context)

| Feature | Files |
|---|---|
| Water Simulation | `src/components/RainSimulation.jsx` (new — instanced rain particles + puddle accumulation), `src/components/WaterPressure.jsx` (new — wind-driven pressure heatmap planes), `src/App.jsx` (`showWaterSim` state), `src/components/Scene.jsx`, `src/components/Toolbar.jsx` (`Droplets` icon, disabled in site/game mode) |
| Floor Plan Auto-Generator | `src/components/FloorPlanPanel.jsx` (new — canvas 2D projection, SVG export), `src/App.jsx` (`showFloorPlan` state), `src/components/Toolbar.jsx` (`LayoutTemplate` icon) |
| Wind Load Arrows | `src/components/WindArrows.jsx` (new — cone+cylinder arrows per face, pulsing via useFrame), `src/components/Scene.jsx`, `src/components/Toolbar.jsx` (`Wind` icon), `src/App.jsx` (`showWindArrows`, `windSpeed` state), `src/components/CranePanel.jsx` (`onWindChange` callback lifts windSpeed to App) |
| Multi-Crane Collision Zone | `src/components/Crane.jsx` (`offsetX`/`offsetZ` props), `src/components/Scene.jsx` (second Crane instance + collision disc mesh), `src/components/CranePanel.jsx` (Add Crane toggle + X slider + warning badge), `src/App.jsx` (`showSecondCrane`, `secondCraneX` state) |
| Construction Schedule / Gantt | `src/components/GanttPanel.jsx` (new), `src/components/MetricsPanel.jsx` (Schedule tab added), `src/App.jsx` (`highlightedWeek` state), `src/components/Scene.jsx` + `Part.jsx` (week dim/glow on highlight) |
| Earthquake Shake Simulation | `src/components/EarthquakePanel.jsx` (panel, verdict logic), `src/components/Part.jsx` (+`isShaking`, `earthquakeMagnitude` props, GSAP shake loop), `src/App.jsx` (`showEarthquake`, `earthquakeMagnitude`, `isShaking`, `hasShaken` state + `handleShake`), `src/components/Toolbar.jsx` (`Activity` icon button), `src/components/Scene.jsx` (passes shake props to Part) |
| OG / Twitter meta tags | `index.html`, `public/og-preview.png` (static asset, needs manual screenshot) |
| Screenshot Share button | `src/components/ShareButton.jsx`, `src/App.jsx` (`handleShare`, `shareMetrics`), `src/components/Scene.jsx` (`preserveDrawingBuffer`) |
| Cinematic Demo Mode (DEMO button) | `src/components/CinematicMode.jsx`, `src/components/Toolbar.jsx`, `src/App.jsx`, `src/components/Scene.jsx` |
| AI Carbon Optimiser (✦ AI tab) | `src/components/AIOptimiserPanel.jsx`, `src/components/MetricsPanel.jsx` (`onVariantChange` prop added) |
