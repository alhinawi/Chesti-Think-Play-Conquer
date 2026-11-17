'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Chess, type Move } from 'chess.js'
import { loadPieceLibrary, type PieceType, type PieceColor, type PieceLibrary } from './world3d/pieces'
import { WORLD3D_THEMES, DEFAULT_THEME } from './world3d/themes'
import { Engine } from '../lib/engine'
import { GAMES } from '../data/games'
import { play as sfx } from '../lib/sound'
import { Icon } from './ui'
import { useI18n } from '../lib/i18n'
import { useGameLoc } from '../lib/i18n/content'

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

const FILES = 'abcdefgh'

const CAM_PRESETS = [
  { id: 'classic', name: 'كلاسيك', pos: [0, 6.4, 8.6], target: [0, 0.3, 0] },
  { id: 'top', name: 'من فوق', pos: [0, 11, 0.01], target: [0, 0, 0] },
  { id: 'white', name: 'جنب الأبيض', pos: [0, 2.6, 7.6], target: [0, 0.8, 0] },
  { id: 'black', name: 'جنب الأسود', pos: [0, 2.6, -7.6], target: [0, 0.8, 0] },
  { id: 'cine', name: 'سينمائي', pos: [7.2, 4.4, 6.4], target: [0, 0.6, 0] },
] as const

