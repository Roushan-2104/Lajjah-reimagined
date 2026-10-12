// Procedural Three.js reconstructions of Lajjha pieces, built from their product photos
// following the img2threejs method: decompose the photo into parts, build each part from
// primitives (swept tubes, lathes, instancing), and project the photo's own engraving onto the
// surface instead of inventing a pattern. Single-view sources: hidden backs are inferred.
import * as THREE from 'three'

const TEX = import.meta.env.BASE_URL + 'img/tex/'
const loader = new THREE.TextureLoader()
const cache = new Map()
function tex(name, repeat = [1, 1]) {
  const key = name + repeat.join('x')
  if (!cache.has(key)) {
    const t = loader.load(TEX + name + '.webp')
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
    t.anisotropy = 8
    cache.set(key, t)
  }
  return cache.get(key)
}

/**
 * Oxidised silver. With an engraving map, `process` uniforms drive the making story:
 * engrave 0→1 brings in the relief, oxidise 0→1 blackens the recesses (1 = finished piece),
 * blacken 0→1 temporarily turns the whole surface black (the oxidising bath).
 */
export function silver({ map, normal, normalScale = 1.1, roughness = 0.3, color = '#d9dbe0', openwork = false, relief = 0, clearcoat = 0.5 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color, metalness: 1, roughness, clearcoat, clearcoatRoughness: 0.25, envMapIntensity: 1.15,
    map: map || null, normalMap: normal || null, normalScale: new THREE.Vector2(normalScale, normalScale),
  })
  if (openwork && map) { m.alphaMap = map; m.alphaTest = 0.42; m.side = THREE.DoubleSide }
  // real relief: the engraving photo pushes vertices out along the normal (needs a dense mesh with aMask)
  if (relief && map) { m.displacementMap = map; m.displacementScale = relief; m.displacementBias = -relief * 0.35 }
  const process = { uEngrave: { value: 1 }, uOxidise: { value: 1 }, uBlacken: { value: 0 } }
  m.userData.process = process
  m.userData.baseNormal = normalScale
  m.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, process)
    if (relief && map) {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aMask;\nuniform float uEngrave;')
        .replace('#include <displacementmap_vertex>', `#ifdef USE_DISPLACEMENTMAP
  transformed += normalize(objectNormal) * (texture2D(displacementMap, vDisplacementMapUv).x * displacementScale + displacementBias) * aMask * uEngrave;
#endif`)
    }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uEngrave;\nuniform float uOxidise;\nuniform float uBlacken;')
      .replace('#include <map_fragment>', `
#ifdef USE_MAP
  float g = texture2D(map, vMapUv).r;
  float cavity = 1.0 - smoothstep(0.22, 0.62, g);          // recesses of the engraving (high contrast = hand-oxidised look)
  float shade = mix(1.0, 1.0 - cavity * 0.97, uOxidise * uEngrave);
  diffuseColor.rgb *= shade;
#endif
  diffuseColor.rgb *= mix(1.0, 0.06, uBlacken);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
#ifdef USE_MAP
  roughnessFactor = mix(roughnessFactor, 0.85, cavity * uOxidise * uEngrave);
#endif
  roughnessFactor = mix(roughnessFactor, 0.9, uBlacken);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
#ifdef USE_MAP
  metalnessFactor = mix(metalnessFactor, 0.3, cavity * uOxidise * uEngrave);
#endif`)
  }
  return m
}

const cord = () => new THREE.MeshStandardMaterial({ color: '#121014', roughness: 0.95, map: cordTexture(), bumpMap: cordTexture(), bumpScale: 2.5 })
let _cordTex
function cordTexture() {
  if (_cordTex) return _cordTex
  const c = document.createElement('canvas'); c.width = 64; c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#2a2830'; g.fillRect(0, 0, 64, 256)
  g.strokeStyle = '#0d0c10'; g.lineWidth = 7
  for (let y = -64; y < 320; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 40); g.stroke() }
  _cordTex = new THREE.CanvasTexture(c)
  _cordTex.wrapS = _cordTex.wrapT = THREE.RepeatWrapping
  _cordTex.repeat.set(1, 18)
  return _cordTex
}

