// src/components/BirthForm.tsx
// Simple birth inputs without geolocation button
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
      <label style={{ display: "grid", gap: 6 }}>
        <span>Date of birth</span>
        <input
          type="date"
          value={value.isoDate}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, isoDate: e.target.value }))
          }
          required
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Time of birth</span>
        <input
          type="time"
          value={value.time}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, time: e.target.value }))
          }
          step={1} // accept HH:mm or HH:mm:ss
          required
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Latitude</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="e.g. 40.7128"
          value={value.latitude}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, latitude: e.target.value }))
          }
          required
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Longitude</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="-74.0060"
          value={value.longitude}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, longitude: e.target.value }))
          }
          required
        />
      </label>
    </form>
  )
}
