// src/App.tsx
// Renders form and chart, with no geolocation button
// Never end code comments with periods

import { useEffect, useMemo, useState } from "react"
import { BirthChart } from "./components/BirthChart"
import { BirthForm } from "./components/BirthForm"
import { computeChartSnapshot, type ChartSnapshot } from "./astro"
import "./App.css"

type FormState = {
  isoDate: string
  time: string
  latitude: string
  longitude: string
}

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
      latitude: "",
      longitude: "",
    }
  })

  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isComputing, setIsComputing] = useState(false)

  const canCompute = useMemo(() => {
    return (
      formState.isoDate.length === 10 &&
      formState.time.length >= 4 &&
      formState.latitude.trim() !== "" &&
      formState.longitude.trim() !== ""
    )
  }, [formState])

  useEffect(() => {
    if (!canCompute) {
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

      const latitude = Number(formState.latitude)
      const longitude = Number(formState.longitude)
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Latitude and longitude must be numbers")
      }
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error("Latitude must be between -90 and 90, longitude between -180 and 180")
      }

      const chart = computeChartSnapshot({
        birthDateTime,
        latitude,
        longitude,
      })
      setSnapshot(chart)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Unexpected error"
      setErrorText(message)
      setSnapshot(null)
    } finally {
      setIsComputing(false)
    }
  }, [canCompute, formState])

  const showChart =
    snapshot &&
    Number.isFinite(snapshot.sun.tropical.eclipticLongitude) &&
    Number.isFinite(snapshot.moon.tropical.eclipticLongitude) &&
    Number.isFinite(snapshot.ascendant.eclipticLongitude)

  return (
    <main style={{ display: "grid", gap: 24 }}>
      <h1 style={{ margin: 0 }}>Your birth chart, minimally and accurately</h1>
      <p style={{ marginTop: -12 }}>
        Enter birth date, exact time, and location to see Sun, Moon, and Ascendant in a clean tropical wheel
      </p>

      <BirthForm value={formState} onChange={setFormState} />

      {errorText && <div style={{ color: "#ff6b6b" }}>{errorText}</div>}

      {showChart && (
        <BirthChart
          eclipticLongitudeSun={snapshot!.sun.tropical.eclipticLongitude}
          eclipticLongitudeMoon={snapshot!.moon.tropical.eclipticLongitude}
          eclipticLongitudeAscendant={snapshot!.ascendant.eclipticLongitude}
          tropicalSignSun={snapshot!.sun.tropical.sign}
          tropicalSignMoon={snapshot!.moon.tropical.sign}
          tropicalSignAscendant={snapshot!.ascendant.sign}
          isComputing={isComputing}
        />
      )}
    </main>
  )
}

export default App

function parseLocalDateTime(isoDate: string, time: string): Date {
  const cleanTime = time.trim()
  const parts = cleanTime.split(":")
  let hh = "00"
  let mm = "00"
  let ss = "00"
  if (parts.length >= 2) {
    ;[hh, mm] = parts
  }
  if (parts.length >= 3) {
    ;[, , ss] = parts
  }
  const [yStr, mStr, dStr] = isoDate.split("-")
  const y = Number(yStr)
  const mZeroBased = Number(mStr) - 1
  const d = Number(dStr)
  const H = Number(hh)
  const M = Number(mm)
  const S = Number(ss)
  return new Date(y, mZeroBased, d, H, M, S)
}