/**
 * Sweep a cross-section along a circular arc in the XY plane (Y up).
 * profile(t, a) -> [dRadial, dZ]; uv(t, a, dr, dz) -> [u, v]. t in [t0,t1] maps to theta.
 */
function sweepArc({ R, theta0, theta1, t0 = 0, t1 = 1, segs = 160, radial = 48, profile, uv, fade = 0.08 }) {
  const pos = [], uvs = [], idx = [], mask = []
  for (let i = 0; i <= segs; i++) {
    const t = t0 + (t1 - t0) * (i / segs)
    const th = theta0 + (theta1 - theta0) * t
    const n = [Math.cos(th), Math.sin(th)]
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2
      const [dr, dz] = profile(t, a)
      pos.push((R + dr) * n[0], (R + dr) * n[1], dz)
      uvs.push(...uv(t, a, dr, dz))
      const e = Math.min(i / segs, 1 - i / segs)
      mask.push(THREE.MathUtils.smoothstep(e, 0, fade))
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j
    idx.push(a, b, a + 1, b, b + 1, a + 1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setAttribute('aMask', new THREE.Float32BufferAttribute(mask, 1))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const arcPoint = (R, th, z = 0) => new THREE.Vector3(R * Math.cos(th), R * Math.sin(th), z)

function cordLoop(a, b, top = 1.35, back = -0.55, radius = 0.032) {
  const curve = new THREE.CatmullRomCurve3([
    a, a.clone().add(new THREE.Vector3(Math.sign(a.x) * 0.08, 0.25, -0.05)),
    new THREE.Vector3(Math.sign(a.x) * 0.75, top * 0.75, back * 0.6),
    new THREE.Vector3(0, top, back),
    new THREE.Vector3(Math.sign(b.x) * 0.75, top * 0.75, back * 0.6),
    b.clone().add(new THREE.Vector3(Math.sign(b.x) * 0.08, 0.25, -0.05)), b,
  ])
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 160, radius, 10), cord())
}

/** Ira Crescent Choker (LJ-NC-GS-002): tapered crescent tube, floral repoussé centre, ridged collars, cord. */
export function createIraModel() {
  const group = new THREE.Group(); group.name = 'ira'
  const R = 0.92, th0 = THREE.MathUtils.degToRad(172), th1 = THREE.MathUtils.degToRad(368)
  const collars = [0.27, 0.73]
  const base = t => 0.055 + 0.11 * Math.pow(Math.sin(Math.PI * t), 0.7)
  const ridge = t => collars.reduce((s, c) => {
    const d = Math.abs(t - c)
    return d < 0.035 ? s + 0.018 * (0.5 + 0.5 * Math.cos(d / 0.035 * Math.PI)) * (0.6 + 0.4 * Math.abs(Math.cos(d * 420))) : s
  }, 0)
  const profile = (t, a) => { const r = base(t) + ridge(t); return [r * Math.cos(a), r * Math.sin(a) * 0.92] }
  const uvAround = rep => (t, a) => [t * rep, a / (Math.PI * 2)]

  const engraved = silver({ map: tex('ira-engrave', [1, 1]), normal: tex('ira-engrave-n', [1, 1]), normalScale: 1.6, relief: 0.016 })
  const polished = silver({ roughness: 0.22, clearcoat: 0.8 })
  const pierced = silver({ map: tex('ira-engrave', [0.5, 1]), normal: tex('ira-engrave-n', [0.5, 1]), roughness: 0.32 })

  const part = (t0, t1, mat, rep, name, dense = 1) => {
    const m = new THREE.Mesh(sweepArc({ R, theta0: th0, theta1: th1, t0, t1, segs: Math.round((t1 - t0) * 260 * dense), radial: 48 * dense, profile, uv: uvAround(rep) }), mat)
    m.name = name; group.add(m); return m
  }
  part(0.0, 0.07, pierced, 3, 'end-cap-left')
  part(0.07, 0.30, polished, 1, 'plain-left')
  part(0.30, 0.70, engraved, 2.6, 'engraved-centre', 2.5)
  part(0.70, 0.93, polished, 1, 'plain-right')
  part(0.93, 1.0, pierced, 3, 'end-cap-right')

  // end caps + jump rings + cotton cord
  const ends = [th0, th1].map(th => arcPoint(R, th))
  ends.forEach((p, i) => {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 16), polished); cap.position.copy(p); group.add(cap)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 10, 24), polished)
    ring.position.copy(p).add(new THREE.Vector3(i ? 0.05 : -0.05, 0.06, 0)); ring.rotation.y = Math.PI / 2; group.add(ring)
  })
  const ca = ends[0].clone().add(new THREE.Vector3(-0.07, 0.1, 0)), cb = ends[1].clone().add(new THREE.Vector3(0.07, 0.1, 0))
  group.add(cordLoop(ca, cb, 1.05, -0.5))
  group.userData.processMaterials = [engraved, pierced, polished]
  group.position.y = 0.3
  return group
}

