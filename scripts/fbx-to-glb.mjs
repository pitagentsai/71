// FBX -> simplified, quantized GLB. Bakes the node transform, normalises to width 1,
// centres on X/Z and rests the model on y=0 so runtime needs no bounding-box work.
// Usage (deps are not part of the app): npm i three@0.170.0 @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer@0.22
//   node scripts/fbx-to-glb.mjs assets/strada-logo-3d.fbx public/strada-logo-3d.glb 0.08
import fs from "fs"
import * as THREE from "three"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { Document, NodeIO } from "@gltf-transform/core"
import { weld, simplify, quantize, normals, dedup, prune } from "@gltf-transform/functions"
import { MeshoptSimplifier } from "meshoptimizer"
import { ALL_EXTENSIONS } from "@gltf-transform/extensions"

const [, , src, out, ratioArg] = process.argv
const buf = fs.readFileSync(src)
const fbx = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "")
fbx.updateMatrixWorld(true)
let geo
fbx.traverse((o) => { if (o.isMesh) { geo = o.geometry.clone().applyMatrix4(o.matrixWorld) } })
geo.deleteAttribute("normal")
geo = mergeVertices(geo, 1e-4)
geo.computeBoundingBox()
const b = geo.boundingBox, s = 1 / Math.max(b.max.x - b.min.x, b.max.z - b.min.z)
geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2)
geo.scale(s, s, s)
geo.computeVertexNormals()

const doc = new Document()
const buffer = doc.createBuffer()
const pos = doc.createAccessor().setType("VEC3").setArray(new Float32Array(geo.attributes.position.array)).setBuffer(buffer)
const nrm = doc.createAccessor().setType("VEC3").setArray(new Float32Array(geo.attributes.normal.array)).setBuffer(buffer)
const idx = doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(geo.index.array)).setBuffer(buffer)
const prim = doc.createPrimitive().setAttribute("POSITION", pos).setAttribute("NORMAL", nrm).setIndices(idx)
const mesh = doc.createMesh("logo").addPrimitive(prim)
doc.createScene().addChild(doc.createNode("logo").setMesh(mesh))

await MeshoptSimplifier.ready
await doc.transform(
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratioArg ?? 0.2), error: 0.0008 }),
  dedup(), prune(),
  quantize({ quantizePosition: 14, quantizeNormal: 10 }),
)
await new NodeIO().registerExtensions(ALL_EXTENSIONS).write(out, doc)
const pr = doc.getRoot().listMeshes()[0].listPrimitives()[0]
console.log("triangles:", pr.getIndices().getCount() / 3, "bytes:", fs.statSync(out).size)
