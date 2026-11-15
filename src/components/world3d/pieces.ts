import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
export type PieceColor = 'w' | 'b'

/** node names inside public/models/chess-set.glb (ASWF "A Beautiful Game", CC-BY 4.0) */
const NODE_MAP: Record<`${PieceType}-${PieceColor}`, string[]> = {
  'k-w': ['King_W'],
  'k-b': ['King_B'],
  'q-w': ['Queen_W'],
  'q-b': ['Queen_B'],
  'r-w': ['Castle_W1'],
  'r-b': ['Castle_B1'],
  'n-w': ['Knight_W1'],
  'n-b': ['Knight_B1'],
  'b-w': ['Bishop_W1'],
  'b-b': ['Bishop_B1'],
  'p-w': ['Pawn_Body_W1', 'Pawn_Top_W1'],
  'p-b': ['Pawn_Body_B1', 'Pawn_Top_B1'],
}

export interface PieceLibrary {
  /** build a fresh piece instance (cloned geometry/materials) */
  spawn: (type: PieceType, color: PieceColor) => THREE.Group
  /** world-units scale applied so a square edge = 1 and the king is ~0.95 tall */
  scale: number
  dispose: () => void
}

let cached: Promise<PieceLibrary> | null = null

export function loadPieceLibrary(): Promise<PieceLibrary> {
  if (cached) return cached
  cached = (async () => {
    const loader = new GLTFLoader()
    loader.setMeshoptDecoder(MeshoptDecoder)
    const gltf = await loader.loadAsync('/models/chess-set.glb')
    const root = gltf.scene

    const protos = new Map<string, THREE.Group>()
    for (const [key, names] of Object.entries(NODE_MAP)) {
      const g = new THREE.Group()
      for (const name of names) {
        const node = root.getObjectByName(name)
        if (!node) throw new Error(`missing node ${name} in chess-set.glb`)
        g.add(node.clone(true))
      }
      protos.set(key, g)
    }

    // normalize: king height -> 0.95 world units, base sits on y=0
    const king = protos.get('k-w')!
    const bbox = new THREE.Box3().setFromObject(king)
    const height = bbox.max.y - bbox.min.y
    const scale = 0.95 / height
    for (const [key, proto] of protos) {
      proto.scale.setScalar(scale)
      const b = new THREE.Box3().setFromObject(proto)
      proto.position.y = -b.min.y
      // wrap so the offset applies without accumulating on clone
      const wrap = new THREE.Group()
      wrap.add(proto)
      protos.set(key, wrap)
    }

    // القطع السوداء في المجموعة الأصلية رخام أخضر - نوحّدها لرمادي غامق محايد
    for (const [key, proto] of protos) {
      if (!key.endsWith('-b')) continue
      proto.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const m = (o.material as THREE.MeshStandardMaterial).clone()
          m.color.set(0x38383f)
          o.material = m
        }
      })
    }

    const materials = new Set<THREE.Material>()
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) materials.add(o.material as THREE.Material)
    })

    return {
      scale,
      spawn(type, color) {
        const proto = protos.get(`${type}-${color}`)!
        const inst = proto.clone(true)
        // clone materials so per-piece effects (capture fade) don't leak across pieces
        inst.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.material = (o.material as THREE.Material).clone()
            o.castShadow = true
            o.receiveShadow = true
          }
        })
        const g = new THREE.Group()
        g.add(inst)
        return g
      },
      dispose() {
        materials.forEach((m) => m.dispose())
        cached = null
      },
    }
  })()
  return cached
}
