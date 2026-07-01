// Thin wrapper around the Google Places API (legacy REST endpoints).
// Used by the GBP, Reviews, and Competitor agents. Every function returns
// `null` when GOOGLE_PLACES_API_KEY is not configured or the request fails,
// so callers can gracefully fall back to estimated/demo data.

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export type PlaceCandidate = {
  place_id: string;
  name: string;
  formatted_address?: string;
};

export type PlaceSearchResult = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
};

export type PlaceReview = {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description?: string;
};

export type PlaceDetails = {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  url?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  opening_hours?: { weekday_text?: string[]; open_now?: boolean };
  photos?: { photo_reference: string }[];
  reviews?: PlaceReview[];
  business_status?: string;
};

export function hasGooglePlacesKey(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY);
}

async function placesGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${PLACES_BASE}/${path}/json`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`Places API (${path}) returned status ${data.status}: ${data.error_message ?? ""}`);
      return null;
    }
    return data as T;
  } catch (err) {
    console.error(`Places API (${path}) request failed`, err);
    return null;
  }
}

export async function findPlace(query: string): Promise<PlaceCandidate | null> {
  const data = await placesGet<{ candidates: PlaceCandidate[] }>("findplacefromtext", {
    input: query,
    inputtype: "textquery",
    fields: "place_id,name,formatted_address",
  });
  return data?.candidates?.[0] ?? null;
}

const DETAIL_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "formatted_phone_number",
  "website",
  "url",
  "rating",
  "user_ratings_total",
  "price_level",
  "types",
  "opening_hours",
  "photos",
  "reviews",
  "business_status",
].join(",");

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const data = await placesGet<{ result: PlaceDetails }>("details", {
    place_id: placeId,
    fields: DETAIL_FIELDS,
  });
  return data?.result ?? null;
}

export async function textSearchRestaurants(query: string): Promise<PlaceSearchResult[]> {
  const data = await placesGet<{ results: PlaceSearchResult[] }>("textsearch", {
    query,
  });
  return data?.results ?? [];
}

/** Convenience helper: resolve a restaurant name (+ optional location) straight to full details. */
export async function findRestaurantDetails(
  restaurantName: string,
  location?: string,
): Promise<PlaceDetails | null> {
  const query = location ? `${restaurantName} ${location}` : restaurantName;
  const candidate = await findPlace(query);
  if (!candidate) return null;
  return getPlaceDetails(candidate.place_id);
}
