// src/App.tsx
// DRY cleanup: no NYT names, only starAligned/tropical; lat/lon start as null to avoid Number("") → 0
// Always render chart; hide body lines until inputs are valid; legend shows N/A until ready
// Never end code comments with periods

import React, { useEffect, useMemo, useState } from "react"
import { BirthChart } from "./components/BirthChart"
import { BirthForm } from "./components/BirthForm"
import { computeChartSnapshot, type ChartSnapshot } from "./astro"
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
      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Unexpected error"
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

        <InfoTooltip>
          <div style={{ maxWidth: 360, lineHeight: 1.35 }}>
            <strong>Star-aligned</strong> uses the constellation behind the Sun at 12:00 UTC in the current year on your month and day, and constellations for Moon and Ascendant at your birth moment
            <br />
            <strong>Tropical</strong> divides the ecliptic into 12 equal 30° segments starting at the March equinox, aligning signs with seasons rather than today’s star positions
            <br />
            Learn more in{" "}
            <a
              href="https://www.nytimes.com/interactive/2025/upshot/zodiac-signs.html?unlocked_article_code=1.s08._-aw.qhOetUaj0-q8&smid=url-share"
              target="_blank"
              rel="noreferrer"
            >
              this explainer
            </a>
          </div>
        </InfoTooltip>
      </div>

      <BirthForm value={formState} onChange={setFormState} />

      {errorText && <div style={{ color: "#ff6b6b" }}>{errorText}</div>}

      {/* chart is always rendered for stable layout */}
      <BirthChart
        eclipticLongitudeSun={snapshot?.sun.tropical.eclipticLongitude}
        eclipticLongitudeMoon={snapshot?.moon.tropical.eclipticLongitude}
        eclipticLongitudeAscendant={snapshot?.ascendant.eclipticLongitude}
        // star-aligned anchor for naming the ring
        sunConstellationName={snapshot?.sun.starAlignedAnchor.name}
        // tropical names for legend
        sunTropicalName={snapshot?.sun.tropical.sign}
        moonTropicalName={snapshot?.moon.tropical.sign}
        ascendantTropicalName={snapshot?.ascendant.sign}
        // toggle selection for rotating draw ring only
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
  const [yearText, monthText, dayText] = isoDate.split("-")
  const year = Number(yearText)
  const monthZeroBased = Number(monthText) - 1
  const day = Number(dayText)
  const hourNumber = Number(hour)
  const minuteNumber = Number(minute)
  const secondNumber = Number(second)
  return new Date(year, monthZeroBased, day, hourNumber, minuteNumber, secondNumber)
}

// tooltip with hover gap fix
function InfoTooltip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
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