const LEVELS = [
  { id: 'easy', name: 'سهل', skill: 1, movetime: 200 },
  { id: 'mid', name: 'متوسط', skill: 8, movetime: 600 },
  { id: 'hard', name: 'صعب', skill: 20, movetime: 1200 },
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

interface Tween {
  obj: THREE.Object3D
  from: THREE.Vector3
  to: THREE.Vector3
  start: number
  dur: number
  arc?: boolean
  onDone?: () => void
}

type Mode = 'gallery' | 'play' | 'replay'

export default function World3DPro() {
  const { t: tr } = useI18n()
  const trRef = useRef(tr)
  trRef.current = tr
  const gl = useGameLoc()
  const glRef = useRef(gl)
  glRef.current = gl
  const mountRef = useRef<HTMLDivElement>(null)
  const [themeId, setThemeId] = useState(DEFAULT_THEME)
  const [preset, setPreset] = useState<string>('classic')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('gallery')
  const [level, setLevel] = useState<string>('mid')
  const [status, setStatus] = useState<string>('')
  const [thinking, setThinking] = useState(false)
  const [replayId, setReplayId] = useState<string>(GAMES[0].id)
  const [replayPlaying, setReplayPlaying] = useState(false)
  const [replayPos, setReplayPos] = useState(0)
  const themeRef = useRef(themeId)
  themeRef.current = themeId
  const apiRef = useRef<{
    applyTheme: (id: string) => void
    goPreset: (id: string) => void
    setMode: (m: Mode) => void
    setLevel: (id: string) => void
    resetGame: () => void
    loadReplay: (id: string) => void
    replayStep: (dir: 1 | -1) => void
    replayToggle: () => void
    replayJump: (to: number) => void
  } | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false

    const theme = () => WORLD3D_THEMES.find((t) => t.id === themeRef.current) ?? WORLD3D_THEMES[0]

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120)
    camera.position.set(...(CAM_PRESETS[0].pos as unknown as [number, number, number]))

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const lowPower = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 640
    renderer.setPixelRatio(lowPower ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = !lowPower
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
    const squareMeshes: THREE.Mesh[] = []
    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const sq = new THREE.Mesh(sqGeo, (f + r) % 2 ? sqDarkMat : sqLightMat)
        sq.position.set(f - 3.5, 0.035, r - 3.5)
        sq.receiveShadow = true
        sq.userData.square = FILES[f] + (8 - r)
        scene.add(sq)
        squareMeshes.push(sq)
      }
    }
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
      const aspect = mount.clientWidth / Math.max(mount.clientHeight, 1)
      const pull = aspect < 1 ? Math.min(1.12 / Math.max(aspect, 0.4), 1.8) : 1
      camera.position.set(
        (p.pos as unknown as [number, number, number])[0] * pull,
        (p.pos as unknown as [number, number, number])[1] * pull,
        (p.pos as unknown as [number, number, number])[2] * pull,
      )
      const tgt = [...(p.target as unknown as [number, number, number])] as [number, number, number]
      if (aspect < 1) tgt[1] -= (1 - aspect) * 2.2
      controls.target.set(...tgt)
    }

    // ===== حالة اللعب =====
    const piecesGroup = new THREE.Group()
    scene.add(piecesGroup)
    const markersGroup = new THREE.Group()
    scene.add(markersGroup)
    const highlightGroup = new THREE.Group()
    scene.add(highlightGroup)

    let lib: PieceLibrary | null = null
    let game = new Chess()
    let currentMode: Mode = 'gallery'
    let selected: string | null = null
    let legalTargets: Move[] = []
    let engine: Engine | null = null
    let currentLevel: (typeof LEVELS)[number] = LEVELS[1]
    let gameOver = false
    let replayGame: (typeof GAMES)[number] | null = null
    let replayIdx = 0
    let replayTimer: ReturnType<typeof setInterval> | null = null
    const tweens: Tween[] = []
    let checkRing: THREE.Mesh | null = null

    const dotGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.015, 20)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.85 })
    const ringGeo = new THREE.TorusGeometry(0.32, 0.045, 10, 32)
    const captureMat = new THREE.MeshBasicMaterial({ color: 0xff5d5d, transparent: true, opacity: 0.9 })
    const hlGeo = new THREE.PlaneGeometry(0.95, 0.95)
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    const checkMat = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.45, side: THREE.DoubleSide })

    const pieceAt = (square: string): THREE.Object3D | undefined =>
      piecesGroup.children.find((p) => p.userData.square === square)

    const clearMarkers = () => {
      markersGroup.children.forEach((m) => markersGroup.remove(m))
    }
    const clearHighlights = () => {
      highlightGroup.children.forEach((m) => highlightGroup.remove(m))
      if (checkRing) {
        scene.remove(checkRing)
        checkRing = null
      }
    }

    const markLastMove = (from: string, to: string) => {
      clearHighlights()
      for (const sq of [from, to]) {
        const [x, z] = squareVec(sq)
        const hl = new THREE.Mesh(hlGeo, hlMat)
        hl.rotation.x = -Math.PI / 2
        hl.position.set(x, 0.075, z)
        highlightGroup.add(hl)
      }
      updateCheckRing()
    }

    const updateCheckRing = () => {
      if (checkRing) {
        scene.remove(checkRing)
        checkRing = null
      }
      if (!game.inCheck()) return
      const turn = game.turn()
      const king = piecesGroup.children.find((p) => p.userData.type === 'k' && p.userData.color === turn)
      if (!king) return
      const hl = new THREE.Mesh(hlGeo, checkMat)
      hl.rotation.x = -Math.PI / 2
      hl.position.set(king.position.x, 0.08, king.position.z)
      checkRing = hl
      scene.add(hl)
    }

    const addTween = (obj: THREE.Object3D, to: THREE.Vector3, dur = 350, onDone?: () => void, arc = true) => {
      tweens.push({ obj, from: obj.position.clone(), to, start: performance.now(), dur, arc, onDone })
    }

    const spawnPiece = (t: PieceType, c: PieceColor, s: string) => {
      if (!lib) return null
      const piece = lib.spawn(t, c)
      const [x, z] = squareVec(s)
      piece.position.set(x, 0.07, z)
      piece.userData.square = s
      piece.userData.type = t
      piece.userData.color = c
      piece.traverse((o) => {
        o.userData.square = s
        o.userData.type = t
        o.userData.color = c
      })
      piecesGroup.add(piece)
      return piece
    }

    const setupStart = () => {
      piecesGroup.children.forEach((p) => piecesGroup.remove(p))
      for (const { t, c, s } of START) spawnPiece(t, c, s)
    }

    const syncPieceSquare = (piece: THREE.Object3D, square: string) => {
      piece.userData.square = square
      piece.traverse((o) => {
        o.userData.square = square
      })
    }

    const endGameStatus = (): { text: string; won: boolean } | null => {
      const q = trRef.current
      if (game.isCheckmate()) return game.turn() === 'w' ? { text: q('wp.mateLose'), won: false } : { text: q('wp.mateWin'), won: true }
      if (game.isDraw()) return { text: q('wp.drawn'), won: false }
      if (game.isStalemate()) return { text: q('wp.stalemate'), won: false }
      return null
    }

    const applyMove = (mv: Move, byPlayer: boolean) => {
      const movingPiece = pieceAt(mv.from)
      if (!movingPiece) return
      // الأكل
      if (mv.captured) {
        const victim = pieceAt(mv.flags.includes('e') ? mv.to[0] + mv.from[1] : mv.to)
        if (victim) {
          const start = performance.now()
          const fade = () => {
            const k = (performance.now() - start) / 300
            if (k >= 1) {
              piecesGroup.remove(victim)
              return
            }
            victim.scale.setScalar(1 - k * 0.9)
            victim.traverse((o) => {
              if (o instanceof THREE.Mesh) {
                const m = o.material as THREE.MeshStandardMaterial
                m.transparent = true
                m.opacity = 1 - k
              }
            })
            requestAnimationFrame(fade)
          }
          fade()
        }
      }
      const [tx, tz] = squareVec(mv.to)
      addTween(movingPiece, new THREE.Vector3(tx, 0.07, tz), byPlayer ? 300 : 450, () => {
        syncPieceSquare(movingPiece, mv.to)
        // التبييت: حرّك الطابية كمان
        if (mv.flags.includes('k') || mv.flags.includes('q')) {
          const rookFrom = mv.flags.includes('k') ? 'h' + mv.to[1] : 'a' + mv.to[1]
          const rookTo = mv.flags.includes('k') ? 'f' + mv.to[1] : 'd' + mv.to[1]
          const rook = pieceAt(rookFrom)
          if (rook) {
            const [rx, rz] = squareVec(rookTo)
            addTween(rook, new THREE.Vector3(rx, 0.07, rz), 350, () => syncPieceSquare(rook, rookTo))
          }
        }
        // الترقية
        if (mv.promotion) {
          const color = mv.color as PieceColor
          const newQ = spawnPiece('q', color, mv.to)
          if (newQ) {
            piecesGroup.remove(movingPiece)
            sfx('promote')
          }
        }
        markLastMove(mv.from, mv.to)
        if (currentMode === 'play') {
          const over = endGameStatus()
          if (over) {
            gameOver = true
            setStatus(over.text)
            sfx(over.won ? 'success' : 'end')
          } else if (game.inCheck()) {
            sfx('check')
            setStatus(trRef.current('wp.check'))
          } else {
            setStatus(trRef.current(game.turn() === 'w' ? 'wp.yourMove' : 'wp.engineMoves'))
          }
        } else if (currentMode === 'replay') {
          showReplayStatus()
        }
      })
      sfx(mv.captured ? 'capture' : mv.flags.includes('k') || mv.flags.includes('q') ? 'castle' : 'move')
    }

    const engineReply = async () => {
      if (!engine || gameOver) return
      setThinking(true)
      try {
        const { best } = await engine.search(game.fen(), { skill: currentLevel.skill, movetime: currentLevel.movetime })
        if (disposed || gameOver || !best) return
        const mv = game.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: best[4] ?? 'q' }) as Move
        applyMove(mv, false)
      } catch {
        setStatus(trRef.current('wp.engineStopped'))
      } finally {
        setThinking(false)
      }
    }

    const tryPlayerMove = (from: string, to: string) => {
      if (gameOver || game.turn() !== 'w') return
      const legal = legalTargets.find((m) => m.to === to)
      if (!legal) {
        sfx('error')
        return
      }
      const mv = game.move({ from, to, promotion: 'q' }) as Move
      selected = null
      legalTargets = []
      clearMarkers()
      applyMove(mv, true)
      if (!gameOver) setTimeout(() => void engineReply(), 500)
    }

    const selectSquare = (square: string) => {
      if (currentMode !== 'play' || gameOver || game.turn() !== 'w') return
      const piece = game.get(square as never)
      if (selected && legalTargets.some((m) => m.to === square)) {
        tryPlayerMove(selected, square)
        return
      }
      if (piece && piece.color === 'w') {
        selected = square
        legalTargets = game.moves({ square: square as never, verbose: true }) as Move[]
        clearMarkers()
        for (const m of legalTargets) {
          const [x, z] = squareVec(m.to)
          const marker = m.captured
            ? new THREE.Mesh(ringGeo, captureMat)
            : new THREE.Mesh(dotGeo, dotMat)
          if (m.captured) {
            marker.rotation.x = Math.PI / 2
            marker.position.set(x, 0.1, z)
          } else {
            marker.position.set(x, 0.085, z)
          }
          markersGroup.add(marker)
        }
      } else {
        selected = null
        legalTargets = []
        clearMarkers()
      }
    }

    // اللمس/الدوس
    const ray = new THREE.Raycaster()
    const ptr = new THREE.Vector2()
    let downXY: [number, number] = [0, 0]
    const onDown = (e: PointerEvent) => {
      downXY = [e.clientX, e.clientY]
    }
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 12) return
      if (currentMode !== 'play') return
      const rect = renderer.domElement.getBoundingClientRect()
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      ray.setFromCamera(ptr, camera)
      const pieceHits = ray.intersectObjects(piecesGroup.children, true)
      const sqHits = ray.intersectObjects(squareMeshes, false)
      const sqHit = sqHits.length ? (sqHits[0].object.userData.square as string) : null
      // لو الدوسة على خانة هدف قانوني، نفّذ النقلة حتى لو قطعة من قطعك واقفة قدامها بصرياً
      if (sqHit && selected && legalTargets.some((m) => m.to === sqHit)) {
        selectSquare(sqHit)
        return
      }
      if (pieceHits.length) {
        selectSquare(pieceHits[0].object.userData.square as string)
        return
      }
      if (sqHit) selectSquare(sqHit)
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const rebuildBoard = () => {
      piecesGroup.children.forEach((pc) => piecesGroup.remove(pc))
      const board = game.board()
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const cell = board[r][f]
          if (cell) spawnPiece(cell.type as PieceType, cell.color as PieceColor, 'abcdefgh'[f] + (8 - r))
        }
      }
    }

    const stopReplayTimer = () => {
      if (replayTimer) {
        clearInterval(replayTimer)
        replayTimer = null
        setReplayPlaying(false)
      }
    }

    const showReplayStatus = () => {
      if (!replayGame) return
      const rg = glRef.current(replayGame)
      let txt: string
      if (replayIdx === 0) {
        txt = `${rg.name} - ${rg.white} ${trRef.current('wp.replayVs')} ${rg.black} (${rg.year})`
      } else {
        const num = Math.ceil(replayIdx / 2)
        txt = `${num}. ${replayGame.moves[replayIdx - 1]}`
        const note = rg.notes[replayIdx - 1]
        if (note) txt += ` - ${note}`
        if (replayIdx >= replayGame.moves.length) {
          const res = trRef.current(replayGame.result === '1-0' ? 'wp.whiteWon' : replayGame.result === '0-1' ? 'wp.blackWon' : 'wp.drawResult')
          txt += ` | ${trRef.current('wp.gameEnded', { res })}`
        }
      }
      setStatus(txt)
      setReplayPos(replayIdx)
    }

    const replayForward = () => {
      if (!replayGame || replayIdx >= replayGame.moves.length) return false
      const mv = game.move(replayGame.moves[replayIdx]) as Move
      replayIdx++
      applyMove(mv, true)
      if (game.inCheck() && !game.isCheckmate()) sfx('check')
      return true
    }

    const replayJump = (to: number) => {
      if (!replayGame) return
      stopReplayTimer()
      replayIdx = Math.max(0, Math.min(to, replayGame.moves.length))
      game = new Chess()
      for (let i = 0; i < replayIdx; i++) game.move(replayGame.moves[i])
      rebuildBoard()
      clearHighlights()
      const hist = game.history({ verbose: true }) as Move[]
      if (hist.length) markLastMove(hist[hist.length - 1].from, hist[hist.length - 1].to)
      showReplayStatus()
      sfx('move')
    }

    const replayStep = (dir: 1 | -1) => {
      if (!replayGame) return
      stopReplayTimer()
      if (dir === 1) replayForward()
      else replayJump(replayIdx - 1)
    }

    const replayToggle = () => {
      if (replayTimer) {
        stopReplayTimer()
        return
      }
      if (!replayGame) return
      if (replayIdx >= replayGame.moves.length) replayJump(0)
      setReplayPlaying(true)
      replayTimer = setInterval(() => {
        if (!replayForward()) stopReplayTimer()
      }, 1700)
    }

    const loadReplay = (id: string) => {
      const g = GAMES.find((x) => x.id === id) ?? GAMES[0]
      stopReplayTimer()
      currentMode = 'replay'
      game = new Chess()
      gameOver = false
      selected = null
      legalTargets = []
      clearMarkers()
      clearHighlights()
      replayGame = g
      replayIdx = 0
      rebuildBoard()
      showReplayStatus()
    }

    const setMode = (m: Mode) => {
      currentMode = m
      game = new Chess()
      gameOver = false
      selected = null
      legalTargets = []
      clearMarkers()
      clearHighlights()
      setupStart()
      if (m === 'play') {
        if (!engine) {
          try {
            engine = new Engine()
          } catch {
            setStatus(trRef.current('wp.engineOff'))
          }
        }
        setStatus(trRef.current('wp.startPlay'))
        goPreset('white')
        setPreset('white')
      } else {
        stopReplayTimer()
        setStatus('')
        goPreset(m === 'replay' ? 'cine' : 'classic')
        setPreset(m === 'replay' ? 'cine' : 'classic')
        if (m === 'replay') loadReplay(replayGame?.id ?? GAMES[0].id)
      }
    }

    const resetGame = () => {
      setMode('play')
      sfx('notify')
    }

    const setLevelApi = (id: string) => {
      currentLevel = LEVELS.find((l) => l.id === id) ?? LEVELS[1]
    }

    apiRef.current = { applyTheme, goPreset, setMode, resetGame, setLevel: setLevelApi, loadReplay, replayStep, replayToggle, replayJump }

    // خطاف اختبار آلي (مش ظاهر في الواجهة)
    ;(window as unknown as { __w3d?: unknown }).__w3d = {
      project: (sq: string) => {
        const [x, z] = squareVec(sq)
        const v = new THREE.Vector3(x, 0.1, z).project(camera)
        const r = renderer.domElement.getBoundingClientRect()
        return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]
      },
      state: () => ({
        mode: currentMode,
        turn: game.turn(),
        fen: game.fen(),
        selected,
        targets: legalTargets.map((m) => m.to),
        over: gameOver,
      }),
    }

    loadPieceLibrary()
      .then((l) => {
        if (disposed) return
        lib = l
        setupStart()
        setReady(true)
      })
      .catch((e) => {
        if (!disposed) setError(e instanceof Error ? e.message : trRef.current('wp.loadFail'))
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
      // أنيميشن النقلات
      const now = performance.now()
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i]
        const k = Math.min(1, (now - tw.start) / tw.dur)
        const e = 1 - Math.pow(1 - k, 3)
        tw.obj.position.lerpVectors(tw.from, tw.to, e)
        if (tw.arc) tw.obj.position.y = 0.07 + Math.sin(e * Math.PI) * 0.45
        if (k >= 1) {
          tweens.splice(i, 1)
          tw.onDone?.()
        }
      }
      // نبض حلقة الكش
      if (checkRing) {
        ;(checkRing.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.2 * Math.sin(now / 220)
      }
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      controls.dispose()
      engine?.terminate()
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement)
      apiRef.current = null
      if (replayTimer) clearInterval(replayTimer)
      ;(window as unknown as { __w3d?: unknown }).__w3d = undefined
    }
  }, [])

  useEffect(() => {
    apiRef.current?.applyTheme(themeId)
  }, [themeId])
  useEffect(() => {
    apiRef.current?.goPreset(preset)
  }, [preset])

  const switchMode = (m: Mode) => {
    setMode(m)
    apiRef.current?.setMode(m)
  }
  const switchLevel = (id: string) => {
    setLevel(id)
    apiRef.current?.setLevel(id)
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => switchMode('gallery')}
            aria-pressed={mode === 'gallery'}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === 'gallery' ? 'bg-gold text-black' : 'text-muted hover:text-ink'}`}
          >
            {tr('wp.modeGallery')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('play')}
            aria-pressed={mode === 'play'}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === 'play' ? 'bg-gold text-black' : 'text-muted hover:text-ink'}`}
          >
            {tr('wp.modePlay')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('replay')}
            aria-pressed={mode === 'replay'}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${mode === 'replay' ? 'bg-gold text-black' : 'text-muted hover:text-ink'}`}
          >
            {tr('wp.modeReplay')}
          </button>
        </div>
        {mode === 'play' && (
          <>
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => switchLevel(l.id)}
                  aria-pressed={level === l.id}
                  className={`rounded-lg px-3 py-2 text-sm transition ${level === l.id ? 'bg-gold font-bold text-black' : 'text-muted hover:text-ink'}`}
                >
                  {tr(`wp.lvl${cap(l.id)}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => apiRef.current?.resetGame()}
              className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-muted transition hover:text-ink"
            >
              {tr('wp.newGame')}
            </button>
          </>
        )}
        {mode === 'replay' && (
          <>
            <select
              value={replayId}
              onChange={(e) => {
                setReplayId(e.target.value)
                apiRef.current?.loadReplay(e.target.value)
              }}
              aria-label={tr('wp.pickGame')}
              className="max-w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm font-bold text-ink"
            >
              {GAMES.map((g) => (
                <option key={g.id} value={g.id}>
                  {gl(g).name} ({g.year})
                </option>
              ))}
            </select>
            <div className="flex gap-1 rounded-xl border border-line bg-surface p-1">
              <button type="button" onClick={() => apiRef.current?.replayJump(0)} aria-label={tr('wp.first')} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">
                <Icon name="first" className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => apiRef.current?.replayStep(-1)} aria-label={tr('wp.prev')} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">
                <Icon name="prev" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => apiRef.current?.replayToggle()}
                aria-label={replayPlaying ? tr('wp.pause') : tr('wp.play')}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${replayPlaying ? 'bg-gold text-black' : 'text-muted hover:text-ink'}`}
              >
                {replayPlaying ? tr('wp.pause') : tr('wp.play')}
              </button>
              <button type="button" onClick={() => apiRef.current?.replayStep(1)} aria-label={tr('wp.next')} className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink">
                <Icon name="next" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => apiRef.current?.replayJump(GAMES.find((g) => g.id === replayId)?.moves.length ?? 0)}
                aria-label={tr('wp.last')}
                className="rounded-lg px-3 py-2 text-sm text-muted transition hover:text-ink"
              >
                <Icon name="last" className="h-4 w-4" />
              </button>
            </div>
            <span className="ltr self-center text-sm text-muted">
              {replayPos}/{GAMES.find((g) => g.id === replayId)?.moves.length ?? 0}
            </span>
          </>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line">
        <div ref={mountRef} className="h-[62vh] min-h-[400px] w-full touch-none md:h-[70vh]" />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-ink backdrop-blur-sm">
            {tr('wp.loading')}
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-ink">
            {tr('wp.loadErr', { err: error })}
          </div>
        )}
        {status && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-xl bg-black/60 px-4 py-1.5 text-sm font-bold text-ink backdrop-blur">
            {status} {thinking && mode === 'play' ? '⏳' : ''}
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 right-3 left-3 hidden flex-wrap items-center gap-2 sm:flex">
          <div className="pointer-events-auto flex gap-1 rounded-xl bg-black/55 p-1 backdrop-blur">
            {WORLD3D_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                aria-pressed={themeId === t.id}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${themeId === t.id ? 'bg-gold font-bold text-black' : 'text-ink hover:bg-white/10'}`}
              >
                {tr(`wp.theme${cap(t.id)}`)}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex max-w-full flex-wrap gap-1 rounded-xl bg-black/55 p-1 backdrop-blur">
            {CAM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                aria-pressed={preset === p.id}
                className={`rounded-lg px-2 py-1.5 text-sm transition sm:px-3 ${preset === p.id ? 'bg-gold font-bold text-black' : 'text-ink hover:bg-white/10'}`}
              >
                {tr(`wp.cam${cap(p.id)}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
        <div className="flex max-w-full flex-wrap gap-1 rounded-xl bg-black/55 p-1 backdrop-blur">
          {WORLD3D_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThemeId(t.id)}
              aria-pressed={themeId === t.id}
              className={`rounded-lg px-2 py-1.5 text-sm transition sm:px-3 ${themeId === t.id ? 'bg-gold font-bold text-black' : 'text-ink hover:bg-white/10'}`}
            >
              {tr(`wp.theme${cap(t.id)}`)}
            </button>
          ))}
        </div>
        <div className="flex max-w-full flex-wrap gap-1 rounded-xl bg-black/55 p-1 backdrop-blur">
          {CAM_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              aria-pressed={preset === p.id}
              className={`rounded-lg px-2 py-1.5 text-sm transition sm:px-3 ${preset === p.id ? 'bg-gold font-bold text-black' : 'text-ink hover:bg-white/10'}`}
            >
              {tr(`wp.cam${cap(p.id)}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted">
        <Icon name="globe" className="inline h-4 w-4 align-[-2px]" /> {tr('wp.hint')}
      </p>
    </div>
  )
}
