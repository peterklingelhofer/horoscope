// src/components/BirthChart.tsx
// Rotate labels only based on toggle and date/time derived Sun position, never lat/lon
// Never end code comments with periods

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

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

function rotate<T>(arr: readonly T[], offset: number): T[] {
  const n = arr.length
  if (!n) return []
  const k = ((offset % n) + n) % n
  return [...arr.slice(k), ...arr.slice(0, k)]
}

function toPoint(cx: number, cy: number, r: number, eclipticLongitude: number) {
  const angle = 360 - eclipticLongitude
  const x = cx + r * Math.cos((angle * Math.PI) / 180)
  const y = cy + r * Math.sin((angle * Math.PI) / 180)
  return { x, y }
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

  const sunPoint = isFiniteNumber(eclipticLongitudeSun)
    ? toPoint(center, center, radius, eclipticLongitudeSun as number)
    : null
  const moonPoint = isFiniteNumber(eclipticLongitudeMoon)
    ? toPoint(center, center, radius, eclipticLongitudeMoon as number)
    : null
  const ascPoint = isFiniteNumber(eclipticLongitudeAscendant)
    ? toPoint(center, center, radius, eclipticLongitudeAscendant as number)
    : null

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
    const starSunSlice = Math.floor((sunEclipticLongitudeForRotation as number) / starStep) % starSlices
    const starTarget = starLabels.findIndex(
      (s) => s.toLowerCase() === sunStarAlignedNameForRotation.toLowerCase()
    )
    const starOffset = starTarget >= 0 ? (starTarget - starSunSlice) % starSlices : 0
    rotatedStarLabels = rotate(starLabels, starOffset)

    if (signMode === "starAligned") {
      // keep drawLabels in sync when star-aligned is selected so the visible ring matches
      const drawSunSlice = Math.floor((sunEclipticLongitudeForRotation as number) / drawStep) % drawSlices
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

        {sunPoint && (
          <>
            <line x1={center} y1={center} x2={sunPoint.x} y2={sunPoint.y} stroke="#f0c419" strokeWidth={2} />
            <circle cx={sunPoint.x} cy={sunPoint.y} r={6} fill="#f0c419" />
            <text x={sunPoint.x} y={sunPoint.y} dx={8} dy={-8} fontSize={12} textAnchor="start" dominantBaseline="central" fill="#f0c419">
              Sun
            </text>
          </>
        )}

        {moonPoint && (
          <>
            <line x1={center} y1={center} x2={moonPoint.x} y2={moonPoint.y} stroke="#e6e6e6" strokeWidth={2} />
            <circle cx={moonPoint.x} cy={moonPoint.y} r={6} fill="#e6e6e6" />
            <text x={moonPoint.x} y={moonPoint.y} dx={8} dy={-8} fontSize={12} textAnchor="start" dominantBaseline="central" fill="#e6e6e6">
              Moon
            </text>
          </>
        )}

        {ascPoint && (
          <>
            <line x1={center} y1={center} x2={ascPoint.x} y2={ascPoint.y} stroke="#8be9fd" strokeWidth={2} />
            <circle cx={ascPoint.x} cy={ascPoint.y} r={6} fill="#8be9fd" />
            <text x={ascPoint.x} y={ascPoint.y} dx={8} dy={-8} fontSize={12} textAnchor="start" dominantBaseline="central" fill="#8be9fd">
              Ascendant
            </text>
          </>
        )}
      </svg>

      <div style={{ display: "grid", gap: 4, fontSize: 13, opacity: 0.95 }}>
        <div>
          <span aria-hidden="true">☉ </span>
          Sun • Star-aligned: <strong>{starAlignedSunName || "N/A"}</strong> • Tropical:{" "}
          <strong>{sunTropicalName ?? "N/A"}</strong>
          {isComputing ? " • recalculating…" : ""}
        </div>
        <div>
          <span aria-hidden="true">☾ </span>
          Moon • Star-aligned: <strong>{starAlignedMoonName || "N/A"}</strong> • Tropical:{" "}
          <strong>{moonTropicalName ?? "N/A"}</strong>
        </div>
        <div>
          <span aria-hidden="true">↑ </span>
          Ascendant • Star-aligned: <strong>{starAlignedAscName || "N/A"}</strong> • Tropical:{" "}
          <strong>{ascendantTropicalName ?? "N/A"}</strong>
        </div>
      </div>
    </figure>
  )
}
