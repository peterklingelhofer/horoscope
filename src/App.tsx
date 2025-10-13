// src/App.tsx
import { useEffect, useMemo, useState } from "react"
import { BirthChart } from "./components/BirthChart"
import { BirthForm } from "./components/BirthForm"
import { computeSunSnapshot, type SunSnapshot } from "./astro"
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

  const [sunSnapshot, setSunSnapshot] = useState<SunSnapshot | null>(null)
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
    if (!canCompute) return
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

      const snapshot = computeSunSnapshot({
        birthDateTime,
        latitude,
        longitude,
      })
      setSunSnapshot(snapshot)
    } catch (err) {
      // Normalize any thrown value to a readable message
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Unexpected error"
      setErrorText(message)
      setSunSnapshot(null)
    } finally {
      setIsComputing(false)
    }
  }, [canCompute, formState])

  return (
    <main style={{ display: "grid", gap: 24 }}>
      <h1 style={{ margin: 0 }}>Your birth chart, minimally and accurately</h1>
      <p style={{ marginTop: -12 }}>
        Enter birth date, exact time, and location to compare the tropical sign vs the constellation actually behind the Sun at that moment
      </p>

      <BirthForm
        value={formState}
        onChange={setFormState}
        onUseGeolocation={(coords) => {
          setFormState((prev) => ({
            ...prev,
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
          }))
        }}
      />

      {errorText && <div style={{ color: "#ff6b6b" }}>{errorText}</div>}

      {sunSnapshot && (
        <div style={{ display: "grid", gap: 16 }}>
          <section
            style={{
              display: "grid",
              gap: 8,
              justifyItems: "center",
              textAlign: "center",
            }}
          >
            <strong>
              Tropical Sun sign: {sunSnapshot.tropical.sign} • Astronomical constellation: {sunSnapshot.constellation.name}
            </strong>
            <div style={{ fontSize: 14, opacity: 0.85 }}>
              Ecliptic longitude {sunSnapshot.tropical.eclipticLongitude.toFixed(2)}°
              {" "}• solar RA {sunSnapshot.constellation.ra.toFixed(3)}h • Dec {sunSnapshot.constellation.dec.toFixed(2)}°
            </div>
          </section>

          <BirthChart
            eclipticLongitude={sunSnapshot.tropical.eclipticLongitude}
            tropicalSign={sunSnapshot.tropical.sign}
            constellationName={sunSnapshot.constellation.name}
            isComputing={isComputing}
          />
        </div>
      )}
    </main>
  )
}

export default App

function parseLocalDateTime(isoDate: string, time: string): Date {
  // Accept HH:mm or HH:mm:ss (and defensively trim)
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

  // Build a local-time Date, not UTC, to match typical birth times
  // Using numeric args avoids inconsistent parsing across browsers
  const [yStr, mStr, dStr] = isoDate.split("-")
  const y = Number(yStr)
  const mZeroBased = Number(mStr) - 1
  const d = Number(dStr)
  const H = Number(hh)
  const M = Number(mm)
  const S = Number(ss)

  return new Date(y, mZeroBased, d, H, M, S)
}
