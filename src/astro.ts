// src/astro.ts
// Compute the Sun's true ecliptic longitude for tropical zodiac,
// and classify the IAU constellation behind the Sun at the birth moment
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

  // time of birth in the engine’s time model
  const time = new Astronomy.AstroTime(birthDateTime)

  // geocentric apparent vector of the Sun, then convert to true ecliptic of date
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, time, true)
  const sunEcl = Astronomy.Ecliptic(sunGeo)
  const elon = normalizeDegrees(sunEcl.elon)

  const signIndex = Math.floor(elon / 30) % 12
  const sign = SIGN_LABELS[signIndex]

  // constellation classification requires J2000 RA/Dec
  // create a real observer to satisfy runtime checks
  const observer = new Astronomy.Observer(latitude, longitude, 0)

  // obtain apparent equatorial coordinates referenced to J2000
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
      eclipticLongitude: elon,
      sign,
      signIndex,
    },
    constellation: {
      name: c.name,
      abbreviation: c.symbol,
      ra: equJ2000.ra,
      dec: equJ2000.dec,
    },
  }
}

function normalizeDegrees(value: number): number {
  const m = value % 360
  return m < 0 ? m + 360 : m
}
