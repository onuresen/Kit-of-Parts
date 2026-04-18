import { useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, PerspectiveCamera, Environment, Sky, Clouds, Cloud, Stars } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import Part from './Part'
import DimensionLines from './DimensionLines'
import SiteGrid from './SiteGrid'
import { useKit } from './KitContext'
// Animates camera + orbit target when switching modes
function CameraController({ siteMode, controlsRef }) {
  const { camera } = useThree()

  useEffect(() => {
    const pos = siteMode ? { x: 2, y: 20, z: 10 } : { x: 8, y: 8, z: 8 }
    gsap.to(camera.position, { ...pos, duration: 1.2, ease: 'expo.inOut' })

    if (controlsRef.current) {
      const targetY = siteMode ? 0.5 : 0
      gsap.to(controlsRef.current.target, {
        x: 0, y: targetY, z: 0,
        duration: 1.2, ease: 'expo.inOut',
        onUpdate: () => controlsRef.current?.update(),
      })
    }
  }, [siteMode, camera, controlsRef])

  return null
}

export default function Scene({
  isExploded,
  visible,
  onSelect,
  onClearSelect,
  selectedVariants,
  sequenceMode,
  sequenceStep,
  showDimensions,
  sectionCutActive,
  sectionCutY,
  siteMode,
  placedUnits,
  onPlaceUnit,
  onRemoveUnit,
  selectedUnitType,
  gameMode,
  gameStep,
  onGameClick,
  builderMode,
  selectedPartId,
  envSettings,
}) {
  const controlsRef = useRef()
  const { parts } = useKit()

  return (
    <Canvas
      shadows
      style={{ position: 'absolute', inset: 0, background: siteMode ? '#eef2f7' : '#f4f4f4' }}
      gl={{ localClippingEnabled: true }}
    >
      <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={45} />
      <OrbitControls ref={controlsRef} makeDefault enableDamping />
      <CameraController siteMode={siteMode} controlsRef={controlsRef} />

      <ambientLight intensity={!siteMode && envSettings && (envSettings.time < 6 || envSettings.time > 18) ? 0.2 : 0.8} />
      
      {/* ── Dynamic Sky and Sun ─────────────────────────── */}
      {(() => {
        if (siteMode || !envSettings) {
          return (
            <>
              <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
              <Environment preset="city" />
            </>
          )
        }
        
        const time = envSettings.time;
        // Map 6am to 0, 12pm to PI/2, 6pm to PI
        const theta = Math.PI * ((time - 6) / 12);
        const sunY = Math.max(-10, Math.sin(theta) * 50);
        const sunX = Math.cos(theta) * 50;
        const sunPos = [sunX, sunY, 15];
        const isDaytime = time > 5 && time < 19;
        
        return (
          <>
            <Environment preset="city" />
            <Sky sunPosition={sunPos} turbidity={0.6} rayleigh={0.8} />
            {isDaytime && <directionalLight position={sunPos} intensity={Math.max(0, Math.sin(theta))} castShadow />}
            
            {envSettings.stars && (
              <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
            )}
            
            {envSettings.clouds && (
              <Clouds material={THREE.MeshLambertMaterial}>
                <Cloud bounds={[20, 2, 20]} volume={15} color="#ffffff" position={[0, 18, 0]} opacity={0.6} speed={0.2} />
              </Clouds>
            )}
          </>
        )
      })()}

      {/* ── Site grid mode ─────────────────────────────── */}
      {siteMode && (
        <SiteGrid
          placedUnits={placedUnits}
          onPlace={onPlaceUnit}
          onRemove={onRemoveUnit}
          selectedUnitType={selectedUnitType}
        />
      )}

      {/* ── Regular parts (hidden in site mode) ────────── */}
      {!siteMode && parts && parts.map((part) => {
        const variantIdx = selectedVariants[part.id] ?? 0
        const activeVariant = part.variants[variantIdx]
        return (
          <Part
            key={part.id}
            data={part}
            isExploded={isExploded}
            isVisible={visible[part.id]}
            onSelect={onSelect}
            activeVariant={activeVariant}
            sequenceMode={sequenceMode}
            sequenceStep={sequenceStep}
            sectionCutActive={sectionCutActive}
            sectionCutY={sectionCutY}
            gameMode={gameMode}
            gameStep={gameStep}
            onGameClick={onGameClick}
            builderMode={builderMode}
            isSelected={selectedPartId === part.id}
          />
        )
      })}

      {!siteMode && showDimensions && <DimensionLines selectedVariants={selectedVariants} />}

      {/* Grass / Background plane */}
      {!siteMode && envSettings?.grass && (
        <mesh position={[0, -0.27, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClearSelect} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#557a2b" roughness={0.9} />
        </mesh>
      )}

      {/* Invisible click plane when grass is off */}
      {!siteMode && !envSettings?.grass && (
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={onClearSelect}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      <ContactShadows position={[0, -0.26, 0]} opacity={0.4} scale={siteMode ? 40 : 12} blur={2} />
    </Canvas>
  )
}
