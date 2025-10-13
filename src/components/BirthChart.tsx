// src/components/BirthChart.tsx
// Rotates the labels when toggling modes; caption now says "Star-aligned" instead of "NYT"
// Never end code comments with periods

import type { SignMode } from "../App"

type Props = {
  eclipticLongitudeSun: number | undefined
  eclipticLongitudeMoon: number | undefined
  eclipticLongitudeAscendant: number | undefined
  tropicalSignSun: string | undefined
  tropicalSignMoon: string | undefined
  tropicalSignAscendant: string | undefined
  sunConstellationName: string | undefined
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

function safeFixed(value: unknown, digits: number): string {
  return isFiniteNumber(value) ? value.toFixed(digits) : "—"
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
  tropicalSignSun,
  tropicalSignMoon,
  tropicalSignAscendant,
  sunConstellationName,
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
    return { x, y, angle }
  }

  const sun = toPoint(eclipticLongitudeSun)
  const moon = toPoint(eclipticLongitudeMoon)
  const asc = toPoint(eclipticLongitudeAscendant)

  const usingStarAligned = signMode === "nytimes"
  const baseLabels = usingStarAligned ? STAR_ALIGNED_LABELS : TROPICAL_SIGNS
  const slices = baseLabels.length
  const stepDeg = 360 / slices

  // Rotate labels so that the Sun's slice name matches the active mode's primary label
  let rotatedLabels = baseLabels
  if (usingStarAligned) {
    const sunElon = safeNumber(eclipticLongitudeSun, 0)
    const sunSliceIndex = Math.floor(sunElon / stepDeg) % slices
    const targetIndex = Math.max(
      0,
      baseLabels.findIndex(
        (s) => s.toLowerCase() === String(sunConstellationName ?? "").toLowerCase()
      )
    )
    const hasTarget = targetIndex >= 0
    if (hasTarget) {
      const offset = (targetIndex - sunSliceIndex) % slices
      rotatedLabels = rotateArray(baseLabels, offset)
    }
  }

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
                  fontWeight:
                    usingStarAligned && label === (sunConstellationName ?? "") ? 700 : 600,
                }}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Sun marker and label */}
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

        {/* Moon marker and label */}
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

        {/* Ascendant marker and label */}
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

      <figcaption style={{ fontSize: 14, opacity: 0.9, textAlign: "center" }}>
        Sun {tropicalSignSun ?? "—"} {usingStarAligned ? "(Star-aligned)" : "(Tropical)"} • Moon{" "}
        {tropicalSignMoon ?? "—"} • Ascendant {tropicalSignAscendant ?? "—"}
        {isComputing ? " • recalculating…" : ""}
      </figcaption>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 8,
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        <span>☉ {tropicalSignSun ?? "—"} at {safeFixed(eclipticLongitudeSun, 2)}°</span>
        <span>☾ {tropicalSignMoon ?? "—"} at {safeFixed(eclipticLongitudeMoon, 2)}°</span>
        <span>Asc {tropicalSignAscendant ?? "—"} at {safeFixed(eclipticLongitudeAscendant, 2)}°</span>
      </div>
    </figure>
  )
}
