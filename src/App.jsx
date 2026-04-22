import { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

// ── 8-bit music ───────────────────────────────────────────
function startMusic(ac) {
  const B = 60 / 85   // beat at 85 BPM

  // A natural minor — melancholic, Sufjan-esque arpeggios
  const MEL = [
    [440,2],[523,1],[659,1],[587,1.5],[523,0.5],[494,1],[440,3],   // 10 beats
    [392,1],[440,1],[523,2],[494,1  ],[392,1  ],[440,1],[440,3],   // 10 beats
    [659,1],[587,1],[523,1.5],[494,0.5],[440,1],[392,1],[349,1],[330,3], // 10 beats
    [440,.5],[523,.5],[659,1],[784,1],[659,1],[587,1],[523,1.5],[440,3.5], // 10 beats
  ]
  // Angular bass — Strokes groove in A minor
  const BAS = [
    [110,1],[110,1],[165,1],[ 98,1],[110,1],[110,1],[131,1],[ 98,1],[110,1],[110,1],
    [ 87,1],[ 87,1],[131,1],[ 87,1],[ 98,1],[ 98,1],[147,1],[ 98,1],[110,1],[110,1],
    [110,1],[131,1],[165,1],[110,1],[ 87,1],[ 87,1],[ 98,1],[ 98,1],[110,1],[110,1],
    [165,1],[165,1],[123,1],[165,1],[110,1],[110,1],[165,1],[220,1],[110,2],
  ]
  const LOOP = MEL.reduce((s, [,b]) => s + b, 0) * B  // ~23.8s

  function note(freq, dur, t, type, vol) {
    const o = ac.createOscillator(), g = ac.createGain()
    o.connect(g); g.connect(ac.destination)
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur * 0.85, 0.02))
    o.start(t); o.stop(t + dur + 0.02)
  }

  let mt = ac.currentTime + 0.06
  let bt = ac.currentTime + 0.06
  let ht = ac.currentTime + 0.06
  const AHEAD = 3

  function sched() {
    const now = ac.currentTime
    while (mt < now + AHEAD) {
      for (const [f, b] of MEL) {
        note(f,   b*B*0.80, mt, 'square',   0.08)
        note(f/2, b*B*0.50, mt, 'sine',     0.03)  // warm sub-octave
        mt += b*B
      }
    }
    while (bt < now + AHEAD) {
      for (const [f, b] of BAS) {
        note(f, b*B*0.62, bt, 'sawtooth', 0.07)
        bt += b*B
      }
    }
    while (ht < now + AHEAD) {
      const steps = Math.round(LOOP / (B / 2))
      for (let i = 0; i < steps; i++) {
        if (i % 2 === 1)  // off-beat hi-hat
          note(1050, 0.05, ht + i * (B / 2), 'square', 0.016)
      }
      ht += LOOP
    }
  }

  sched()
  const id = setInterval(sched, 1000)
  return () => clearInterval(id)
}

// Logical game size (all coordinates use this)
const CW = 320
const CH = 180
const SCALE = 2          // canvas pixels per logical pixel → 640×360
const GROUND = CH - 32

const ZONES = [
  { name: 'Ciudad',  bgTop: '#040214', bgBot: '#120840', gc: '#6650a0', len: 700 },
  { name: 'Bosque',  bgTop: '#010f08', bgBot: '#063520', gc: '#1e5014', len: 700 },
  { name: 'Ruinas',  bgTop: '#080714', bgBot: '#1a1428', gc: '#42325a', len: 520 },
  { name: 'Dragón',  bgTop: '#140100', bgBot: '#380500', gc: '#8a1808', len: 480 },
  { name: 'Jardín',  bgTop: '#011008', bgBot: '#053818', gc: '#225810', len: 600 },
  { name: 'Final',   bgTop: '#040118', bgBot: '#160850', gc: '#4a2878', len: 480 },
]

const DIALOGS = [
  '23 de abril, Barcelona.\nVictor camina hacia algo que no sabe nombrar todavía.',
  'Una sombra enorme con ojos de río:\n"Las distancias más largas son las de aquí a aquí."',
  'El eco de sus propios pasos lo persigue.\nRespira. Se detiene. Sigue.',
  'El dragón existe desde siempre.\nSolo lo vence quien deja de temerle.',
  'Al otro lado del fuego, un jardín.\nMarta lleva tiempo caminando hacia él.',
  '"No fue el valor lo que te trajo aquí.\nFue saber querer sin perderte."\n\n🌹',
]

