// src/components/BirthChart.tsx
// Animated lines: grow on first appearance and ease to new positions on updates without flicker
// Labels rotate only based on toggle and date/time derived Sun position, never lat/lon
// Line labels are rendered outside the wheel using symbols ☼ ☾ ↑, centered on the ray
// Lines end exactly at the circumference; only text sits outside
// Only the symbol + word at the start of each legend line are colored
// Never end code comments with periods

import { useEffect, useMemo, useRef, useState } from "react"
import type { SignMode } from "../App"

type Props = {
  // lines for bodies, optional until inputs are valid
  eclipticLongitudeSun: number | undefined
  eclipticLongitudeMoon: number | undefined
  eclipticLongitudeAscendant: number | undefined

  // rotation inputs derived from date/time only
  sunEclipticLongitudeForRotation: number | undefined
  sunStarAlignedNameForRotation: string | undefined

  // tropical names for legend
  sunTropicalName: string | undefined
  moonTropicalName: string | undefined
  ascendantTropicalName: string | undefined

  signMode: SignMode
  isComputing: boolean
}

const TROPICAL_LABELS: readonly string[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
]

const STAR_ALIGNED_LABELS: readonly string[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Ophiuchus",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
]

// line colors used both on the wheel and in legend headers
const COLOR_SUN = "#f0c419"
const COLOR_MOON = "#e6e6e6"
const COLOR_ASC = "#8be9fd"

// shared easing for smooth but snappy motion
const EASE = "cubic-bezier(.22,.7,.15,1)"

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

function rotate<T>(arr: readonly T[], offset: number): T[] {
  const n = arr.length
  if (!n) return []
  const k = ((offset % n) + n) % n
  return [...arr.slice(k), ...arr.slice(0, k)]
}

function toPoint(centerX: number, centerY: number, radius: number, eclipticLongitude: number) {
  // SVG 0° is along +x, we want ecliptic 0° at +x and increase clockwise, so use 360 - elon
  const angleDegrees = 360 - eclipticLongitude
  const angleRadians = (angleDegrees * Math.PI) / 180
  const unitX = Math.cos(angleRadians)
  const unitY = Math.sin(angleRadians)
  const x = centerX + radius * unitX
  const y = centerY + radius * unitY
  return { x, y, unitX, unitY }
}

// place the symbol exactly on the ray, centered on the glyph
function renderOuterLabel(
  center: number,
  radius: number,
  labelOffset: number,
  point: { x: number; y: number; unitX: number; unitY: number } | null,
  symbol: string,
  fill: string
) {
  if (!point) return null
  const lx = center + (radius + labelOffset) * point.unitX
  const ly = center + (radius + labelOffset) * point.unitY
  return (
    <text
      x={lx}
      y={ly}
      fontSize={13}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={fill}
      style={{
        fontWeight: 700,
        transition: `x 220ms ${EASE}, y 220ms ${EASE}`,
      }}
    >
      {symbol}
    </text>
  )
}

