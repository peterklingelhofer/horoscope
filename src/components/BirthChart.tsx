// src/components/BirthChart.tsx
// Always render the wheel; hide body lines until inputs are valid
// Legend shows N/A until values are available
// Star-aligned names come via a rotated star-aligned ring; tropical names are passed in
// Never end code comments with periods

import type { SignMode } from "../App"

type Props = {
  eclipticLongitudeSun: number | undefined
  eclipticLongitudeMoon: number | undefined
  eclipticLongitudeAscendant: number | undefined

  // star-aligned anchor for Sun naming on the ring
  sunConstellationName: string | undefined

  // tropical names for legend
  sunTropicalName: string | undefined
  moonTropicalName: string | undefined
  ascendantTropicalName: string | undefined

  // kept aligned with the app toggle
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function rotateArray<T>(arr: readonly T[], offset: number): T[] {
  const n = arr.length
  if (n === 0) return []
  const k = ((offset % n) + n) % n
  return [...arr.slice(k), ...arr.slice(0, k)]
}

function getPoint(center: number, radius: number, eclipticLongitude: number) {
  const angle = 360 - eclipticLongitude
  const x = center + radius * Math.cos((angle * Math.PI) / 180)
  const y = center + radius * Math.sin((angle * Math.PI) / 180)
  return { x, y }
}

export function BirthChart({
  eclipticLongitudeSun,
  eclipticLongitudeMoon,
  eclipticLongitudeAscendant,
  sunConstellationName,
  sunTropicalName,
  moonTropicalName,
  ascendantTropicalName,
  signMode,
  isComputing,
}: Props) {
  const size = 460
  const radius = 190
  const center = size / 2

  const hasSun = isFiniteNumber(eclipticLongitudeSun)
  const hasMoon = isFiniteNumber(eclipticLongitudeMoon)
  const hasAsc = isFiniteNumber(eclipticLongitudeAscendant)

  const sunPoint = hasSun ? getPoint(center, radius, eclipticLongitudeSun as number) : null
  const moonPoint = hasMoon ? getPoint(center, radius, eclipticLongitudeMoon as number) : null
  const ascPoint = hasAsc ? getPoint(center, radius, eclipticLongitudeAscendant as number) : null

  // drawing ring follows the toggle
  const drawLabels = signMode === "starAligned" ? STAR_ALIGNED_LABELS : TROPICAL_LABELS
  const drawSlices = drawLabels.length
  const drawStep = 360 / drawSlices

  // independent star-aligned ring used to compute legend starAligned names so they do not depend on toggle
  const starLabels = STAR_ALIGNED_LABELS
  const starSlices = starLabels.length
  const starStep = 360 / starSlices

  // rotate the star-aligned ring so the Sun slice matches the provided Sun star-aligned name
  let rotatedStarLabels = starLabels
  if (hasSun && sunConstellationName) {
    const sunSliceIndex = Math.floor((eclipticLongitudeSun as number) / starStep) % starSlices
    const targetIndex = starLabels.findIndex(
      (s) => s.toLowerCase() === sunConstellationName.toLowerCase()
    )
    if (targetIndex >= 0) {
      const offset = (targetIndex - sunSliceIndex) % starSlices
      rotatedStarLabels = rotateArray(starLabels, offset)
    }
  }

  const getStarAlignedNameViaRing = (elonMaybe: number | undefined): string => {
    if (!isFiniteNumber(elonMaybe)) return "N/A"
    const idx = Math.floor((elonMaybe as number) / starStep) % starSlices
    return rotatedStarLabels[idx] ?? "N/A"
  }

  const starAlignedSunName = getStarAlignedNameViaRing(eclipticLongitudeSun)
  const starAlignedMoonName = getStarAlignedNameViaRing(eclipticLongitudeMoon)
  const starAlignedAscName = getStarAlignedNameViaRing(eclipticLongitudeAscendant)

  // drawing ring rotation for labels, only when in starAligned mode
  let rotatedDrawLabels = drawLabels
  if (signMode === "starAligned" && hasSun && sunConstellationName) {
    const sunSliceIndex = Math.floor((eclipticLongitudeSun as number) / drawStep) % drawSlices
    const targetIndex = drawLabels.findIndex(
      (s) => s.toLowerCase() === sunConstellationName.toLowerCase()
    )
    if (targetIndex >= 0) {
      const offset = (targetIndex - sunSliceIndex) % drawSlices
      rotatedDrawLabels = rotateArray(drawLabels, offset)
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

        {rotatedDrawLabels.map((label, idx) => {
          const angle = ((-idx * drawStep) * Math.PI) / 180
          const x0 = center + radius * Math.cos(angle)
          const y0 = center + radius * Math.sin(angle)
          const mid = angle - ((drawStep / 2) * Math.PI) / 180
          const lx = center + (radius - 36) * Math.cos(mid)
          const ly = center + (radius - 36) * Math.sin(mid)
          const highlight =
            signMode === "starAligned" &&
            hasSun &&
            label.toLowerCase() === starAlignedSunName.toLowerCase()
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

        {/* draw body lines only when available */}
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
