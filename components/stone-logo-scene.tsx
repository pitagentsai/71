"use client"

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, SoftShadows, useGLTF } from "@react-three/drei"
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing"
import { ToneMappingMode } from "postprocessing"
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js"

/*
 * Gallery-style still life: the STRADA logo dug out of a white marble floor,
 * seen from above, with freshly chipped marble fragments and dust around the cut.
 *
 * How the cavity works (no CSG needed):
 *  1. The logo mesh, sunk so its top sits at floor level, is drawn invisibly
 *     into the stencil buffer — that marks the logo's footprint.
 *  2. The floor is drawn everywhere except that footprint, leaving a hole.
 *  3. The same mesh is drawn again with back faces only: seen through the hole,
 *     its inside walls and bottom look exactly like a carved recess.
 *
 * Performance — the scene is static, so:
 *  - frameloop="demand": frames render only while the camera eases toward
 *    a new pointer position. An idle page costs ~0 GPU.
 *  - the shadow map is rendered once, then frozen.
 *  - chips are a handful of instanced meshes (a few draw calls in total).
 *  - the logo is a pre-simplified, quantized GLB (~190 KB, ~13k tris)
 *    generated from the original FBX by scripts/fbx-to-glb.mjs.
 *  - AO runs at half resolution, pixel ratio is capped at 1.5.
 */

const LOGO_URL = "/strada-logo-3d.glb" // normalised: width 1, centred on X/Z, resting on y=0
const LOGO_WIDTH = 5 // world units (shading/shadows are tuned for this; on-screen size is set by CAMERA_DIST)
const CUT_DEPTH_SCALE = 1.6 // how much deeper than the model's own thickness the cut goes
const CAMERA_DIST = 8 // larger = smaller logo on screen
const CAMERA_ELEVATION = THREE.MathUtils.degToRad(84) // near-overhead, bird's-eye view
const BG = "#f3f2ef" // only visible past the floor; the page background (#f7f5f1) matches the rendered floor

/* ------------------------------------------------------------------ */
/* Stone / marble material                                             */
/* ------------------------------------------------------------------ */

// GLSL: 3D value noise + fbm, used for chalky pores, mottling and erosion pits.
const NOISE_GLSL = /* glsl */ `
  varying vec3 vStonePos;
  float st_hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float st_noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(st_hash(i + vec3(0,0,0)), st_hash(i + vec3(1,0,0)), f.x),
                   mix(st_hash(i + vec3(0,1,0)), st_hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(st_hash(i + vec3(0,0,1)), st_hash(i + vec3(1,0,1)), f.x),
                   mix(st_hash(i + vec3(0,1,1)), st_hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float st_fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * st_noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
  // Stone height field: broad weathering + fine grain + sparse eroded pits
  float st_height(vec3 p, out float pit) {
    float broad = st_fbm(p * 2.2);
    float grain = st_fbm(p * 14.0);
    pit = smoothstep(0.66, 0.8, st_fbm(p * 5.0 + 3.1));
    return broad * 0.25 + grain * 0.06 - pit * 0.18;
  }
  // Soft marble veining: wide, low-frequency ridges (no thin lines that would alias at distance)
  float st_vein(vec3 p) {
    float r = 1.0 - abs(2.0 * st_fbm(p * vec3(0.18, 0.18, 0.32) + 11.0) - 1.0);
    return pow(r, 10.0);
  }
  vec3 st_perturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
    vec3 sx = dFdx(surfPos);
    vec3 sy = dFdy(surfPos);
    vec3 r1 = cross(sy, surfNorm);
    vec3 r2 = cross(surfNorm, sx);
    float det = dot(sx, r1) * faceDir;
    vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
    return normalize(abs(det) * surfNorm - grad);
  }
`

type StoneOptions = {
  color?: string
  pits?: number // 0..1 strength of eroded pits
  veins?: number // 0..1 strength of marble veining
  bump?: number // surface relief strength
  cutDepth?: number // > 0: darken toward the bottom of a recess this deep (world units)
  flatShading?: boolean
}

