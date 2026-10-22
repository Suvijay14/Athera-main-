'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from 'framer-motion'
import { User } from 'lucide-react'
import AtheraMark from '@/components/brand/AtheraMark'
import {
  MESH_REF_HEIGHT,
  MESH_REF_WIDTH,
  POSITIONS_12,
  POSITIONS_24,
  buildMeshEdges,
  curvedPath,
  scaleMeshPoint,
  type MeshEdge,
  type MeshPoint,
} from '@/lib/landing/mesh-layout'
import {
  MESH_APPS_ALL,
  meshAppsForViewport,
  type MeshAppDef,
} from '@/components/landing/mesh-apps'

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

function segment(p: number, start: number, end: number) {
  return clamp01((p - start) / (end - start))
}

function easeInOut(t: number) {
  const x = clamp01(t)
  return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2
}

export const MESH_SCROLL_VH_DESKTOP = 450
export const MESH_SCROLL_VH_MOBILE = 330
export const MESH_STICKY_VH = 100
export const MESH_SNAP_PROGRESS = 0.85

/** Scroll offset (vh) within section where progress hits MESH_SNAP_PROGRESS */
export function meshSnapOffsetVh(mobile: boolean) {
  const total = mobile ? MESH_SCROLL_VH_MOBILE : MESH_SCROLL_VH_DESKTOP
  const range = total - MESH_STICKY_VH
  return range * MESH_SNAP_PROGRESS
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return mobile
}

type MeshStageProps = {
  progress: number
  width: number
  height: number
  apps: MeshAppDef[]
  positions: MeshPoint[]
  edges: MeshEdge[]
  iconSize: number
  labelSize: number
  youSize: number
  driftPhase: number
}

