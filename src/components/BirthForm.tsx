// src/components/BirthForm.tsx
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
  onUseGeolocation: (coords: { latitude: number; longitude: number }) => void
}

export function BirthForm({ value, onChange, onUseGeolocation }: Props) {
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
          step={60}
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

      <button
        type="button"
        onClick={() => {
          if (!("geolocation" in navigator)) return
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              onUseGeolocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              })
            },
            () => {
              // no-op for denied geolocation
            },
            { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
          )
        }}
      >
        Use my location
      </button>
    </form>
  )
}
