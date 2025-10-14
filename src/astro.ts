// src/astro.ts
// Compute Sun and Moon tropical longitudes, IAU constellations, and the Ascendant
// Star-aligned basis uses IAU constellations in J2000 astrometric frame
// Sun.constellationNYT is at 12:00 UTC in the current year on the same month/day
// Ascendant constellation is taken at the Ascendant ecliptic longitude projected to J2000 RA/Dec
// Never end code comments with periods

import * as Astronomy from "astronomy-engine"
import { z } from "zod"

export type SunSnapshot = {
  tropical: {
    eclipticLongitude: number
    sign: string
    signIndex: number
  }
  // constellation at exact birth datetime
  constellation: {
    name: string
    abbreviation: string
    ra: number
    dec: number
  }
  // NYT basis: constellation at 12:00 UTC in the current year for same month/day
  constellationNYT: {
    name: string
    abbreviation: string
    ra: number
    dec: number
    when: Date
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
  constellation: {
    name: string
    abbreviation: string
    raHours: number
    decDeg: number
  }
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

// zero-parallax observer to mimic geocenter in this API
const GEOCENTER = new Astronomy.Observer(0, 0, 0)

export function computeSunSnapshot(args: {
  birthDateTime: Date
  latitude: number
  longitude: number
}): SunSnapshot {
  const { birthDateTime } = InputSchema.parse(args)
  const time = new Astronomy.AstroTime(birthDateTime)

  // Sun tropical ecliptic longitude of date
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, time, true)
  const sunEcl = Astronomy.Ecliptic(sunGeo)
  const sunElon = normalizeDegrees(sunEcl.elon)
  const sunSignIndex = Math.floor(sunElon / 30) % 12
  const sunSign = SIGN_LABELS[sunSignIndex]

  // Constellation at birth datetime in J2000 astrometric
  const equJ2000 = Astronomy.Equator(
    Astronomy.Body.Sun,
    time,
    GEOCENTER,
    false, // J2000
    false  // astrometric
  )
  const c = Astronomy.Constellation(equJ2000.ra, equJ2000.dec)

  // NYT method: same month/day, current year, 12:00 UTC
  const month = birthDateTime.getMonth() // 0-based
  const day = birthDateTime.getDate()
  const now = new Date()
  const nytWhen = new Date(Date.UTC(now.getFullYear(), month, day, 12, 0, 0))
  const timeNYT = new Astronomy.AstroTime(nytWhen)
  const equJ2000NYT = Astronomy.Equator(
    Astronomy.Body.Sun,
    timeNYT,
    GEOCENTER,
    false,
    false
  )
  const cNYT = Astronomy.Constellation(equJ2000NYT.ra, equJ2000NYT.dec)

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
    constellationNYT: {
      name: cNYT.name,
      abbreviation: cNYT.symbol,
      ra: equJ2000NYT.ra,
      dec: equJ2000NYT.dec,
      when: nytWhen,
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

  // Sun snapshots
  const sun = computeSunSnapshot({ birthDateTime, latitude, longitude })

  // Moon tropical ecliptic longitude of date
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
  const moonEcl = Astronomy.Ecliptic(moonGeo)
  const moonElon = normalizeDegrees(moonEcl.elon)
  const moonSignIndex = Math.floor(moonElon / 30) % 12
  const moonSign = SIGN_LABELS[moonSignIndex]

  // Moon constellation in J2000 astrometric
  const moonEquJ2000 = Astronomy.Equator(
    Astronomy.Body.Moon,
    time,
    GEOCENTER,
    false,
    false
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

  // Ascendant via local sidereal time, latitude, obliquity
  const gastHours = Astronomy.SiderealTime(time)
  const lstHours = gastHours + longitude / 15
  const thetaDeg = normalizeDegrees(lstHours * 15)
  const theta = deg2rad(thetaDeg)
  const phi = deg2rad(latitude)
  const eps = deg2rad(23.4392911)

  const y = -Math.cos(theta)
  const x = Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)
  let lambdaAsc = rad2deg(Math.atan2(y, x))
  lambdaAsc = normalizeDegrees(lambdaAsc)
  lambdaAsc = lambdaAsc < 180 ? lambdaAsc + 180 : lambdaAsc - 180

  const ascSignIndex = Math.floor(lambdaAsc / 30) % 12
  const ascSign = SIGN_LABELS[ascSignIndex]

  // Ascendant constellation: project the ecliptic point (beta=0) at lambdaAsc to J2000 RA/Dec
  const ascEq = eclipticLongitudeToEquatorialJ2000(lambdaAsc, 23.4392911)
  const ac = Astronomy.Constellation(ascEq.raHours, ascEq.decDeg)

  const ascendant: AscendantSnapshot = {
    eclipticLongitude: lambdaAsc,
    sign: ascSign,
    signIndex: ascSignIndex,
    constellation: {
      name: ac.name,
      abbreviation: ac.symbol,
      raHours: ascEq.raHours,
      decDeg: ascEq.decDeg,
    },
  }

  return { sun, moon, ascendant }
}

function eclipticLongitudeToEquatorialJ2000(lambdaDeg: number, obliquityDeg: number) {
  // for ecliptic latitude beta=0
  const λ = deg2rad(lambdaDeg)
  const ε = deg2rad(obliquityDeg)
  const sinλ = Math.sin(λ)
  const cosλ = Math.cos(λ)
  const sinε = Math.sin(ε)
  const cosε = Math.cos(ε)

  const y = sinλ * cosε
  const x = cosλ
  let alpha = Math.atan2(y, x) // radians
  if (alpha < 0) alpha += 2 * Math.PI
  const delta = Math.asin(sinε * sinλ)
  const raHours = (alpha * 12) / Math.PI
  const decDeg = rad2deg(delta)
  return { raHours, decDeg }
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
