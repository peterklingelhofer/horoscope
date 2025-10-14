// src/App.tsx
// Decouple label rotation from lat/lon by computing date-time based rotation inputs
// Never end code comments with periods

import React, { useEffect, useMemo, useState } from "react"
import { BirthChart } from "./components/BirthChart"
import { BirthForm } from "./components/BirthForm"
import { computeChartSnapshot, type ChartSnapshot } from "./astro"
import * as Astronomy from "astronomy-engine"
import "./App.css"

type FormState = {
  isoDate: string
  time: string
  latitude: string | null
  longitude: string | null
}

export type SignMode = "starAligned" | "tropical"

function App() {
  const [formState, setFormState] = useState<FormState>(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const hh = String(now.getHours()).padStart(2, "0")
    const mi = String(now.getMinutes()).padStart(2, "0")
    return {
      isoDate: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${mi}`,
      latitude: null,
      longitude: null,
    }
  })

  const [signMode, setSignMode] = useState<SignMode>("starAligned")
  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isComputing, setIsComputing] = useState(false)

  const inputsValid = useMemo(() => {
    if (!(formState.isoDate.length === 10 && formState.time.length >= 4)) return false
    if (formState.latitude === null || formState.longitude === null) return false
    const latitude = Number(formState.latitude)
    const longitude = Number(formState.longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false
    return true
  }, [formState])

  // compute provisional rotation inputs from date/time only so labels do not jump when lat/lon becomes valid
  const { sunEclipticLongitudeForRotation, sunStarAlignedNameForRotation } = useMemo(() => {
    const result = { sunEclipticLongitudeForRotation: undefined as number | undefined, sunStarAlignedNameForRotation: undefined as string | undefined }
    // need a valid date and time to compute stable rotation
    if (!(formState.isoDate.length === 10 && formState.time.length >= 4)) return result

    const birthDateTime = parseLocalDateTime(formState.isoDate, formState.time)
    if (Number.isNaN(birthDateTime.getTime())) return result

    // geocentric Sun ecliptic longitude for birth time
    const t = new Astronomy.AstroTime(birthDateTime)
    const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, t, true)
    const ecl = Astronomy.Ecliptic(sunGeo)
    result.sunEclipticLongitudeForRotation = normalizeDegrees(ecl.elon)

    // star-aligned anchor name for Sun: same month/day, current year, 12:00 UTC
    const month = birthDateTime.getMonth()
    const day = birthDateTime.getDate()
    const when = new Date(Date.UTC(new Date().getFullYear(), month, day, 12, 0, 0))
    const tAnchor = new Astronomy.AstroTime(when)
    const equJ2000 = Astronomy.Equator(Astronomy.Body.Sun, tAnchor, new Astronomy.Observer(0, 0, 0), false, false)
    const c = Astronomy.Constellation(equJ2000.ra, equJ2000.dec)
    result.sunStarAlignedNameForRotation = c.name
    return result
  }, [formState.isoDate, formState.time])

  useEffect(() => {
    if (!inputsValid) {
      setSnapshot(null)
      return
    }
    setIsComputing(true)
    setErrorText(null)
    try {
      const birthDateTime = parseLocalDateTime(formState.isoDate, formState.time)
      if (Number.isNaN(birthDateTime.getTime())) {
        throw new Error("Please enter a valid date and time")
      }
      const latitude = Number(formState.latitude!)
      const longitude = Number(formState.longitude!)
      const chart = computeChartSnapshot({ birthDateTime, latitude, longitude })
      setSnapshot(chart)
    } catch (err) {
      const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error"
      setErrorText(message)
      setSnapshot(null)
    } finally {
      setIsComputing(false)
    }
  }, [inputsValid, formState])

  return (
    <main style={{ display: "grid", gap: 24 }}>
      <h1 style={{ margin: 0 }}>Your birth chart, minimally and accurately</h1>
      <p style={{ marginTop: -12 }}>
        Enter birth date, exact time, and location to see Sun, Moon, and Ascendant for star-aligned and tropical interpretations
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          <input
            type="radio"
            name="signMode"
            value="starAligned"
            checked={signMode === "starAligned"}
            onChange={() => setSignMode("starAligned")}
          />
          <span style={{ marginLeft: 6 }}>Star-aligned</span>
        </label>

        <label>
          <input
            type="radio"
            name="signMode"
            value="tropical"
            checked={signMode === "tropical"}
            onChange={() => setSignMode("tropical")}
          />
          <span style={{ marginLeft: 6 }}>Tropical</span>
        </label>
      </div>

      <BirthForm value={formState} onChange={setFormState} />

      {errorText && <div style={{ color: "#ff6b6b" }}>{errorText}</div>}

      {/* chart is always rendered; label rotation uses date/time only, never lat/lon */}
      <BirthChart
        // lines only appear when snapshot exists
        eclipticLongitudeSun={snapshot?.sun.tropical.eclipticLongitude}
        eclipticLongitudeMoon={snapshot?.moon.tropical.eclipticLongitude}
        eclipticLongitudeAscendant={snapshot?.ascendant.eclipticLongitude}
        // stable rotation inputs driven only by date/time
        sunEclipticLongitudeForRotation={sunEclipticLongitudeForRotation}
        sunStarAlignedNameForRotation={sunStarAlignedNameForRotation}
        // legend tropical names when available
        sunTropicalName={snapshot?.sun.tropical.sign}
        moonTropicalName={snapshot?.moon.tropical.sign}
        ascendantTropicalName={snapshot?.ascendant.sign}
        signMode={signMode}
        isComputing={isComputing}
      />
    </main>
  )
}

export default App

function parseLocalDateTime(isoDate: string, time: string): Date {
  const cleanTime = time.trim()
  const parts = cleanTime.split(":")
  let hour = "00"
  let minute = "00"
  let second = "00"
  if (parts.length >= 2) {
    ;[hour, minute] = parts
  }
  if (parts.length >= 3) {
    ;[, , second] = parts
  }
  const [y, m, d] = isoDate.split("-")
  return new Date(Number(y), Number(m) - 1, Number(d), Number(hour), Number(minute), Number(second))
}

function normalizeDegrees(value: number): number {
  const m = value % 360
  return m < 0 ? m + 360 : m
}