// ── Spawn enemies per zone ───────────────────────────────
function spawnZone(zone) {
  const e = []
  if (zone === 0) {
    for (let i = 0; i < 3; i++)
      e.push({ type: 'blob', x: 300 + i * 160, y: GROUND, vx: -0.8, vy: 0, hp: 2, maxHp: 2, f: i * 12, jumper: false, jt: 0 })
  } else if (zone === 1) {
    for (let i = 0; i < 4; i++)
      e.push({ type: 'blob', x: 280 + i * 140, y: GROUND, vx: -1, vy: 0, hp: 2, maxHp: 2, f: i * 8, jumper: true, jt: i * 40 + 50 })
  } else if (zone === 2) {
    for (let i = 0; i < 6; i++)
      e.push({ type: 'rock', x: 150 + i * 75, y: 0, vy: 0, hp: 1, maxHp: 1, f: 0, delay: 50 + i * 55 })
  } else if (zone === 3) {
    e.push({ type: 'dragon', x: 380, y: GROUND, hp: 6, maxHp: 6, f: 0, inv: 0 })
  } else if (zone === 4) {
    for (let i = 0; i < 5; i++)
      e.push({ type: 'rose', x: 120 + i * 100, y: GROUND - 6, got: false, f: 0 })
  } else if (zone === 5) {
    e.push({ type: 'elephant', x: 190, y: GROUND, hp: 6, maxHp: 6, f: 0 })
  }
  return e
}

// ── Initial game state ────────────────────────────────────
const mkState = () => ({
  px: 60, py: GROUND, pvx: 0, pvy: 0, onGround: true, facing: 1,
  atk: 0, atkcd: 0, inv: 0,
  hp: 6, maxHp: 6, mp: 50, maxMp: 50, panic: 30,
  camX: 0, zone: 0, roses: 0,
  enemies: spawnZone(0), particles: [],
  marta: null,
  ebActive: false, ebResistance: false,
  won: false, dead: false, f: 0,
})

// ── Pixel drawing helpers ─────────────────────────────────
function r(ctx, x, y, w, h, c) {
  ctx.fillStyle = c
  ctx.fillRect(~~x, ~~y, w, h)
}

function drawVictor(ctx, x, y, dir, atk, inv, f, walking) {
  if (inv % 8 >= 6) return
  ctx.save()
  ctx.translate(~~x + 8, ~~y)
  ctx.scale(dir, 1)
  const leg = walking ? ~~(Math.sin(f * 0.28) * 3) : 0
  r(ctx, -11, -50, 22, 53, '#000000')           // outline backdrop
  r(ctx, -10,   -1, 20,  3, 'rgba(0,0,0,0.3)') // shadow
  r(ctx,  -8,   -7 - leg,  8,  7, '#3a1a0a')   // left boot
  r(ctx,   2,   -7 + leg,  8,  7, '#3a1a0a')   // right boot
  r(ctx,  -8,   -7 - leg,  8,  2, '#5a2a10')   // boot shine L
  r(ctx,   2,   -7 + leg,  8,  2, '#5a2a10')   // boot shine R
  r(ctx,  -8,  -19 - leg,  7, 13, '#1a3a6c')   // left leg
  r(ctx,   2,  -19 + leg,  7, 13, '#1a3a6c')   // right leg
  r(ctx,  -9,  -33, 18, 15, '#3a6bc7')          // torso
  r(ctx,  -9,  -33, 18,  4, '#5a8be8')          // torso highlight
  r(ctx,  -9,  -19, 18,  3, '#1a0d3a')          // belt
  r(ctx,  -7,  -47, 14, 15, '#e8b88a')          // head
  r(ctx,  -7,  -47, 14,  5, '#3a2010')          // hair
  r(ctx,  -4,  -40,  3,  3, '#1a1a2e')          // left eye
  r(ctx,   2,  -40,  3,  3, '#1a1a2e')          // right eye
  r(ctx,  -1,  -35,  4,  2, '#b07060')          // mouth
  r(ctx, -14,  -31 + leg,  5, 11, '#e8b88a')   // left arm
  r(ctx,  10,  -31 - leg,  5, 11, '#e8b88a')   // right arm
  if (atk > 0) {
    r(ctx,  10, -35, 28,  4, '#d8d8e8')         // blade
    r(ctx,   7, -41,  8, 12, '#8a6a20')         // handle
    r(ctx,  28, -37,  4,  2, '#ffffff')         // gleam
  }
  ctx.restore()
}

function drawBlob(ctx, x, y, f) {
  const b = ~~(Math.sin(f * 0.15) * 2)
  r(ctx, x - 8, y - 14 + b, 16, 10, '#a030b0')
  r(ctx, x - 6, y - 20 + b, 12,  8, '#c040d0')
  r(ctx, x - 4, y - 17 + b,  2,  2, '#ff80ff')
  r(ctx, x + 2, y - 17 + b,  2,  2, '#ff80ff')
  r(ctx, x - 9, y -  6,      4,  4, '#8a2090')
  r(ctx, x + 5, y -  6,      4,  4, '#8a2090')
}

function drawRock(ctx, x, y) {
  r(ctx, x - 8, y - 14, 16, 12, '#6a5878')
  r(ctx, x - 6, y - 12, 12,  8, '#8a7898')
}

