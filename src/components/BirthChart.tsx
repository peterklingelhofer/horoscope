// src/components/BirthChart.tsx
// Minimal, fast SVG wheel with 12 sectors and a single Sun marker
// We draw sectors once and rotate a marker according to ecliptic longitude

type Props = {
  eclipticLongitude: number
  tropicalSign: string
  constellationName: string
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

export function BirthChart({
  eclipticLongitude,
  tropicalSign,
  constellationName,
  isComputing,
}: Props) {
  const size = 420
  const radius = 180
  const center = size / 2

  const sunAngleDeg = 360 - eclipticLongitude // clockwise with 0 at right
  const sunX = center + radius * Math.cos((sunAngleDeg * Math.PI) / 180)
  const sunY = center + radius * Math.sin((sunAngleDeg * Math.PI) / 180)

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
          const a1 = ((-(idx + 1) * 30) * Math.PI) / 180
          const x0 = center + radius * Math.cos(a0)
          const y0 = center + radius * Math.sin(a0)
          const x1 = center + radius * Math.cos(a1)
          const y1 = center + radius * Math.sin(a1)
          const mid = ((a0 + a1) / 2)
          const lx = center + (radius - 36) * Math.cos(mid)
          const ly = center + (radius - 36) * Math.sin(mid)
          return (
            <g key={label}>
              <line x1={center} y1={center} x2={x0} y2={y0} stroke="#666" />
              <path d={`M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`} fill="none" stroke="transparent" />
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

        <line
          x1={center}
          y1={center}
          x2={sunX}
          y2={sunY}
          stroke="#f0c419"
          strokeWidth={2}
        />
        <circle cx={sunX} cy={sunY} r={6} fill="#f0c419" />
      </svg>

      <figcaption style={{ fontSize: 14, opacity: 0.9 }}>
        Sun at {eclipticLongitude.toFixed(2)}° • Tropical {tropicalSign} • Constellation {constellationName}
        {isComputing ? " • recalculating…" : ""}
      </figcaption>
    </figure>
  )
}
