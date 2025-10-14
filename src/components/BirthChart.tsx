// src/components/BirthChart.tsx
// Star-aligned names now come from the rotated ring mapping so text matches the circle
// Renders exactly three lines with icons showing Star-aligned and Tropical for Sun, Moon, and Ascendant
// Never end code comments with periods

import type { SignMode } from "../App"

type Props = {
  eclipticLongitudeSun: number | undefined
  eclipticLongitudeMoon: number | undefined
  eclipticLongitudeAscendant: number | undefined

  // star-aligned constellation names for Sun (timestamp shown); Moon/Asc names will be derived from the ring mapping
  sunConstellationName: string | undefined
  moonConstellationName: string | undefined
  ascendantConstellationName: string | undefined

  // tropical names for all three
  sunTropicalName: string | undefined
  moonTropicalName: string | undefined
  ascendantTropicalName: string | undefined

  // timestamp for star-aligned Sun label
  sunConstellationWhenUTC: Date | undefined

  signMode: SignMode
  isComputing: boolean
}

const TROPICAL_SIGNS: readonly string[] = [
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function safeNumber(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback
}

function rotateArray<T>(arr: readonly T[], offset: number): T[] {
  const n = arr.length
  if (!n) return []
  const norm = ((offset % n) + n) % n
  return [...arr.slice(norm), ...arr.slice(0, norm)]
}

export function BirthChart({
  eclipticLongitudeSun,
  eclipticLongitudeMoon,
  eclipticLongitudeAscendant,
  sunConstellationName,
  moonConstellationName, // not used for text anymore, but kept for compatibility
  ascendantConstellationName, // not used for text anymore, but kept for compatibility
  sunTropicalName,
  moonTropicalName,
  ascendantTropicalName,
  sunConstellationWhenUTC, // still accepted but no longer shown in the legend
  signMode,
  isComputing,
}: Props) {
  const size = 460
  const radius = 190
  const center = size / 2

  const toPoint = (elonMaybe: unknown, r = radius) => {
    const elon = safeNumber(elonMaybe, 0)
    const angle = 360 - elon
    const x = center + r * Math.cos((angle * Math.PI) / 180)
    const y = center + r * Math.sin((angle * Math.PI) / 180)
    return { x, y, angle, elon }
  }

  const sun = toPoint(eclipticLongitudeSun)
  const moon = toPoint(eclipticLongitudeMoon)
  const asc = toPoint(eclipticLongitudeAscendant)

  const usingStarAligned = signMode === "nytimes"
  const baseLabels = usingStarAligned ? STAR_ALIGNED_LABELS : TROPICAL_SIGNS
  const slices = baseLabels.length
  const stepDeg = 360 / slices

  // rotate labels so the Sun slice matches the active mode's chosen Sun name
  let rotatedLabels = baseLabels
  if (usingStarAligned) {
    const sunSliceIndex = Math.floor(sun.elon / stepDeg) % slices
    const targetIndex = Math.max(
      0,
      baseLabels.findIndex(
        (s) => s.toLowerCase() === String(sunConstellationName ?? "").toLowerCase()
      )
    )
    if (targetIndex >= 0) {
      const offset = (targetIndex - sunSliceIndex) % slices
      rotatedLabels = rotateArray(baseLabels, offset)
    }
  }

  // helper to map ecliptic longitude to the label on the ring
  const starAlignedNameViaRing = (elon: number): string => {
    const idx = Math.floor(elon / stepDeg) % slices
    return rotatedLabels[idx]
  }

  const starAlignedSunName = starAlignedNameViaRing(sun.elon)
  const starAlignedMoonName = starAlignedNameViaRing(moon.elon)
  const starAlignedAscName = starAlignedNameViaRing(asc.elon)

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
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Birth chart wheel"
      >
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#888" strokeWidth={2} />

        {rotatedLabels.map((label, idx) => {
          const angle = ((-idx * stepDeg) * Math.PI) / 180
          const x0 = center + radius * Math.cos(angle)
          const y0 = center + radius * Math.sin(angle)
          const mid = angle - ((stepDeg / 2) * Math.PI) / 180
          const lx = center + (radius - 36) * Math.cos(mid)
          const ly = center + (radius - 36) * Math.sin(mid)
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
                style={{
                  fontWeight: usingStarAligned && label === starAlignedSunName ? 700 : 600,
                }}
              >
                {label}
              </text>
            </g>
          )
        })}

        <line x1={center} y1={center} x2={sun.x} y2={sun.y} stroke="#f0c419" strokeWidth={2} />
        <circle cx={sun.x} cy={sun.y} r={6} fill="#f0c419" />
        <text
          x={sun.x}
          y={sun.y}
          dx={8}
          dy={-8}
          fontSize={12}
          textAnchor="start"
          dominantBaseline="central"
          fill="#f0c419"
        >
          Sun
        </text>

        <line x1={center} y1={center} x2={moon.x} y2={moon.y} stroke="#e6e6e6" strokeWidth={2} />
        <circle cx={moon.x} cy={moon.y} r={6} fill="#e6e6e6" />
        <text
          x={moon.x}
          y={moon.y}
          dx={8}
          dy={-8}
          fontSize={12}
          textAnchor="start"
          dominantBaseline="central"
          fill="#e6e6e6"
        >
          Moon
        </text>

        <line x1={center} y1={center} x2={asc.x} y2={asc.y} stroke="#8be9fd" strokeWidth={2} />
        <circle cx={asc.x} cy={asc.y} r={6} fill="#8be9fd" />
        <text
          x={asc.x}
          y={asc.y}
          dx={8}
          dy={-8}
          fontSize={12}
          textAnchor="start"
          dominantBaseline="central"
          fill="#8be9fd"
        >
          Ascendant
        </text>
      </svg>

      <div style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.95 }}>
        <div>
          <span aria-hidden="true">☉ </span>
          Sun • Star-aligned: <strong>{starAlignedSunName}</strong> • Tropical:{" "}
          <strong>{sunTropicalName ?? ""}</strong>
          {isComputing ? " • recalculating…" : ""}
        </div>
        <div>
          <span aria-hidden="true">☾ </span>
          Moon • Star-aligned: <strong>{starAlignedMoonName}</strong> • Tropical:{" "}
          <strong>{moonTropicalName ?? ""}</strong>
        </div>
        <div>
          <span aria-hidden="true">↑ </span>
          Ascendant • Star-aligned: <strong>{starAlignedAscName}</strong> • Tropical:{" "}
          <strong>{ascendantTropicalName ?? ""}</strong>
        </div>
      </div>
    </figure>
  )
}
