// src/App.tsx
// App wiring the birth form, mode controls, and animated chart
// Chart is always shown; lines render only when inputs are valid
// Never end code comments with periods

import React, { useEffect, useMemo, useState } from "react"
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
      latitude: "",
      longitude: "",
    }
  })

  // default to star-aligned
  const [signMode, setSignMode] = useState<SignMode>("starAligned")

  const [snapshot, setSnapshot] = useState<ChartSnapshot | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isComputing, setIsComputing] = useState(false)

  // require non-empty latitude/longitude strings before parsing so Number("") never becomes 0
  const canCompute = useMemo(() => {
    if (formState.isoDate.length !== 10 || formState.time.length < 4) return false
    if (formState.latitude.trim() === "" || formState.longitude.trim() === "") return false
    const lat = Number(formState.latitude)
    const lon = Number(formState.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false
    return true
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

  // always render the chart container; feed undefineds until snapshot is ready
  const sunElon = snapshot?.sun.tropical.eclipticLongitude
  const moonElon = snapshot?.moon.tropical.eclipticLongitude
  const ascElon = snapshot?.ascendant.eclipticLongitude

  const sunTropicalName = snapshot?.sun.tropical.sign
  const moonTropicalName = snapshot?.moon.tropical.sign
  const ascTropicalName = snapshot?.ascendant.sign

  // rotation inputs must depend only on date/time, not location, but our sun elon is geocentric so safe
  const sunElonForRotation = sunElon
  const sunStarAlignedNameForRotation = snapshot?.sun?.constellationNYT?.name

  return (
    <main style={{ display: "grid", gap: 24 }}>
      <h1 style={{ margin: 0 }}>Your birth chart, minimally and accurately</h1>
      <p style={{ marginTop: -12 }}>
        Enter birth date, exact time, and location to see Sun, Moon, and Ascendant for star-aligned and tropical interpretations
      </p>

      <ModeControls signMode={signMode} setSignMode={setSignMode} />

      <BirthForm value={formState} onChange={setFormState} />

      {errorText && (
        <div style={{ color: "#ff6b6b" }}>{errorText}</div>
      )}

      <BirthChart
        eclipticLongitudeSun={sunElon}
        eclipticLongitudeMoon={moonElon}
        eclipticLongitudeAscendant={ascElon}
        sunEclipticLongitudeForRotation={sunElonForRotation}
        sunStarAlignedNameForRotation={sunStarAlignedNameForRotation}
        sunTropicalName={sunTropicalName}
        moonTropicalName={moonTropicalName}
        ascendantTropicalName={ascTropicalName}
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

// persistent tooltip that stays open while moving to the NYT link
function InfoTooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const closeTimerRef = React.useRef<number | null>(null)
  const tooltipId = "info-tooltip"

  const openNow = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
  }

  const scheduleClose = (delayMs: number = 160) => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, delayMs)
  }

  const cancelClose = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={openNow}
      onMouseLeave={() => scheduleClose()}
    >
      <button
        type="button"
        aria-label="About star-aligned vs tropical"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tooltipId}
        onMouseEnter={openNow}
        onMouseLeave={() => scheduleClose()}
        onFocus={openNow}
        onBlur={() => scheduleClose()}
        onClick={() => (open ? setOpen(false) : setOpen(true))}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: "help",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" role="img" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="none" stroke="#aaa" />
          <circle cx="12" cy="7.2" r="1.2" fill="#aaa" />
          <rect x="11.1" y="10" width="1.8" height="8" fill="#aaa" rx="0.9" />
        </svg>
      </button>

      {open && (
        <div
          id={tooltipId}
          role="dialog"
          onMouseEnter={() => {
            cancelClose()
            openNow()
          }}
          onMouseLeave={() => scheduleClose()}
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1a1a1a",
            color: "#eee",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "10px 12px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
            width: 360,
            pointerEvents: "auto",
          }}
        >
          {children}
        </div>
      )}
    </span>
  )
}

// radios plus tooltip
function ModeControls({
  signMode,
  setSignMode,
}: {
  signMode: "starAligned" | "tropical"
  setSignMode: (m: "starAligned" | "tropical") => void
}) {
  return (
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

      <InfoTooltip>
        <div style={{ maxWidth: 360, lineHeight: 1.35 }}>
          <strong>Star-aligned</strong> uses the constellation behind the Sun at 12:00 UTC in the current year on your month and day, which can include Ophiuchus
          <br />
          <strong>Tropical</strong> divides the ecliptic into 12 equal 30° segments starting at the March equinox, aligning signs with seasons rather than today’s star positions
          <br />
          Learn more in{" "}
          <a
            href="https://www.nytimes.com/interactive/2025/upshot/zodiac-signs.html?unlocked_article_code=1.s08._-aw.qhOetUaj0-q8&smid=url-share"
            target="_blank"
            rel="noreferrer"
          >
            this New York Times explainer
          </a>
        </div>
      </InfoTooltip>
    </div>
  )
}
