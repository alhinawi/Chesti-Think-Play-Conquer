'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { loadPieceLibrary, type PieceType, type PieceColor } from './world3d/pieces'
import { WORLD3D_THEMES, DEFAULT_THEME } from './world3d/themes'
import { Icon } from './ui'

const FILES = 'abcdefgh'

const CAM_PRESETS = [
  { id: 'classic', name: 'كلاسيك', pos: [0, 6.4, 8.6], target: [0, 0.3, 0] },
  { id: 'top', name: 'من فوق', pos: [0, 11, 0.01], target: [0, 0, 0] },
  { id: 'white', name: 'جنب الأبيض', pos: [0, 2.6, 7.6], target: [0, 0.8, 0] },
  { id: 'black', name: 'جنب الأسود', pos: [0, 2.6, -7.6], target: [0, 0.8, 0] },
  { id: 'cine', name: 'سينمائي', pos: [7.2, 4.4, 6.4], target: [0, 0.6, 0] },
] as const

function squareVec(square: string): [number, number] {
  const f = FILES.indexOf(square[0])
  const r = +square[1]
  return [f - 3.5, 3.5 - (r - 1)]
}

const START: { t: PieceType; c: PieceColor; s: string }[] = (() => {
  const back: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  const out: { t: PieceType; c: PieceColor; s: string }[] = []
  for (let f = 0; f < 8; f++) {
    out.push({ t: back[f], c: 'w', s: FILES[f] + '1' })
    out.push({ t: 'p', c: 'w', s: FILES[f] + '2' })
    out.push({ t: 'p', c: 'b', s: FILES[f] + '7' })
    out.push({ t: back[f], c: 'b', s: FILES[f] + '8' })
  }
  return out
})()

