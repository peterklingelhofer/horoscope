// src/astro.ts
// Compute Sun and Moon tropical longitudes, IAU constellations, and the Ascendant (rising)
// Uses Astronomy Engine for precise ephemerides and sidereal time
// Ascendant formula per Wikipedia and Meeus, using local sidereal time, latitude, and obliquity
// Never end code comments with periods

import * as Astronomy from "astronomy-engine"
import { z } from "zod"

export type SunSnapshot = {
  tropical: {
    eclipticLongitude: number
    sign: string
    signIndex: number
  }
  constellation: {
    name: string
    abbreviation: string
    ra: number
    dec: number
  }
}

export type MoonSnapshot = {
  tropical: {
    eclipticLongitude: number
    sign: string
    signIndex: number
  }
  constellation: {
    name: string
    abbreviation: string
  }
}

export type AscendantSnapshot = {
  eclipticLongitude: number
  sign: string
  signIndex: number
}

export type ChartSnapshot = {
  sun: SunSnapshot
  moon: MoonSnapshot
  ascendant: AscendantSnapshot
}

const InputSchema = z.object({
  birthDateTime: z.date(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

const SIGN_LABELS: readonly string[] = [
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

export function computeSunSnapshot(args: {
  birthDateTime: Date
  latitude: number
  longitude: number
}): SunSnapshot {
  const { birthDateTime, latitude, longitude } = InputSchema.parse(args)
  const time = new Astronomy.AstroTime(birthDateTime)

  // Sun tropical ecliptic longitude of date
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, time, true)
  const sunEcl = Astronomy.Ecliptic(sunGeo)
  const sunElon = normalizeDegrees(sunEcl.elon)
  const sunSignIndex = Math.floor(sunElon / 30) % 12
  const sunSign = SIGN_LABELS[sunSignIndex]

  // Sun constellation via J2000 apparent RA/Dec
  const observer = new Astronomy.Observer(latitude, longitude, 0)
  const equJ2000 = Astronomy.Equator(
    Astronomy.Body.Sun,
    time,
    observer,
    false,
    true
  )
  const c = Astronomy.Constellation(equJ2000.ra, equJ2000.dec)

  return {
    tropical: {
      eclipticLongitude: sunElon,
      sign: sunSign,
      signIndex: sunSignIndex,
    },
    constellation: {
      name: c.name,
      abbreviation: c.symbol,
      ra: equJ2000.ra,
      dec: equJ2000.dec,
    },
  }
}

export function computeChartSnapshot(args: {
  birthDateTime: Date
  latitude: number
  longitude: number
}): ChartSnapshot {
  const { birthDateTime, latitude, longitude } = InputSchema.parse(args)
  const time = new Astronomy.AstroTime(birthDateTime)

  // Sun
  const sun = computeSunSnapshot({ birthDateTime, latitude, longitude })

  // Moon tropical ecliptic longitude of date
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
  const moonEcl = Astronomy.Ecliptic(moonGeo)
  const moonElon = normalizeDegrees(moonEcl.elon)
  const moonSignIndex = Math.floor(moonElon / 30) % 12
  const moonSign = SIGN_LABELS[moonSignIndex]

  // Moon constellation by J2000 RA/Dec
  const observer = new Astronomy.Observer(latitude, longitude, 0)
  const moonEquJ2000 = Astronomy.Equator(
    Astronomy.Body.Moon,
    time,
    observer,
    false,
    true
  )
  const mc = Astronomy.Constellation(moonEquJ2000.ra, moonEquJ2000.dec)

  const moon: MoonSnapshot = {
    tropical: {
      eclipticLongitude: moonElon,
      sign: moonSign,
      signIndex: moonSignIndex,
    },
    constellation: {
      name: mc.name,
      abbreviation: mc.symbol,
    },
  }

  // Ascendant using local sidereal time θL, latitude φ, obliquity ε
  // λAsc = atan2( -cos θL, sin θL cos ε + tan φ sin ε ) in degrees
  // Then pick the easterly intersection per the final rule
  const gastHours = Astronomy.SiderealTime(time) // Greenwich Apparent Sidereal Time hours
  const lstHours = gastHours + longitude / 15 // east longitudes positive
  const thetaDeg = normalizeDegrees(lstHours * 15)
  const theta = deg2rad(thetaDeg)
  const phi = deg2rad(latitude)
  const eps = deg2rad(23.4392911) // J2000 obliquity for stable results

  const y = -Math.cos(theta)
  const x = Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)
  let lambdaAsc = rad2deg(Math.atan2(y, x))
  lambdaAsc = normalizeDegrees(lambdaAsc)
  lambdaAsc = lambdaAsc < 180 ? lambdaAsc + 180 : lambdaAsc - 180

  const ascSignIndex = Math.floor(lambdaAsc / 30) % 12
  const ascSign = SIGN_LABELS[ascSignIndex]

  const ascendant: AscendantSnapshot = {
    eclipticLongitude: lambdaAsc,
    sign: ascSign,
    signIndex: ascSignIndex,
  }

  return { sun, moon, ascendant }
}

function normalizeDegrees(value: number): number {
  const m = value % 360
  return m < 0 ? m + 360 : m
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180
}

function rad2deg(r: number): number {
  return (r * 180) / Math.PI
}
