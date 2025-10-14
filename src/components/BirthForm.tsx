// src/components/BirthForm.tsx
// Gentle validation with fixed-height error rows to prevent layout shift
// Latitude/longitude show "required" only if the user typed then cleared
// Uses soft amber highlight
// Never end code comments with periods

import { type Dispatch, type SetStateAction, useMemo, useRef, useState } from "react"

type FormValue = {
  isoDate: string
  time: string
  latitude: string | null
  longitude: string | null
}

type Props = {
  value: FormValue
  onChange: Dispatch<SetStateAction<FormValue>>
}

type FieldError = string | null

function getDateError(isoDate: string): FieldError {
  if (!isoDate || isoDate.length !== 10) return "Please select a date"
  return null
}

function getTimeError(time: string): FieldError {
  if (!time || time.length < 4) return "Please enter a time"
  const parts = time.split(":")
  if (parts.length < 2 || parts.length > 3) return "Time must be HH:mm or HH:mm:ss"
  const [h, m, s = "0"] = parts
  const hour = Number(h)
  const minute = Number(m)
  const second = Number(s)
  if (![hour, minute, second].every(Number.isFinite)) return "Time must contain numbers only"
  if (hour < 0 || hour > 23) return "Hour must be between 0 and 23"
  if (minute < 0 || minute > 59) return "Minute must be between 0 and 59"
  if (second < 0 || second > 59) return "Second must be between 0 and 59"
  return null
}

function getLatitudeError(latitude: string | null): FieldError {
  if (latitude === null || latitude.trim() === "") return "Latitude is required"
  const n = Number(latitude)
  if (!Number.isFinite(n)) return "Latitude must be a number"
  if (n < -90 || n > 90) return "Latitude must be between -90 and 90"
  return null
}

function getLongitudeError(longitude: string | null): FieldError {
  if (longitude === null || longitude.trim() === "") return "Longitude is required"
  const n = Number(longitude)
  if (!Number.isFinite(n)) return "Longitude must be a number"
  if (n < -180 || n > 180) return "Longitude must be between -180 and 180"
  return null
}

function invalidStyle(show: boolean): React.CSSProperties {
  // soft amber outline
  return show
    ? {
        borderColor: "#d9a900",
        boxShadow: "0 0 0 3px rgba(217, 169, 0, 0.22)",
      }
    : {}
}

// fixed-height error row to prevent layout shift
function ErrorRow({
  id,
  show,
  text,
}: {
  id: string
  show: boolean
  text: string | null
}) {
  return (
    <div
      id={id}
      aria-live="polite"
      // reserve vertical space even when hidden
      style={{
        minHeight: 20,
        lineHeight: "20px",
        fontSize: 12,
        color: "#b88700",
        visibility: show ? "visible" : "hidden",
        pointerEvents: show ? "auto" : "none",
      }}
    >
      {text}
    </div>
  )
}

export function BirthForm({ value, onChange }: Props) {
  // touched means user focused and left the field at least once
  const [touched, setTouched] = useState<{ [K in keyof FormValue]?: boolean }>({})
  // dirty means user typed something nonempty at least once
  const [dirty, setDirty] = useState<{ [K in keyof FormValue]?: boolean }>({})

  // track whether these fields were ever nonempty to enable required message after clearing
  const lastNonEmptyRef = useRef<{ latitude: boolean; longitude: boolean }>({
    latitude: false,
    longitude: false,
  })

  const errors = useMemo(
    () => ({
      isoDate: getDateError(value.isoDate),
      time: getTimeError(value.time),
      latitude: getLatitudeError(value.latitude),
      longitude: getLongitudeError(value.longitude),
    }),
    [value]
  )

  const showDate = !!touched.isoDate && !!errors.isoDate
  const showTime = !!touched.time && !!errors.time

  const latIsDirty = !!dirty.latitude
  const lonIsDirty = !!dirty.longitude

  const showLat =
    !!errors.latitude &&
    (latIsDirty || lastNonEmptyRef.current.latitude === true)

  const showLon =
    !!errors.longitude &&
    (lonIsDirty || lastNonEmptyRef.current.longitude === true)

  const handleBlur = (key: keyof FormValue) => {
    setTouched((prev) => ({ ...prev, [key]: true }))
  }

  const handleLatChange = (text: string) => {
    const trimmed = text.trim()
    const next: string | null = trimmed === "" ? null : text
    if (trimmed !== "") {
      setDirty((prev) => ({ ...prev, latitude: true }))
      lastNonEmptyRef.current.latitude = true
    }
    onChange((prev) => ({ ...prev, latitude: next }))
  }

  const handleLonChange = (text: string) => {
    const trimmed = text.trim()
    const next: string | null = trimmed === "" ? null : text
    if (trimmed !== "") {
      setDirty((prev) => ({ ...prev, longitude: true }))
      lastNonEmptyRef.current.longitude = true
    }
    onChange((prev) => ({ ...prev, longitude: next }))
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        alignItems: "start",
      }}
      noValidate
    >
      <label style={{ display: "grid", gap: 6 }}>
        <span>Date of birth</span>
        <input
          type="date"
          value={value.isoDate}
          onChange={(e) => onChange((prev) => ({ ...prev, isoDate: e.target.value }))}
          onBlur={() => handleBlur("isoDate")}
          aria-invalid={showDate}
          aria-describedby="error-iso-date"
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #444",
            ...invalidStyle(showDate),
          }}
          required
        />
        <ErrorRow id="error-iso-date" show={showDate} text={errors.isoDate} />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Time of birth</span>
        <input
          type="time"
          value={value.time}
          onChange={(e) => onChange((prev) => ({ ...prev, time: e.target.value }))}
          onBlur={() => handleBlur("time")}
          step={1} // accept HH:mm or HH:mm:ss
          aria-invalid={showTime}
          aria-describedby="error-time"
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #444",
            ...invalidStyle(showTime),
          }}
          required
        />
        <ErrorRow id="error-time" show={showTime} text={errors.time} />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Latitude</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 40.7128"
          value={value.latitude ?? ""} // keep input controlled
          onChange={(e) => handleLatChange(e.target.value)}
          onBlur={() => handleBlur("latitude")}
          aria-invalid={showLat}
          aria-describedby="error-latitude"
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #444",
            ...invalidStyle(showLat),
          }}
          required
        />
        <ErrorRow id="error-latitude" show={showLat} text={errors.latitude} />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Longitude</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="-74.0060"
          value={value.longitude ?? ""} // keep input controlled
          onChange={(e) => handleLonChange(e.target.value)}
          onBlur={() => handleBlur("longitude")}
          aria-invalid={showLon}
          aria-describedby="error-longitude"
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #444",
            ...invalidStyle(showLon),
          }}
          required
        />
        <ErrorRow id="error-longitude" show={showLon} text={errors.longitude} />
      </label>
    </form>
  )
}
