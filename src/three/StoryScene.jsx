import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { createIraModel, createKaveriModel, createNiraModel, createAditiModel } from './jewellery.js'
import { WordPlane } from './WordPlane.jsx'
import { Studio, Effects } from './Stage.jsx'
import { pointer, reducedMotion } from './pointer.js'

/** Story scroll progress (0..1), the archive piece facing front, and the making stage; shared with <Story>. */
export const story = { p: 0, front: 'ira', stage: 0 }

const clamp01 = v => Math.min(1, Math.max(0, v))
const ease = t => t * t * (3 - 2 * t)
const seg = (p, a, b) => ease(clamp01((p - a) / (b - a)))

// Chapter stations along X. The camera holds on each chapter and dollies between them.
const STATIONS = [0, 14, 28]

// guideline secondaries: royal indigo → peacock teal → deep emerald
const GROUNDS = [new THREE.Color('#283A68'), new THREE.Color('#176B68'), new THREE.Color('#245B43')]
const ground = new THREE.Color('#283A68')

function CameraRig({ tall }) {
  const { camera, scene } = useThree()
  const look = useRef(new THREE.Vector3())
  const sm = useRef(new THREE.Vector2())
  useFrame((_, dt) => {
    const p = story.p
    let x
    if (p < 0.24) x = STATIONS[0]
    else if (p < 0.33) x = THREE.MathUtils.lerp(STATIONS[0], STATIONS[1], seg(p, 0.24, 0.33))
    else if (p < 0.6) x = STATIONS[1]
    else if (p < 0.69) x = THREE.MathUtils.lerp(STATIONS[1], STATIONS[2], seg(p, 0.6, 0.69))
    else x = STATIONS[2]
    const still = reducedMotion()
    sm.current.lerp(new THREE.Vector2(still ? 0 : pointer.x, still ? 0 : pointer.y), 1 - Math.exp(-dt * 3))
    // wide screens: subject sits right of the text column; tall: centred in the upper half
    const off = tall ? 0 : -1.45
    // the archive turntable reads better from a little above
    const lift = seg(p, 0.6, 0.69)
    const y = (tall ? -1.6 : 0) + lift * 0.8
    const target = new THREE.Vector3(x + off + sm.current.x * 0.3, y - sm.current.y * 0.15, tall ? 15 : 7.4)
    const k = 1 - Math.exp(-dt * 5)
    camera.position.lerp(target, k)
    look.current.lerp(new THREE.Vector3(x + off, y - lift * 0.9, 0), k)
    camera.lookAt(look.current)
    // colour-block the chapters: blend the ground between the two nearest chapters
    const a = seg(p, 0.24, 0.33), b = seg(p, 0.6, 0.69)
    ground.copy(GROUNDS[0]).lerp(GROUNDS[1], a).lerp(GROUNDS[2], b)
    if (scene.background?.isColor) scene.background.copy(ground)
    if (scene.fog) scene.fog.color.copy(ground)
  })
  return null
}

/** Chapter 1 · धातु: German-silver torque and 92.5 jhumkas, turning with scroll. */
function Metals({ tall }) {
  const nira = useMemo(() => createNiraModel(), [])
  const aditi = useMemo(() => createAditiModel(), [])
  const a = useRef(), b = useRef()
  useFrame(({ clock }) => {
    const p = story.p, t = reducedMotion() ? 0 : clock.elapsedTime
    if (a.current) { a.current.rotation.y = p * 9 + t * 0.15; a.current.rotation.x = 1.1 }
    if (b.current) b.current.rotation.y = -p * 7 + Math.sin(t * 0.5) * 0.25
  })
  return (
    <group position={[STATIONS[0], tall ? 0.7 : 0, 0]}>
      <WordPlane text="धातु" height={tall ? 2.4 : 3.6} position={[0, 0.2, -2.8]} />
      <group ref={a} position={[tall ? -1.05 : -1.3, 0.15, 0]} scale={tall ? 0.95 : 1.0}><primitive object={nira} /></group>
      <group ref={b} position={[tall ? 1.1 : 0.95, 0.05, 0.4]} scale={tall ? 0.78 : 0.85}><primitive object={aditi} /></group>
      <ContactShadows resolution={256} position={[0, -1.35, 0]} scale={7} blur={2.8} far={3} opacity={0.5} color="#0a0807" frames={1} />
    </group>
  )
}

