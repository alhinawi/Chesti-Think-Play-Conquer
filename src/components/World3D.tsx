'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { WORLD3D_POSITIONS } from '../data/world3d'
import { Icon } from './ui'
import RichText from './RichText'
import { useI18n } from '../lib/i18n'
import { useW3Loc } from '../lib/i18n/content'

const FILES = 'abcdefgh'
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

type PieceSpec = { type: string; color: 'w' | 'b'; square: string }

function parseFen(fen: string): PieceSpec[] {
  const out: PieceSpec[] = []
  const rows = fen.split(' ')[0].split('/')
  rows.forEach((row, ri) => {
    let file = 0
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += +ch
      } else {
        out.push({
          type: ch.toLowerCase(),
          color: ch === ch.toUpperCase() ? 'w' : 'b',
          square: FILES[file] + (8 - ri),
        })
        file += 1
      }
    }
  })
  return out
}

function squareToVec(square: string): [number, number] {
  const file = FILES.indexOf(square[0])
  const rank = +square[1]
  return [file - 3.5, 3.5 - (rank - 1)]
}

function lathe(points: [number, number][], segments = 28): THREE.LatheGeometry {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments)
}

function buildPiece(type: string, color: 'w' | 'b'): THREE.Group {
  const mat = new THREE.MeshStandardMaterial({
    color: color === 'w' ? 0xf3ead5 : 0x23232b,
    roughness: 0.32,
    metalness: 0.15,
  })
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a94a, roughness: 0.25, metalness: 0.7 })
  const g = new THREE.Group()
  const add = (geo: THREE.BufferGeometry, y = 0, m: THREE.Material = mat) => {
    const mesh = new THREE.Mesh(geo, m)
    mesh.position.y = y
    mesh.castShadow = true
    g.add(mesh)
    return mesh
  }
  // القاعدة المشتركة
  add(lathe([[0, 0], [0.3, 0], [0.28, 0.05], [0.2, 0.1], [0.16, 0.14]]))
  switch (type) {
    case 'p': {
      add(lathe([[0.14, 0.14], [0.1, 0.3], [0.05, 0.4], [0.13, 0.44], [0.13, 0.46]]))
      add(new THREE.SphereGeometry(0.14, 20, 16), 0.58)
      break
    }
    case 'r': {
      add(lathe([[0.16, 0.14], [0.13, 0.45], [0.16, 0.48], [0.24, 0.5], [0.24, 0.68]]))
      for (let i = 0; i < 4; i++) {
        const tooth = add(new THREE.BoxGeometry(0.11, 0.1, 0.11), 0.72)
        tooth.position.x = Math.cos((i * Math.PI) / 2) * 0.17
        tooth.position.z = Math.sin((i * Math.PI) / 2) * 0.17
      }
      break
    }
    case 'n': {
      add(lathe([[0.16, 0.14], [0.15, 0.2], [0.14, 0.3]]))
      const neck = add(new THREE.BoxGeometry(0.16, 0.45, 0.22), 0.42)
      neck.rotation.x = -0.35
      const head = add(new THREE.BoxGeometry(0.15, 0.22, 0.34), 0.66)
      head.position.z = 0.06
      head.rotation.x = 0.25
      const snout = add(new THREE.BoxGeometry(0.12, 0.12, 0.18), 0.6)
      snout.position.z = 0.26
      snout.rotation.x = 0.5
      const ear1 = add(new THREE.ConeGeometry(0.045, 0.12, 8), 0.78)
      ear1.position.set(0.05, 0.78, -0.04)
      const ear2 = add(new THREE.ConeGeometry(0.045, 0.12, 8), 0.78)
      ear2.position.set(-0.05, 0.78, -0.04)
      break
    }
    case 'b': {
      add(lathe([[0.15, 0.14], [0.09, 0.5], [0.16, 0.56], [0.1, 0.62], [0.13, 0.68], [0.13, 0.7]]))
      add(new THREE.SphereGeometry(0.11, 20, 16), 0.82)
      add(new THREE.ConeGeometry(0.05, 0.14, 12), 0.98)
      break
    }
    case 'q': {
      add(lathe([[0.17, 0.14], [0.1, 0.55], [0.2, 0.66], [0.16, 0.72], [0.22, 0.76], [0.22, 0.78]]))
      for (let i = 0; i < 6; i++) {
        const ball = add(new THREE.SphereGeometry(0.05, 12, 10), 0.88, gold)
        ball.position.x = Math.cos((i * Math.PI) / 3) * 0.18
        ball.position.z = Math.sin((i * Math.PI) / 3) * 0.18
      }
      add(new THREE.SphereGeometry(0.08, 16, 12), 0.94, gold)
      break
    }
    case 'k': {
      add(lathe([[0.18, 0.14], [0.11, 0.6], [0.2, 0.7], [0.15, 0.76], [0.19, 0.8], [0.19, 0.82]]))
      add(new THREE.BoxGeometry(0.06, 0.22, 0.06), 0.98, gold)
      add(new THREE.BoxGeometry(0.16, 0.06, 0.06), 1.0, gold)
      break
    }
  }
  return g
}

