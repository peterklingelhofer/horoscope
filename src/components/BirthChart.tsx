// src/components/BirthChart.tsx
// Always render the wheel; hide body lines when inputs aren't valid yet
// Legend shows N/A until values are available
// Star-aligned names are independent of toggle and come from a dedicated rotated star-aligned ring
// Never end code comments with periods

import type { SignMode } from "../App"

type Props = {
  eclipticLongitudeSun: number | undefined
  eclipticLongitudeMoon: number | undefined
  eclipticLongitudeAscendant: number | undefined

  // star-aligned Sun name anchor and timestamp
  sunConstellationName: string | undefined
  sunConstellationWhenUTC: Date | undefined

  // tropical names for all three
  sunTropicalName: string | undefined
  moonTropicalName: string | undefined
  ascendantTropicalName: string | undefined

  // not used for text now but kept for compatibility
  moonConstellationName?: string | undefined
  ascendantConstellationName?: string | undefined

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
  sunConstellationWhenUTC, // accepted but not shown anymore
  sunTropicalName,
  moonTropicalName,
  ascendantTropicalName,
  signMode,
  isComputing,
}: Props) {
  const size = 460
  const radius = 190
  const center = size / 2

  const sunHas = isFiniteNumber(eclipticLongitudeSun)
  const moonHas = isFiniteNumber(eclipticLongitudeMoon)
  const ascHas = isFiniteNumber(eclipticLongitudeAscendant)

  const toPoint = (elon: number) => {
    const angle = 360 - elon
    const x = center + radius * Math.cos((angle * Math.PI) / 180)
    const y = center + radius * Math.sin((angle * Math.PI) / 180)
    return { x, y, elon }
  }

  const sun = sunHas ? toPoint(eclipticLongitudeSun as number) : null
  const moon = moonHas ? toPoint(eclipticLongitudeMoon as number) : null
  const asc = ascHas ? toPoint(eclipticLongitudeAscendant as number) : null

  // ring used for drawing labels depends on toggle
  const baseRing = signMode === "nytimes" ? STAR_ALIGNED_LABELS : TROPICAL_SIGNS
  const ringSlices = baseRing.length
  const ringStep = 360 / ringSlices

  // independent star-aligned ring used only for text so it doesn't depend on the toggle
  const starRing = STAR_ALIGNED_LABELS
  const starSlices = starRing.length
  const starStep = 360 / starSlices

  // rotate the star-aligned ring so Sun's slice matches sunConstellationName
  let rotatedStarRing = starRing
  if (sunHas && sunConstellationName) {
    const sunSliceIndex = Math.floor((eclipticLongitudeSun as number) / starStep) % starSlices
    const targetIndex = starRing.findIndex(
      (s) => s.toLowerCase() === sunConstellationName.toLowerCase()
    )
    if (targetIndex >= 0) {
      const offset = (targetIndex - sunSliceIndex) % starSlices
      rotatedStarRing = rotateArray(starRing, offset)
    }
  }

  const starNameForElon = (elonMaybe: number | undefined): string => {
    if (!isFiniteNumber(elonMaybe)) return "N/A"
    const idx = Math.floor(elonMaybe / starStep) % starSlices
    const name = rotatedStarRing[idx]
    return name ?? "N/A"
  }

  const starSunName = starNameForElon(eclipticLongitudeSun)
  const starMoonName = starNameForElon(eclipticLongitudeMoon)
  const starAscName = starNameForElon(eclipticLongitudeAscendant)

  // drawing ring rotation follows toggle
  let rotatedDrawRing = baseRing
  if (signMode === "nytimes" && sunHas && sunConstellationName) {
    const sunSliceIndex = Math.floor((eclipticLongitudeSun as number) / ringStep) % ringSlices
    const targetIndex = baseRing.findIndex(
      (s) => s.toLowerCase() === sunConstellationName.toLowerCase()
    )
    if (targetIndex >= 0) {
      const offset = (targetIndex - sunSliceIndex) % ringSlices
      rotatedDrawRing = rotateArray(baseRing, offset)
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
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Birth chart wheel">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#888" strokeWidth={2} />

        {rotatedDrawRing.map((label, idx) => {
          const angle = ((-idx * ringStep) * Math.PI) / 180
          const x0 = center + radius * Math.cos(angle)
          const y0 = center + radius * Math.sin(angle)
          const mid = angle - ((ringStep / 2) * Math.PI) / 180
          const lx = center + (radius - 36) * Math.cos(mid)
          const ly = center + (radius - 36) * Math.sin(mid)
          const isSunSlice =
            signMode === "nytimes" &&
            sunHas &&
            label.toLowerCase() === starSunName.toLowerCase()
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
                style={{ fontWeight: isSunSlice ? 700 : 600 }}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* draw body lines only when we have valid angles */}
        {sun && (
          <>
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
          </>
        )}

        {moon && (
          <>
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
          </>
        )}

        {asc && (
          <>
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
          </>
        )}
      </svg>

      {/* legend shows N/A when values are not available yet */}
      <div style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.95 }}>
        <div>
          <span aria-hidden="true">☉ </span>
          Sun • Star-aligned: <strong>{starSunName || "N/A"}</strong> • Tropical:{" "}
          <strong>{sunTropicalName ?? "N/A"}</strong>
          {isComputing ? " • recalculating…" : ""}
        </div>
        <div>
          <span aria-hidden="true">☾ </span>
          Moon • Star-aligned: <strong>{starMoonName || "N/A"}</strong> • Tropical:{" "}
          <strong>{moonTropicalName ?? "N/A"}</strong>
        </div>
        <div>
          <span aria-hidden="true">↑ </span>
          Ascendant • Star-aligned: <strong>{starAscName || "N/A"}</strong> • Tropical:{" "}
          <strong>{ascendantTropicalName ?? "N/A"}</strong>
        </div>
      </div>
    </figure>
  )
}
