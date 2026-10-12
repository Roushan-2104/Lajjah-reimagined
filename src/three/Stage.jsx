import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import { reducedMotion } from './pointer.js'

const isSmall = () => typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 600

/**
 * Jewellery studio lighting, local light-formers only (no remote HDR):
 * - a big soft top key and a front fill for the readable body of the metal,
 * - warm and cool strip lights at the sides for colour in the reflections,
 * - two bright rim strips BEHIND the subject so every silhouette gets an edge highlight,
 * - the reflection environment slowly turns (scene.environmentRotation), so highlights travel across the
 *   silver without re-rendering the environment every frame.
 */
export function Studio({ warm = '#ffd59a', cool = '#b8c6ff', intensity = 1, live = true }) {
  const scene = useThree(s => s.scene)
  const animate = live && !reducedMotion()
  useFrame((_, dt) => { if (animate && scene.environmentRotation) scene.environmentRotation.y += dt * 0.12 })
  return (
    <>
      <ambientLight intensity={0.12 * intensity} />
      {/* key: warm, high, front-left */}
      <spotLight position={[-3.5, 5, 5]} angle={0.5} penumbra={0.9} intensity={60 * intensity} decay={2} color="#fff1dc" />
      {/* rim: cool, behind, separates metal from the dark ground */}
      <directionalLight position={[2.5, 2.5, -5]} intensity={2.4 * intensity} color="#cfd9ff" />
      <directionalLight position={[-3, -1.5, -4]} intensity={1.2 * intensity} color="#ffd9a8" />
      <Environment resolution={256} frames={1}>
        <group>
          <Lightformer intensity={5} position={[0, 5, 2]} scale={[12, 3, 1]} rotation-x={Math.PI / 2.6} />
          <Lightformer intensity={1.8} position={[0, 0.5, 6]} scale={[8, 3, 1]} />
          <Lightformer intensity={3.5} color={warm} position={[-5, 1, 1.5]} scale={[2.5, 8, 1]} rotation-y={Math.PI / 2} />
          <Lightformer intensity={2.6} color={cool} position={[5, 0.5, 1]} scale={[2.5, 8, 1]} rotation-y={-Math.PI / 2} />
          {/* rim strips behind the subject */}
          <Lightformer form="rect" intensity={7} position={[-2.2, 1, -5]} scale={[0.6, 9, 1]} />
          <Lightformer form="rect" intensity={7} position={[2.6, 0.5, -5]} scale={[0.6, 9, 1]} />
          <Lightformer form="ring" intensity={4} color={warm} position={[0, 3, -4]} scale={2} />
          <Lightformer intensity={1.2} position={[0, -4, 2]} scale={[10, 2, 1]} rotation-x={-Math.PI / 2} />
        </group>
      </Environment>
    </>
  )
}

/**
 * Post-processing for depth: N8AO darkens engraving recesses and contact points,
 * a restrained bloom lets specular glints sparkle, a vignette pulls the eye to the piece.
 */
export function Effects({ ao = true, bloom = 0.32 }) {
  const gl = useThree(s => s.gl)
  // ?capture (video recording on weak GPUs): skip the composer; a CSS vignette stands in for it
  if (typeof location !== 'undefined' && location.search.includes('capture')) return null
  const small = isSmall()
  const passes = [
    ao && <N8AO key="ao" halfRes={small} aoRadius={0.35} distanceFalloff={0.6} intensity={2.2} quality={small ? 'performance' : 'medium'} />,
    <Bloom key="bloom" mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.15} intensity={bloom} radius={0.6} />,
    <Vignette key="vig" eskil={false} offset={0.28} darkness={0.55} />,
    gl.capabilities.isWebGL2 && <SMAA key="smaa" />,
  ].filter(Boolean)
  return <EffectComposer multisampling={0} enableNormalPass={false}>{passes}</EffectComposer>
}
