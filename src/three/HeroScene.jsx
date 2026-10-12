import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PresentationControls, Float } from '@react-three/drei'
import * as THREE from 'three'
import { createIraModel, createNiraModel, createJhumka } from './jewellery.js'
import { WordPlane } from './WordPlane.jsx'
import { Studio, Effects } from './Stage.jsx'
import { pointer, reducedMotion } from './pointer.js'

/** Hero progress (0 = top of page, 1 = hero scrolled away), written by <Hero>. */
export const hero = { p: 0 }

function Dust({ count = 260 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < count; i++) { a[i * 3] = (rnd() - 0.5) * 12; a[i * 3 + 1] = (rnd() - 0.5) * 7; a[i * 3 + 2] = (rnd() - 0.6) * 6 }
    return a
  }, [count])
  useFrame((_, dt) => { if (ref.current && !reducedMotion()) ref.current.rotation.y += dt * 0.02 })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.025} color="#dfe3f2" transparent opacity={0.55} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function Rig({ tall }) {
  const { camera } = useThree()
  const sm = useRef(new THREE.Vector2())
  useFrame((_, dt) => {
    const still = reducedMotion()
    sm.current.lerp(new THREE.Vector2(still ? 0 : pointer.x, still ? 0 : pointer.y), 1 - Math.exp(-dt * 3))
    const base = tall ? [0, 0.2, 11] : [0, 0.1, 7]
    camera.position.set(base[0] + sm.current.x * 0.35, base[1] - sm.current.y * 0.2 + hero.p * 0.8, base[2])
    camera.lookAt(0, hero.p * 0.6, 0)
  })
  return null
}

export function HeroScene() {
  const tall = useThree(s => s.size.width / s.size.height < 0.9)
  const ira = useMemo(() => createIraModel(), [])
  const nira = useMemo(() => createNiraModel(), [])
  const jhumkaA = useMemo(() => createJhumka(), [])
  const jhumkaB = useMemo(() => createJhumka(), [])
  const ringPivot = useRef(), crescent = useRef(), intro = useRef(0)

  useFrame(({ clock }, dt) => {
    const still = reducedMotion()
    intro.current = Math.min(1, intro.current + dt / 1.8)
    const e = 1 - Math.pow(1 - intro.current, 3) // ease-out cubic entrance
    const t = clock.elapsedTime
    if (crescent.current) {
      crescent.current.rotation.y = (1 - e) * -1.6 + (still ? 0 : Math.sin(t * 0.35) * 0.18) + hero.p * 1.2
      crescent.current.position.y = (1 - e) * -2.4 - hero.p * 1.2
      crescent.current.scale.setScalar(0.6 + 0.4 * e)
    }
    // the torque ring orbits through the word: tilted ring spinning around the vertical axis
    if (ringPivot.current && !still) ringPivot.current.rotation.y += dt * 0.35
  })

  // wide: composition sits right of centre (text on the left); tall: centred, upper half
  const X = tall ? 0 : 1.95
  const Y = tall ? 1.75 : 0
  return (
    <>
      <Studio />
      <Effects ao={!tall} bloom={0.35} />
      <Rig tall={tall} />
      <Dust />
      <group position={[X, Y, 0]} scale={tall ? 0.56 : 1}>
        <WordPlane text="लज्जा" height={tall ? 3.0 : 3.25} position={[0, 0.25, -1.4]} />
        <group ref={ringPivot} position={[0, 0.25, -1.4]} rotation={[0.35, 0, 0.22]}>
          <primitive object={nira} scale={2.05} rotation={[Math.PI / 2, 0, 0]} />
        </group>
        <PresentationControls global={false} cursor snap speed={1.6} polar={[-0.5, 0.6]} azimuth={[-1.2, 1.2]}>
          <group ref={crescent}>
            <Float speed={still() ? 0 : 1.4} rotationIntensity={0.25} floatIntensity={0.35}>
              <primitive object={ira} scale={1.25} rotation={[0.18, 0, 0]} />
            </Float>
          </group>
        </PresentationControls>
        <Float speed={still() ? 0 : 1.1} floatIntensity={0.6} rotationIntensity={0.4}>
          <primitive object={jhumkaA} scale={0.44} position={[1.45, 1.25, -0.5]} rotation={[0, -0.5, 0.12]} />
          <primitive object={jhumkaB} scale={0.4} position={[-1.85, -1.45, -0.8]} rotation={[0, 0.6, -0.1]} />
        </Float>
      </group>
    </>
  )
}

const still = () => reducedMotion()