function drawDragon(ctx, x, y, hp, maxHp, f) {
  const fl = ~~(Math.sin(f * 0.1) * 4)
  r(ctx, x - 50, y - 30 + fl, 30, 20, '#7a1010') // left wing
  r(ctx, x + 22, y - 30 + fl, 30, 20, '#7a1010') // right wing
  r(ctx, x - 20, y - 34, 40, 32, '#c0392b')       // body
  r(ctx, x - 14, y - 24, 28, 18, '#e74c3c')       // belly
  r(ctx, x -  6, y - 52, 12, 22, '#c0392b')       // neck
  r(ctx, x - 10, y - 68, 24, 18, '#c0392b')       // head
  r(ctx, x + 12, y - 62, 14, 10, '#a93226')        // snout
  r(ctx, x -  4, y - 64,  6,  6, '#f39c12')        // eye
  r(ctx, x -  2, y - 62,  2,  2, '#000')           // pupil
  r(ctx, x + 14, y - 54,  3,  6, '#f5f5f5')        // tooth l
  r(ctx, x + 19, y - 54,  3,  6, '#f5f5f5')        // tooth r
  r(ctx, x + 26, y - 56,  4,  4, '#fa8620')        // fire glow
  r(ctx, x - 16, y -  4, 10, 14, '#a93226')        // leg l
  r(ctx, x +  8, y -  4, 10, 14, '#a93226')        // leg r
  r(ctx, x - 34, y - 18, 16,  6, '#a93226')        // tail
  r(ctx, x - 44, y - 22, 12,  4, '#8b1a1a')
  // HP bar
  const bw = 72, bx = x - 36, by = y - 80
  r(ctx, bx - 1, by - 1, bw + 2, 10, '#1a0010')
  r(ctx, bx, by, ~~(bw * hp / maxHp), 8, '#e35656')
}

function drawElephant(ctx, x, y, hp, maxHp, f) {
  const pulse = Math.sin(f * 0.08) * 2
  ctx.globalAlpha = 0.22
  r(ctx, x - 28 - pulse, y - 44 - pulse, 56 + pulse * 2, 56 + pulse * 2, '#c9b8e8')
  ctx.globalAlpha = 1
  r(ctx, x - 22, y - 52, 48, 54, '#000000') // backdrop
  r(ctx, x - 20, y - 32, 40, 30, '#7d6b8a') // body
  r(ctx, x - 14, y - 24, 28, 18, '#9b8aaa') // belly
  r(ctx, x +  6, y - 50, 22, 22, '#7d6b8a') // head
  r(ctx, x + 18, y - 54, 14, 18, '#9b8aaa') // ear
  r(ctx, x + 10, y - 46,  5,  5, '#c9b8e8') // eye
  r(ctx, x + 11, y - 45,  2,  2, '#1a0d2e')
  r(ctx, x +  6, y - 30,  6,  8, '#7d6b8a') // trunk top
  r(ctx, x +  4, y - 22,  6,  8, '#7d6b8a') // trunk mid
  r(ctx, x +  2, y - 14,  6,  6, '#6a5878') // trunk tip
  r(ctx, x +  8, y - 34, 10,  3, '#f5f0e0') // tusk
  r(ctx, x - 16, y -  2,  8, 12, '#6a5878') // leg l
  r(ctx, x -  4, y -  2,  8, 12, '#6a5878') // leg m
  r(ctx, x +  8, y -  2,  8, 12, '#6a5878') // leg r
  const bw = 72, bx = x - 36, by = y - 64
  r(ctx, bx - 1, by - 1, bw + 2, 10, '#1a0010')
  r(ctx, bx, by, ~~(bw * hp / maxHp), 8, '#9b56e3')
}

function drawRose(ctx, x, y) {
  r(ctx, x - 2, y - 10, 4, 10, '#2d6b1e')
  r(ctx, x - 6, y - 16, 10,  8, '#e0203a')
  r(ctx, x - 4, y - 18,  6,  4, '#e84060')
  r(ctx, x - 2, y - 14,  2,  2, '#ff9bb5')
}

function drawMarta(ctx, x, y, f) {
  ctx.save()
  ctx.translate(~~x + 6, ~~y)
  r(ctx, -11, -50, 22, 53, '#000000')           // outline backdrop
  r(ctx,  -9,   -1, 18,  3, 'rgba(0,0,0,0.3)') // shadow
  r(ctx, -10,  -16, 20, 16, '#c0305a')          // skirt
  r(ctx, -13,   -8, 26,  9, '#e0406a')          // skirt flare
  r(ctx, -10,  -16, 20,  3, '#e05070')          // skirt highlight
  r(ctx,  -5,  -27, 10, 12, '#e8b88a')          // torso
  r(ctx,  -7,  -43, 14,  8, '#1a0808')          // hair top
  r(ctx,  -8,  -35,  4, 19, '#1a0808')          // hair left
  r(ctx,   5,  -35,  4, 19, '#1a0808')          // hair right
  r(ctx,  -5,  -39, 10, 13, '#e8b88a')          // face
  r(ctx,  -3,  -35,  3,  3, '#1a1a2e')          // left eye
  r(ctx,   2,  -35,  3,  3, '#1a1a2e')          // right eye
  r(ctx,  -2,  -30,  5,  2, '#b07060')          // smile
  r(ctx,  -4,  -46,  3,  5, '#f39c12')          // crown left
  r(ctx,   0,  -48,  3,  5, '#f39c12')          // crown mid
  r(ctx,   4,  -46,  3,  5, '#f39c12')          // crown right
  r(ctx,  -1,  -46,  7,  2, '#f5d020')          // crown base
  r(ctx, -11,  -27,  4,  9, '#e8b88a')          // left arm
  r(ctx,   8,  -27,  4,  9, '#e8b88a')          // right arm
  const bob = ~~(Math.sin(f * 0.18) * 1.5)
  r(ctx,  -6,   -5 + bob, 6, 6, '#8a3020')      // left shoe
  r(ctx,   1,   -5 - bob, 6, 6, '#8a3020')      // right shoe
  ctx.restore()
}