/** Chapter 2 · शिल्प: the Ira crescent goes cut → engrave → oxidise → buff as you scroll. */
function Making({ tall }) {
  const ira = useMemo(() => createIraModel(), [])
  const ref = useRef()
  useFrame(({ clock }) => {
    const q = clamp01((story.p - 0.34) / 0.25) // local progress inside the chapter
    const engrave = seg(q, 0.18, 0.36)
    const blacken = seg(q, 0.45, 0.58) * (1 - seg(q, 0.72, 0.88))
    const oxidise = seg(q, 0.72, 0.88)
    story.stage = q < 0.18 ? 0 : q < 0.45 ? 1 : q < 0.72 ? 2 : 3
    for (const m of ira.userData.processMaterials) {
      m.userData.process.uEngrave.value = engrave
      m.userData.process.uOxidise.value = oxidise
      m.userData.process.uBlacken.value = blacken
      m.normalScale.setScalar(m.userData.baseNormal * engrave)
    }
    if (ref.current) {
      ref.current.rotation.y = Math.sin(q * Math.PI * 1.5) * 0.55 + (reducedMotion() ? 0 : Math.sin(clock.elapsedTime * 0.4) * 0.08)
      ref.current.rotation.x = 0.22
    }
  })
  return (
    <group position={[STATIONS[1], tall ? 0.7 : 0, 0]}>
      <WordPlane text="शिल्प" height={tall ? 2.4 : 3.6} position={[0, 0.2, -2.8]} />
      <group ref={ref} scale={tall ? 1.15 : 1.3} position={[0, -0.35, 0]}><primitive object={ira} /></group>
      <ContactShadows resolution={256} position={[0, -1.4, 0]} scale={6} blur={2.6} far={3} opacity={0.5} color="#0a0807" />
    </group>
  )
}

/** Chapter 3 · संग्रह: the four modelled pieces on a turntable that turns with scroll. */
export const RING = ['ira', 'kaveri', 'nira', 'aditi']
function Archive({ tall }) {
  const objs = useMemo(() => ({ ira: createIraModel(), kaveri: createKaveriModel(), nira: createNiraModel(), aditi: createAditiModel() }), [])
  const table = useRef()
  const r = tall ? 1.9 : 2.35
  useFrame(() => {
    const q = clamp01((story.p - 0.69) / 0.3)
    const angle = -q * Math.PI * 2 * 0.75 // three-quarter turn shows every piece
    if (table.current) table.current.rotation.y = angle
    let best = 0, bestZ = -1e9
    RING.forEach((id, i) => { const z = Math.cos((i / RING.length) * Math.PI * 2 + angle); if (z > bestZ) { bestZ = z; best = i } })
    story.front = RING[best]
  })
  return (
    <group position={[STATIONS[2] + (tall ? 0 : -0.7), tall ? 0.5 : -0.1, -1.4]}>
      <WordPlane text="संग्रह" height={tall ? 2.2 : 3.2} position={[0, 1.4, -3.8]} />
      <group ref={table}>
        {RING.map((id, i) => {
          const a = (i / RING.length) * Math.PI * 2
          return (
            <group key={id} position={[Math.sin(a) * r, 0, Math.cos(a) * r]} rotation={[0, a, 0]}>
              <primitive object={objs[id]} scale={id === 'aditi' ? 0.7 : 0.82} rotation={[id === 'nira' ? 1.15 : 0.18, 0, 0]} />
            </group>
          )
        })}
      </group>
      <mesh position={[0, -1.15, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[r, 0.025, 12, 160]} />
        <meshStandardMaterial color="#D8AE62" emissive="#A9782C" emissiveIntensity={0.4} metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  )
}

export function StoryScene() {
  const tall = useThree(s => s.size.width / s.size.height < 0.9)
  return (
    <>
      <color attach="background" args={['#283A68']} />
      <fog attach="fog" args={['#283A68', tall ? 17 : 10, tall ? 34 : 24]} />
      <Studio />
      <Effects />
      <CameraRig tall={tall} />
      <Metals tall={tall} />
      <Making tall={tall} />
      <Archive tall={tall} />
    </>
  )
}