export default function World3DPro() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [themeId, setThemeId] = useState(DEFAULT_THEME)
  const [preset, setPreset] = useState<string>('classic')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const themeRef = useRef(themeId)
  themeRef.current = themeId
  const apiRef = useRef<{ applyTheme: (id: string) => void; goPreset: (id: string) => void } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false

    const theme = () => WORLD3D_THEMES.find((t) => t.id === themeRef.current) ?? WORLD3D_THEMES[0]

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120)
    camera.position.set(...(CAM_PRESETS[0].pos as unknown as [number, number, number]))

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 3.5
    controls.maxDistance = 22
    controls.maxPolarAngle = 1.5
    controls.target.set(0, 0.3, 0)

    // إضاءة
    const amb = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(amb)
    const key = new THREE.DirectionalLight(0xfff2dd, 1.6)
    key.position.set(6, 12, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -9
    key.shadow.camera.right = 9
    key.shadow.camera.top = 9
    key.shadow.camera.bottom = -9
    key.shadow.bias = -0.0004
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x9cc8ff, 0.4)
    rim.position.set(-8, 6, -7)
    scene.add(rim)

    // أرضية الصالة
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ roughness: 0.3 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.34
    floor.receiveShadow = true
    scene.add(floor)

    // قاعدة الرقعة وإطارها
    const base = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.34, 9.6), new THREE.MeshStandardMaterial({ roughness: 0.4 }))
    base.position.y = -0.17
    base.receiveShadow = true
    base.castShadow = true
    scene.add(base)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(9.9, 0.12, 9.9), new THREE.MeshStandardMaterial({ roughness: 0.25 }))
    frame.position.y = -0.36
    scene.add(frame)

    // المربعات
    const sqLightMat = new THREE.MeshStandardMaterial({ roughness: 0.2 })
    const sqDarkMat = new THREE.MeshStandardMaterial({ roughness: 0.2 })
    const sqGeo = new THREE.BoxGeometry(0.99, 0.07, 0.99)
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const sq = new THREE.Mesh(sqGeo, (f + r) % 2 ? sqDarkMat : sqLightMat)
        sq.position.set(f - 3.5, 0.035, r - 3.5)
        sq.receiveShadow = true
        scene.add(sq)
      }
    }

    // ضباب
    scene.fog = new THREE.Fog(0x08090d, 22, 44)

    const applyTheme = (id: string) => {
      const t = WORLD3D_THEMES.find((x) => x.id === id) ?? WORLD3D_THEMES[0]
      ;(sqLightMat.color as THREE.Color).set(t.squareLight)
      ;(sqDarkMat.color as THREE.Color).set(t.squareDark)
      sqLightMat.roughness = t.squareRoughness
      sqDarkMat.roughness = t.squareRoughness
      ;(base.material as THREE.MeshStandardMaterial).color.set(t.base)
      ;(frame.material as THREE.MeshStandardMaterial).color.set(t.frame)
      ;(frame.material as THREE.MeshStandardMaterial).metalness = t.frameMetalness
      ;(floor.material as THREE.MeshStandardMaterial).color.set(t.floor)
      ;(floor.material as THREE.MeshStandardMaterial).roughness = t.floorRoughness
      amb.intensity = t.ambient
      key.color.set(t.keyColor)
      key.intensity = t.keyIntensity
      rim.color.set(t.rimColor)
      rim.intensity = t.rimIntensity
      ;(scene.fog as THREE.Fog).color.set(t.fog)
      mount.style.background = `linear-gradient(to bottom, ${t.skyTop}, ${t.skyBottom})`
    }
    applyTheme(theme().id)

    const goPreset = (id: string) => {
      const p = CAM_PRESETS.find((x) => x.id === id) ?? CAM_PRESETS[0]
      // شاشة ضيقة (موبايل بورتريه) = الكاميرا ترجع لورا عشان الرقعة تدخل في الكادر
      const aspect = mount.clientWidth / Math.max(mount.clientHeight, 1)
      const pull = aspect < 1 ? Math.min(1.12 / Math.max(aspect, 0.4), 1.8) : 1
      camera.position.set(
        (p.pos as unknown as [number, number, number])[0] * pull,
        (p.pos as unknown as [number, number, number])[1] * pull,
        (p.pos as unknown as [number, number, number])[2] * pull,
      )
      controls.target.set(...(p.target as unknown as [number, number, number]))
    }

    apiRef.current = { applyTheme, goPreset }

    // تحميل القطع
    const piecesGroup = new THREE.Group()
    scene.add(piecesGroup)
    loadPieceLibrary()
      .then((lib) => {
        if (disposed) return
        for (const { t, c, s } of START) {
          const piece = lib.spawn(t, c)
          const [x, z] = squareVec(s)
          piece.position.set(x, 0.07, z)
          piecesGroup.add(piece)
        }
        setReady(true)
      })
      .catch((e) => {
        if (!disposed) setError(e instanceof Error ? e.message : 'فشل تحميل القطع')
      })

    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      controls.update()
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    apiRef.current?.applyTheme(themeId)
  }, [themeId])
  useEffect(() => {
    apiRef.current?.goPreset(preset)
  }, [preset])

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line">
        <div ref={mountRef} className="h-[62vh] min-h-[400px] w-full touch-none md:h-[70vh]" />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-ink backdrop-blur-sm">
            بيحمّل قطع الشطرنج الفخمة...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-ink">
            حصلت مشكلة في التحميل: {error}
          </div>
        )}
        <div className="absolute bottom-3 right-3 left-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-black/55 p-1 backdrop-blur">
            {WORLD3D_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                aria-pressed={themeId === t.id}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${themeId === t.id ? 'bg-gold font-bold text-black' : 'text-ink hover:bg-white/10'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl bg-black/55 p-1 backdrop-blur">
            {CAM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${preset === p.id ? 'bg-gold font-bold text-black' : 'text-ink hover:bg-white/10'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        <Icon name="globe" className="inline h-4 w-4 align-[-2px]" /> اسحب للفّ، وقرّب وبعّد بإصبعين
      </p>
    </div>
  )
}