/** Kaveri Hasli (LJ-NC-GS-003): flat crescent band of raised paisley plaques joined by rosette sections. */
export function createKaveriModel() {
  const group = new THREE.Group(); group.name = 'kaveri'
  const R = 1.05, th0 = THREE.MathUtils.degToRad(205), th1 = THREE.MathUtils.degToRad(335)
  const W = 0.22, H = 0.07, n = 4
  const se = (a, w, h) => {
    const c = Math.cos(a), s = Math.sin(a)
    return [w / 2 * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), h / 2 * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]
  }
  const bandMat = silver({ map: tex('kaveri-rosette', [14, 1]), normal: tex('kaveri-rosette-n', [14, 1]), normalScale: 1.3, color: '#9ea1a8', roughness: 0.42 })
  const band = new THREE.Mesh(sweepArc({ R, theta0: th0, theta1: th1, segs: 240, radial: 40, profile: (t, a) => se(a, W, H), uv: (t, a, dr) => [t, 0.5 + dr / W] }), bandMat)
  group.add(band)
  const panelMat = silver({ map: tex('kaveri-panel'), normal: tex('kaveri-panel-n'), normalScale: 1.8, relief: 0.012, roughness: 0.26 })
  const centres = [0.1, 0.3, 0.5, 0.7, 0.9]
  for (const c of centres) {
    const half = 0.07
    const g = sweepArc({ R, theta0: th0, theta1: th1, t0: c - half, t1: c + half, segs: 110, radial: 120, fade: 0.12,
      profile: (t, a) => se(a, W * 1.08, H * 2.4), uv: (t, a, dr) => [(t - (c - half)) / (2 * half), 0.5 + dr / (W * 1.08)] })
    const m = new THREE.Mesh(g, panelMat); m.name = 'plaque'; group.add(m)
  }
  const ends = [th0, th1].map(th => arcPoint(R, th))
  group.add(cordLoop(ends[0].clone().add(new THREE.Vector3(-0.04, 0.06, 0)), ends[1].clone().add(new THREE.Vector3(0.04, 0.06, 0)), 1.2, -0.5, 0.035))
  group.userData.processMaterials = [bandMat, panelMat]
  group.position.y = 0.6
  return group
}

/** Nira Ball-Tip Torque (LJ-NC-GS-009): open round wire collar with ball terminals. */
export function createNiraModel() {
  const group = new THREE.Group(); group.name = 'nira'
  const mat = silver({ roughness: 0.26, color: '#cfd1d6' })
  const R = 1, gap = THREE.MathUtils.degToRad(34)
  const th0 = Math.PI / 2 + gap / 2, th1 = Math.PI / 2 + Math.PI * 2 - gap / 2
  const wire = new THREE.Mesh(sweepArc({ R, theta0: th0, theta1: th1, segs: 360, radial: 20, profile: (t, a) => [0.026 * Math.cos(a), 0.026 * Math.sin(a)], uv: (t, a) => [t, a] }), mat)
  group.add(wire)
  for (const th of [th0, th1]) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.058, 32, 24), mat)
    ball.position.copy(arcPoint(R + 0.004, th)); group.add(ball)
  }
  group.userData.processMaterials = [mat]
  return group
}

