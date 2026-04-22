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

### 2. Construction Schedule / Gantt Overlay ⬜
**What:** Each part already has a `sequence` field. Add a `week` field to each part (or derive from sequence). Sequence timeline becomes a Gantt chart — horizontal bars per part, grouped by week. Hover a week bar to highlight that week's parts in 3D. Export as PDF schedule.

**UI:** New "Schedule" tab in MetricsPanel (alongside cost, carbon, bom, prefab, structural, ai). Gantt rendered as CSS bars (no canvas needed).

**Data:** Add optional `week: number` field to part schema. If absent, derive: `week = Math.ceil(sequence / 2)`.

**New files:** `src/components/GanttPanel.jsx`
**Modified files:** `src/components/MetricsPanel.jsx` (add 'schedule' tab), `src/components/BuilderPanel.jsx` (add week input), `src/App.css`

---

### 3. Multi-Crane Collision Zone ⬜
**What:** Add a second crane to the site. Both cranes have configurable positions. The system calculates the anti-collision envelope (overlapping jib radii) and renders a translucent red disc at the danger zone. When sequence steps would put both jibs in the zone simultaneously, both freeze and flash.

**UI:** "Add Crane" button in CranePanel. Second crane position slider (X offset). Anti-collision radius shown as `<mesh>` ring on site.

**State to add in App.jsx:** `showSecondCrane: bool`, `secondCraneX: number`

**3D implementation:** In `Crane.jsx`, accept `position` prop (default [0,0,0]). Render second instance at `[secondCraneX, 0, 0]`. Collision disc: `<mesh rotation={[-PI/2,0,0]} position={[midpoint, 0, midpoint]}><circleGeometry /><meshBasicMaterial color="#e74c3c" transparent opacity={0.15} /></mesh>`.

**New files:** None
**Modified files:** `src/components/Crane.jsx` (position prop), `src/components/CranePanel.jsx` (second crane controls), `src/App.jsx`, `src/components/Scene.jsx`, `src/App.css`

---

