// src/components/BirthForm.tsx
// Date, time, and native number inputs for latitude/longitude
// Never end code comments with periods

import { type Dispatch, type SetStateAction } from "react"

type FormValue = {
  isoDate: string
  time: string
  latitude: string
  longitude: string
}

type Props = {
  value: FormValue
  onChange: Dispatch<SetStateAction<FormValue>>
}

export function BirthForm({ value, onChange }: Props) {
  const fieldStyle: React.CSSProperties = { display: "grid", gap: 6 }
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box" }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        alignItems: "end",
      }}
    >
      <label style={fieldStyle}>
        <span>Date of birth</span>
        <input
          type="date"
          value={value.isoDate}
          onChange={(e) => onChange((prev) => ({ ...prev, isoDate: e.target.value }))}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span>Time of birth</span>
        <input
          type="time"
          value={value.time}
          onChange={(e) => onChange((prev) => ({ ...prev, time: e.target.value }))}
          step={60}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span>Latitude</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="e.g. 40.7128"
          value={value.latitude}
          onChange={(e) => onChange((prev) => ({ ...prev, latitude: e.target.value }))}
          step={0.1}
          min={-90}
          max={90}
          required
          style={inputStyle}
        />
      </label>

      <label style={fieldStyle}>
        <span>Longitude</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="-74.0060"
          value={value.longitude}
          onChange={(e) => onChange((prev) => ({ ...prev, longitude: e.target.value }))}
          step={0.1}
          min={-180}
          max={180}
          required
          style={inputStyle}
        />
      </label>
    </form>
  )
}