/** Aditi 92.5 Jhumka (LJ-ER-SS-002): filigree stud, hook, filigree dome, beaded rim, ball fringe. */
export function createJhumka() {
  const group = new THREE.Group()
  const bright = silver({ roughness: 0.2, color: '#eceef2' })
  const studMat = silver({ map: tex('aditi-stud'), normal: tex('aditi-stud-n'), normalScale: 1.2, color: '#f1f2f5', roughness: 0.22, openwork: true })
  const domeMat = silver({ map: tex('aditi-dome', [4, 1]), normal: tex('aditi-dome-n', [4, 1]), normalScale: 1.2, color: '#f1f2f5', roughness: 0.22, openwork: true })

  // stud: disc with filigree face + beaded rim
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 64), [bright, studMat, studMat])
  stud.rotation.x = Math.PI / 2; stud.position.y = 0.95; group.add(stud)
  const bead = new THREE.SphereGeometry(0.02, 12, 8)
  const rimBeads = new THREE.InstancedMesh(bead, bright, 40)
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; rimBeads.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * 0.31, 0.95 + Math.sin(a) * 0.31, 0.01)) }
  group.add(rimBeads)

  // hook from stud to dome
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 12, 32), bright)
  hook.position.y = 0.55; group.add(hook)
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 12), bright); stem.position.y = 0.68; group.add(stem)

  // dome (lathe), rim band, finial
  const pts = []
  for (let i = 0; i <= 40; i++) {
    const s = i / 40
    pts.push(new THREE.Vector2(0.04 + 0.41 * Math.sin(s * Math.PI / 2), 0.42 * Math.cos(s * Math.PI / 2)))
  }
  const dome = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), domeMat); group.add(dome)
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), bright); finial.position.y = 0.44; group.add(finial)
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.02, 12, 96), bright); rim.rotation.x = Math.PI / 2; group.add(rim)
  const rimDots = new THREE.InstancedMesh(bead, bright, 64)
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; rimDots.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * 0.45, -0.035, Math.sin(a) * 0.45)) }
  group.add(rimDots)

  // fringe: drops on short links hanging from the rim, two rows
  const drop = new THREE.SphereGeometry(0.042, 16, 12)
  const link = new THREE.CylinderGeometry(0.006, 0.006, 0.09, 6)
  const N = 26
  const drops = new THREE.InstancedMesh(drop, bright, N * 2)
  const links = new THREE.InstancedMesh(link, bright, N * 2)
  for (let row = 0; row < 2; row++) for (let i = 0; i < N; i++) {
    const a = ((i + row * 0.5) / N) * Math.PI * 2, r = 0.43 - row * 0.07, y = -0.1 - row * 0.09
    const k = row * N + i
    links.setMatrixAt(k, m4.makeTranslation(Math.cos(a) * r, y + 0.04, Math.sin(a) * r))
    drops.setMatrixAt(k, m4.makeTranslation(Math.cos(a) * r, y - 0.03, Math.sin(a) * r))
  }
  group.add(links, drops)
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), silver({ roughness: 0.35, color: '#9a9ca3' })); group.add(inner)
  const centreBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 24, 16), bright); centreBall.position.y = -0.12; group.add(centreBall)
  group.userData.processMaterials = [studMat, domeMat]
  return group
}

/** A pair of Aditi jhumkas, slightly turned towards each other. */
export function createAditiModel() {
  const group = new THREE.Group(); group.name = 'aditi'
  const a = createJhumka(), b = createJhumka()
  a.position.x = -0.6; a.rotation.y = 0.35
  b.position.x = 0.6; b.rotation.y = -0.35; b.position.y = -0.08
  group.add(a, b)
  group.userData.processMaterials = [...a.userData.processMaterials, ...b.userData.processMaterials]
  group.scale.setScalar(1.15)
  group.position.y = -0.25
  return group
}

export const MODELS = {
  ira: { create: createIraModel, name: 'Ira Crescent Choker', hi: 'इरा', metal: 'German silver' },
  kaveri: { create: createKaveriModel, name: 'Kaveri Hasli', hi: 'कावेरी', metal: 'German silver' },
  nira: { create: createNiraModel, name: 'Nira Ball-Tip Torque', hi: 'नीरा', metal: 'German silver' },
  aditi: { create: createAditiModel, name: 'Aditi Jhumkas', hi: 'अदिति', metal: '92.5 sterling' },
}