export function BirthChart({
  eclipticLongitudeSun,
  eclipticLongitudeMoon,
  eclipticLongitudeAscendant,
  sunEclipticLongitudeForRotation,
  sunStarAlignedNameForRotation,
  sunTropicalName,
  moonTropicalName,
  ascendantTropicalName,
  signMode,
  isComputing,
}: Props) {
  const size = 460
  const radius = 190
  const center = size / 2
  const labelOffset = 28 // distance for line labels outside the circumference

  const sunPoint = isFiniteNumber(eclipticLongitudeSun)
    ? toPoint(center, center, radius, eclipticLongitudeSun as number)
    : null
  const moonPoint = isFiniteNumber(eclipticLongitudeMoon)
    ? toPoint(center, center, radius, eclipticLongitudeMoon as number)
    : null
  const ascPoint = isFiniteNumber(eclipticLongitudeAscendant)
    ? toPoint(center, center, radius, eclipticLongitudeAscendant as number)
    : null

  // stroke-dashoffset animation state per body to avoid out-in-out flicker
  const [sunDash, setSunDash] = useState<number>(radius)
  const [moonDash, setMoonDash] = useState<number>(radius)
  const [ascDash, setAscDash] = useState<number>(radius)

  const hadSun = useRef<boolean>(false)
  const hadMoon = useRef<boolean>(false)
  const hadAsc = useRef<boolean>(false)

  // when a line first appears, start at radius and animate to 0 on next frame
  useEffect(() => {
    const present = !!sunPoint
    if (present && !hadSun.current) {
      setSunDash(radius)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setSunDash(0))
      })
      hadSun.current = true
    } else if (!present) {
      hadSun.current = false
      setSunDash(radius)
    }
  }, [!!sunPoint, radius])

  useEffect(() => {
    const present = !!moonPoint
    if (present && !hadMoon.current) {
      setMoonDash(radius)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMoonDash(0))
      })
      hadMoon.current = true
    } else if (!present) {
      hadMoon.current = false
      setMoonDash(radius)
    }
  }, [!!moonPoint, radius])

  useEffect(() => {
    const present = !!ascPoint
    if (present && !hadAsc.current) {
      setAscDash(radius)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAscDash(0))
      })
      hadAsc.current = true
    } else if (!present) {
      hadAsc.current = false
      setAscDash(radius)
    }
  }, [!!ascPoint, radius])

  // label set based on toggle
  const drawLabels = signMode === "starAligned" ? STAR_ALIGNED_LABELS : TROPICAL_LABELS
  const drawSlices = drawLabels.length
  const drawStep = 360 / drawSlices

  // star-aligned ring used to generate star-aligned names for legend
  const starLabels = STAR_ALIGNED_LABELS
  const starSlices = starLabels.length
  const starStep = 360 / starSlices

  // compute rotation offset using only date/time derived inputs
  let rotatedDrawLabels = drawLabels
  let rotatedStarLabels = starLabels

  if (
    isFiniteNumber(sunEclipticLongitudeForRotation) &&
    typeof sunStarAlignedNameForRotation === "string" &&
    sunStarAlignedNameForRotation.length > 0
  ) {
    const starSunSlice =
      Math.floor((sunEclipticLongitudeForRotation as number) / starStep) % starSlices
    const starTarget = starLabels.findIndex(
      (s) => s.toLowerCase() === sunStarAlignedNameForRotation.toLowerCase()
    )
    const starOffset = starTarget >= 0 ? (starTarget - starSunSlice) % starSlices : 0
    rotatedStarLabels = rotate(starLabels, starOffset)

    if (signMode === "starAligned") {
      const drawSunSlice =
        Math.floor((sunEclipticLongitudeForRotation as number) / drawStep) % drawSlices
      const drawTarget = drawLabels.findIndex(
        (s) => s.toLowerCase() === sunStarAlignedNameForRotation.toLowerCase()
      )
      const drawOffset = drawTarget >= 0 ? (drawTarget - drawSunSlice) % drawSlices : 0
      rotatedDrawLabels = rotate(drawLabels, drawOffset)
    }
  }

  const nameViaStarRing = (elon: number | undefined): string => {
    if (!isFiniteNumber(elon)) return "N/A"
    const idx = Math.floor(elon / starStep) % starSlices
    return rotatedStarLabels[idx] ?? "N/A"
  }

  const starAlignedSunName = nameViaStarRing(eclipticLongitudeSun)
  const starAlignedMoonName = nameViaStarRing(eclipticLongitudeMoon)
  const starAlignedAscName = nameViaStarRing(eclipticLongitudeAscendant)

  // reusable transition style snippets for smooth movement
  const lineMoveTransition = { transition: `x2 220ms ${EASE}, y2 220ms ${EASE}, stroke-dashoffset 420ms ${EASE}` } as const
  const dotMoveTransition = { transition: `cx 220ms ${EASE}, cy 220ms ${EASE}` } as const

  return (
    <figure
      style={{
        margin: 0,
        padding: 0,
        display: "grid",
        justifyItems: "center",
        gap: 8,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Birth chart wheel">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#888" strokeWidth={2} />

        {rotatedDrawLabels.map((label, idx) => {
          const angle = ((-idx * drawStep) * Math.PI) / 180
          const x0 = center + radius * Math.cos(angle)
          const y0 = center + radius * Math.sin(angle)
          const mid = angle - ((drawStep / 2) * Math.PI) / 180
          const lx = center + (radius - 36) * Math.cos(mid)
          const ly = center + (radius - 36) * Math.sin(mid)
          const highlight =
            signMode === "starAligned" &&
            typeof sunStarAlignedNameForRotation === "string" &&
            label.toLowerCase() === sunStarAlignedNameForRotation.toLowerCase()
          return (
            <g key={`${label}-${idx}`}>
              <line x1={center} y1={center} x2={x0} y2={y0} stroke="#666" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fill="#ddd"
                style={{ fontWeight: highlight ? 700 : 600 }}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Sun line and marker */}
        {sunPoint && (
          <>
            <line
              x1={center}
              y1={center}
              x2={sunPoint.x}
              y2={sunPoint.y}
              stroke={COLOR_SUN}
              strokeWidth={2}
              strokeDasharray={radius}
              strokeDashoffset={sunDash}
              style={lineMoveTransition}
            />
            <circle cx={sunPoint.x} cy={sunPoint.y} r={6} fill={COLOR_SUN} style={dotMoveTransition} />
            {renderOuterLabel(center, radius, labelOffset, sunPoint, "☼", COLOR_SUN)}
          </>
        )}

        {/* Moon line and marker */}
        {moonPoint && (
          <>
            <line
              x1={center}
              y1={center}
              x2={moonPoint.x}
              y2={moonPoint.y}
              stroke={COLOR_MOON}
              strokeWidth={2}
              strokeDasharray={radius}
              strokeDashoffset={moonDash}
              style={lineMoveTransition}
            />
            <circle cx={moonPoint.x} cy={moonPoint.y} r={6} fill={COLOR_MOON} style={dotMoveTransition} />
            {renderOuterLabel(center, radius, labelOffset, moonPoint, "☾", COLOR_MOON)}
          </>
        )}

        {/* Ascendant line and marker */}
        {ascPoint && (
          <>
            <line
              x1={center}
              y1={center}
              x2={ascPoint.x}
              y2={ascPoint.y}
              stroke={COLOR_ASC}
              strokeWidth={2}
              strokeDasharray={radius}
              strokeDashoffset={ascDash}
              style={lineMoveTransition}
            />
            <circle cx={ascPoint.x} cy={ascPoint.y} r={6} fill={COLOR_ASC} style={dotMoveTransition} />
            {renderOuterLabel(center, radius, labelOffset, ascPoint, "↑", COLOR_ASC)}
          </>
        )}
      </svg>

      {/* legend with only the left header colored per line */}
      <div style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.95 }}>
        <div>
          <span style={{ color: COLOR_SUN }}>
            <span aria-hidden="true">☼ </span>Sun
          </span>
          {" • Star-aligned: "}
          <strong>{starAlignedSunName || "N/A"}</strong>
          {" • Tropical: "}
          <strong>{sunTropicalName ?? "N/A"}</strong>
          {isComputing ? " • recalculating…" : ""}
        </div>
        <div>
          <span style={{ color: COLOR_MOON }}>
            <span aria-hidden="true">☾ </span>Moon
          </span>
          {" • Star-aligned: "}
          <strong>{starAlignedMoonName || "N/A"}</strong>
          {" • Tropical: "}
          <strong>{moonTropicalName ?? "N/A"}</strong>
        </div>
        <div>
          <span style={{ color: COLOR_ASC }}>
            <span aria-hidden="true">↑ </span>Ascendant
          </span>
          {" • Star-aligned: "}
          <strong>{starAlignedAscName || "N/A"}</strong>
          {" • Tropical: "}
          <strong>{ascendantTropicalName ?? "N/A"}</strong>
        </div>
      </div>
    </figure>
  )
}