function MeshStage({
  progress: p,
  width,
  height,
  apps,
  positions,
  edges,
  iconSize,
  labelSize,
  youSize,
  driftPhase,
}: MeshStageProps) {
  const labelPad = 48
  const usableH = Math.max(120, height - labelPad)
  const cx = width / 2
  const cy = usableH / 2
  const count = apps.length
  const edgeCount = edges.length

  const youAlpha = segment(p, 0.04, 0.12) * (1 - segment(p, 0.25, 0.34))
  const logoScaleT = easeInOut(segment(p, 0.75, 0.85))
  const atheraAlpha = segment(p, 0.73, 0.8)
  const atheraScale = 0.55 + logoScaleT * 0.55
  const atheraGlow = logoScaleT

  const holdPulse = p >= 0.15 && p <= 0.25
  const linePulse = holdPulse ? 0.38 + 0.08 * Math.sin(driftPhase * 0.002) : 0.4

  const iconCenters = apps.map((_, i) => {
    const raw = scaleMeshPoint(positions[i], width, usableH)
    const base = { x: raw.x, y: raw.y }
    const pop = segment(p, (i / count) * 0.1, 0.05 + (i / count) * 0.1)
    const mergeStart = 0.35 + (i / Math.max(1, count - 1)) * 0.25
    const merge = easeInOut(segment(p, mergeStart, 0.75))

    let x = base.x
    let y = base.y
    if (p < 0.75 && pop > 0.01) {
      const drift = (1 - merge) * (1 - segment(p, 0.25, 0.38))
      x += Math.sin(driftPhase * 0.0012 + i * 1.7) * 3 * drift
      y += Math.cos(driftPhase * 0.001 + i * 2.1) * 3 * drift
    }

    x = x + (cx - x) * merge
    y = y + (cy - y) * merge

    const scale = pop * (1 - merge * 0.92)
    const opacity = pop * (1 - merge * 0.98)

    return { x, y, scale, opacity, pop, merge }
  })

  return (
    <div className="relative w-full h-full">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox={`0 0 ${width} ${usableH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {edges.map((edge, idx) => {
          const from = iconCenters[edge.from]
          const toPoint =
            edge.to === 'you'
              ? { x: cx, y: cy }
              : iconCenters[edge.to as number]

          const lineIntro = segment(p, 0.06, 0.14)
          const lineFadeOut = segment(p, 0.25, 0.35)
          const lineFade = lineIntro * (1 - lineFadeOut)

          if (lineFade <= 0.01 || from.opacity <= 0.01) return null

          return (
            <path
              key={edge.key}
              d={curvedPath(from.x, from.y, toPoint.x, toPoint.y)}
              fill="none"
              stroke="rgba(52, 48, 44, 0.4)"
              strokeWidth={1.5}
              strokeOpacity={lineFade * linePulse}
            />
          )
        })}
      </svg>

      {apps.map((app, i) => {
        const { x, y, scale, opacity, pop, merge } = iconCenters[i]
        if (opacity <= 0.02) return null

        const badgeFade =
          app.badge != null ? pop * (1 - segment(p, 0.25 + (i / count) * 0.04, 0.35)) : 0

        const Icon = app.Icon
        const iconColor = app.color ? '#fff' : undefined

        return (
          <div
            key={app.id}
            className="absolute z-10 flex flex-col items-center"
            style={{
              left: x,
              top: y,
              opacity,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            <div className="relative">
              <div
                className="rounded-xl bg-surface-paper shadow-float flex items-center justify-center border border-border-delicate/80"
                style={{
                  width: iconSize,
                  height: iconSize,
                  backgroundColor: app.color ?? undefined,
                }}
              >
                <Icon
                  size={iconSize * 0.52}
                  className={app.color ? 'text-white' : 'text-ink-primary'}
                  color={iconColor}
                />
              </div>
              {app.badge != null && badgeFade > 0.05 ? (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
                  style={{ opacity: badgeFade }}
                >
                  {app.badge > 20 ? '99+' : app.badge}
                </span>
              ) : null}
            </div>
            <span
              className="mt-1.5 text-ink-secondary text-center leading-tight max-w-[96px]"
              style={{ fontSize: labelSize }}
            >
              {app.name}
            </span>
          </div>
        )
      })}

      <div
        className="absolute z-20 flex flex-col items-center"
        style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          style={{ opacity: youAlpha, scale: 1 - segment(p, 0.4, 0.48) * 0.35 }}
          className="absolute flex flex-col items-center"
        >
          <div
            className="rounded-full bg-surface-paper border-2 border-sage/50 shadow-float flex items-center justify-center"
            style={{ width: youSize, height: youSize }}
          >
            <User className="text-sage" size={youSize * 0.42} strokeWidth={1.75} />
          </div>
          <span className="mt-2 text-sm font-semibold text-sage">You</span>
        </motion.div>

        <motion.div
          style={{
            opacity: atheraAlpha,
            scale: atheraScale,
          }}
          className="flex flex-col items-center"
        >
          <div
            className="flex items-center justify-center"
            style={{
              filter:
                atheraGlow > 0.01
                  ? `drop-shadow(0 0 ${12 + atheraGlow * 28}px rgba(78, 100, 76, ${0.35 + atheraGlow * 0.45}))`
                  : undefined,
            }}
          >
            <AtheraMark size={youSize} raster={false} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function MeshHeadings({ progress: p }: { progress: number }) {
  const h1In = segment(p, 0, 0.08)
  const h1Out = segment(p, 0.62, 0.72)
  const headingIntro = h1In * (1 - h1Out)
  const headingOutro = segment(p, 0.86, 0.94)

  return (
    <div className="relative w-full max-w-[900px] mx-auto px-4 h-[4.5rem] sm:h-[5.25rem] lg:h-[5.75rem] xl:h-[11rem]">
      <motion.p
        style={{ opacity: headingIntro }}
        className="font-newsreader text-xl sm:text-2xl lg:text-3xl text-center text-ink-primary leading-snug absolute inset-0 flex items-center justify-center [text-wrap:balance]"
      >
        You use 20+ apps to get through a week. None of them talk to each other.
      </motion.p>
      <motion.div
        style={{ opacity: headingOutro }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 sm:px-4"
      >
        <p className="font-newsreader text-xl sm:text-2xl lg:text-[1.75rem] text-ink-primary leading-snug [text-wrap:balance] max-w-[900px]">
          Athera builds the system for you, and keeps it running.
        </p>
      </motion.div>
    </div>
  )
}

function StaticReducedMotion({ mobile }: { mobile: boolean }) {
  const apps = meshAppsForViewport(mobile)
  const positions = mobile ? POSITIONS_12 : POSITIONS_24
  const edges = buildMeshEdges(apps.length)

  return (
    <div className="w-full px-4 sm:px-8 py-16">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-start">
        <div>
          <p className="font-newsreader text-xl sm:text-2xl text-center text-ink-primary mb-6 leading-snug">
            You use 20+ apps to get through a week. None of them talk to each other.
          </p>
          <div
            className="relative mx-auto landing-card"
            style={{ width: 'min(1200px, 95vw)', height: 'min(60vh, 520px)' }}
          >
            <MeshStage
              progress={0.2}
              width={MESH_REF_WIDTH}
              height={MESH_REF_HEIGHT}
              apps={apps}
              positions={positions.slice(0, apps.length)}
              edges={edges}
              iconSize={mobile ? 56 : 72}
              labelSize={14}
              youSize={96}
              driftPhase={0}
            />
          </div>
        </div>
        <div>
          <div className="text-center mb-6 max-w-[680px] mx-auto">
            <p className="font-newsreader text-xl sm:text-2xl text-ink-primary leading-snug">
              Athera builds the system for you, and keeps it running.
            </p>
          </div>
          <div
            className="relative mx-auto landing-card flex items-center justify-center"
            style={{ width: 'min(1200px, 95vw)', height: 'min(60vh, 520px)' }}
          >
            <div className="flex flex-col items-center">
              <div style={{ filter: 'drop-shadow(0 0 28px rgba(78, 100, 76, 0.45))' }}>
                <AtheraMark size={96} raster={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AppMeshProblem() {
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const meshRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [driftPhase, setDriftPhase] = useState(0)
  const [meshSize, setMeshSize] = useState({ w: MESH_REF_WIDTH, h: MESH_REF_HEIGHT })

  const scrollHeightVh = isMobile ? MESH_SCROLL_VH_MOBILE : MESH_SCROLL_VH_DESKTOP
  const snapOffsetVh = meshSnapOffsetVh(isMobile)

  const apps = useMemo(() => meshAppsForViewport(isMobile), [isMobile])
  const positions = isMobile ? POSITIONS_12 : POSITIONS_24
  const edges = useMemo(() => buildMeshEdges(apps.length), [apps.length])
  const iconSize = isMobile ? 56 : 72
  const labelSize = 14
  const youSize = 96

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    mass: 0.45,
  })

  useMotionValueEvent(smoothScroll, 'change', (v) => {
    setProgress(clamp01(v))
  })

  useEffect(() => {
    if (reducedMotion) return
    let frame = 0
    const tick = (t: number) => {
      setDriftPhase(t)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion])

  useEffect(() => {
    const el = meshRef.current
    if (!el) return
    const sync = () => {
      setMeshSize({ w: el.clientWidth, h: el.clientHeight })
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => ro.disconnect()
  }, [reducedMotion, isMobile])

  if (reducedMotion) {
    return <StaticReducedMotion mobile={isMobile} />
  }

  return (
    <div
      id="app-mesh-scroll"
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${scrollHeightVh}vh` }}
    >
      <div
        aria-hidden
        className="snap-start pointer-events-none w-full shrink-0"
        style={{ height: `${snapOffsetVh}vh` }}
      />
      <div
        className="sticky top-0 h-screen w-full flex flex-col items-center border-t border-[var(--border)] px-2 pb-12 box-border"
        style={{ marginTop: `-${snapOffsetVh}vh`, paddingTop: '12vh' }}
      >
        <div className="w-full shrink-0 flex justify-center">
          <MeshHeadings progress={progress} />
        </div>
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div
            ref={meshRef}
            className="relative mx-auto w-[95vw] max-w-[1200px] h-full max-h-[min(80vh,calc(100vh-12vh-6rem-48px))] min-h-[240px]"
          >
          <MeshStage
            progress={progress}
            width={meshSize.w}
            height={meshSize.h}
            apps={apps}
            positions={positions.slice(0, apps.length)}
            edges={edges}
            iconSize={iconSize}
            labelSize={labelSize}
            youSize={youSize}
            driftPhase={driftPhase}
          />
          </div>
        </div>
      </div>
    </div>
  )
}
