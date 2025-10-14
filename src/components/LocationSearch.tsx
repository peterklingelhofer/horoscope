// src/components/LocationSearch.tsx
// Online location picker using Open-Meteo Geocoding API with debounce and fuzzy US shorthand expansion
// Tries multiple candidate queries and prefers countryCode=US for US-looking input
// Full width of its grid cell and fixed-height helper to avoid layout shift
// Never end code comments with periods

import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  onPick: (latitude: number, longitude: number, label: string) => void
  helperText?: string
}

type Place = {
  id: number
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

const OFFLINE_FALLBACK: readonly Place[] = [
  { id: 1, name: "New York", country: "United States", admin1: "NY", latitude: 40.7128, longitude: -74.006 },
  { id: 2, name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { id: 3, name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { id: 4, name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { id: 5, name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { id: 6, name: "São Paulo", country: "Brazil", latitude: -23.55, longitude: -46.6333 },
  { id: 7, name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832 },
  { id: 8, name: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
]

// US state and territory expansions
const US_ABBR: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", VI: "U.S. Virgin Islands", GU: "Guam", MP: "Northern Mariana Islands",
  AS: "American Samoa",
}

function titleCaseWords(s: string): string {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase())
}

function normalizeQuery(raw: string): string {
  // unify commas and collapse whitespace
  let s = raw.replace(/[，]/g, ",").replace(/\s+/g, " ").trim()
  // st -> saint for common prefixes
  s = s.replace(/\bst\.?\s+/gi, "saint ")
  // washington dc variants to canonical
  if (/^washington\s*[, ]?\s*dc$/i.test(s)) return "washington, district of columbia"
  if (/^dc$/i.test(s)) return "district of columbia"
  return s
}

function looksUSLike(q: string): boolean {
  if (/^\d{5}$/.test(q)) return true // ZIP
  if (/\busa\b|\bunited states\b/i.test(q)) return true
  if (/\b[a-z]{2}\b$/i.test(q)) {
    const code = q.trim().slice(-2).toUpperCase()
    if (US_ABBR[code]) return true
  }
  if (/\bdc\b/i.test(q)) return true
  return false
}

function expandUSVariants(norm: string): string[] {
  const out: string[] = []
  // insert missing comma before state code at end: arlington va -> arlington, va
  if (!/,/.test(norm) && /\s+[a-z]{2}$/i.test(norm)) {
    out.push(norm.replace(/\s+([A-Za-z]{2})$/, ", $1"))
  }
  // replace 2 letter code with full state name
  const endCode = norm.match(/\b([A-Za-z]{2})\b$/)
  if (endCode) {
    const full = US_ABBR[endCode[1].toUpperCase()]
    if (full) out.push(norm.replace(/\b([A-Za-z]{2})\b$/, full.toLowerCase()))
  }
  // any , XX, inside
  const inText = norm.match(/,\s*([A-Za-z]{2})(\s|$)/)
  if (inText) {
    const full = US_ABBR[inText[1].toUpperCase()]
    if (full) out.push(norm.replace(/,\s*([A-Za-z]{2})(\s|$)/, `, ${full.toLowerCase()}$2`))
  }
  // add country suffix options
  const bases = [norm, ...out]
  for (const b of bases) {
    if (!/united states/i.test(b)) {
      out.push(`${b}, United States`)
      out.push(`${b}, USA`)
    }
  }
  // tidy casing
  return Array.from(new Set(out.map(titleCaseWords)))
}

async function queryOpenMeteo(name: string, preferUS: boolean, signal: AbortSignal): Promise<Place[]> {
  const tryOnce = async (n: string, countryCode?: string): Promise<Place[]> => {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", n)
    url.searchParams.set("count", "8")
    url.searchParams.set("language", "en")
    url.searchParams.set("format", "json")
    if (countryCode) url.searchParams.set("countryCode", countryCode)
    const r = await fetch(url.toString(), { signal })
    if (!r.ok) return []
    const j = await r.json()
    const items: Place[] = Array.isArray(j.results)
      ? j.results.map((p: any) => ({
          id: p.id,
          name: String(p.name),
          country: String(p.country ?? ""),
          admin1: p.admin1 ? String(p.admin1) : undefined,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
        }))
      : []
    return items
  }

  // prefer US filter first if applicable, then without
  if (preferUS) {
    const us = await tryOnce(name, "US")
    if (us.length) return us
  }
  return tryOnce(name)
}

export function LocationSearch({ onPick, helperText }: Props) {
  const [query, setQuery] = useState<string>("")
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const canSearch = query.trim().length >= 2

  // close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (!listRef.current || !inputRef.current) return
      if (listRef.current.contains(t) || inputRef.current.contains(t)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (!canSearch) {
      setResults([])
      return
    }

    const id = window.setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setLoading(true)

      const raw = query.trim()
      const norm = normalizeQuery(raw)
      const preferUS = looksUSLike(raw)

      // candidate ordering: zip first, then normalized, then US expansions
      const candidates: string[] = []
      if (/^\d{5}$/.test(raw)) candidates.push(raw)
      candidates.push(norm, ...expandUSVariants(norm))

      // remove duplicates while preserving order and cap to 10
      const deduped = Array.from(new Set(candidates)).slice(0, 10)

      let got: Place[] = []
      try {
        for (const cand of deduped) {
          const items = await queryOpenMeteo(cand, preferUS, ac.signal)
          if (items.length > 0) {
            got = items
            break
          }
        }
      } catch {
        // ignore and fall through to fallback
      } finally {
        if (got.length === 0) {
          const q = norm.toLowerCase()
          got = OFFLINE_FALLBACK.filter((p) => {
            const label = `${p.name}, ${p.admin1 ? p.admin1 + ", " : ""}${p.country}`.toLowerCase()
            return label.includes(q)
          })
        }
        setResults(got)
        setLoading(false)
      }
    }, 220)

    return () => window.clearTimeout(id)
  }, [query, canSearch])

  const helper = useMemo(() => {
    if (loading) return "Searching…"
    if (!canSearch && query.length > 0) return "Type at least 2 characters"
    return helperText ?? ""
  }, [loading, canSearch, query, helperText])

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div style={{ display: "grid", gap: 6 }}>
        <span>Search location</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="City, region, ZIP code or country (avoid acronyms)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          spellCheck={false}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        {/* fixed-height helper prevents layout shift */}
        <div
          style={{
            height: 16,
            lineHeight: "16px",
            fontSize: 12,
            color: "#aaa",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {helper}
        </div>
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 18,
            top: "100%",
            left: 0,
            right: 0,
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            margin: "6px 0 0 0",
            padding: 6,
            listStyle: "none",
            maxHeight: 280,
            overflowY: "auto",
            boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
          }}
        >
          {results.map((p) => {
            const label =
              p.admin1 && p.admin1 !== p.name
                ? `${p.name}, ${p.admin1}, ${p.country}`
                : `${p.name}, ${p.country}`
            return (
              <li key={`${p.id}-${p.latitude}-${p.longitude}`}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(p.latitude, p.longitude, label)
                    setOpen(false)
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "none",
                    color: "#eee",
                    cursor: "pointer",
                    borderRadius: 6,
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "#232323"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                  }}
                >
                  {label}
                  <span style={{ opacity: 0.65 }}>
                    {" "}
                    • {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
