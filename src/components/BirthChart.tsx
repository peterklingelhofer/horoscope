// src/components/BirthChart.tsx
// SVG zodiac wheel with Sun, Moon, and Ascendant markers and clear labels
// Defensive against undefined props so the UI never crashes
// Never end code comments with periods

type Props = {
  eclipticLongitudeSun: number | undefined
  eclipticLongitudeMoon: number | undefined
  eclipticLongitudeAscendant: number | undefined
  tropicalSignSun: string | undefined
  tropicalSignMoon: string | undefined
  tropicalSignAscendant: string | undefined
  isComputing: boolean
}

const SIGNS = [
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
] as const

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function safeNumber(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback
}

function safeFixed(value: unknown, digits: number): string {
  return isFiniteNumber(value) ? value.toFixed(digits) : "—"
}

export function BirthChart({
  eclipticLongitudeSun,
  eclipticLongitudeMoon,
  eclipticLongitudeAscendant,
  tropicalSignSun,
  tropicalSignMoon,
  tropicalSignAscendant,
  isComputing,
}: Props) {
  const size = 460
  const radius = 190
  const center = size / 2

  const toPoint = (elonMaybe: unknown, offset = 0) => {
    const elon = safeNumber(elonMaybe, 0)
    const angle = 360 - elon
    const r = radius + offset
    const x = center + r * Math.cos((angle * Math.PI) / 180)
    const y = center + r * Math.sin((angle * Math.PI) / 180)
    return { x, y, angle }
  }

  const sun = toPoint(eclipticLongitudeSun)
  const moon = toPoint(eclipticLongitudeMoon)
  const asc = toPoint(eclipticLongitudeAscendant)

  const labelAt = (angleDeg: number, pad = 20) => {
    const x = center + (radius + pad) * Math.cos((angleDeg * Math.PI) / 180)
    const y = center + (radius + pad) * Math.sin((angleDeg * Math.PI) / 180)
    return { x, y }
  }

  const labelPosAsc = labelAt(360 - safeNumber(eclipticLongitudeAscendant, 0))
  const labelPosSun = labelAt(360 - safeNumber(eclipticLongitudeSun, 0))
  const labelPosMoon = labelAt(360 - safeNumber(eclipticLongitudeMoon, 0))

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
        <circle cx={center} cy={center} r={radius + 16} fill="none" stroke="#555" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#777" />

        {SIGNS.map((label, idx) => {
          const a0 = ((-idx * 30) * Math.PI) / 180
          const x0 = center + radius * Math.cos(a0)
          const y0 = center + radius * Math.sin(a0)
          const mid = a0 - (15 * Math.PI) / 180
          const lx = center + (radius - 36) * Math.cos(mid)
          const ly = center + (radius - 36) * Math.sin(mid)
          return (
            <g key={label}>
              <line x1={center} y1={center} x2={x0} y2={y0} stroke="#666" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fill="#bbb"
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Ascendant marker and label */}
        <line x1={center} y1={center} x2={asc.x} y2={asc.y} stroke="#8be9fd" strokeWidth={2} />
        <circle cx={asc.x} cy={asc.y} r={6} fill="#8be9fd" />
        <text
          x={labelPosAsc.x}
          y={labelPosAsc.y}
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#8be9fd"
        >
          Ascendant
        </text>

        {/* Sun marker and label */}
        <line x1={center} y1={center} x2={sun.x} y2={sun.y} stroke="#f0c419" strokeWidth={2} />
        <circle cx={sun.x} cy={sun.y} r={6} fill="#f0c419" />
        <text
          x={labelPosSun.x}
          y={labelPosSun.y}
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f0c419"
        >
          Sun
        </text>

        {/* Moon marker and label */}
        <line x1={center} y1={center} x2={moon.x} y2={moon.y} stroke="#e6e6e6" strokeWidth={2} />
        <circle cx={moon.x} cy={moon.y} r={6} fill="#e6e6e6" />
        <text
          x={labelPosMoon.x}
          y={labelPosMoon.y}
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e6e6e6"
        >
          Moon
        </text>
      </svg>

      <figcaption style={{ fontSize: 14, opacity: 0.9, textAlign: "center" }}>
        Sun {tropicalSignSun ?? "—"} • Moon {tropicalSignMoon ?? "—"} • Ascendant {tropicalSignAscendant ?? "—"}
        {isComputing ? " • recalculating…" : ""}
      </figcaption>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
