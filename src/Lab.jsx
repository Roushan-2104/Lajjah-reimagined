// Dev-only model lab (open /?m=ira#lab): each procedural piece on its own, for comparison with its photo.
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { MODELS } from './three/jewellery.js'
import { Studio, Effects } from './three/Stage.jsx'

function Piece({ id }) {
  const obj = useMemo(() => MODELS[id].create(), [id])
  return <primitive object={obj} />
}

export default function Lab() {
  const q = new URLSearchParams(location.search)
  const id = q.get('m') || 'ira'
  const fx = q.get('fx') !== '0'
  const cam = { front: [0, 0.2, 3.6], top: [0, 3.6, 0.6], side: [3.4, 0.6, 1.4], three: [1.8, 1.0, 3.0] }[q.get('v') || 'front']
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#641F2B' }}>
      <Canvas camera={{ position: cam, fov: 35 }} gl={{ preserveDrawingBuffer: true }}>
        <color attach="background" args={['#641F2B']} />
        <Studio live={false} />
        <Piece id={id} />
        <ContactShadows position={[0, -1.15, 0]} scale={6} blur={2.6} far={3} opacity={0.55} color="#05081c" />
        {fx && <Effects />}
        <OrbitControls target={[0, 0.1, 0]} />
      </Canvas>
    </div>
  )
}