function makeStoneMaterial({
  color = "#f4f2ed",
  pits = 1,
  veins = 0,
  bump = 1,
  cutDepth = 0,
  flatShading = false,
}: StoneOptions = {}) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, envMapIntensity: 0.6, flatShading })
  const f = (n: number) => n.toFixed(4)
  const relief = pits > 0 || bump > 0 // skip the costly height field where it isn't used (e.g. the full-screen floor)

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vStonePos;")
      .replace(
        "#include <worldpos_vertex>",
        /* glsl */ `#include <worldpos_vertex>
        vec4 st_p = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          st_p = instanceMatrix * st_p;
        #endif
        vStonePos = (modelMatrix * st_p).xyz;`,
      )

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + NOISE_GLSL)
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        float st_pit = 0.0;
        float st_h = ${relief ? "st_height(vStonePos, st_pit)" : "0.0"};
        st_pit *= ${f(pits)};
        float st_mottle = st_fbm(vStonePos * 1.3 + 7.0);
        diffuseColor.rgb *= mix(0.95, 1.02, st_mottle);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.85, 0.83), st_pit * 0.6);
        ${veins > 0 ? `diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.62, 0.63), st_vein(vStonePos) * ${f(veins)});` : ""}
        ${cutDepth > 0 ? `diffuseColor.rgb *= mix(0.6, 1.0, smoothstep(${f(-cutDepth)}, 0.0, vStonePos.y));` : ""}`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + st_pit * 0.06, 0.0, 1.0);",
      )
      .replace(
        "#include <normal_fragment_maps>",
        relief
          ? /* glsl */ `#include <normal_fragment_maps>
        vec2 st_dH = vec2(dFdx(st_h), dFdy(st_h)) * ${f(bump)};
        normal = st_perturb(-vViewPosition, normal, st_dH, faceDirection);`
          : "#include <normal_fragment_maps>",
      )
  }
  // Each option set compiles to different GLSL — keep their programs separate
  mat.customProgramCacheKey = () => `stone-${color}-${pits}-${veins}-${bump}-${cutDepth}-${flatShading}`
  return mat
}

/* ------------------------------------------------------------------ */
/* Seeded random (layout is identical on every load)                   */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* Cut geometry                                                        */
/* ------------------------------------------------------------------ */

// Bake the GLB mesh (quantized, with a node transform) into a plain float geometry,
// sized to LOGO_WIDTH, deepened, and sunk so its top sits at y = 0.
function useCutGeometry() {
  const { scene } = useGLTF(LOGO_URL)
  return useMemo(() => {
    let src: THREE.Mesh | undefined
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh
    })
    const sg = src!.geometry
    const sp = sg.attributes.position
    const sn = sg.attributes.normal
    const pos = new Float32Array(sp.count * 3)
    const nrm = new Float32Array(sp.count * 3)
    for (let i = 0; i < sp.count; i++) {
      pos.set([sp.getX(i), sp.getY(i), sp.getZ(i)], i * 3)
      nrm.set([sn.getX(i), sn.getY(i), sn.getZ(i)], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3))
    g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3))
    if (sg.index) g.setIndex(sg.index.clone())
    g.applyMatrix4(src!.matrixWorld)
    g.scale(LOGO_WIDTH, LOGO_WIDTH * CUT_DEPTH_SCALE, LOGO_WIDTH)
    g.computeBoundingBox()
    g.translate(0, -g.boundingBox!.max.y, 0)
    g.computeBoundingBox()
    g.computeBoundingSphere()
    return g
  }, [scene])
}

useGLTF.preload(LOGO_URL)

/* ------------------------------------------------------------------ */
/* Floor with the logo dug out of it                                   */
/* ------------------------------------------------------------------ */

function DugOutLogo() {
  const geometry = useCutGeometry()
  const depth = -geometry.boundingBox!.min.y

  const { mask, floor, cut } = useMemo(() => {
    // 1. footprint → stencil = 1
    const mask = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
    })
    // 2. marble floor where stencil != 1
    const floor = makeStoneMaterial({ pits: 0, veins: 0.25, bump: 0 })
    floor.stencilWrite = true
    floor.stencilRef = 1
    floor.stencilFunc = THREE.NotEqualStencilFunc
    floor.stencilFail = THREE.KeepStencilOp
    floor.stencilZFail = THREE.KeepStencilOp
    floor.stencilZPass = THREE.KeepStencilOp
    // 3. inside of the cut: back faces, rougher, darkening toward the bottom
    const cut = makeStoneMaterial({ pits: 1, veins: 0.15, bump: 1.2, cutDepth: depth })
    cut.side = THREE.BackSide
    // Front faces (the "lid" at floor level) cast into the shadow map, so the rim
    // shades the inside of the cut like a real recess under raking light
    cut.shadowSide = THREE.FrontSide
    return { mask, floor, cut }
  }, [depth])

  return (
    <>
      <mesh geometry={geometry} material={mask} renderOrder={-2} />
      <mesh rotation-x={-Math.PI / 2} material={floor} renderOrder={-1} receiveShadow>
        <planeGeometry args={[90, 90]} />
      </mesh>
      <mesh geometry={geometry} material={cut} receiveShadow /* DBG */ />
      <Debris cut={geometry} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Chipped marble fragments + dust around the cut                      */
/* ------------------------------------------------------------------ */

// Direction shadows fall across the floor (opposite the key light at [-7, 3.6, 3.5])
const SHADOW_DIR = new THREE.Vector2(7, -3.5).normalize()
const SHARD_VARIANTS = 8

function makeShard(rand: () => number) {
  // Convex hull of a few points in a flat slab → an angular, freshly fractured flake.
  // Few points = big flat facets, which is what broken marble looks like.
  const pts: THREE.Vector3[] = []
  const n = 7 + Math.floor(rand() * 4)
  const thick = 0.45 + rand() * 0.35
  const stretch = 0.55 + rand() * 0.45
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.55 + rand() * 0.45
    pts.push(new THREE.Vector3(Math.cos(a) * r, rand() * thick, Math.sin(a) * r * stretch))
  }
  // Guarantee a flat underside so the flake sits on the floor instead of rocking on a point
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + rand() * 0.8
    pts.push(new THREE.Vector3(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6 * stretch))
  }
  const g = new ConvexGeometry(pts)
  g.computeBoundingBox()
  g.translate(0, -g.boundingBox!.min.y, 0)
  return g
}

// Soft radial blob — contact shadow under each chip
function contactTexture() {
  const c = document.createElement("canvas")
  c.width = c.height = 64
  const ctx = c.getContext("2d")!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, "rgba(255,255,255,1)")
  g.addColorStop(0.45, "rgba(255,255,255,0.55)")
  g.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Grainy powder patch — fine marble dust left along the cut
function powderTexture(rand: () => number) {
  const s = 256
  const c = document.createElement("canvas")
  c.width = c.height = s
  const ctx = c.getContext("2d")!
  // soft base haze
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, "rgba(255,255,255,0.55)")
  g.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  // grains, denser toward the centre
  for (let i = 0; i < 2600; i++) {
    const a = rand() * Math.PI * 2
    const r = Math.pow(rand(), 0.7) * s * 0.48
    const x = s / 2 + Math.cos(a) * r
    const y = s / 2 + Math.sin(a) * r
    const fall = 1 - r / (s * 0.48)
    ctx.fillStyle = `rgba(255,255,255,${(0.25 + rand() * 0.75) * fall})`
    const d = 0.8 + rand() * 2.2
    ctx.fillRect(x, y, d, d)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Floor decals are clipped by the same stencil as the floor, so none hang over the hole
function floorDecalMaterial(map: THREE.Texture, color: string, opacity: number) {
  return new THREE.MeshBasicMaterial({
    map,
    color,
    opacity,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    stencilWrite: true,
    stencilRef: 1,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  })
}

type Piece = { matrix: THREE.Matrix4; color: THREE.Color }

function buildGroundGrid(geo: THREE.BufferGeometry) {
  const CELL = 0.01
  const bb = geo.boundingBox!
  const x0 = bb.min.x - CELL, z0 = bb.min.z - CELL
  const W = Math.ceil((bb.max.x - x0) / CELL) + 2
  const H = Math.ceil((bb.max.z - z0) / CELL) + 2
  const grid = new Float32Array(W * H) // 0 = floor level (no cut)
  const pos = geo.attributes.position
  const idx = geo.index
  const tri = idx ? idx.count / 3 : pos.count / 3
  const v = (k: number) => (idx ? idx.getX(k) : k)
  for (let t = 0; t < tri; t++) {
    const a = v(t * 3), b = v(t * 3 + 1), c = v(t * 3 + 2)
    const ax = pos.getX(a), az = pos.getZ(a), ay = pos.getY(a)
    const bx = pos.getX(b), bz = pos.getZ(b), by = pos.getY(b)
    const cx = pos.getX(c), cz = pos.getZ(c), cy = pos.getY(c)
    const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz)
    if (Math.abs(den) < 1e-12) continue // vertical wall seen edge-on from above
    const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / CELL))
    const i1 = Math.min(W - 1, Math.ceil((Math.max(ax, bx, cx) - x0) / CELL))
    const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - z0) / CELL))
    const j1 = Math.min(H - 1, Math.ceil((Math.max(az, bz, cz) - z0) / CELL))
    for (let j = j0; j <= j1; j++) {
      const pz = z0 + j * CELL
      for (let i = i0; i <= i1; i++) {
        const px = x0 + i * CELL
        const w1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / den
        const w2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / den
        const w3 = 1 - w1 - w2
        if (w1 < 0 || w2 < 0 || w3 < 0) continue
        const y = w1 * ay + w2 * by + w3 * cy
        const k = j * W + i
        if (y < grid[k]) grid[k] = y
      }
    }
  }
  return (x: number, z: number) => {
    const i = Math.round((x - x0) / CELL), j = Math.round((z - z0) / CELL)
    if (i < 0 || j < 0 || i >= W || j >= H) return 0
    return grid[j * W + i]
  }
}

function Debris({ cut }: { cut: THREE.BufferGeometry }) {
  const data = useMemo(() => {
    const rand = mulberry32(20261123)
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())

    // Rim: wall vertices near the top. Normal XZ points away from the logo.
    const p = cut.attributes.position
    const nm = cut.attributes.normal
    const rim: { x: number; z: number; dx: number; dz: number }[] = []
    for (let i = 0; i < p.count; i++) {
      const nx = nm.getX(i), ny = nm.getY(i), nz = nm.getZ(i)
      if (Math.abs(ny) < 0.35 && p.getY(i) > -0.12) {
        const l = Math.hypot(nx, nz) || 1
        rim.push({ x: p.getX(i), z: p.getZ(i), dx: nx / l, dz: nz / l })
      }
    }
    const pickRim = () => rim[Math.floor(rand() * rim.length)]

    // Height of the ground at (x, z): 0 on the floor, the cut bottom inside the logo.
    // Built once as a top-down height grid (rasterised triangles, keeping the lowest
    // surface), so every lookup is O(1) instead of a raycast.
    const groundAt = buildGroundGrid(cut)
    const inCut = (x: number, z: number) => groundAt(x, z) < -0.01

    const shards: Piece[] = []
    const grains: Piece[] = []
    const contacts: THREE.Matrix4[] = []
    const powder: THREE.Matrix4[] = []

    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const tint = () => {
      const v = 0.9 + rand() * 0.1
      return new THREE.Color(v, v * (0.99 + rand() * 0.01), v * (0.97 + rand() * 0.02))
    }

    // Drop a chip at (x, z), nudging it away from the cut until it is fully on one surface
    const drop = (x: number, z: number, s: number, dx: number, dz: number, list: Piece[], contact: boolean) => {
      for (let k = 0; k < 4; k++) {
        const c = inCut(x, z)
        const r = s * 0.55
        const mixed =
          inCut(x + r, z) !== c || inCut(x - r, z) !== c || inCut(x, z + r) !== c || inCut(x, z - r) !== c
        if (!mixed) break
        x += dx * s * 0.8
        z += dz * s * 0.8
      }
      const y = groundAt(x, z)
      // lie flat: free yaw, barely any tilt; sink a touch so it beds into the surface
      e.set((rand() - 0.5) * 0.12, rand() * Math.PI * 2, (rand() - 0.5) * 0.12)
      q.setFromEuler(e)
      const sy = s * (0.8 + rand() * 0.4)
      list.push({
        matrix: new THREE.Matrix4().compose(new THREE.Vector3(x, y - sy * 0.04, z), q, new THREE.Vector3(s, sy, s)),
        color: tint(),
      })
      if (contact && y === 0) {
        // contact shadow: slightly larger than the chip, nudged toward the shadow side
        const cs = s * 1.9
        contacts.push(
          new THREE.Matrix4().compose(
            new THREE.Vector3(x + SHADOW_DIR.x * s * 0.25, 0.003, z + SHADOW_DIR.y * s * 0.25),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rand() * Math.PI)),
            new THREE.Vector3(cs, cs * (0.75 + rand() * 0.25), 1),
          ),
        )
      }
    }

    // 1. Rubble piles along the rim: a few larger chips by the edge, smaller ones spilling outward
    for (let c = 0; c < 30; c++) {
      const r = pickRim()
      const cx = r.x + r.dx * (0.04 + rand() * 0.1)
      const cz = r.z + r.dz * (0.04 + rand() * 0.1)
      const n = 2 + Math.floor(rand() * 6)
      for (let i = 0; i < n; i++) {
        const spread = 0.05 + i * 0.025
        const x = cx + gauss() * spread + r.dx * i * 0.03
        const z = cz + gauss() * spread + r.dz * i * 0.03
        const s = Math.max(0.035, (0.15 - i * 0.017) * (0.6 + rand() * 0.5))
        drop(x, z, s, r.dx, r.dz, shards, true)
      }
      // grit around each pile
      for (let i = 0; i < 14; i++) {
        drop(cx + gauss() * 0.12, cz + gauss() * 0.12, 0.008 + rand() * 0.018, r.dx, r.dz, grains, false)
      }
    }

    // 2. Loose singles thrown further from the cut
    for (let i = 0; i < 45; i++) {
      const r = pickRim()
      const d = 0.18 + -Math.log(1 - rand() * 0.97) * 0.3
      const a = (rand() - 0.5) * 0.9
      const dx = r.dx * Math.cos(a) - r.dz * Math.sin(a)
      const dz = r.dx * Math.sin(a) + r.dz * Math.cos(a)
      drop(r.x + dx * d, r.z + dz * d, 0.03 + Math.pow(rand(), 2) * 0.08, dx, dz, shards, true)
    }

    // 3. Rubble that fell into the cut
    for (let i = 0; i < 26; i++) {
      const r = pickRim()
      drop(r.x - r.dx * 0.08, r.z - r.dz * 0.08, 0.03 + rand() * 0.07, -r.dx, -r.dz, shards, false)
    }

    // 4. Fine grit hugging the rim
    for (let i = 0; i < 360; i++) {
      const r = pickRim()
      const d = 0.015 + -Math.log(1 - rand() * 0.95) * 0.07
      drop(r.x + r.dx * d + gauss() * 0.02, r.z + r.dz * d + gauss() * 0.02, 0.007 + rand() * 0.016, r.dx, r.dz, grains, false)
    }

    // 5. Powder: elongated dust patches running along the rim
    for (let i = 0; i < 70; i++) {
      const r = pickRim()
      const d = 0.03 + rand() * 0.12
      const yaw = Math.atan2(r.dx, r.dz) // long axis follows the rim tangent
      const len = 0.25 + rand() * 0.45
      powder.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(r.x + r.dx * d, 0.002, r.z + r.dz * d),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, yaw, "YXZ")),
          new THREE.Vector3(len, len * (0.3 + rand() * 0.3), 1),
        ),
      )
    }

    const shardGeos = Array.from({ length: SHARD_VARIANTS }, () => makeShard(rand))
    return {
      shardGroups: shardGeos.map((geometry, v) => ({
        geometry,
        pieces: shards.filter((_, i) => i % SHARD_VARIANTS === v),
      })),
      grains: { geometry: makeShard(rand), pieces: grains },
      contacts,
      powder,
      // freshly broken marble: faceted, a touch brighter/cooler than the weathered floor
      chipMaterial: makeStoneMaterial({ color: "#f2f0ec", pits: 0, veins: 0.15, bump: 0, flatShading: true }),
      grainMaterial: makeStoneMaterial({ color: "#e4e1db", pits: 0, veins: 0, bump: 0, flatShading: true }),
      contactMaterial: floorDecalMaterial(contactTexture(), "#3a342c", 0.55),
      powderMaterial: floorDecalMaterial(powderTexture(rand), "#d6d1c8", 0.85),
    }
  }, [cut])

  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  return (
    <>
      <Instances geometry={plane} matrices={data.powder} material={data.powderMaterial} renderOrder={1} />
      <Instances geometry={plane} matrices={data.contacts} material={data.contactMaterial} renderOrder={2} />
      {data.shardGroups.map((g, i) => (
        <Instances key={i} geometry={g.geometry} pieces={g.pieces} material={data.chipMaterial} castShadow />
      ))}
      <Instances geometry={data.grains.geometry} pieces={data.grains.pieces} material={data.grainMaterial} />
    </>
  )
}

function Instances({
  geometry,
  matrices,
  pieces,
  material,
  castShadow = false,
  renderOrder = 0,
}: {
  geometry: THREE.BufferGeometry
  matrices?: THREE.Matrix4[]
  pieces?: Piece[]
  material: THREE.Material
  castShadow?: boolean
  renderOrder?: number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = pieces?.length ?? matrices?.length ?? 0
  // Layout effect: matrices must be in place before the first (and only) shadow-map render
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    if (pieces) {
      pieces.forEach((pc, i) => {
        m.setMatrixAt(i, pc.matrix)
        m.setColorAt(i, pc.color)
      })
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    } else {
      matrices?.forEach((mat, i) => m.setMatrixAt(i, mat))
    }
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [matrices, pieces])
  if (!count) return null
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow={castShadow}
      renderOrder={renderOrder}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Camera: fit to screen + gentle pointer parallax, rendered on demand  */
/* ------------------------------------------------------------------ */

function CameraRig() {
  const { camera, size, invalidate } = useThree()
  const pointer = useRef({ x: 0, y: 0 })
  const target = useMemo(() => new THREE.Vector3(), [])
  const first = useRef(true)

  // Pointer parallax only on fine pointers and when motion is allowed
  useEffect(() => {
    const allow =
      window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!allow) return
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      invalidate()
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [invalidate])

  useEffect(() => invalidate(), [size, invalidate])

  useFrame((_, dt) => {
    const aspect = size.width / size.height
    // Pull back on portrait screens so the logo keeps the same relative size
    const dist = CAMERA_DIST / Math.min(1, aspect * 1.15)
    const yaw = pointer.current.x * 0.05
    // Clamp below 90° so lookAt never flips when the pointer tilts the view
    const pitch = Math.min(CAMERA_ELEVATION + pointer.current.y * 0.025, THREE.MathUtils.degToRad(88))
    target.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist)

    if (first.current) {
      camera.position.copy(target)
      first.current = false
    } else {
      camera.position.lerp(target, 1 - Math.exp(-Math.min(dt, 0.1) * 3))
    }
    camera.lookAt(0, 0, 0)
    // Keep rendering only while the camera is still easing
    if (camera.position.distanceToSquared(target) > 1e-6) invalidate()
  })
  return null
}

// Render the shadow map once — after every mesh (incl. instanced chips) is placed — then freeze it
function FreezeShadows() {
  const { gl, invalidate } = useThree()
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    invalidate()
    return () => {
      gl.shadowMap.autoUpdate = true
    }
  }, [gl, invalidate])
  return null
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

export default function StoneLogoScene() {
  return (
    <Canvas
      flat
      shadows
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 30, 3], fov: 30, near: 1, far: 120 }}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: true }}
    >
      <color attach="background" args={[BG]} />
      <ambientLight intensity={0.18} />

      {/* Raking key light from the upper left: soft, contact-hardening shadows */}
      {/* DBG <SoftShadows size={6} samples={10} focus={0.3} /> */}
      <directionalLight
        position={[-7, 3.6, 3.5]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.003}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-camera-near={1}
        shadow-camera-far={18}
      />
      {/* Studio reflections, rendered once into a cube map */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={0.75} position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={0.4} position={[-8, 3, 2]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={0.25} position={[8, 3, -2]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>

      <Suspense fallback={null}>
        <DugOutLogo />
        {/* DBG2 <FreezeShadows /> */}
      </Suspense>

      <CameraRig />

      {false && <EffectComposer multisampling={2} stencilBuffer>
        {/* Half-res ambient occlusion: darkens the inside corners of the cut and under chips */}
        <N8AO halfRes aoRadius={0.12} distanceFalloff={0.25} intensity={2.4} color="#3d3832" quality="medium" />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      </EffectComposer>}
    </Canvas>
  )
}
