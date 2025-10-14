// src/astro.ts
// Computes Sun and Moon tropical longitudes, IAU constellation anchors, and the Ascendant
// Star-aligned Sun anchor: constellation at 12:00 UTC, current year, same month/day as birth date
// Star-aligned Moon and Ascendant names are derived visually by the ring in the UI, not by IAU boundaries
// Never end code comments with periods

import * as Astronomy from "astronomy-engine"
import { z } from "zod"

export type SunSnapshot = {
  tropical: {
    eclipticLongitude: number
    sign: string
    signIndex: number
  }
  // constellation at exact birth datetime in J2000 astrometric frame
  constellationAtBirth: {
    name: string
    abbreviation: string
    rightAscensionHours: number
    declinationDegrees: number
  }
  // star-aligned anchor used by the UI to align the label ring for the Sun
  starAlignedAnchor: {
    name: string
    abbreviation: string
    rightAscensionHours: number
    declinationDegrees: number
    when: Date
  }
}

export type MoonSnapshot = {
  tropical: {
    eclipticLongitude: number
    sign: string
    signIndex: number
  }
  // constellation at birth, not used for star-aligned text in the UI
  constellationAtBirth: {
    name: string
    abbreviation: string
  }
}

export type AscendantSnapshot = {
  eclipticLongitude: number
  sign: string
  signIndex: number
  // constellation name near the ascendant point projected to J2000 equatorial
  constellationProjected: {
    name: string
    abbreviation: string
    rightAscensionHours: number
    declinationDegrees: number
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

const TROPICAL_SIGN_LABELS: readonly string[] = [
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

// observer at geocenter
const geocenterObserver = new Astronomy.Observer(0, 0, 0)

export function computeSunSnapshot(args: {
  birthDateTime: Date
  latitude: number
  longitude: number
}): SunSnapshot {
  const { birthDateTime } = InputSchema.parse(args)
  const time = new Astronomy.AstroTime(birthDateTime)

  // tropical ecliptic longitude
  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, time, true)
  const sunEcliptic = Astronomy.Ecliptic(sunGeo)
  const sunEclipticLongitude = normalizeDegrees(sunEcliptic.elon)
  const sunSignIndex = Math.floor(sunEclipticLongitude / 30) % 12
  const sunSign = TROPICAL_SIGN_LABELS[sunSignIndex]

  // constellation at birth in J2000 astrometric
  const equatorJ2000 = Astronomy.Equator(
    Astronomy.Body.Sun,
    time,
    geocenterObserver,
    false, // J2000
    false  // astrometric
  )
  const constellationBirth = Astronomy.Constellation(equatorJ2000.ra, equatorJ2000.dec)

  // star-aligned anchor for Sun: same month/day, current year, 12:00 UTC
  const monthZeroBased = birthDateTime.getMonth()
  const dayOfMonth = birthDateTime.getDate()
  const currentYear = new Date().getFullYear()
  const when = new Date(Date.UTC(currentYear, monthZeroBased, dayOfMonth, 12, 0, 0))
  const timeAnchor = new Astronomy.AstroTime(when)
  const equatorAnchor = Astronomy.Equator(
    Astronomy.Body.Sun,
    timeAnchor,
    geocenterObserver,
    false,
    false
  )
  const constellationAnchor = Astronomy.Constellation(equatorAnchor.ra, equatorAnchor.dec)

  return {
    tropical: {
      eclipticLongitude: sunEclipticLongitude,
      sign: sunSign,
      signIndex: sunSignIndex,
    },
    constellationAtBirth: {
      name: constellationBirth.name,
      abbreviation: constellationBirth.symbol,
      rightAscensionHours: equatorJ2000.ra,
      declinationDegrees: equatorJ2000.dec,
    },
    starAlignedAnchor: {
      name: constellationAnchor.name,
      abbreviation: constellationAnchor.symbol,
      rightAscensionHours: equatorAnchor.ra,
      declinationDegrees: equatorAnchor.dec,
      when,
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

  // Moon tropical ecliptic longitude
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
  const moonEcliptic = Astronomy.Ecliptic(moonGeo)
  const moonEclipticLongitude = normalizeDegrees(moonEcliptic.elon)
  const moonSignIndex = Math.floor(moonEclipticLongitude / 30) % 12
  const moonSign = TROPICAL_SIGN_LABELS[moonSignIndex]

  // Moon constellation at birth
  const moonEquatorJ2000 = Astronomy.Equator(Astronomy.Body.Moon, time, geocenterObserver, false, false)
  const moonConstellationBirth = Astronomy.Constellation(moonEquatorJ2000.ra, moonEquatorJ2000.dec)

  const moon: MoonSnapshot = {
    tropical: {
      eclipticLongitude: moonEclipticLongitude,
      sign: moonSign,
      signIndex: moonSignIndex,
    },
    constellationAtBirth: {
      name: moonConstellationBirth.name,
      abbreviation: moonConstellationBirth.symbol,
    },
  }

  // Ascendant via sidereal time, latitude, obliquity
  const greenwichSiderealTimeHours = Astronomy.SiderealTime(time)
  const localSiderealTimeHours = greenwichSiderealTimeHours + longitude / 15
  const localSiderealDegrees = normalizeDegrees(localSiderealTimeHours * 15)
  const localSiderealRadians = degreesToRadians(localSiderealDegrees)
  const latitudeRadians = degreesToRadians(latitude)
  const obliquityRadians = degreesToRadians(23.4392911)

  const y = -Math.cos(localSiderealRadians)
  const x =
    Math.sin(localSiderealRadians) * Math.cos(obliquityRadians) +
    Math.tan(latitudeRadians) * Math.sin(obliquityRadians)

  let ascendantLongitude = radiansToDegrees(Math.atan2(y, x))
  ascendantLongitude = normalizeDegrees(ascendantLongitude)
  ascendantLongitude = ascendantLongitude < 180 ? ascendantLongitude + 180 : ascendantLongitude - 180

  const ascendantSignIndex = Math.floor(ascendantLongitude / 30) % 12
  const ascendantSign = TROPICAL_SIGN_LABELS[ascendantSignIndex]

  // project the ascendant ecliptic point (latitude 0) to equatorial J2000 and tag constellation
  const ascendantEquatorial = eclipticLongitudeToEquatorialJ2000(ascendantLongitude, 23.4392911)
  const ascendantConstellation = Astronomy.Constellation(
    ascendantEquatorial.rightAscensionHours,
    ascendantEquatorial.declinationDegrees
  )

  const ascendant: AscendantSnapshot = {
    eclipticLongitude: ascendantLongitude,
    sign: ascendantSign,
    signIndex: ascendantSignIndex,
    constellationProjected: {
      name: ascendantConstellation.name,
      abbreviation: ascendantConstellation.symbol,
      rightAscensionHours: ascendantEquatorial.rightAscensionHours,
      declinationDegrees: ascendantEquatorial.declinationDegrees,
    },
  }

  return { sun, moon, ascendant }
}

function eclipticLongitudeToEquatorialJ2000(
  longitudeDegrees: number,
  obliquityDegrees: number
) {
  // ecliptic latitude assumed 0
  const lambda = degreesToRadians(longitudeDegrees)
  const epsilon = degreesToRadians(obliquityDegrees)
  const sineLambda = Math.sin(lambda)
  const cosineLambda = Math.cos(lambda)
  const sineEpsilon = Math.sin(epsilon)
  const cosineEpsilon = Math.cos(epsilon)

  const y = sineLambda * cosineEpsilon
  const x = cosineLambda
  let rightAscensionRadians = Math.atan2(y, x)
  if (rightAscensionRadians < 0) rightAscensionRadians += 2 * Math.PI
  const declinationRadians = Math.asin(sineEpsilon * sineLambda)

  const rightAscensionHours = (rightAscensionRadians * 12) / Math.PI
  const declinationDegrees = radiansToDegrees(declinationRadians)
  return { rightAscensionHours, declinationDegrees }
}

function normalizeDegrees(value: number): number {
  const m = value % 360
  return m < 0 ? m + 360 : m
}

function degreesToRadians(d: number): number {
  return (d * Math.PI) / 180
}

function radiansToDegrees(r: number): number {
  return (r * 180) / Math.PI
}