function addParticles(particles, x, y, color) {
  for (let i = 0; i < 6; i++)
    particles.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3 - 1, life: 20 + ~~(Math.random() * 15), color })
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  const canvasRef   = useRef(null)
  const stateRef    = useRef(mkState())
  const keysRef     = useRef({})
  const touchRef    = useRef({ left: false, right: false, jump: false, attack: false })
  const overlayRef  = useRef(true)
  const pauseRef    = useRef(false)
  const audioRef    = useRef(null)
  const musicStopRef= useRef(null)

  const [overlay, setOverlay]   = useState({ zone: 0, text: DIALOGS[0] })
  const [ebUI,    setEbUI]      = useState(null)
  const [isDead,  setIsDead]    = useState(false)
  const [paused,  setPaused]    = useState(false)

  const showOverlay = useCallback((data) => {
    overlayRef.current = !!data
    setOverlay(data)
  }, [])

  const dismissDialog = useCallback(() => {
    const s = stateRef.current
    if (s.won) return
    overlayRef.current = false
    setOverlay(null)
    // Start music on first user gesture
    if (!audioRef.current) {
      const ac = new (window.AudioContext || window.webkitAudioContext)()
      audioRef.current = ac
      musicStopRef.current = startMusic(ac)
    }
  }, [])

  const restart = useCallback(() => {
    overlayRef.current = true
    pauseRef.current   = false
    stateRef.current = mkState()
    setIsDead(false)
    setPaused(false)
    setEbUI(null)
    setOverlay({ zone: 0, text: DIALOGS[0] })
    if (musicStopRef.current) musicStopRef.current()
    if (audioRef.current) musicStopRef.current = startMusic(audioRef.current)
  }, [])

  const togglePause = useCallback(() => {
    const s = stateRef.current
    if (s.won || s.dead || overlayRef.current) return
    pauseRef.current = !pauseRef.current
    setPaused(pauseRef.current)
    // Suspend / resume AudioContext
    if (audioRef.current) {
      if (pauseRef.current) audioRef.current.suspend()
      else                  audioRef.current.resume()
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])
  const attackElephant = useCallback(() => {
    const s = stateRef.current
    const enm = s.enemies.find(e => e.type === 'elephant')
    if (!enm || enm.hp <= 0) return
    const res = s.ebResistance
    enm.hp = Math.max(0, enm.hp - (res ? 2 : 1))
    s.hp    = Math.max(0, s.hp - (res ? 1 : 2))
    s.panic = Math.min(100, s.panic + (res ? 4 : 8))
    s.ebResistance = false
    if (enm.hp <= 0) {
      s.won = true
      setTimeout(() => showOverlay({ zone: 5, text: DIALOGS[5] }), 400)
    }
    setEbUI(u => ({ ...u, ebHp: enm.hp, mp: s.mp, resistance: false }))
  }, [showOverlay])

  const rememberMarta = useCallback(() => {
    const s = stateRef.current
    if (s.mp < 10) return
    s.mp  -= 10
    s.panic = Math.max(0, s.panic - 20)
    s.hp    = Math.max(0, s.hp - 1)
    s.ebResistance = true
    setEbUI(u => ({ ...u, mp: s.mp, resistance: true }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)

    const onKeyDown = (e) => {
      keysRef.current[e.code] = true
      if ((e.code === 'KeyP' || e.code === 'Escape') && !stateRef.current.dead) {
        const s = stateRef.current
        if (!s.won && !overlayRef.current) {
          pauseRef.current = !pauseRef.current
          setPaused(pauseRef.current)
          if (audioRef.current) {
            if (pauseRef.current) audioRef.current.suspend()
            else                  audioRef.current.resume()
          }
        }
      }
      if (e.code === 'KeyR' && stateRef.current.dead) {
        overlayRef.current = true
        stateRef.current = mkState()
        setIsDead(false)
        setEbUI(null)
        setOverlay({ zone: 0, text: DIALOGS[0] })
      }
    }
    const onKeyUp = (e) => { keysRef.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    let animId

    function update() {
      const s    = stateRef.current
      const k    = keysRef.current
      const t    = touchRef.current
      s.f++

      if (s.won || s.dead || overlayRef.current || pauseRef.current) return

      // Elephant boss uses React UI — freeze platformer controls
      const elboss = s.enemies.find(e => e.type === 'elephant')
      if (elboss) {
        if (!s.ebActive) {
          s.ebActive = true
          setEbUI({ total: elboss.maxHp, ebHp: elboss.hp, mp: s.mp, resistance: false })
        }
        return
      }

      // ── Input ─────────────────────────────────────────
      const left   = k.ArrowLeft || k.KeyA || t.left
      const right  = k.ArrowRight || k.KeyD || t.right
      const jump   = k.ArrowUp  || k.KeyW || k.Space || t.jump
      const attack = k.KeyZ || k.KeyX || k.Enter || t.attack

      if (left)       { s.pvx = -2.2; s.facing = -1 }
      else if (right) { s.pvx =  2.2; s.facing =  1 }
      else            { s.pvx *= 0.75 }

      if (jump && s.onGround) { s.pvy = -7.5; s.onGround = false }

      if (attack && s.atkcd <= 0) { s.atk = 10; s.atkcd = 22 }
      if (s.atk  > 0) s.atk--
      if (s.atkcd > 0) s.atkcd--
      if (s.inv  > 0) s.inv--

      // ── Physics ───────────────────────────────────────
      s.pvy += 0.48
      s.px  += s.pvx
      s.py  += s.pvy
      if (s.py >= GROUND) { s.py = GROUND; s.pvy = 0; s.onGround = true }
      if (s.px < 10)      { s.px = 10; s.pvx = 0 }

      // ── Camera ────────────────────────────────────────
      const zlen = ZONES[s.zone].len
      const target = s.px - CW / 3
      s.camX += (Math.max(0, Math.min(zlen - CW, target)) - s.camX) * 0.1

      // ── Zone exit ─────────────────────────────────────
      if (s.zone < ZONES.length - 1 && s.px > zlen - 50) {
        const dragonOk  = s.zone !== 3 || !s.enemies.find(e => e.type === 'dragon' && e.hp > 0)
        const rosesOk   = s.zone !== 4 || s.roses >= 5
        if (dragonOk && rosesOk) {
          const next = s.zone + 1
          s.zone = next
          s.enemies = spawnZone(next)
          s.px = 60; s.py = GROUND; s.pvx = 0; s.pvy = 0; s.camX = 0
          s.roses = 0; s.ebActive = false; s.ebResistance = false
          s.marta = next === 4 ? { x: ZONES[4].len - 80, y: GROUND, f: 0, met: false }
                  : next === 5 ? { x: 300, y: GROUND, f: 0, met: false }
                  : null
          setEbUI(null)
          showOverlay({ zone: next, text: DIALOGS[next] })
          return
        }
      }

      // ── Enemy update ──────────────────────────────────
      for (const e of s.enemies) {
        e.f++
        if (e.type === 'blob') {
          e.x += e.vx
          if (e.jumper) {
            e.jt--
            if (e.jt <= 0 && e.y >= GROUND - 1) { e.vy = -5.5; e.jt = 70 + ~~(Math.random() * 50) }
            e.vy += 0.48; e.y += e.vy
            if (e.y >= GROUND) { e.y = GROUND; e.vy = 0 }
          }
          if (e.x < s.camX - 50) { e.hp = 0; continue }
          // Sword hit
          if (s.atk > 0 && e.hp > 0) {
            const ex = e.x - s.camX, vx = s.px - s.camX
            const inRange = Math.abs(ex - vx) < 28 && Math.abs(e.y - s.py) < 22
            const correct = (s.facing === 1 && ex > vx - 8) || (s.facing === -1 && ex < vx + 8)
            if (inRange && correct) { e.hp--; addParticles(s.particles, e.x, e.y - 8, '#e056e0') }
          }
          // Touch damage
          if (s.inv <= 0 && e.hp > 0 && Math.abs(e.x - s.px) < 14 && Math.abs(e.y - s.py) < 18) {
            s.hp = Math.max(0, s.hp - 1); s.panic = Math.min(100, s.panic + 6)
            s.inv = 60; s.pvx = s.facing * -3.5; s.pvy = -3
          }
        } else if (e.type === 'rock') {
          if (--e.delay <= 0) {
            e.vy += 0.4; e.y += e.vy
            if (e.y >= GROUND) {
              if (s.inv <= 0 && Math.abs(e.x - s.px) < 14) {
                s.hp = Math.max(0, s.hp - 1); s.inv = 40
              }
              e.hp = 0
            }
          }
        } else if (e.type === 'dragon') {
          const dx = s.px - e.x
          if (Math.abs(dx) > 90) e.x += dx > 0 ? 0.9 : -0.9
          if (e.inv > 0) e.inv--
          // Sword hit
          if (s.atk > 0 && e.hp > 0 && e.inv <= 0) {
            const inRange = Math.abs(s.px - e.x) < 42 && Math.abs(s.py - e.y) < 50
            const correct = (s.facing === 1 && e.x > s.px - 12) || (s.facing === -1 && e.x < s.px + 12)
            if (inRange && correct) {
              e.hp = Math.max(0, e.hp - 1)
              e.inv = 30
              addParticles(s.particles, e.x, e.y - 52, '#e35656')
              if (e.hp <= 0) addParticles(s.particles, e.x, e.y - 30, '#f39c12')
            }
          }
          // Body collision
          if (s.inv <= 0 && e.hp > 0 && Math.abs(s.px - e.x) < 22 && s.py > e.y - 36) {
            s.hp = Math.max(0, s.hp - 1); s.panic = Math.min(100, s.panic + 10)
            s.inv = 70; s.pvx = (s.px > e.x ? 1 : -1) * 4; s.pvy = -4
          }
        } else if (e.type === 'rose') {
          if (!e.got && Math.abs(s.px - e.x) < 16 && Math.abs(s.py - e.y) < 20) {
            e.got = true; s.roses++
            s.mp = Math.min(s.maxMp, s.mp + 7)
            addParticles(s.particles, e.x, e.y, '#ff90b3')
          }
        }
      }

      s.enemies = s.enemies.filter(e => e.type === 'rose' || e.type === 'elephant' || e.type === 'dragon' || e.hp > 0)

      // ── Marta update ──────────────────────────────────
      if (s.marta) {
        s.marta.f++
        if (s.zone === 4 && !s.marta.met) {
          // Walk slowly toward Victor
          if (s.marta.x > s.px + 20) s.marta.x -= 0.6
        }
        // Meeting moment: hearts when close
        if (!s.marta.met && Math.abs(s.px - s.marta.x) < 22) {
          s.marta.met = true
          for (let i = 0; i < 3; i++)
            addParticles(s.particles, s.marta.x, s.marta.y - 20, '#ff90b3')
        }
      }

      s.particles = s.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--
        return p.life > 0
      })

      if (s.hp <= 0 && !s.dead) { s.dead = true; setIsDead(true) }
    }

    function draw() {
      const s = stateRef.current
      ctx.clearRect(0, 0, CW, CH)

      // ── Background ────────────────────────────────────
      const z  = ZONES[s.zone]
      const bg = ctx.createLinearGradient(0, 0, 0, CH)
      bg.addColorStop(0, z.bgTop); bg.addColorStop(1, z.bgBot)
      ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH)

      // Stars + Moon
      if (s.zone === 0 || s.zone === 5) {
        ctx.fillStyle = '#ffffffcc'
        for (let i = 0; i < 36; i++) {
          const sx = ((i * 137 - s.camX * 0.06) % CW + CW) % CW
          const sy = (i * 71 + 5) % (CH - 50)
          const sz = i % 5 === 0 ? 2 : 1
          ctx.fillRect(sx, sy, sz, sz)
        }
        // Moon
        const mx = ((CW * 0.72 - s.camX * 0.04) % CW + CW) % CW
        ctx.fillStyle = s.zone === 5 ? '#ffe8a0' : '#d8d0f8'
        ctx.beginPath(); ctx.arc(mx, 22, 10, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = s.zone === 5 ? '#160850' : '#120840'
        ctx.beginPath(); ctx.arc(mx + 3, 19, 8, 0, Math.PI * 2); ctx.fill()
      }
      // Trees (Forest / Garden)
      if (s.zone === 1 || s.zone === 4) {
        for (let i = 0; i < 7; i++) {
          const tx = ((i * 210 + 40 - s.camX * 0.35) % (CW + 80) + (CW + 80)) % (CW + 80) - 40
          r(ctx, tx,      CH - 72,  10, 40, '#1a0e06')
          r(ctx, tx - 14, CH - 100, 38, 30, s.zone === 4 ? '#1a4d0e' : '#122e0a')
          r(ctx, tx - 6,  CH - 114, 22, 18, s.zone === 4 ? '#2a6e18' : '#1a4a10')
        }
        // Fireflies in garden
        if (s.zone === 4) {
          ctx.fillStyle = '#c0ff80'
          for (let i = 0; i < 8; i++) {
            const fx = ((i * 173 + s.f * (i%2 ? 0.4 : -0.3) - s.camX * 0.5) % CW + CW) % CW
            const fy = 60 + (i * 53 + ~~(Math.sin(s.f * 0.05 + i) * 8)) % 60
            if ((s.f + i * 7) % 30 < 20) ctx.fillRect(~~fx, ~~fy, 1, 1)
          }
        }
      }
      // Ruins
      if (s.zone === 2) {
        for (let i = 0; i < 5; i++) {
          const rx = ((i * 240 - s.camX * 0.28) % (CW + 120) + (CW + 120)) % (CW + 120) - 60
          r(ctx, rx,     CH - 76, 26, 44, '#302840')
          r(ctx, rx + 6, CH - 90, 14, 18, '#241e34')
          r(ctx, rx + 2, CH - 78,  4,  6, '#1a1228') // window hole
        }
        // Mist
        ctx.globalAlpha = 0.06 + Math.sin(s.f * 0.02) * 0.02
        ctx.fillStyle = '#a090c0'
        ctx.fillRect(0, CH - 52, CW, 22)
        ctx.globalAlpha = 1
      }
      // Dragon zone — lava glow on horizon
      if (s.zone === 3) {
        ctx.globalAlpha = 0.18 + Math.sin(s.f * 0.04) * 0.05
        const lava = ctx.createLinearGradient(0, CH - 55, 0, CH - 32)
        lava.addColorStop(0, '#ff4400'); lava.addColorStop(1, 'transparent')
        ctx.fillStyle = lava; ctx.fillRect(0, CH - 55, CW, 23)
        ctx.globalAlpha = 1
      }
      // Ground
      r(ctx, 0, CH - 32, CW, 32, z.gc)
      r(ctx, 0, CH - 32, CW,  3, '#b0a0c8')

      // ── Enemies ───────────────────────────────────────
      for (const e of s.enemies) {
        const sx = e.x - s.camX
        if (sx < -90 || sx > CW + 90) continue
        if      (e.type === 'blob'     )                drawBlob(ctx, sx, e.y, e.f)
        else if (e.type === 'rock'     && e.delay <= 0) drawRock(ctx, sx, e.y)
        else if (e.type === 'dragon'   && e.hp > 0)     drawDragon(ctx, sx, e.y, e.hp, e.maxHp, e.f)
        else if (e.type === 'rose'     && !e.got)       drawRose(ctx, sx, e.y)
        else if (e.type === 'elephant' && e.hp > 0)     drawElephant(ctx, sx, e.y, e.hp, e.maxHp, e.f)
      }

      // ── Marta ─────────────────────────────────────────
      if (s.marta) {
        const mx = s.marta.x - s.camX
        if (mx > -20 && mx < CW + 20) drawMarta(ctx, mx, s.marta.y, s.marta.f)
      }

      // ── Particles ─────────────────────────────────────
      s.particles.forEach(p => {
        ctx.globalAlpha = p.life / 35
        r(ctx, p.x - s.camX, p.y, 3, 3, p.color)
      })
      ctx.globalAlpha = 1

      // ── Victor ────────────────────────────────────────
      drawVictor(ctx, s.px - s.camX, s.py, s.facing, s.atk, s.inv, s.f, Math.abs(s.pvx) > 0.3 && s.onGround)

      // ── Exit hint ─────────────────────────────────────
      const canExit = s.zone < ZONES.length - 1
        && (s.zone !== 3 || !s.enemies.find(e => e.type === 'dragon' && e.hp > 0))
        && (s.zone !== 4 || s.roses >= 5)
      if (canExit) {
        const ax = ZONES[s.zone].len - s.camX - 30
        if (ax > 0 && ax < CW) {
          ctx.fillStyle = '#ff90b360'; ctx.font = '9px monospace'
          ctx.fillText('▶▶', ax, CH - 38)
        }
      }

      // ── HUD ───────────────────────────────────────────
      ctx.font = '6px monospace'
      r(ctx, 4,  4, 62,  8, '#1a0d2e')
      r(ctx, 5,  5, ~~(60 * s.hp / s.maxHp), 6, s.hp <= 2 ? '#e35656' : '#56e356')
      ctx.fillStyle = '#fff'; ctx.fillText('HP', 5, 12)

      r(ctx, 4, 14, 62,  8, '#1a0d2e')
      r(ctx, 5, 15, ~~(60 * s.mp / s.maxMp), 6, '#5684e3')
      ctx.fillStyle = '#fff'; ctx.fillText('MP', 5, 22)

      r(ctx, 4, 24, 62,  8, '#1a0d2e')
      r(ctx, 5, 25, ~~(60 * s.panic / 100), 6, s.panic > 60 ? '#e35656' : '#e3a056')
      ctx.fillStyle = '#fff'; ctx.fillText('PAN', 5, 32)

      ctx.fillStyle = '#ffffff88'; ctx.textAlign = 'right'
      ctx.fillText(z.name.toUpperCase(), CW - 4, 12)
      if (s.zone === 4) ctx.fillText(`🌹 ${s.roses}/5`, CW - 4, 22)
      ctx.textAlign = 'left'

      // Dragon hint
      if (s.zone === 3 && s.enemies.find(e => e.type === 'dragon' && e.hp > 0)) {
        ctx.fillStyle = '#ffd98f99'; ctx.textAlign = 'center'; ctx.font = '6px monospace'
        ctx.fillText('¡Usa tu espada para atacarlo!', CW / 2, 18)
        ctx.textAlign = 'left'
      }

      // Roses hint
      if (s.zone === 4 && s.roses < 5) {
        ctx.fillStyle = '#ff90b399'; ctx.textAlign = 'center'; ctx.font = '6px monospace'
        ctx.fillText('Recoge 5 rosas para avanzar', CW / 2, 18)
        ctx.textAlign = 'left'
      }

      // ── Pause screen ─────────────────────────────────
      if (pauseRef.current) {
        ctx.fillStyle = 'rgba(4,1,20,0.72)'
        ctx.fillRect(0, 0, CW, CH)
        ctx.textAlign = 'center'
        ctx.fillStyle = '#c8a040'; ctx.font = 'bold 20px monospace'
        ctx.fillText('PAUSA', CW / 2, CH / 2 - 8)
        ctx.fillStyle = '#7a6030'; ctx.font = '6px monospace'
        ctx.fillText('P · ESC  para continuar', CW / 2, CH / 2 + 8)
        ctx.textAlign = 'left'
      }

      // ── Game over screen ──────────────────────────────
      if (s.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.78)'
        ctx.fillRect(0, 0, CW, CH)
        ctx.textAlign = 'center'
        ctx.fillStyle = '#e35656'; ctx.font = 'bold 28px monospace'
        ctx.fillText('GAME OVER', CW / 2, CH / 2 - 8)
        ctx.fillStyle = '#c9b8e8'; ctx.font = '8px monospace'
        ctx.fillText('Pulsa R o el botón para reintentar', CW / 2, CH / 2 + 8)
        ctx.textAlign = 'left'
      }

      // ── Win / FIN screen ─────────────────────────────
      if (s.won) {
        ctx.fillStyle = 'rgba(6,3,15,0.72)'
        ctx.fillRect(0, 0, CW, CH)
        ctx.textAlign = 'center'
        ctx.fillStyle = '#f5d020'; ctx.font = 'bold 42px monospace'
        ctx.fillText('FIN', CW / 2, CH / 2 + 6)
        ctx.fillStyle = '#ff90b3'; ctx.font = '7px monospace'
        ctx.fillText('🌹 Más allá del dragón', CW / 2, CH / 2 + 22)
        ctx.textAlign = 'left'
      }

    }

    function loop() {
      update(); draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [showOverlay])

  const tb = (k, v) => { touchRef.current[k] = v }

  return (
    <div className="game-root">
      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          width={CW * SCALE}
          height={CH * SCALE}
          className="game-canvas"
        />

        {overlay && (
          <div className="dialog-overlay" onClick={dismissDialog}>
            <div className="dialog-box">
              <div className="dialog-zone">{ZONES[overlay.zone]?.name}</div>
              <div className="dialog-text">{overlay.text}</div>
              <div className="dialog-hint">{stateRef.current.won ? '🌹 Fin' : 'Toca para continuar'}</div>
            </div>
          </div>
        )}

        {isDead && (
          <div className="dialog-overlay" onClick={restart}>
            <div className="dialog-box">
              <div className="dialog-zone" style={{ color: '#e35656' }}>Game Over</div>
              <div className="dialog-hint">Toca para reintentar</div>
            </div>
          </div>
        )}
      </div>

      {ebUI && !overlay && (
        <div className="eb-panel">
          <div className="eb-title">⚔ Elefante Guardián</div>
          <div className="eb-row">
            <span>HP</span>
            <div className="bar-track"><div className="bar-fill bar-enemy" style={{ width: `${(ebUI.ebHp / ebUI.total) * 100}%` }} /></div>
            <span className="bar-val">{ebUI.ebHp}/{ebUI.total}</span>
          </div>
          <div className="eb-row">
            <span>MP</span>
            <div className="bar-track"><div className="bar-fill bar-mp" style={{ width: `${(ebUI.mp / 50) * 100}%` }} /></div>
            <span className="bar-val">{ebUI.mp}/50</span>
          </div>
          {ebUI.resistance && <div className="eb-buff">⚡ Resistencia activa — próximo golpe +dmg</div>}
          <div className="eb-actions">
            <button type="button" className="eb-btn" onClick={attackElephant} disabled={ebUI.ebHp <= 0}>
              Golpe valiente
            </button>
            <button type="button" className="eb-btn eb-marta" onClick={rememberMarta} disabled={ebUI.mp < 10 || ebUI.ebHp <= 0}>
              ❤️ Recordar a Marta
            </button>
          </div>
        </div>
      )}

      <div className="touch-controls">
        <div className="touch-dpad">
          <button className="tbtn" onPointerDown={() => tb('left',  true)} onPointerUp={() => tb('left',  false)} onPointerLeave={() => tb('left',  false)}>◀</button>
          <button className="tbtn" onPointerDown={() => tb('right', true)} onPointerUp={() => tb('right', false)} onPointerLeave={() => tb('right', false)}>▶</button>
        </div>
        <div className="touch-utils">
          <button className="tbtn tbtn-util" onClick={restart}>↺</button>
          <button className="tbtn tbtn-pause" onClick={togglePause}>{paused ? '▶' : '⏸'}</button>
          <button className="tbtn tbtn-util" onClick={toggleFullscreen}>⛶</button>
        </div>
        <div className="touch-btns">
          <button className="tbtn tbtn-jump"  onPointerDown={() => tb('jump',   true)} onPointerUp={() => tb('jump',   false)} onPointerLeave={() => tb('jump',   false)}>↑</button>
          <button className="tbtn tbtn-atk"   onPointerDown={() => tb('attack', true)} onPointerUp={() => tb('attack', false)} onPointerLeave={() => tb('attack', false)}>⚔</button>
        </div>
      </div>
    </div>
  )
}
