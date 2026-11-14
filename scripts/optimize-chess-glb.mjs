import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, textureCompress, quantize, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'

await MeshoptEncoder.ready
const KEEP = ['King_B','King_W','Queen_B','Queen_W','Pawn_Body_W1','Pawn_Top_W1','Pawn_Body_B1','Pawn_Top_B1','Castle_W1','Castle_B1','Knight_W1','Knight_B1','Bishop_W1','Bishop_B1']
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
const doc = await io.read('/tmp/abg.glb')
const root = doc.getRoot()

for (const node of root.listNodes()) {
  if (!KEEP.includes(node.getName())) node.dispose()
}
// center kept pieces on origin (X/Z), keep Y
for (const node of root.listNodes()) {
  const t = node.getTranslation()
  node.setTranslation([0, t[1], 0])
}
await doc.transform(dedup(), prune(), weld())
// drop transmission (heavy on mobile; materials stay glossy PBR)
for (const mat of root.listMaterials()) {
  const tr = mat.getExtension('KHR_materials_transmission')
  if (tr) mat.setExtension('KHR_materials_transmission', null)
  const vol = mat.getExtension('KHR_materials_volume')
  if (vol) mat.setExtension('KHR_materials_volume', null)
}
await doc.transform(
  textureCompress({ resize: [512, 512], targetFormat: 'webp' }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
)
await io.write('/downloads/chesti/public/models/chess-set.glb', doc)