### 4. Wind Load Arrows on Facade ⬜
**What:** A "Wind Analysis" toggle overlays animated pressure arrows on part faces. Windward faces get inward blue arrows, leeward faces get outward red arrows (suction), roof faces get uplift arrows. Arrow size scales with wind speed (already simulated in CranePanel's `windSpeed` state).

**UI:** Button in Toolbar (`Wind` icon). Arrows visible in Scene when active.

**State to add in App.jsx:** `showWindArrows: bool`. Share `windSpeed` from CranePanel via lifting it to App.jsx state (or pass down from CranePanel via callback `onWindChange`).

**3D implementation:** New `WindArrows.jsx` component. For each visible part, compute face normals from `part.size`. Render `<ArrowHelper>` (Three.js) or custom cone meshes at face centers. Animate scale with `useFrame` using a sine wave + windSpeed factor.

**New files:** `src/components/WindArrows.jsx`
**Modified files:** `src/App.jsx`, `src/components/Toolbar.jsx`, `src/components/Scene.jsx`, `src/components/CranePanel.jsx` (lift windSpeed to App), `src/App.css`

---

### 5. Floor Plan Auto-Generator ⬜
**What:** Projects all visible parts downward onto a 2D canvas. Auto-traces footprints, labels rooms/parts, shows dimensions. Export as SVG or PNG. Optionally shows Ken grid (910mm module) overlay.

**UI:** New "Floor Plan" button in Toolbar or new tab in MetricsPanel. Renders a `<canvas>` element in a modal. Export button downloads SVG.

**Implementation:** No Three.js needed. Iterate `parts` (filtered by `visible`), use `part.position` and `part.size` as XZ rectangle. Draw rects on 2D canvas, scale to fit panel. Label with `part.id`. Draw dimension lines at edges. For SVG export, build SVG string manually.

**New files:** `src/components/FloorPlanPanel.jsx`, `src/utils/floorPlanExporter.js`
**Modified files:** `src/App.jsx` (`showFloorPlan` state), `src/components/Toolbar.jsx`, `src/App.css`

---

### 6. Crane Swing Path Planner ⬜
**What:** In site mode, click a laydown point on the grid, then the installation point. Crane animates the full slew arc. Shows swing radius danger zone as a translucent arc sweep. Warns if path crosses adjacent placed units.

**UI:** "Plan Lift" button in CranePanel (active only in site mode + crane visible). Click-to-pick interaction on SiteGrid.

**State to add in App.jsx:** `liftPlanMode: bool`, `liftStart: [col, row] | null`, `liftEnd: [col, row] | null`

**3D implementation:** In `SiteGrid.jsx`, when `liftPlanMode` is true, clicks set `liftStart` then `liftEnd`. In `Crane.jsx`, when both set, GSAP animates jib slew angle from start azimuth to end azimuth. Sweep arc rendered as `<line>` with arc points.

**New files:** None
**Modified files:** `src/components/SiteGrid.jsx`, `src/components/Crane.jsx`, `src/components/CranePanel.jsx`, `src/App.jsx`, `src/App.css`

---

### 7. Fire Spread Simulation ⬜
**What:** Click "Ignite" on any part to start fire. Fire propagates to connected neighbours based on fire resistance rating — 1hr parts hold 3× longer before turning orange/red, non-rated parts ignite immediately. Parts glow orange then red then dark. When fire hits a 2hr-rated boundary, it stops.

**UI:** "Fire" mode button in Toolbar (`Flame` icon). Click any part to ignite. Panel shows time elapsed and parts compromised.

**State to add in App.jsx:** `fireMode: bool`, `fireState: { [partId]: 'ok'|'burning'|'failed' }`, `fireElapsed: number`

**3D implementation:** In `Part.jsx`, when `fireState[part.id]` is `'burning'`, animate emissive color from `0x000000` → `0xff6600` with GSAP. When `'failed'` → `0x1a0000` (char). `useEffect` in App.jsx propagates fire via `part.connections` array every `N` seconds where `N` depends on `fire_resistance_grade`.

**New files:** `src/components/FirePanel.jsx`
**Modified files:** `src/App.jsx`, `src/components/Toolbar.jsx`, `src/components/Part.jsx`, `src/App.css`

---

### 8. Thermal Bridge Visualizer ⬜
**What:** Heatmap overlay on all connection joints. Blue = well-insulated, red = cold bridge. Based on material thermal conductivity (W/mK) stored on variants. Shows where heat loss detailing matters in prefab construction.

**UI:** Toggle button in Toolbar (`Thermometer` icon). Heatmap spheres rendered at connection midpoints in Scene.

**Data:** Add optional `thermal_conductivity_wpmk: number` to variant schema (e.g. steel = 50, CLT = 0.13, concrete = 1.7).

**3D implementation:** In `Connection.jsx` (or new `ThermalOverlay.jsx`), render a `<mesh><sphereGeometry /></mesh>` at the midpoint between connected parts. Color interpolated from blue (low conductivity) to red (high). Animate pulse with `useFrame`.

**New files:** `src/components/ThermalOverlay.jsx`
**Modified files:** `src/App.jsx` (`showThermal` state), `src/components/Toolbar.jsx`, `src/components/Scene.jsx`, `src/App.css`

---

### 9. Prefab Factory Layout Planner ⬜
**What:** A second grid view — not the site, but the factory floor. Shows how parts are laid out for fabrication in sequence: panel by panel, jig positions, welding/curing zones. Entirely different view of the supply chain that no configurator shows.

**UI:** "Factory" toggle in Toolbar (alongside "Site"). Replaces the 3D building view with a top-down factory floor grid. Parts shown flat (rotated to XZ plane) in sequence order with zone labels.

**State to add in App.jsx:** `factoryMode: bool`

**3D implementation:** New `FactoryGrid.jsx` component. When `factoryMode` is true, render parts in a grid layout (one per bay) at Y=0 with `rotation.x = -PI/2`. Bays drawn as `<gridHelper>` sections. Sequence numbers as 3D text labels.

**New files:** `src/components/FactoryGrid.jsx`
**Modified files:** `src/App.jsx`, `src/components/Toolbar.jsx`, `src/components/Scene.jsx`, `src/App.css`

---

### 10. Crane Operator First-Person View ⬜
**What:** "Cab View" button teleports the camera inside the crane operator's cab. You see the load dangling below, the site grid, and the building under construction from 30m up. Purely experiential — the kind of screenshot that gets shared.

**UI:** Small "Cab View" button in CranePanel (visible only when crane is shown).

**State to add in App.jsx:** `craneCabView: bool`

**3D implementation:** In `Scene.jsx` (or `CameraController`), when `craneCabView` is true, position camera at crane cab position: `[craneX, mastHeight + 2, craneZ - 1]`, look toward `[craneX + 20, mastHeight, craneZ]`. Disable OrbitControls. Re-enable on exit.

**Modified files:** `src/components/CranePanel.jsx` (Cab View button), `src/App.jsx`, `src/components/Scene.jsx`, `src/components/Toolbar.jsx` (disable conflicting modes)

---

### 11. Carbon vs Cost Pareto Frontier ⬜
**What:** Scatter chart of all possible variant combinations: X = total cost, Y = total carbon. Current config shown as highlighted dot. Pareto frontier (optimal trade-off curve) drawn. Click any frontier point to apply that variant configuration instantly.

**UI:** New "Pareto" tab in MetricsPanel.

**Implementation:** Enumerate combinations (if >1000, sample). For each: compute total cost and carbon. Find Pareto-optimal set (no point dominates on both axes). Render as SVG or HTML canvas. Click handler calls `onVariantChange` for each part in that combination.

**Performance note:** With N parts each having V variants, combinations = V^N. Cap at 5000 random samples if too large. With typical 8 parts × 3 variants = 6561 — fully enumerable.

**New files:** `src/components/ParetoPanel.jsx`
**Modified files:** `src/components/MetricsPanel.jsx` (add 'pareto' tab), `src/App.css`

---

### 12. Japanese Fire Compartment Visualizer ⬜
**What:** Groups parts into fire compartments based on `fire_resistance_grade`. Each compartment gets a translucent bounding box in the 3D scene. Shows whether the design meets BSL maximum compartment area rules (500 m² unsprinklered, 1500 m² sprinklered).

**UI:** Toggle in Toolbar (`Shield` icon). Bounding boxes in Scene. Panel shows compartment areas and compliance status.

**Data:** Add optional `fire_compartment: string` field to part schema (e.g. `"zone-A"`). Parts in the same compartment are grouped.

**3D implementation:** New `FireCompartments.jsx`. Group parts by `fire_compartment` field. For each group, compute bounding box from positions/sizes. Render as `<Box args={[w,h,d]}><meshBasicMaterial wireframe /></Box>` with color-coded opacity by fire rating.

**New files:** `src/components/FireCompartments.jsx`
**Modified files:** `src/App.jsx` (`showFireCompartments` state), `src/components/Toolbar.jsx`, `src/components/Scene.jsx`, `src/App.css`

---

### 13. Material Supply Chain Risk ⬜
**What:** Supply risk badge (Low/Medium/High) per variant based on `lead_time_days` and `supplier` count. A "Supply Risk" overlay highlights high-risk parts in the 3D view and MetricsPanel. Scenario: "What if steel is unavailable?" — auto-switches steel variants to next best.

**UI:** New "Supply" tab in MetricsPanel. Risk badge in BOM table (already exists, just add the badge). "Simulate shortage" button per material type.

**Data:** Add optional `supply_risk: 'low'|'medium'|'high'` to variant schema. Derive if absent: `lead_time_days > 60` → high, `> 30` → medium, else low.

**New files:** `src/components/SupplyRiskPanel.jsx`
**Modified files:** `src/components/MetricsPanel.jsx` (add 'supply' tab or fold into BOM), `src/App.css`

---

### 14. BSL / Seismic Compliance Report Card ⬜
**What:** One-page visual report card: minimum seismic grade in assembly, which parts are the weak links (highlighted in 3D), traffic-light verdict (Pass/Conditional/Fail per BSL criteria). Exportable as PDF compliance summary — the kind of document submitted to building councils.

**UI:** "Compliance" tab in MetricsPanel (or extend existing "structural" tab with a Report Card section and export button).

**Implementation:** Already have `minSeismicGrade` and `bslCompliantCount` in MetricsPanel. Extend with: highlight non-compliant parts in 3D (`onHighlight` callback to App.jsx), add "Export Compliance PDF" button that calls `pdfGenerator.js` with the compliance data.

**Modified files:** `src/components/MetricsPanel.jsx`, `src/utils/pdfGenerator.js`, `src/App.jsx`, `src/App.css`

---

### 15. Acoustic Performance Overlay ⬜
**What:** Assigns STC (Sound Transmission Class) ratings to parts/connections. A "Noise Map" shows predicted sound attenuation through walls and slabs — colour-coded by STC (red = poor <35, yellow = ok 35–50, green = good >50). Useful for residential prefab compliance with Japanese noise standards.

**UI:** Toggle in Toolbar (`Volume2` icon). STC displayed as colour gradient on part faces in Scene.

**Data:** Add optional `stc_rating: number` to variant schema.

**3D implementation:** In `Part.jsx`, when `showAcoustic` prop is true, override material color with STC-derived hue (lerp red→green based on `stc_rating / 60`). Show STC number as floating label.

**Modified files:** `src/App.jsx` (`showAcoustic` state), `src/components/Toolbar.jsx`, `src/components/Part.jsx`, `src/components/InfoPanel.jsx` (show STC in variant stats), `src/App.css`

---

### 16. Carbon Payback Calculator ⬜
**What:** Embodied carbon already tracked. Add `operational_carbon_kgco2e_per_year: number` to project settings (from U-values, heating loads). Show break-even year when operational savings offset embodied carbon. Timeline chart. A single "Carbon Payback: 14 years" headline is extremely shareable in sustainability circles.

**UI:** New section in Carbon tab of MetricsPanel, below the existing CASBEE section. Timeline bar chart (0–50 years).

**Data:** Add `operational_carbon_kgco2e_per_year` to `projectSettings` in KitContext. Add UI slider in InfoPanel's environment/settings section.

**Calculation:** `paybackYear = totalEmbodied / annualSaving` where `annualSaving = conventionalBaseline - operationalCarbon`. Conventional baseline = 3500 kg CO₂e/year for a 16m² module (configurable).

**Modified files:** `src/components/MetricsPanel.jsx` (carbon tab extension), `src/components/KitContext.jsx` (projectSettings schema), `src/components/InfoPanel.jsx` (settings slider), `src/App.css`

---

### 17. Circular Economy End-of-Life Score ⬜
**What:** Each variant gets a `recyclability_pct: number` (steel=98, CLT=60, concrete=30). Show total end-of-life recovered carbon value and circularity score (0–100%). A "Circularity Gauge" on the MetricsPanel. Ties into CASBEE LCA framework.

**UI:** New "Circular" tab in MetricsPanel with gauge, per-part recyclability breakdown.

**Data:** Add `recyclability_pct: number` and optionally `end_of_life_cost_usd: number` to variant schema. Derive defaults by material keyword in label if absent (steel→98, timber/CLT→60, concrete→30).

**New files:** `src/components/CircularEconomyPanel.jsx`
**Modified files:** `src/components/MetricsPanel.jsx` (add 'circular' tab), `src/App.css`

---

### 18. Structural Redundancy Heatmap ⬜
**What:** Virtually "remove" any part and calculate which remaining parts are now critical (load redistribution approximation). Highlight critical-path parts in red in the 3D view. Shows structural robustness — important for progressive collapse resistance.

**UI:** "Redundancy" toggle in Toolbar. Click a part to simulate its removal. Heatmap colours on remaining parts: green=redundant, yellow=contributing, red=critical.

**Implementation:** Simplified approach — use `load_bearing_kn` data from variants. When a primary structural part is removed, distribute its load across connected parts. Parts whose `load_bearing_kn` would be exceeded go red. No FEM required — this is indicative only (label it as such).

**New files:** `src/components/RedundancyOverlay.jsx`
**Modified files:** `src/App.jsx` (`redundancyMode`, `removedPartId` state), `src/components/Toolbar.jsx`, `src/components/Scene.jsx`, `src/App.css`

---

### 19. 4D Time-Lapse Recording ⬜
**What:** Built-in screen recorder using the `MediaRecorder` API + Canvas stream. Press Record → cinematic demo auto-plays → Press Stop → downloads `.webm` video. No external screen-capture software needed. The LinkedIn video asset generates itself.

**UI:** "Record" button in Toolbar (`Circle` icon, turns red when recording). Stop button while recording.

**State to add in App.jsx:** `isRecording: bool`, `mediaRecorderRef: ref`

**Implementation:**
```js
const stream = canvasRef.current.captureStream(30) // 30fps
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
const chunks = []
recorder.ondataavailable = e => chunks.push(e.data)
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' })
  // trigger download
}
recorder.start()
// auto-start cinematic mode
```
`canvasRef` is `rendererRef.current.domElement`. When recording starts, auto-trigger `setCinematicMode(true)`. When cinematic ends, auto-stop recording.

**Modified files:** `src/App.jsx`, `src/components/Toolbar.jsx`, `src/App.css`

---

## Recently Shipped Features (for context)

| Feature | Files |
|---|---|
| Earthquake Shake Simulation | `src/components/EarthquakePanel.jsx` (panel, verdict logic), `src/components/Part.jsx` (+`isShaking`, `earthquakeMagnitude` props, GSAP shake loop), `src/App.jsx` (`showEarthquake`, `earthquakeMagnitude`, `isShaking`, `hasShaken` state + `handleShake`), `src/components/Toolbar.jsx` (`Activity` icon button), `src/components/Scene.jsx` (passes shake props to Part) |
| OG / Twitter meta tags | `index.html`, `public/og-preview.png` (static asset, needs manual screenshot) |
| Screenshot Share button | `src/components/ShareButton.jsx`, `src/App.jsx` (`handleShare`, `shareMetrics`), `src/components/Scene.jsx` (`preserveDrawingBuffer`) |
| Cinematic Demo Mode (DEMO button) | `src/components/CinematicMode.jsx`, `src/components/Toolbar.jsx`, `src/App.jsx`, `src/components/Scene.jsx` |
| AI Carbon Optimiser (✦ AI tab) | `src/components/AIOptimiserPanel.jsx`, `src/components/MetricsPanel.jsx` (`onVariantChange` prop added) |
