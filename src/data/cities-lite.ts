// src/data/cities-lite.ts
// Small offline gazetteer for the location picker
// Never end code comments with periods

export type CityRecord = {
  name: string
  admin1?: string
  country: string
  latitude: number
  longitude: number
}

export const CITIES: readonly CityRecord[] = [
  { name: "New York", admin1: "NY", country: "United States", latitude: 40.7128, longitude: -74.006 },
  { name: "Los Angeles", admin1: "CA", country: "United States", latitude: 34.0522, longitude: -118.2437 },
  { name: "Chicago", admin1: "IL", country: "United States", latitude: 41.8781, longitude: -87.6298 },
  { name: "Miami", admin1: "FL", country: "United States", latitude: 25.7617, longitude: -80.1918 },
  { name: "San Francisco", admin1: "CA", country: "United States", latitude: 37.7749, longitude: -122.4194 },
  { name: "Seattle", admin1: "WA", country: "United States", latitude: 47.6062, longitude: -122.3321 },
  { name: "Toronto", admin1: "ON", country: "Canada", latitude: 43.6532, longitude: -79.3832 },
  { name: "Vancouver", admin1: "BC", country: "Canada", latitude: 49.2827, longitude: -123.1207 },
  { name: "Mexico City", country: "Mexico", latitude: 19.4326, longitude: -99.1332 },
  { name: "São Paulo", country: "Brazil", latitude: -23.55, longitude: -46.6333 },
  { name: "Buenos Aires", country: "Argentina", latitude: -34.6037, longitude: -58.3816 },
  { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522 },
  { name: "Berlin", country: "Germany", latitude: 52.52, longitude: 13.405 },
  { name: "Madrid", country: "Spain", latitude: 40.4168, longitude: -3.7038 },
  { name: "Rome", country: "Italy", latitude: 41.9028, longitude: 12.4964 },
  { name: "Amsterdam", country: "Netherlands", latitude: 52.3676, longitude: 4.9041 },
  { name: "Stockholm", country: "Sweden", latitude: 59.3293, longitude: 18.0686 },
  { name: "Oslo", country: "Norway", latitude: 59.9139, longitude: 10.7522 },
  { name: "Copenhagen", country: "Denmark", latitude: 55.6761, longitude: 12.5683 },
  { name: "Helsinki", country: "Finland", latitude: 60.1699, longitude: 24.9384 },
  { name: "Dublin", country: "Ireland", latitude: 53.3498, longitude: -6.2603 },
  { name: "Zurich", country: "Switzerland", latitude: 47.3769, longitude: 8.5417 },
  { name: "Vienna", country: "Austria", latitude: 48.2082, longitude: 16.3738 },
  { name: "Prague", country: "Czechia", latitude: 50.0755, longitude: 14.4378 },
  { name: "Warsaw", country: "Poland", latitude: 52.2297, longitude: 21.0122 },
  { name: "Athens", country: "Greece", latitude: 37.9838, longitude: 23.7275 },
  { name: "Istanbul", country: "Türkiye", latitude: 41.0082, longitude: 28.9784 },
  { name: "Moscow", country: "Russia", latitude: 55.7558, longitude: 37.6173 },
  { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708 },
  { name: "Tel Aviv", country: "Israel", latitude: 32.0853, longitude: 34.7818 },
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357 },
  { name: "Johannesburg", country: "South Africa", latitude: -26.2041, longitude: 28.0473 },
  { name: "Nairobi", country: "Kenya", latitude: -1.2921, longitude: 36.8219 },
  { name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792 },
  { name: "Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { name: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
  { name: "Bengaluru", country: "India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Dhaka", country: "Bangladesh", latitude: 23.8103, longitude: 90.4125 },
  { name: "Karachi", country: "Pakistan", latitude: 24.8607, longitude: 67.0011 },
  { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018 },
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198 },
  { name: "Jakarta", country: "Indonesia", latitude: -6.2088, longitude: 106.8456 },
  { name: "Manila", country: "Philippines", latitude: 14.5995, longitude: 120.9842 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.978 },
  { name: "Osaka", country: "Japan", latitude: 34.6937, longitude: 135.5023 },
  { name: "Beijing", country: "China", latitude: 39.9042, longitude: 116.4074 },
  { name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737 },
  { name: "Hong Kong", country: "China", latitude: 22.3193, longitude: 114.1694 },
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093 },
  { name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631 },
  { name: "Auckland", country: "New Zealand", latitude: -36.8485, longitude: 174.7633 },
]