export default function World3D() {
  const { t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const mountRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)
  // fullscreen: the browser's Fullscreen API when it works, else a fixed full-viewport overlay (iPhone Safari, blocked APIs)
  const stageRef = useRef<HTMLDivElement>(null)
  const [fs, setFs] = useState<'off' | 'native' | 'css'>('off')
  const indexRef = useRef(index)
  const autoRef = useRef(autoRotate)
  indexRef.current = index
  autoRef.current = autoRotate

  const apiRef = useRef<{ setPosition: (i: number) => void; resetView: () => void } | null>(null)
  const pickCbRef = useRef<(label: string | null) => void>(null)
  pickCbRef.current = setPicked

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0b0e14, 18, 34)
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    const HOME = new THREE.Vector3(5.4, 6.4, 7.4)
    camera.position.copy(HOME)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 4.5
    controls.maxDistance = 16
    controls.maxPolarAngle = 1.42
    controls.target.set(0, 0.3, 0)
    controls.autoRotateSpeed = 1.1

    // إضاءة
    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const key = new THREE.DirectionalLight(0xfff2dd, 1.6)
    key.position.set(6, 11, 4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -8
    key.shadow.camera.right = 8
    key.shadow.camera.top = 8
    key.shadow.camera.bottom = -8
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x7dd3fc, 0.35)
    rim.position.set(-7, 6, -6)
    scene.add(rim)

    // الأرضية
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(11, 48),
      new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: 0.9 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.32
    floor.receiveShadow = true
    scene.add(floor)

    // القاعدة والرقعة
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(9.4, 0.3, 9.4),
      new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.5, metalness: 0.2 }),
    )
    base.position.y = -0.16
    base.receiveShadow = true
    scene.add(base)
    const rimFrame = new THREE.Mesh(
      new THREE.BoxGeometry(9.7, 0.1, 9.7),
      new THREE.MeshStandardMaterial({ color: 0xd9a94a, roughness: 0.3, metalness: 0.75 }),
    )
    rimFrame.position.y = -0.3
    scene.add(rimFrame)

    const lightSq = new THREE.MeshStandardMaterial({ color: 0xe9dcc3, roughness: 0.55 })
    const darkSq = new THREE.MeshStandardMaterial({ color: 0x175546, roughness: 0.55 })
    const sqGeo = new THREE.BoxGeometry(0.985, 0.06, 0.985)
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const sq = new THREE.Mesh(sqGeo, (f + r) % 2 ? darkSq : lightSq)
        sq.position.set(f - 3.5, 0.03, r - 3.5)
        sq.receiveShadow = true
        sq.userData.square = FILES[f] + (8 - r)
        scene.add(sq)
      }
    }

    // مجموعة القطع
    let pieceGroup = new THREE.Group()
    scene.add(pieceGroup)
    let spawnAt = performance.now()

    const setPosition = (i: number) => {
      scene.remove(pieceGroup)
      pieceGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      pieceGroup = new THREE.Group()
      const specs = parseFen(WORLD3D_POSITIONS[i].fen)
      for (const spec of specs) {
        const piece = buildPiece(spec.type, spec.color)
        const [x, z] = squareToVec(spec.square)
        piece.position.set(x, 0.06, z)
        piece.userData = { square: spec.square, type: spec.type, color: spec.color }
        piece.traverse((o) => {
          o.userData = { square: spec.square, type: spec.type, color: spec.color }
        })
        pieceGroup.add(piece)
      }
      scene.add(pieceGroup)
      spawnAt = performance.now()
    }

    setPosition(indexRef.current)

    // لمس/دوس على قطعة
    const ray = new THREE.Raycaster()
    const ptr = new THREE.Vector2()
    let downAt = 0
    let downXY: [number, number] = [0, 0]
    const onDown = (e: PointerEvent) => {
      downAt = performance.now()
      downXY = [e.clientX, e.clientY]
    }
    const onUp = (e: PointerEvent) => {
      if (performance.now() - downAt > 350) return
      if (Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 8) return
      const rect = renderer.domElement.getBoundingClientRect()
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(ptr, camera)
      const hits = ray.intersectObjects(pieceGroup.children, true)
      if (hits.length) {
        const u = hits[0].object.userData
        pickCbRef.current?.(tRef.current(u.color === 'w' ? 'w3.pickWhite' : 'w3.pickBlack', { piece: tRef.current(`w3.piece${String(u.type).toUpperCase()}`), sq: u.square }))
      } else {
        pickCbRef.current?.(null)
      }
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    // حجم
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
      controls.autoRotate = autoRef.current
      controls.update()
      // دخول القطع بأنيميشن
      const t = performance.now() - spawnAt
      pieceGroup.children.forEach((p, i) => {
        const local = Math.min(1, Math.max(0, (t - i * 28) / 380))
        const s = local < 1 ? 0.2 + 0.8 * (1 - Math.pow(1 - local, 3)) : 1
        p.scale.setScalar(s)
      })
      renderer.render(scene, camera)
    }
    loop()

    apiRef.current = {
      setPosition,
      resetView: () => {
        camera.position.copy(HOME)
        controls.target.set(0, 0.3, 0)
      },
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      controls.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      apiRef.current = null
    }
  }, [])

  useEffect(() => {
    apiRef.current?.setPosition(index)
    setPicked(null)
  }, [index])

  useEffect(() => {
    const onChange = () => {
      const d = document as FsDoc
      const el = d.fullscreenElement ?? d.webkitFullscreenElement ?? null
      setFs((m) => (el && el === stageRef.current ? 'native' : m === 'native' ? 'off' : m))
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  useEffect(() => {
    if (fs !== 'css') return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFs('off')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fs])

  const toggleFs = useCallback(async () => {
    const d = document as FsDoc
    if (fs === 'native') {
      if (d.fullscreenElement && d.exitFullscreen) void d.exitFullscreen().catch(() => setFs('off'))
      else if (d.webkitFullscreenElement && d.webkitExitFullscreen) void d.webkitExitFullscreen()
      else setFs('off')
      return
    }
    if (fs === 'css') {
      setFs('off')
      return
    }
    const el = stageRef.current as FsEl | null
    if (!el) return
    try {
      if (typeof el.requestFullscreen === 'function') {
        await el.requestFullscreen({ navigationUI: 'hide' })
        return
      }
      if (typeof el.webkitRequestFullscreen === 'function') {
        await el.webkitRequestFullscreen()
        if (d.webkitFullscreenElement === el) return
      }
    } catch {
      /* refused by the browser: use the overlay */
    }
    setFs('css')
  }, [fs])

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + WORLD3D_POSITIONS.length) % WORLD3D_POSITIONS.length)
  }, [])

  const w3 = useW3Loc()
  const pos = w3(WORLD3D_POSITIONS[index])

  return (
    <div>
      <div
        ref={stageRef}
        className={`relative overflow-hidden border border-line bg-gradient-to-b from-[#0d1420] to-[#090d15] ${
          fs === 'css' ? 'fixed inset-0 z-[60] rounded-none' : 'rounded-2xl'
        }`}
      >
        <div ref={mountRef} className={`w-full touch-none ${fs === 'off' ? 'h-[60vh] min-h-[380px] md:h-[65vh]' : 'h-screen h-dvh'}`} />
        <button
          type="button"
          onClick={toggleFs}
          aria-label={fs === 'off' ? t('ln.fs') : t('ln.exitFs')}
          title={fs === 'off' ? t('ln.fs') : t('ln.exitFs')}
          className="absolute top-3 left-3 grid h-11 w-11 place-items-center rounded-xl bg-black/55 text-gold backdrop-blur transition hover:bg-black/75"
        >
          <Icon name={fs === 'off' ? 'expand' : 'shrink'} />
        </button>
        <div className="pointer-events-none absolute top-3 right-3 rounded-lg bg-black/50 px-3 py-1 text-sm font-bold text-gold backdrop-blur" dir="ltr">
          {index + 1} / {WORLD3D_POSITIONS.length}
        </div>
        {picked && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-3 py-1 text-sm text-ink backdrop-blur">
            {picked}
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('w3.next')}
            className="grid h-11 w-11 place-items-center rounded-xl bg-black/55 text-gold backdrop-blur transition hover:bg-black/75"
          >
            <Icon name="next" />
          </button>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('w3.prev')}
            className="grid h-11 w-11 place-items-center rounded-xl bg-black/55 text-gold backdrop-blur transition hover:bg-black/75"
          >
            <Icon name="prev" />
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            aria-label={autoRotate ? t('w3.autoOff') : t('w3.autoOn')}
            aria-pressed={autoRotate}
            className={`grid h-11 w-11 place-items-center rounded-xl backdrop-blur transition ${
              autoRotate ? 'bg-gold text-black' : 'bg-black/55 text-gold hover:bg-black/75'
            }`}
          >
            <Icon name="reset" />
          </button>
          <button
            type="button"
            onClick={() => apiRef.current?.resetView()}
            aria-label={t('w3.resetCam')}
            title={t('w3.resetCam')}
            className="grid h-11 w-11 place-items-center rounded-xl bg-black/55 text-gold backdrop-blur transition hover:bg-black/75"
          >
            <Icon name="compass" />
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-muted">
        {t('w3.hint')}
      </p>

      <div className="luxe-card mt-4 rounded-2xl p-5">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">{pos.name}</h2>
          <span className="rounded-full bg-gold-soft px-3 py-1 text-sm font-bold text-gold" dir="ltr">
            {pos.move}
          </span>
        </div>
        <p className="mb-2 text-sm text-muted" dir="ltr">{pos.en}</p>
        <RichText text={pos.story} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {WORLD3D_POSITIONS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-current={i === index}
            className={`rounded-xl border p-3 text-right text-sm transition ${
              i === index ? 'border-gold bg-gold-soft font-bold' : 'border-line bg-surface hover:border-gold/40'
            }`}
          >
            {w3(p).name}
          </button>
        ))}
      </div>
    </div>
  )
}
