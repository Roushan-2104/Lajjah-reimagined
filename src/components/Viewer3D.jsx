import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { MODELS } from '../three/jewellery.js'
import { Studio, Effects } from '../three/Stage.jsx'

function Model({ id }) {
  const obj = useMemo(() => MODELS[id].create(), [id])
  return <primitive object={obj} rotation={[id === 'nira' ? 1.1 : 0.15, 0, 0]} />
}

/** Modal 3D viewer for pieces that have a procedural model. */
export function Viewer3D({ id, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (id && !d.open) d.showModal()
    if (!id && d.open) d.close()
  }, [id])
  const m = id ? MODELS[id] : null
  return (
    <dialog ref={ref} className="viewer" onClose={onClose} aria-label={m ? `${m.name} in 3D` : '3D viewer'}>
      {m && (
        <>
          <div className="viewer-head">
            <p><span className="dev">{m.hi}</span> <b>{m.name}</b> <span className="label">{m.metal}</span></p>
            <button type="button" className="label viewer-close" onClick={onClose}>Close ✕</button>
          </div>
          <div className="viewer-canvas">
            <Canvas dpr={[1, 1.75]} camera={{ fov: 35, position: [0, 0.3, 4.4] }}>
              <color attach="background" args={['#641F2B']} />
              <Studio />
              <Effects />
              <ContactShadows position={[0, -1.1, 0]} scale={6} blur={2.6} far={3} opacity={0.55} color="#1a0a0d" />
              <Suspense fallback={null}><Model id={id} /></Suspense>
              <OrbitControls enablePan={false} minDistance={2.6} maxDistance={7} autoRotate autoRotateSpeed={0.8} />
            </Canvas>
          </div>
          <p className="label viewer-note">Drag to turn · scroll to zoom · rebuilt in 3D from the product photo, so it approximates the real piece</p>
        </>
      )}
    </dialog>
  )
}
